import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { verifyJWT, requireCB, requireDealer } from '../../middleware/auth';

const router = Router();

// GET /api/dashboard/stats (CB only)
router.get('/stats', verifyJWT, requireCB, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [
      todayAgg,
      todayByTelco,
      todayByWallet,
      activeOMOCount,
      activeDealerCount,
      pendingAMLCount,
      last7DaysTx,
      last7DaysTypeSplit,
      dealerVolumes,
      recentTx,
      activeSessions,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { timestamp: { gte: todayStart, lt: tomorrowStart } },
        _sum: { amountUSD: true },
        _count: { id: true },
      }),
      prisma.transaction.groupBy({
        by: ['telcoOperator'],
        where: { timestamp: { gte: todayStart, lt: tomorrowStart } },
        _sum: { amountUSD: true },
        _count: { id: true },
      }),
      prisma.transaction.groupBy({
        by: ['walletType'],
        where: { timestamp: { gte: todayStart, lt: tomorrowStart } },
        _count: { id: true },
      }),
      prisma.oMOSession.count({ where: { status: 'Open' } }),
      prisma.dealer.count({ where: { status: 'Active' } }),
      prisma.aMLAlert.count({ where: { status: { in: ['New', 'UnderReview'] } } }),
      prisma.transaction.findMany({
        where: { timestamp: { gte: sevenDaysAgo } },
        select: { timestamp: true, telcoOperator: true, amountUSD: true },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { timestamp: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
      prisma.dealer.findMany({
        where: { status: 'Active' },
        select: { name: true, volume30d: true },
        orderBy: { volume30d: 'desc' },
        take: 5,
      }),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { dealer: { select: { id: true, name: true } } },
      }),
      prisma.oMOSession.findMany({
        where: { status: 'Open' },
        include: {
          _count: { select: { bids: true } },
          bids: { select: { bidAmount: true, status: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
    ]);

    // ── Today KPIs ──────────────────────────────────────────────────────────
    const totalVolumeToday = Number(todayAgg._sum.amountUSD ?? 0);
    const totalTxToday = todayAgg._count.id;

    const telesomRow = todayByTelco.find(t => t.telcoOperator === 'Telesom');
    const somtelRow  = todayByTelco.find(t => t.telcoOperator === 'Somtel');
    const telesomVolumeToday = Number(telesomRow?._sum.amountUSD ?? 0);
    const somtelVolumeToday  = Number(somtelRow?._sum.amountUSD  ?? 0);
    const telesomTxCount = telesomRow?._count.id ?? 0;
    const somtelTxCount  = somtelRow?._count.id  ?? 0;

    const zaadSettlements   = todayByWallet.find(w => w.walletType === 'Zaad')?._count.id   ?? 0;
    const edahabSettlements = todayByWallet.find(w => w.walletType === 'eDahab')?._count.id ?? 0;

    const totalTelco = telesomTxCount + somtelTxCount;
    const telesomPct = totalTelco > 0 ? Math.round((telesomTxCount / totalTelco) * 100) : 50;
    const somtelPct  = totalTelco > 0 ? 100 - telesomPct : 50;

    // ── Volume last 7 days chart ─────────────────────────────────────────────
    const volumeLast7Days = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayLabel = dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayTxs   = last7DaysTx.filter(t => t.timestamp >= dayStart && t.timestamp < dayEnd);
      const telesom  = dayTxs.filter(t => t.telcoOperator === 'Telesom').reduce((s, t) => s + Number(t.amountUSD), 0);
      const somtel   = dayTxs.filter(t => t.telcoOperator === 'Somtel').reduce((s,  t) => s + Number(t.amountUSD), 0);
      return { day: dayLabel, telesom, somtel, total: telesom + somtel };
    });

    // ── Transaction type split (last 7 days) ────────────────────────────────
    const totalTypeTx = last7DaysTypeSplit.reduce((s, t) => s + t._count.id, 0);
    const transactionTypeSplit = last7DaysTypeSplit.map(t => ({
      name: t.type === 'BuyUSD' ? 'Buy USD' : 'Sell USD',
      value: totalTypeTx > 0 ? Math.round((t._count.id / totalTypeTx) * 100) : 50,
    }));
    if (transactionTypeSplit.length === 0) {
      transactionTypeSplit.push({ name: 'Buy USD', value: 55 }, { name: 'Sell USD', value: 45 });
    }

    // ── Telco split pie (last 7 days) ────────────────────────────────────────
    const telcoSplit = [
      { name: 'Telesom (Zaad)',   value: telesomPct },
      { name: 'Somtel (e-Dahab)', value: somtelPct  },
    ];

    // ── Top 5 dealers by 30d volume ──────────────────────────────────────────
    const topDealers = dealerVolumes.map(d => ({
      name: d.name.split(' ').slice(0, 2).join(' '), // shorten for chart
      volume: Number(d.volume30d),
    }));

    // ── Recent 10 transactions ───────────────────────────────────────────────
    const recentTransactions = recentTx.map(tx => ({
      id:           tx.id,
      refNumber:    tx.refNumber,
      type:         tx.type === 'BuyUSD' ? 'Buy USD' : 'Sell USD',
      mobileNumber: tx.mobileNumber,
      telcoOperator: tx.telcoOperator,
      amountUSD:    Number(tx.amountUSD),
      amountSL:     Number(tx.amountSL),
      rate:         Number(tx.rate),
      dealerName:   tx.dealer?.name ?? '',
      status:       tx.status,
      timestamp:    tx.timestamp.toISOString(),
    }));

    // ── Active OMO sessions ──────────────────────────────────────────────────
    const activeSessionsData = activeSessions.map(s => {
      const submittedBids = s.bids.filter(b => b.status === 'Submitted');
      const totalBidAmount = submittedBids.reduce((sum, b) => sum + Number(b.bidAmount), 0);
      return {
        id:          s.id,
        type:        s.type,
        fixedRate:   Number(s.fixedRate),
        totalAmount: Number(s.totalAmount),
        status:      s.status,
        bidsCount:   s._count.bids,
        totalBidAmount,
        startTime:   s.startTime.toISOString(),
        durationMinutes: s.durationMinutes,
      };
    });

    res.json({
      kpis: {
        totalVolumeToday,
        telesomVolumeToday,
        somtelVolumeToday,
        zaadSettlements,
        edahabSettlements,
        activeOMOSessions: activeOMOCount,
        activeDealers:     activeDealerCount,
        pendingAMLAlerts:  pendingAMLCount,
        totalTxToday,
        telesomTxCount,
        somtelTxCount,
        telesomPct,
        somtelPct,
      },
      volumeLast7Days,
      transactionTypeSplit,
      telcoSplit,
      topDealers,
      recentTransactions,
      activeSessions: activeSessionsData,
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/dealer-stats (Dealer only)
router.get('/dealer-stats', verifyJWT, requireDealer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dealerId = req.user!.dealerId!;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [
      dealer,
      todayAgg,
      todayByWallet,
      pendingAllocations,
      openSessionCount,
      last7DaysTx,
      recentTx,
      myOpenBids,
      notifications,
    ] = await Promise.all([
      prisma.dealer.findUnique({ where: { id: dealerId } }),
      prisma.transaction.aggregate({
        where: { dealerId, timestamp: { gte: todayStart, lt: tomorrowStart } },
        _sum: { amountUSD: true },
        _count: { id: true },
      }),
      prisma.transaction.groupBy({
        by: ['walletType'],
        where: { dealerId, timestamp: { gte: todayStart, lt: tomorrowStart } },
        _sum: { amountUSD: true },
      }),
      prisma.allocationResult.aggregate({
        where: { dealerId, settlementStatus: 'Pending' },
        _sum: { allocatedAmount: true },
        _count: { id: true },
      }),
      prisma.oMOSession.count({ where: { status: 'Open' } }),
      prisma.transaction.findMany({
        where: { dealerId, timestamp: { gte: sevenDaysAgo } },
        select: { timestamp: true, amountUSD: true, walletType: true },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.transaction.findMany({
        where: { dealerId },
        take: 5,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true, refNumber: true, type: true, amountUSD: true, amountSL: true,
          rate: true, status: true, timestamp: true, telcoOperator: true, walletType: true,
        },
      }),
      prisma.oMOBid.findMany({
        where: { dealerId, session: { status: 'Open' } },
        include: { session: { select: { id: true, type: true, status: true } } },
      }),
      prisma.notification.findMany({
        where: { OR: [{ dealerId }, { dealerId: null }] },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    if (!dealer) { res.status(404).json({ error: 'Dealer not found' }); return; }

    const dailyLimit = Number(dealer.dailyLimit);
    const todayVolumeUSD = Number(todayAgg._sum.amountUSD ?? 0);
    const todayTxCount = todayAgg._count.id;

    // Wallet balances come directly from the DB (updated by OMO allocations)
    const availableLiquidityZaad   = Number(dealer.zaadBalanceUSD);
    const availableLiquidityEDahab = Number(dealer.eDahabBalanceUSD);
    const availableLiquidityTotal  = availableLiquidityZaad + availableLiquidityEDahab;

    const pendingAllocationAmount = Number(pendingAllocations._sum.allocatedAmount ?? 0);
    const pendingAllocationCount  = pendingAllocations._count.id;

    // Volume last 7 days — one bucket per day
    const volumeLast7Days = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayLabel = dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const volume   = last7DaysTx
        .filter(t => t.timestamp >= dayStart && t.timestamp < dayEnd)
        .reduce((s, t) => s + Number(t.amountUSD), 0);
      return { day: dayLabel, volume };
    });

    res.json({
      dealer: {
        id: dealer.id, name: dealer.name, tier: dealer.tier,
        status: dealer.status, licenseNumber: dealer.licenseNumber,
        buyRate: Number(dealer.buyRate), sellRate: Number(dealer.sellRate), dailyLimit,
        walletProvider: dealer.walletProvider,
        zaadWallet: dealer.zaadWallet, zaadBalanceUSD: availableLiquidityZaad,
        eDahabWallet: dealer.eDahabWallet, eDahabBalanceUSD: availableLiquidityEDahab,
      },
      kpis: {
        todayVolumeUSD, todayTxCount,
        pendingAllocationAmount, pendingAllocationCount,
        availableLiquidityTotal, availableLiquidityZaad, availableLiquidityEDahab,
        openOMOSessions: openSessionCount,
        dailyLimitUsedPct: dailyLimit > 0 ? Math.round((todayVolumeUSD / dailyLimit) * 100) : 0,
      },
      volumeLast7Days,
      recentTransactions: recentTx.map(tx => ({
        id: tx.id, refNumber: tx.refNumber,
        type: tx.type === 'BuyUSD' ? 'Buy USD' : 'Sell USD',
        amountUSD: Number(tx.amountUSD), amountSL: Number(tx.amountSL), rate: Number(tx.rate),
        status: tx.status, timestamp: tx.timestamp.toISOString(),
        telcoOperator: tx.telcoOperator, walletType: tx.walletType,
      })),
      myOpenBids: myOpenBids.map(b => ({
        id: b.id, sessionId: b.sessionId,
        bidAmount: Number(b.bidAmount),
        bidRate: b.bidRate != null ? Number(b.bidRate) : null,
        status: b.status, submittedAt: b.submittedAt.toISOString(),
        session: b.session,
      })),
      notifications: notifications.map(n => ({
        id: n.id, type: n.type, title: n.title, message: n.message,
        read: n.read, createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) { next(err); }
});

export default router;
