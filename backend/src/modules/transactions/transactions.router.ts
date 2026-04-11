import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { verifyJWT, optionalJWT } from '../../middleware/auth';
import { getPageParams, paginate, generateRefNumber, generateAlertCode } from '../../utils/helpers';
import { runAMLChecks, AMLThresholds } from '../../utils/amlRules';
import { emitTransactionNew, emitAMLAlert } from '../../socket/socket';

const router = Router();

const txSchema = z.object({
  type: z.enum(['BuyUSD', 'SellUSD']),
  dealerId: z.string(),
  customerWallet: z.string(),
  mobileNumber: z.string(),
  telcoOperator: z.enum(['Telesom', 'Somtel', 'Soltelco']),
  walletType: z.enum(['Zaad', 'eDahab']),
  amountUSD: z.number().positive(),
  rate: z.number().positive(),
  source: z.string().optional(),
});

// GET /api/transactions
router.get('/', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPageParams(req.query);
    const { type, status, telco, dealerId, search } = req.query;

    const where: Record<string, unknown> = {};

    // If authenticated dealer — only their transactions
    if (req.user?.dealerId) {
      where.dealerId = req.user.dealerId;
    } else if (dealerId) {
      // Allow filtering by dealerId via query param (for prototype)
      where.dealerId = dealerId;
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (telco) where.telcoOperator = telco;
    if (search) {
      where.OR = [
        { refNumber: { contains: String(search), mode: 'insensitive' } },
        { mobileNumber: { contains: String(search) } },
        { customerWallet: { contains: String(search) } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where, skip, take: limit,
        orderBy: { timestamp: 'desc' },
        include: { dealer: { select: { id: true, name: true } } },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json(paginate(transactions, total, page, limit));
  } catch (err) { next(err); }
});

// GET /api/transactions/stats/summary
router.get('/stats/summary', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.user?.dealerId) where.dealerId = req.user.dealerId;

    const [total, byTelco, byType, byStatus] = await Promise.all([
      prisma.transaction.aggregate({ where, _sum: { amountUSD: true }, _count: { id: true } }),
      prisma.transaction.groupBy({ by: ['telcoOperator'], where, _sum: { amountUSD: true }, _count: { id: true } }),
      prisma.transaction.groupBy({ by: ['type'], where, _sum: { amountUSD: true }, _count: { id: true } }),
      prisma.transaction.groupBy({ by: ['status'], where, _count: { id: true } }),
    ]);

    res.json({ total, byTelco, byType, byStatus });
  } catch (err) { next(err); }
});

// GET /api/transactions/:id
router.get('/:id', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        dealer: { select: { id: true, name: true } },
        amlAlerts: { include: { alert: true } },
      },
    });
    if (!tx) { res.status(404).json({ error: 'Transaction not found' }); return; }
    if (req.user?.dealerId && tx.dealerId !== req.user.dealerId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }
    res.json(tx);
  } catch (err) { next(err); }
});

// POST /api/transactions
router.post('/', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = txSchema.parse(req.body);
    const amountSL = data.amountUSD * data.rate;
    const refNumber = generateRefNumber();

    const tx = await prisma.transaction.create({
      data: {
        refNumber,
        type: data.type,
        dealerId: data.dealerId,
        customerWallet: data.customerWallet,
        mobileNumber: data.mobileNumber,
        telcoOperator: data.telcoOperator,
        walletType: data.walletType,
        amountUSD: data.amountUSD,
        amountSL,
        rate: data.rate,
        status: 'Completed',
        source: data.source || 'portal',
      },
      include: { dealer: { select: { id: true, name: true } } },
    });

    // Run AML checks — gather recent activity
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentMobileTxs, recentWalletTxs, amlSettings] = await Promise.all([
      prisma.transaction.findMany({
        where: { mobileNumber: data.mobileNumber, timestamp: { gte: oneHourAgo }, id: { not: tx.id } },
        select: { id: true, amountUSD: true },
      }),
      prisma.transaction.findMany({
        where: { customerWallet: data.customerWallet, timestamp: { gte: oneDayAgo }, id: { not: tx.id } },
        select: { id: true, amountUSD: true },
      }),
      prisma.systemSetting.findMany({
        where: { key: { in: ['aml_threshold', 'velocity_limit', 'structuring_count'] } },
      }),
    ]);

    const settingsMap = Object.fromEntries(amlSettings.map(s => [s.key, Number(s.value)]));
    const thresholds: AMLThresholds = {
      amlThreshold:    settingsMap['aml_threshold']    ?? 50000,
      velocityLimit:   settingsMap['velocity_limit']   ?? 5,
      structuringCount: settingsMap['structuring_count'] ?? 5,
    };

    const amlTrigger = runAMLChecks({
      amountUSD: data.amountUSD,
      mobileNumber: data.mobileNumber,
      customerWallet: data.customerWallet,
      dealerId: data.dealerId,
      recentTxCount: recentMobileTxs.length,
      recentTxAmounts: recentWalletTxs.map(t => Number(t.amountUSD)),
    }, thresholds);

    let finalTx = tx;
    if (amlTrigger?.triggered) {
      // Hold the flagged transaction in Pending
      finalTx = await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'Pending' },
        include: { dealer: { select: { id: true, name: true } } },
      });

      // Collect all triggering transaction IDs
      let triggeringIds: string[] = [tx.id];
      if (amlTrigger.type === 'VelocityCheck' || amlTrigger.type === 'UnusualFrequency') {
        triggeringIds = [tx.id, ...recentMobileTxs.map(t => t.id)];
      } else if (amlTrigger.type === 'StructuringPattern') {
        const structuring = recentWalletTxs.filter(
          t => Number(t.amountUSD) >= 8000 && Number(t.amountUSD) <= 10000
        );
        triggeringIds = [tx.id, ...structuring.map(t => t.id)];
      }
      triggeringIds = [...new Set(triggeringIds)];

      const alert = await prisma.aMLAlert.create({
        data: {
          alertCode: generateAlertCode(),
          type: amlTrigger.type,
          dealerId: data.dealerId,
          customerWallet: data.customerWallet,
          mobileNumber: data.mobileNumber,
          amount: data.amountUSD,
          triggerRule: amlTrigger.triggerRule,
          priority: amlTrigger.priority,
          status: 'New',
          transactions: { create: triggeringIds.map(transactionId => ({ transactionId })) },
        },
      });
      emitAMLAlert(alert);
    }

    emitTransactionNew(finalTx);
    res.status(201).json(finalTx);
  } catch (err) { next(err); }
});

// PATCH /api/transactions/:id/status (CB only)
router.patch('/:id/status', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({
      status: z.enum(['Completed', 'Pending', 'Failed', 'Cancelled']),
    }).parse(req.body);

    const tx = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(tx);
  } catch (err) { next(err); }
});

export default router;
