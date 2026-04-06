import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { verifyJWT, optionalJWT } from '../../middleware/auth';
import { getPageParams, paginate, generateRefNumber, generateAlertCode } from '../../utils/helpers';
import { runAMLChecks } from '../../utils/amlRules';
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

    // Run AML checks
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentCount, recentAmounts] = await Promise.all([
      prisma.transaction.count({
        where: { mobileNumber: data.mobileNumber, timestamp: { gte: oneHourAgo }, id: { not: tx.id } },
      }),
      prisma.transaction.findMany({
        where: { customerWallet: data.customerWallet, timestamp: { gte: oneDayAgo }, id: { not: tx.id } },
        select: { amountUSD: true },
      }),
    ]);

    const amlTrigger = runAMLChecks({
      amountUSD: data.amountUSD,
      mobileNumber: data.mobileNumber,
      customerWallet: data.customerWallet,
      dealerId: data.dealerId,
      recentTxCount: recentCount,
      recentTxAmounts: recentAmounts.map(t => Number(t.amountUSD)),
    });

    if (amlTrigger?.triggered) {
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
          transactions: { create: { transactionId: tx.id } },
        },
      });
      emitAMLAlert(alert);
    }

    emitTransactionNew(tx);
    res.status(201).json(tx);
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
