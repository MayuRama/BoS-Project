import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { verifyJWT, requireCB, optionalJWT } from '../../middleware/auth';
import { getPageParams, paginate } from '../../utils/helpers';
import { emitOMOStatusChanged, emitOMOAllocated, emitNotification } from '../../socket/socket';

const router = Router();

const sessionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['Injection', 'Absorption']),
  fixedRate: z.number(),
  totalAmount: z.number(),
  startTime: z.string(),
  durationMinutes: z.number(),
  allocationMethod: z.enum(['EqualDistribution', 'BestBidPriceWins']),
  maxBidTier1: z.number(),
  maxBidTier2: z.number(),
  notes: z.string().optional().nullable(),
});

// GET /api/omo-sessions
router.get('/', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPageParams(req.query);
    const { status, type } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [sessions, total] = await Promise.all([
      prisma.oMOSession.findMany({
        where, skip, take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          _count: { select: { bids: true } },
        },
      }),
      prisma.oMOSession.count({ where }),
    ]);

    res.json(paginate(sessions, total, page, limit));
  } catch (err) { next(err); }
});

// GET /api/omo-sessions/my-bids — all bids for the authenticated dealer across all sessions
router.get('/my-bids', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.dealerId) { res.json([]); return; }
    const bids = await prisma.oMOBid.findMany({
      where: { dealerId: req.user.dealerId },
      include: {
        session: { select: { id: true, type: true, status: true, fixedRate: true, allocationMethod: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(bids);
  } catch (err) { next(err); }
});

// GET /api/omo-sessions/:id
router.get('/:id', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.oMOSession.findUnique({
      where: { id: req.params.id },
      include: {
        bids: { include: { dealer: { select: { id: true, name: true, tier: true } } } },
        allocationResults: { include: { dealer: { select: { id: true, name: true } } } },
      },
    });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
    res.json(session);
  } catch (err) { next(err); }
});

