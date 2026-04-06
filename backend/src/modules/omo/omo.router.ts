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
      const share = Math.min(1, totalAmount / totalBid);
      for (const bid of bids) {
        const allocated = Math.min(Number(bid.bidAmount), Number(bid.bidAmount) * share);
        results.push({
          sessionId: session.id, dealerId: bid.dealerId,
          bidAmount: Number(bid.bidAmount), allocatedAmount: allocated,
          fixedRate, slSettlement: allocated * fixedRate,
        });
      }
    } else {
      // Best bid — sort by amount desc, fill greedily
      const sorted = [...bids].sort((a, b) => Number(b.bidAmount) - Number(a.bidAmount));
      let remaining = totalAmount;
      for (const bid of sorted) {
        const allocated = Math.min(Number(bid.bidAmount), remaining);
        remaining -= allocated;
        results.push({
          sessionId: session.id, dealerId: bid.dealerId,
          bidAmount: Number(bid.bidAmount), allocatedAmount: allocated,
          fixedRate, slSettlement: allocated * fixedRate,
        });
      }
    }

    // Write results in a transaction
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
    if (req.user!.dealerId) where.dealerId = req.user!.dealerId; // dealers see only their bid

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

    const { bidAmount, wallet } = z.object({
      bidAmount: z.number().positive(),
      wallet: z.enum(['Zaad', 'eDahab', 'Both']),
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

    const bid = await prisma.oMOBid.upsert({
      where: { sessionId_dealerId: { sessionId: req.params.id, dealerId: req.user!.dealerId } },
      create: {
        sessionId: req.params.id, dealerId: req.user!.dealerId,
        tier: dealer.tier, bidAmount, wallet, status: 'Submitted',
      },
      update: { bidAmount, wallet, status: 'Submitted' },
    });

    res.status(201).json(bid);
  } catch (err) { next(err); }
});

// DELETE /api/omo-sessions/:id/bids/:bidId
router.delete('/:id/bids/:bidId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bid = await prisma.oMOBid.findUnique({ where: { id: req.params.bidId } });
    if (!bid) { res.status(404).json({ error: 'Bid not found' }); return; }
    if (req.user!.dealerId && bid.dealerId !== req.user!.dealerId) {
      res.status(403).json({ error: 'Access denied' }); return;
    }
    await prisma.oMOBid.delete({ where: { id: req.params.bidId } });
    res.json({ message: 'Bid withdrawn' });
  } catch (err) { next(err); }
});

// GET /api/omo-sessions/:id/results
router.get('/:id/results', optionalJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = { sessionId: req.params.id };
    if (req.user!.dealerId) where.dealerId = req.user!.dealerId;

    const results = await prisma.allocationResult.findMany({
      where,
      include: { dealer: { select: { id: true, name: true } } },
    });
    res.json(results);
  } catch (err) { next(err); }
});

export default router;
