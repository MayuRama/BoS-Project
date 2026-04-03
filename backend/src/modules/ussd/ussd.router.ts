import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { generateRefNumber, generateAlertCode } from '../../utils/helpers';
import { runAMLChecks } from '../../utils/amlRules';
import { emitTransactionNew, emitAMLAlert } from '../../socket/socket';

const router = Router();

const simulateSchema = z.object({
  mobileNumber: z.string(),
  telcoOperator: z.enum(['Telesom', 'Somtel', 'Soltelco']),
  walletType: z.enum(['Zaad', 'eDahab']),
  customerWallet: z.string(),
  type: z.enum(['BuyUSD', 'SellUSD']),
  amountUSD: z.number().positive(),
  dealerId: z.string(),
  pin: z.string().length(4),
});

// GET /api/ussd/dealers — public: return active dealers + rates for the simulator UI
router.get('/dealers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dealers = await prisma.dealer.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, buyRate: true, sellRate: true, tier: true },
      orderBy: { name: 'asc' },
    });
    res.json(dealers);
  } catch (err) { next(err); }
});

// POST /api/ussd/simulate — create a real transaction from USSD simulator
router.post('/simulate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = simulateSchema.parse(req.body);

    // Validate PIN (mock: accept "1234" or any 4-digit PIN for simulation)
    if (!/^\d{4}$/.test(data.pin)) {
      res.status(400).json({ error: 'Invalid PIN format' });
      return;
    }

    // Get dealer and validate rate
    const dealer = await prisma.dealer.findUnique({ where: { id: data.dealerId } });
    if (!dealer || dealer.status !== 'Active') {
      res.status(400).json({ error: 'Dealer not available' });
      return;
    }

    const rate = data.type === 'BuyUSD' ? Number(dealer.sellRate) : Number(dealer.buyRate);
    const amountSL = data.amountUSD * rate;
    const refNumber = generateRefNumber();

    // Create transaction in DB
    const tx = await prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
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
          rate,
          status: 'Completed',
          source: 'ussd',
        },
        include: { dealer: { select: { id: true, name: true } } },
      });

      // Update dealer stats
      await prisma.dealer.update({
        where: { id: data.dealerId },
        data: {
          volume30d: { increment: data.amountUSD },
          txCount30d: { increment: 1 },
        },
      });

      return transaction;
    });

    // AML checks
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

    let amlAlert = null;
    if (amlTrigger?.triggered) {
      amlAlert = await prisma.aMLAlert.create({
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
      emitAMLAlert(amlAlert);
    }

    // Emit real-time events to both portals
    emitTransactionNew(tx);

    // Shape response to match frontend SimTransaction interface
    res.status(201).json({
      transaction: {
        id: tx.id,
        ref: tx.refNumber,
        type: tx.type === 'BuyUSD' ? 'BUY' : 'SELL',
        usdAmount: Number(tx.amountUSD),
        slsAmount: Number(tx.amountSL),
        rate: Number(tx.rate),
        dealerName: tx.dealer.name,
        mobileNumber: tx.mobileNumber,
        telcoOperator: tx.telcoOperator,
        walletType: tx.walletType,
        timestamp: tx.timestamp.toISOString(),
        status: tx.status,
      },
      amlTriggered: !!amlAlert,
    });
  } catch (err) { next(err); }
});

export default router;
