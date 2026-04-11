import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { verifyJWT, requireCB } from '../../middleware/auth';
import { getPageParams, paginate } from '../../utils/helpers';

const router = Router();
router.use(verifyJWT);

const dealerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  tier: z.enum(['Tier1', 'Tier2']),
  buyRate: z.number().min(0),
  sellRate: z.number().min(0),
  dailyLimit: z.number().min(0),
  status: z.enum(['Active', 'Suspended', 'Pending']).optional(),
  walletProvider: z.enum(['Zaad', 'eDahab', 'Both']),
  zaadWallet: z.string().optional().nullable(),
  eDahabWallet: z.string().optional().nullable(),
  registeredDate: z.string(),
  complianceScore: z.number().min(0).max(100).optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
});

// GET /api/dealers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPageParams(req.query);
    const { status, tier, search } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (search) where.name = { contains: String(search), mode: 'insensitive' };

    const [dealers, total] = await Promise.all([
      prisma.dealer.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.dealer.count({ where }),
    ]);

    res.json(paginate(dealers, total, page, limit));
  } catch (err) { next(err); }
});

// GET /api/dealers/wallet — authenticated dealer's wallet balances + ledger
router.get('/wallet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.dealerId) { res.status(403).json({ error: 'Dealer authentication required' }); return; }

    const [dealer, ledger] = await Promise.all([
      prisma.dealer.findUnique({
        where: { id: req.user.dealerId },
        select: {
          id: true, name: true, walletProvider: true,
          zaadWallet: true, zaadBalanceUSD: true,
          eDahabWallet: true, eDahabBalanceUSD: true,
        },
      }),
      prisma.walletLedger.findMany({
        where: { dealerId: req.user.dealerId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    if (!dealer) { res.status(404).json({ error: 'Dealer not found' }); return; }

    const zaadBalance   = Number(dealer.zaadBalanceUSD);
    const eDahabBalance = Number(dealer.eDahabBalanceUSD);

    res.json({
      walletProvider: dealer.walletProvider,
      wallets: [
        ...(dealer.walletProvider !== 'eDahab' ? [{
          type: 'Zaad', address: dealer.zaadWallet,
          balanceUSD: zaadBalance, network: 'Telesom',
        }] : []),
        ...(dealer.walletProvider !== 'Zaad' ? [{
          type: 'eDahab', address: dealer.eDahabWallet,
          balanceUSD: eDahabBalance, network: 'Somtel',
        }] : []),
      ],
      totalBalanceUSD: zaadBalance + eDahabBalance,
      ledger: ledger.map(l => ({
        id: l.id, walletType: l.walletType, entryType: l.entryType,
        amountUSD: Number(l.amountUSD), reference: l.reference,
        description: l.description, balanceAfter: Number(l.balanceAfter),
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) { next(err); }
});

// GET /api/dealers/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Dealers can only see themselves
    if (req.user!.dealerId && req.user!.dealerId !== req.params.id) {
      res.status(403).json({ error: 'Access denied' }); return;
    }

    const dealer = await prisma.dealer.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { transactions: true, bids: true } },
      },
    });
    if (!dealer) { res.status(404).json({ error: 'Dealer not found' }); return; }
    res.json(dealer);
  } catch (err) { next(err); }
});

// POST /api/dealers (CB only)
router.post('/', requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = dealerSchema.parse(req.body);
    const dealer = await prisma.dealer.create({
      data: {
        ...data,
        buyRate: data.buyRate,
        sellRate: data.sellRate,
        dailyLimit: data.dailyLimit,
        registeredDate: new Date(data.registeredDate),
        status: data.status || 'Pending',
      },
    });
    res.status(201).json(dealer);
  } catch (err) { next(err); }
});

// PUT /api/dealers/:id (CB only)
router.put('/:id', requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = dealerSchema.partial().parse(req.body);
    const dealer = await prisma.dealer.update({
      where: { id: req.params.id },
      data: {
        ...data,
        registeredDate: data.registeredDate ? new Date(data.registeredDate) : undefined,
      },
    });
    res.json(dealer);
  } catch (err) { next(err); }
});

// PATCH /api/dealers/:id/status (CB only)
router.patch('/:id/status', requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({ status: z.enum(['Active', 'Suspended', 'Pending']) }).parse(req.body);
    const dealer = await prisma.dealer.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(dealer);
  } catch (err) { next(err); }
});

// GET /api/dealers/:id/stats (CB only)
router.get('/:id/stats', requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [txStats, alertCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { dealerId: req.params.id, timestamp: { gte: thirtyDaysAgo } },
        _sum: { amountUSD: true },
        _count: { id: true },
      }),
      prisma.aMLAlert.count({
        where: { dealerId: req.params.id, status: { not: 'Resolved' } },
      }),
    ]);
    res.json({
      volume30d: txStats._sum.amountUSD || 0,
      txCount30d: txStats._count.id,
      openAlerts: alertCount,
    });
  } catch (err) { next(err); }
});

export default router;