// POST /api/omo-sessions (CB only)
router.post('/', verifyJWT, requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = sessionSchema.parse(req.body);
    const id = data.id || `OMO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const session = await prisma.oMOSession.create({
      data: {
        id,
        type: data.type,
        fixedRate: data.fixedRate,
        totalAmount: data.totalAmount,
        startTime: new Date(data.startTime),
        durationMinutes: data.durationMinutes,
        allocationMethod: data.allocationMethod,
        maxBidTier1: data.maxBidTier1,
        maxBidTier2: data.maxBidTier2,
        notes: data.notes,
        createdBy: req.user!.username,
        status: 'Open',
      },
    });

    emitOMOStatusChanged(session.id, 'Open');

    // Notify all dealers
    await prisma.notification.create({
      data: {
        type: 'OMO',
        title: `New OMO Session: ${session.id}`,
        message: `A new ${session.type} session is open. Fixed rate: SL ${session.fixedRate}. Total: $${Number(session.totalAmount).toLocaleString()}`,
        sessionId: session.id,
      },
    });

    res.status(201).json(session);
  } catch (err) { next(err); }
});

// PUT /api/omo-sessions/:id (CB only)
router.put('/:id', verifyJWT, requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = sessionSchema.partial().parse(req.body);
    const session = await prisma.oMOSession.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
      },
    });
    res.json(session);
  } catch (err) { next(err); }
});

// PATCH /api/omo-sessions/:id/cancel (CB only)
router.patch('/:id/cancel', verifyJWT, requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.oMOSession.update({
      where: { id: req.params.id },
      data: { status: 'Cancelled', closedAt: new Date() },
    });
    emitOMOStatusChanged(session.id, 'Cancelled');
    res.json(session);
  } catch (err) { next(err); }
});

// POST /api/omo-sessions/:id/allocate (CB only) — allocation engine
router.post('/:id/allocate', verifyJWT, requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.oMOSession.findUnique({
      where: { id: req.params.id },
      include: { bids: { include: { dealer: true } } },
    });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
    if (session.status !== 'Open') { res.status(400).json({ error: 'Session is not open' }); return; }

    const totalAmount = Number(session.totalAmount);
    const fixedRate = Number(session.fixedRate);
    const bids = session.bids.filter(b => b.status === 'Submitted');

    if (bids.length === 0) { res.status(400).json({ error: 'No bids to allocate' }); return; }

    const totalBid = bids.reduce((sum, b) => sum + Number(b.bidAmount), 0);
    const results: Array<{
      sessionId: string; dealerId: string; bidAmount: number;
      allocatedAmount: number; fixedRate: number; slSettlement: number;
    }> = [];

    if (session.allocationMethod === 'EqualDistribution') {
      // Allotment (pro-rata): each dealer receives a share proportional to their bid.
      // If total demand ≤ supply → everyone gets exactly what they requested.
      // If total demand > supply → each dealer gets (their bid / total demand) × total supply.
      const share = Math.min(1, totalAmount / totalBid);
      for (const bid of bids) {
        const allocated = Math.round(Number(bid.bidAmount) * share * 100) / 100;
        results.push({
          sessionId: session.id, dealerId: bid.dealerId,
          bidAmount: Number(bid.bidAmount), allocatedAmount: allocated,
          fixedRate, slSettlement: allocated * fixedRate,
        });
      }
    } else {
      // Best Bid Price Wins: rank dealers by their submitted bid rate.
      // Injection  → dealers offering the HIGHEST rate get priority (they pay the most per USD).
      // Absorption → dealers offering the LOWEST rate get priority (CB pays them least per USD).
      // Each dealer settles at their own submitted bid rate.
      const sorted = [...bids].sort((a, b) => {
        const aRate = Number(a.bidRate ?? 0);
        const bRate = Number(b.bidRate ?? 0);
        return session.type === 'Injection' ? bRate - aRate : aRate - bRate;
      });
      let remaining = totalAmount;
      for (const bid of sorted) {
        const allocated = Math.min(Number(bid.bidAmount), remaining);
        remaining -= allocated;
        const dealerRate = Number(bid.bidRate ?? fixedRate); // each dealer's settlement rate is their own bid rate
        results.push({
          sessionId: session.id, dealerId: bid.dealerId,
          bidAmount: Number(bid.bidAmount), allocatedAmount: allocated,
          fixedRate: dealerRate,           // stored as the settlement rate for this dealer
          slSettlement: allocated * dealerRate,
        });
      }
    }

    // ── Wallet balance updates ────────────────────────────────────────────────
    // Fetch current dealer wallet balances for all affected dealers
    const dealerIds = [...new Set(bids.map(b => b.dealerId))];
    const dealerRecords = await prisma.dealer.findMany({
      where: { id: { in: dealerIds } },
      select: { id: true, zaadBalanceUSD: true, eDahabBalanceUSD: true, walletProvider: true },
    });
    const balanceMap = new Map(dealerRecords.map(d => ({
      id: d.id, zaad: Number(d.zaadBalanceUSD), eDahab: Number(d.eDahabBalanceUSD),
      provider: d.walletProvider,
    })).map(d => [d.id, d]));

    interface WalletUpdate {
      dealerId: string; walletType: 'Zaad' | 'eDahab';
      delta: number; newBalance: number;
    }
    const walletUpdates: WalletUpdate[] = [];

    for (const result of results) {
      const bid = bids.find(b => b.dealerId === result.dealerId)!;
      const bal = balanceMap.get(result.dealerId)!;
      // Resolve wallet: use bid's walletChoice, else fall back to provider default
      const walletType = (bid.walletChoice ?? (bal.provider === 'eDahab' ? 'eDahab' : 'Zaad')) as 'Zaad' | 'eDahab';
      const current = walletType === 'Zaad' ? bal.zaad : bal.eDahab;

      let newBalance: number;
      if (session.type === 'Injection') {
        // CB injects USD → dealer wallet balance increases
        newBalance = current + result.allocatedAmount;
      } else {
        // CB absorbs USD → dealer sells USD → wallet balance decreases
        newBalance = Math.max(0, current - result.allocatedAmount);
      }

      if (walletType === 'Zaad') bal.zaad = newBalance; else bal.eDahab = newBalance;
      walletUpdates.push({ dealerId: result.dealerId, walletType, delta: newBalance - current, newBalance });
    }

    // Write results + wallet updates atomically
    await prisma.$transaction([
      prisma.oMOSession.update({
        where: { id: session.id },
        data: { status: 'Completed', closedAt: new Date() },
      }),
      ...bids.map(b => {
        const result = results.find(r => r.dealerId === b.dealerId)!;
        return prisma.oMOBid.update({
          where: { id: b.id },
          data: {
            status: result.allocatedAmount >= Number(b.bidAmount) ? 'Allocated' : result.allocatedAmount > 0 ? 'Partial' : 'Rejected',
            allocatedAmount: result.allocatedAmount,
          },
        });
      }),
      ...results.map(r => prisma.allocationResult.create({ data: r })),
      // Update dealer wallet balances
      ...walletUpdates.map(wu =>
        prisma.dealer.update({
          where: { id: wu.dealerId },
          data: wu.walletType === 'Zaad'
            ? { zaadBalanceUSD: wu.newBalance }
            : { eDahabBalanceUSD: wu.newBalance },
        })
      ),
      // Create wallet ledger entries
      ...walletUpdates.map(wu =>
        prisma.walletLedger.create({
          data: {
            dealerId:    wu.dealerId,
            walletType:  wu.walletType,
            entryType:   wu.delta >= 0 ? 'Credit' : 'Debit',
            amountUSD:   Math.abs(wu.delta),
            reference:   session.id,
            description: `OMO ${session.type} — ${session.allocationMethod === 'EqualDistribution' ? 'Allotment' : 'Best Bid'} allocation from session ${session.id}`,
            balanceAfter: wu.newBalance,
          },
        })
      ),
    ]);

    // Notify dealers
    for (const r of results) {
      await prisma.notification.create({
        data: {
          type: 'Settlement',
          title: `OMO Allocation: ${session.id}`,
          message: `You have been allocated $${r.allocatedAmount.toLocaleString()} at SL ${fixedRate}/USD`,
          dealerId: r.dealerId,
          sessionId: session.id,
        },
      });
      emitNotification(r.dealerId, { type: 'allocation', dealerId: r.dealerId });
    }

    emitOMOAllocated(session.id, results.map(r => r.dealerId), results);
    res.json({ message: 'Allocation completed', results });
  } catch (err) { next(err); }
});

// ─── OMO BIDS ────────────────────────────────────────────────────────────────

// GET /api/omo-sessions/:id/bids
router.get('/:id/bids', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = { sessionId: req.params.id };
    if (req.user?.dealerId) where.dealerId = req.user.dealerId; // dealers see only their own bid

    const bids = await prisma.oMOBid.findMany({
      where,
      include: { dealer: { select: { id: true, name: true, tier: true } } },
    });
    res.json(bids);
  } catch (err) { next(err); }
});

// POST /api/omo-sessions/:id/bids (dealer only)
router.post('/:id/bids', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.dealerId) { res.status(403).json({ error: 'Only dealers can submit bids' }); return; }

    const { bidAmount, bidRate, wallet } = z.object({
      bidAmount: z.number().positive(),
      bidRate:   z.number().positive().optional(),
      wallet:    z.enum(['Zaad', 'eDahab']).optional(),
    }).parse(req.body);

    const session = await prisma.oMOSession.findUnique({ where: { id: req.params.id } });
    if (!session || session.status !== 'Open') {
      res.status(400).json({ error: 'Session is not open for bids' }); return;
    }

    const dealer = await prisma.dealer.findUnique({ where: { id: req.user!.dealerId } });
    if (!dealer) { res.status(404).json({ error: 'Dealer not found' }); return; }

    const maxBid = dealer.tier === 'Tier1' ? Number(session.maxBidTier1) : Number(session.maxBidTier2);
    if (bidAmount > maxBid) {
      res.status(400).json({ error: `Bid exceeds maximum allowed: $${maxBid.toLocaleString()}` }); return;
    }

    // BestBidPriceWins: bidRate is mandatory and must compete against the session baseline
    if (session.allocationMethod === 'BestBidPriceWins') {
      if (!bidRate) {
        res.status(400).json({ error: 'A bid rate (SL/USD) is required for Best Bid Price Wins sessions' }); return;
      }
      const baselineRate = Number(session.fixedRate);
      // Injection: dealers are buying USD from CB — they must offer at least the baseline rate
      if (session.type === 'Injection' && bidRate < baselineRate) {
        res.status(400).json({ error: `Bid rate SL ${bidRate} is below the session baseline of SL ${baselineRate}. Your rate must be ≥ SL ${baselineRate}` }); return;
      }
      // Absorption: CB is buying USD from dealers — dealers must accept at most the baseline rate
      if (session.type === 'Absorption' && bidRate > baselineRate) {
        res.status(400).json({ error: `Bid rate SL ${bidRate} exceeds the session baseline of SL ${baselineRate}. Your rate must be ≤ SL ${baselineRate}` }); return;
      }
    }

    // Resolve the wallet choice: use what dealer sent, else fall back to their provider
    const resolvedWallet = wallet ?? (
      dealer.walletProvider === 'eDahab' ? 'eDahab' : 'Zaad'
    ) as 'Zaad' | 'eDahab';

    const bid = await prisma.oMOBid.upsert({
      where: { sessionId_dealerId: { sessionId: req.params.id, dealerId: req.user!.dealerId } },
      create: {
        sessionId: req.params.id, dealerId: req.user!.dealerId,
        tier: dealer.tier, bidAmount, bidRate: bidRate ?? null,
        walletChoice: resolvedWallet, status: 'Submitted',
      },
      update: { bidAmount, bidRate: bidRate ?? null, walletChoice: resolvedWallet, status: 'Submitted' },
    });

    res.status(201).json(bid);
  } catch (err) { next(err); }
});

// DELETE /api/omo-sessions/:id/bids/:bidId
router.delete('/:id/bids/:bidId', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.dealerId) { res.status(403).json({ error: 'Only dealers can withdraw bids' }); return; }
    const bid = await prisma.oMOBid.findUnique({ where: { id: req.params.bidId } });
    if (!bid) { res.status(404).json({ error: 'Bid not found' }); return; }
    if (bid.dealerId !== req.user.dealerId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }
    if (bid.status !== 'Submitted') {
      res.status(400).json({ error: 'Only submitted bids can be withdrawn' }); return;
    }
    await prisma.oMOBid.delete({ where: { id: req.params.bidId } });
    res.json({ message: 'Bid withdrawn' });
  } catch (err) { next(err); }
});

// GET /api/omo-sessions/:id/results
router.get('/:id/results', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = { sessionId: req.params.id };
    if (req.user?.dealerId) where.dealerId = req.user.dealerId;

    const results = await prisma.allocationResult.findMany({
      where,
      include: { dealer: { select: { id: true, name: true } } },
    });
    res.json(results);
  } catch (err) { next(err); }
});

export default router;
