import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BoS FX Database...\n');

  // ─── SYSTEM SETTINGS ───────────────────────────────────────────────────────
  const settings = [
    { key: 'aml_threshold', value: '50000', label: 'AML Transaction Threshold (USD)', category: 'AML' },
    { key: 'velocity_limit', value: '5', label: 'Velocity Limit (tx per hour)', category: 'AML' },
    { key: 'structuring_count', value: '5', label: 'Structuring Pattern Count', category: 'AML' },
    { key: 'session_timeout', value: '30', label: 'Session Timeout (minutes)', category: 'Security' },
    { key: 'max_bid_tier1', value: '500000', label: 'Max Bid Tier 1 (USD)', category: 'OMO' },
    { key: 'max_bid_tier2', value: '200000', label: 'Max Bid Tier 2 (USD)', category: 'OMO' },
    { key: 'market_ref_rate', value: '570', label: 'Market Reference Rate (SLS/USD)', category: 'Rates' },
    { key: 'daily_reporting', value: 'true', label: 'Daily Reporting Enabled', category: 'Reports' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: { ...s, updatedBy: 'system' },
      update: { value: s.value, updatedBy: 'system' },
    });
  }
  console.log('✅ System settings seeded');

  // ─── RATE CONTROLS ─────────────────────────────────────────────────────────
  await prisma.rateControl.deleteMany();
  await prisma.rateControl.create({
    data: {
      buyFloor: 558, buyCeiling: 575,
      sellFloor: 560, sellCeiling: 580,
      maxSpreadPct: 2.5, marketRef: 570,
      updatedBy: 'system', isActive: true,
    },
  });
  console.log('✅ Rate controls seeded');

  // ─── RATE HISTORY ──────────────────────────────────────────────────────────
  await prisma.rateHistory.deleteMany();
  const rateHistoryData = [
    { date: '2026-03-05', buyRate: 563, sellRate: 568, marketRef: 566 },
    { date: '2026-03-06', buyRate: 564, sellRate: 569, marketRef: 567 },
    { date: '2026-03-07', buyRate: 564, sellRate: 569, marketRef: 567 },
    { date: '2026-03-10', buyRate: 565, sellRate: 570, marketRef: 568 },
    { date: '2026-03-11', buyRate: 565, sellRate: 570, marketRef: 568 },
    { date: '2026-03-12', buyRate: 566, sellRate: 571, marketRef: 569 },
    { date: '2026-03-13', buyRate: 566, sellRate: 571, marketRef: 569 },
    { date: '2026-03-14', buyRate: 566, sellRate: 572, marketRef: 569 },
    { date: '2026-03-17', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-03-18', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-03-19', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-03-20', buyRate: 567, sellRate: 573, marketRef: 570 },
    { date: '2026-03-21', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-03-24', buyRate: 566, sellRate: 571, marketRef: 569 },
    { date: '2026-03-25', buyRate: 566, sellRate: 572, marketRef: 569 },
    { date: '2026-03-26', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-03-27', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-03-28', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-03-31', buyRate: 566, sellRate: 571, marketRef: 569 },
    { date: '2026-04-01', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-04-02', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-04-03', buyRate: 567, sellRate: 572, marketRef: 570 },
    { date: '2026-04-04', buyRate: 567, sellRate: 572, marketRef: 570 },
  ];
  for (const r of rateHistoryData) {
    await prisma.rateHistory.create({ data: { ...r, date: new Date(r.date) } });
  }
  console.log('✅ Rate history seeded');

  // ─── DEALERS ───────────────────────────────────────────────────────────────
  const dealerData = [
    { id: 'D001', name: 'Dahabshiil Exchange', licenseNumber: 'FX-LIC-2019-001', tier: 'Tier1', buyRate: 567, sellRate: 572, dailyLimit: 500000, status: 'Active', walletProvider: 'Both', zaadWallet: '063-4521-001', eDahabWallet: '770-9843-001', registeredDate: '2019-03-15', volume30d: 3850000, txCount30d: 142, complianceScore: 98, contactEmail: 'fx@dahabshiil.com', contactPhone: '+252-63-4521000' },
    { id: 'D002', name: 'Premier Exchange Co.', licenseNumber: 'FX-LIC-2019-002', tier: 'Tier1', buyRate: 567, sellRate: 572, dailyLimit: 500000, status: 'Active', walletProvider: 'Both', zaadWallet: '063-7712-002', eDahabWallet: '770-3312-002', registeredDate: '2019-05-20', volume30d: 2940000, txCount30d: 118, complianceScore: 97, contactEmail: 'ops@premierexchange.so', contactPhone: '+252-63-7712000' },
    { id: 'D003', name: 'Amal Bank FX', licenseNumber: 'FX-LIC-2020-003', tier: 'Tier1', buyRate: 566, sellRate: 571, dailyLimit: 450000, status: 'Active', walletProvider: 'Zaad', zaadWallet: '063-5541-003', eDahabWallet: null, registeredDate: '2020-01-10', volume30d: 2210000, txCount30d: 95, complianceScore: 95, contactEmail: 'fx@amalbank.so', contactPhone: '+252-63-5541000' },
    { id: 'D004', name: 'Salaam Somali Bank FX', licenseNumber: 'FX-LIC-2020-004', tier: 'Tier1', buyRate: 567, sellRate: 572, dailyLimit: 400000, status: 'Active', walletProvider: 'Both', zaadWallet: '063-6632-004', eDahabWallet: '770-4421-004', registeredDate: '2020-06-01', volume30d: 1870000, txCount30d: 76, complianceScore: 94, contactEmail: 'fx@salaambank.so', contactPhone: '+252-63-6632000' },
    { id: 'D005', name: 'Gulf Remittance Co.', licenseNumber: 'FX-LIC-2021-005', tier: 'Tier2', buyRate: 563, sellRate: 568, dailyLimit: 250000, status: 'Active', walletProvider: 'eDahab', zaadWallet: null, eDahabWallet: '770-2211-005', registeredDate: '2021-02-14', volume30d: 980000, txCount30d: 44, complianceScore: 91, contactEmail: 'ops@gulfremit.so', contactPhone: '+252-68-2211000' },
  ];

  for (const d of dealerData) {
    await prisma.dealer.upsert({
      where: { id: d.id },
      create: {
        ...d,
        tier: d.tier as 'Tier1' | 'Tier2',
        status: d.status as 'Active' | 'Suspended' | 'Pending',
        walletProvider: d.walletProvider as 'Zaad' | 'eDahab' | 'Both',
        registeredDate: new Date(d.registeredDate),
      },
      update: {
        buyRate: d.buyRate, sellRate: d.sellRate,
        volume30d: d.volume30d, txCount30d: d.txCount30d,
      },
    });
  }
  console.log('✅ Dealers seeded (D001–D005)');

  // ─── CB USERS ──────────────────────────────────────────────────────────────
  const cbPassword = await bcrypt.hash('admin123', 10);
  const cbUsers = [
    { username: 'admin', email: 'admin@bos.gov.so', fullName: 'System Administrator', role: 'CBSuperAdmin' },
    { username: 'governor', email: 'governor@bos.gov.so', fullName: 'H.E. The Governor', role: 'CBSuperAdmin' },
    { username: 'fxdesk', email: 'fxdesk@bos.gov.so', fullName: 'FX Intervention Desk', role: 'FXInterventionDesk' },
    { username: 'analyst', email: 'analyst@bos.gov.so', fullName: 'FX Analyst', role: 'Supervisor' },
    { username: 'auditor', email: 'auditor@bos.gov.so', fullName: 'Internal Auditor', role: 'Auditor' },
  ];

  for (const u of cbUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      create: { ...u, passwordHash: cbPassword, role: u.role as 'CBSuperAdmin' | 'FXInterventionDesk' | 'Supervisor' | 'Auditor' },
      update: {},
    });
  }
  console.log('✅ CB users seeded (password: admin123)');

  // ─── DEALER USERS ──────────────────────────────────────────────────────────
  const dealerPassword = await bcrypt.hash('dealer123', 10);
  const dealerUsers = [
    { username: 'D001_admin', email: 'admin@dahabshiil.com', fullName: 'Dahabshiil Admin', dealerId: 'D001', role: 'DealerAdmin' },
    { username: 'D002_admin', email: 'admin@premierexchange.so', fullName: 'Premier Admin', dealerId: 'D002', role: 'DealerAdmin' },
    { username: 'dealer', email: 'dealer@premierexchange.so', fullName: 'Premier Operator', dealerId: 'D002', role: 'DealerOperator' },
    { username: 'D003_admin', email: 'admin@amalbank.so', fullName: 'Amal Bank Admin', dealerId: 'D003', role: 'DealerAdmin' },
    { username: 'D004_admin', email: 'admin@salaambank.so', fullName: 'Salaam Bank Admin', dealerId: 'D004', role: 'DealerAdmin' },
    { username: 'D005_admin', email: 'admin@gulfremit.so', fullName: 'Gulf Remit Admin', dealerId: 'D005', role: 'DealerAdmin' },
  ];

  for (const u of dealerUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      create: { ...u, passwordHash: dealerPassword, role: u.role as 'DealerAdmin' | 'DealerOperator' },
      update: {},
    });
  }
  console.log('✅ Dealer users seeded (password: dealer123)');

  // ─── OMO SESSIONS ──────────────────────────────────────────────────────────
  const omoSessions = [
    { id: 'OMO-2026-001', type: 'Injection', fixedRate: 565, totalAmount: 2000000, startTime: '2026-03-15T09:00:00Z', durationMinutes: 120, status: 'Completed', allocationMethod: 'EqualDistribution', maxBidTier1: 500000, maxBidTier2: 200000, createdBy: 'fxdesk' },
    { id: 'OMO-2026-002', type: 'Absorption', fixedRate: 572, totalAmount: 1500000, startTime: '2026-03-20T10:00:00Z', durationMinutes: 90, status: 'Completed', allocationMethod: 'BestBidPriceWins', maxBidTier1: 500000, maxBidTier2: 200000, createdBy: 'fxdesk' },
    { id: 'OMO-2026-003', type: 'Injection', fixedRate: 558, totalAmount: 3000000, startTime: '2026-04-01T09:00:00Z', durationMinutes: 180, status: 'Open', allocationMethod: 'EqualDistribution', maxBidTier1: 600000, maxBidTier2: 250000, createdBy: 'fxdesk' },
    { id: 'OMO-2026-004', type: 'Absorption', fixedRate: 570, totalAmount: 1000000, startTime: '2026-04-10T09:00:00Z', durationMinutes: 120, status: 'PendingAllocation', allocationMethod: 'EqualDistribution', maxBidTier1: 400000, maxBidTier2: 150000, createdBy: 'fxdesk' },
    { id: 'OMO-2026-005', type: 'Injection', fixedRate: 562, totalAmount: 2500000, startTime: '2026-04-20T10:00:00Z', durationMinutes: 120, status: 'Open', allocationMethod: 'BestBidPriceWins', maxBidTier1: 500000, maxBidTier2: 200000, createdBy: 'fxdesk' },
  ];

  for (const s of omoSessions) {
    await prisma.oMOSession.upsert({
      where: { id: s.id },
      create: {
        ...s,
        type: s.type as 'Injection' | 'Absorption',
        status: s.status as 'Open' | 'PendingAllocation' | 'Completed' | 'Cancelled',
        allocationMethod: s.allocationMethod as 'EqualDistribution' | 'BestBidPriceWins',
        startTime: new Date(s.startTime),
        ...(s.status === 'Completed' ? { closedAt: new Date(s.startTime) } : {}),
      },
      update: { status: s.status as 'Open' | 'PendingAllocation' | 'Completed' | 'Cancelled' },
    });
  }
  console.log('✅ OMO sessions seeded');

  // ─── OMO BIDS ──────────────────────────────────────────────────────────────
  const bids = [
    { sessionId: 'OMO-2026-001', dealerId: 'D001', tier: 'Tier1', bidAmount: 450000, status: 'Allocated', allocatedAmount: 400000, wallet: 'Both' },
    { sessionId: 'OMO-2026-001', dealerId: 'D002', tier: 'Tier1', bidAmount: 500000, status: 'Allocated', allocatedAmount: 450000, wallet: 'Both' },
    { sessionId: 'OMO-2026-001', dealerId: 'D003', tier: 'Tier1', bidAmount: 300000, status: 'Allocated', allocatedAmount: 300000, wallet: 'Zaad' },
    { sessionId: 'OMO-2026-002', dealerId: 'D001', tier: 'Tier1', bidAmount: 400000, status: 'Allocated', allocatedAmount: 400000, wallet: 'Both' },
    { sessionId: 'OMO-2026-002', dealerId: 'D004', tier: 'Tier1', bidAmount: 350000, status: 'Allocated', allocatedAmount: 350000, wallet: 'Both' },
    { sessionId: 'OMO-2026-003', dealerId: 'D001', tier: 'Tier1', bidAmount: 500000, status: 'Submitted', allocatedAmount: null, wallet: 'Both' },
    { sessionId: 'OMO-2026-003', dealerId: 'D002', tier: 'Tier1', bidAmount: 480000, status: 'Submitted', allocatedAmount: null, wallet: 'Both' },
    { sessionId: 'OMO-2026-003', dealerId: 'D005', tier: 'Tier2', bidAmount: 200000, status: 'Submitted', allocatedAmount: null, wallet: 'eDahab' },
    { sessionId: 'OMO-2026-004', dealerId: 'D002', tier: 'Tier1', bidAmount: 300000, status: 'Submitted', allocatedAmount: null, wallet: 'Both' },
    { sessionId: 'OMO-2026-004', dealerId: 'D003', tier: 'Tier1', bidAmount: 250000, status: 'Submitted', allocatedAmount: null, wallet: 'Zaad' },
  ];

  for (const b of bids) {
    try {
      await prisma.oMOBid.upsert({
        where: { sessionId_dealerId: { sessionId: b.sessionId, dealerId: b.dealerId } },
        create: {
          sessionId: b.sessionId, dealerId: b.dealerId,
          tier: b.tier as 'Tier1' | 'Tier2',
          bidAmount: b.bidAmount,
          status: b.status as 'Submitted' | 'Allocated' | 'Partial' | 'Rejected',
          allocatedAmount: b.allocatedAmount,
          wallet: b.wallet as 'Zaad' | 'eDahab' | 'Both',
        },
        update: {},
      });
    } catch { /* skip duplicate */ }
  }
  console.log('✅ OMO bids seeded');

  // ─── TRANSACTIONS ──────────────────────────────────────────────────────────
  const txData = [
    { id: 'TX001', refNumber: 'FX-20260301-00001', type: 'BuyUSD', dealerId: 'D001', customerWallet: '063-1234-567', mobileNumber: '063-1234-567', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 1200, rate: 572, status: 'Completed', timestamp: '2026-03-01T08:23:11Z' },
    { id: 'TX002', refNumber: 'FX-20260301-00002', type: 'SellUSD', dealerId: 'D002', customerWallet: '770-9876-543', mobileNumber: '068-9876-543', telcoOperator: 'Somtel', walletType: 'eDahab', amountUSD: 800, rate: 567, status: 'Completed', timestamp: '2026-03-01T09:14:22Z' },
    { id: 'TX003', refNumber: 'FX-20260301-00003', type: 'BuyUSD', dealerId: 'D001', customerWallet: '063-2345-678', mobileNumber: '063-2345-678', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 2500, rate: 572, status: 'Completed', timestamp: '2026-03-02T10:45:33Z' },
    { id: 'TX004', refNumber: 'FX-20260302-00004', type: 'BuyUSD', dealerId: 'D003', customerWallet: '063-3456-789', mobileNumber: '063-3456-789', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 3000, rate: 571, status: 'Completed', timestamp: '2026-03-02T11:30:00Z' },
    { id: 'TX005', refNumber: 'FX-20260303-00005', type: 'SellUSD', dealerId: 'D004', customerWallet: '770-1122-334', mobileNumber: '068-1122-334', telcoOperator: 'Somtel', walletType: 'eDahab', amountUSD: 1500, rate: 567, status: 'Completed', timestamp: '2026-03-03T14:20:00Z' },
    { id: 'TX006', refNumber: 'FX-20260303-00006', type: 'BuyUSD', dealerId: 'D002', customerWallet: '063-4567-890', mobileNumber: '063-4567-890', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 55000, rate: 572, status: 'Completed', timestamp: '2026-03-04T08:00:00Z' },
    { id: 'TX007', refNumber: 'FX-20260304-00007', type: 'BuyUSD', dealerId: 'D001', customerWallet: '063-5678-901', mobileNumber: '063-5678-901', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 900, rate: 572, status: 'Pending', timestamp: '2026-03-04T09:15:00Z' },
    { id: 'TX008', refNumber: 'FX-20260305-00008', type: 'SellUSD', dealerId: 'D005', customerWallet: '770-3344-556', mobileNumber: '068-3344-556', telcoOperator: 'Somtel', walletType: 'eDahab', amountUSD: 2000, rate: 563, status: 'Completed', timestamp: '2026-03-05T10:30:00Z' },
    { id: 'TX009', refNumber: 'FX-20260305-00009', type: 'BuyUSD', dealerId: 'D002', customerWallet: '063-6789-012', mobileNumber: '063-6789-012', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 4500, rate: 572, status: 'Completed', timestamp: '2026-03-05T11:45:00Z' },
    { id: 'TX010', refNumber: 'FX-20260306-00010', type: 'BuyUSD', dealerId: 'D003', customerWallet: '063-7890-123', mobileNumber: '063-7890-123', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 1800, rate: 571, status: 'Failed', timestamp: '2026-03-06T08:20:00Z' },
    { id: 'TX011', refNumber: 'FX-20260307-00011', type: 'SellUSD', dealerId: 'D001', customerWallet: '770-5566-778', mobileNumber: '068-5566-778', telcoOperator: 'Somtel', walletType: 'eDahab', amountUSD: 3200, rate: 567, status: 'Completed', timestamp: '2026-03-07T13:00:00Z' },
    { id: 'TX012', refNumber: 'FX-20260308-00012', type: 'BuyUSD', dealerId: 'D004', customerWallet: '063-8901-234', mobileNumber: '063-8901-234', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 6700, rate: 572, status: 'Completed', timestamp: '2026-03-08T09:30:00Z' },
    { id: 'TX013', refNumber: 'FX-20260310-00013', type: 'BuyUSD', dealerId: 'D002', customerWallet: '063-9012-345', mobileNumber: '063-9012-345', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 52000, rate: 572, status: 'Completed', timestamp: '2026-03-10T10:10:00Z' },
    { id: 'TX014', refNumber: 'FX-20260311-00014', type: 'SellUSD', dealerId: 'D003', customerWallet: '770-7788-990', mobileNumber: '068-7788-990', telcoOperator: 'Somtel', walletType: 'eDahab', amountUSD: 1100, rate: 566, status: 'Completed', timestamp: '2026-03-11T11:00:00Z' },
    { id: 'TX015', refNumber: 'FX-20260312-00015', type: 'BuyUSD', dealerId: 'D001', customerWallet: '063-0123-456', mobileNumber: '063-0123-456', telcoOperator: 'Telesom', walletType: 'Zaad', amountUSD: 750, rate: 572, status: 'Cancelled', timestamp: '2026-03-12T14:45:00Z' },
  ];

  for (const t of txData) {
    await prisma.transaction.upsert({
      where: { refNumber: t.refNumber },
      create: {
        id: t.id, refNumber: t.refNumber,
        type: t.type as 'BuyUSD' | 'SellUSD',
        dealerId: t.dealerId,
        customerWallet: t.customerWallet,
        mobileNumber: t.mobileNumber,
        telcoOperator: t.telcoOperator as 'Telesom' | 'Somtel' | 'Soltelco',
        walletType: t.walletType as 'Zaad' | 'eDahab',
        amountUSD: t.amountUSD,
        amountSL: t.amountUSD * t.rate,
        rate: t.rate,
        status: t.status as 'Completed' | 'Pending' | 'Failed' | 'Cancelled',
        source: 'seed',
        timestamp: new Date(t.timestamp),
      },
      update: {},
    });
  }
  console.log('✅ Transactions seeded (TX001–TX015)');

  // ─── AML ALERTS ────────────────────────────────────────────────────────────
  const alerts = [
    { alertCode: 'AML-2026-0001', type: 'ThresholdExceeded', dealerId: 'D002', customerWallet: '063-4567-890', mobileNumber: '063-4567-890', amount: 55000, triggerRule: 'Transaction amount $55,000 exceeds threshold of $50,000', priority: 'High', status: 'UnderReview', txIds: ['TX006'] },
    { alertCode: 'AML-2026-0002', type: 'ThresholdExceeded', dealerId: 'D002', customerWallet: '063-9012-345', mobileNumber: '063-9012-345', amount: 52000, triggerRule: 'Transaction amount $52,000 exceeds threshold of $50,000', priority: 'High', status: 'New', txIds: ['TX013'] },
    { alertCode: 'AML-2026-0003', type: 'UnusualFrequency', dealerId: 'D001', customerWallet: '063-1234-567', mobileNumber: '063-1234-567', amount: 1200, triggerRule: '3 transactions from 063-1234-567 in 60 minutes', priority: 'Medium', status: 'Resolved', txIds: ['TX001', 'TX003'] },
  ];

  for (const a of alerts) {
    const existing = await prisma.aMLAlert.findUnique({ where: { alertCode: a.alertCode } });
    if (!existing) {
      await prisma.aMLAlert.create({
        data: {
          alertCode: a.alertCode,
          type: a.type as 'ThresholdExceeded' | 'UnusualFrequency' | 'StructuringPattern' | 'VelocityCheck',
          dealerId: a.dealerId,
          customerWallet: a.customerWallet,
          mobileNumber: a.mobileNumber,
          amount: a.amount,
          triggerRule: a.triggerRule,
          priority: a.priority as 'High' | 'Medium' | 'Low',
          status: a.status as 'New' | 'UnderReview' | 'Resolved',
          ...(a.status === 'Resolved' ? { resolvedBy: 'auditor', resolvedAt: new Date() } : {}),
          transactions: {
            create: a.txIds.map(txId => ({ transactionId: txId })),
          },
        },
      });
    }
  }
  console.log('✅ AML alerts seeded');

  // ─── AUDIT LOGS ────────────────────────────────────────────────────────────
  const auditLogs = [
    { actorName: 'admin', role: 'CBSuperAdmin', action: 'LOGIN', entity: 'Auth', details: 'Admin logged in successfully', ipAddress: '192.168.1.10' },
    { actorName: 'fxdesk', role: 'FXInterventionDesk', action: 'CREATE', entity: 'OMO Session', entityId: 'OMO-2026-001', details: 'Created Injection session OMO-2026-001 for $2,000,000 at SL 565', ipAddress: '192.168.1.11' },
    { actorName: 'fxdesk', role: 'FXInterventionDesk', action: 'CREATE', entity: 'OMO Session', entityId: 'OMO-2026-002', details: 'Created Absorption session OMO-2026-002 for $1,500,000 at SL 572', ipAddress: '192.168.1.11' },
    { actorName: 'fxdesk', role: 'FXInterventionDesk', action: 'EXECUTE', entity: 'OMO Session', entityId: 'OMO-2026-001', details: 'Executed pro-rata allocation for OMO-2026-001. 3 dealers allocated.', ipAddress: '192.168.1.11' },
    { actorName: 'analyst', role: 'Supervisor', action: 'UPDATE', entity: 'Rate Controls', details: 'Updated buy floor to 558, buy ceiling to 575, sell floor 560, sell ceiling 580', ipAddress: '192.168.1.12' },
    { actorName: 'auditor', role: 'Auditor', action: 'VIEW', entity: 'AML Alert', entityId: 'AML-2026-0001', details: 'Reviewed AML alert AML-2026-0001 — Threshold exceeded by D002', ipAddress: '192.168.1.13' },
    { actorName: 'auditor', role: 'Auditor', action: 'ALERT', entity: 'AML Alert', entityId: 'AML-2026-0003', details: 'Resolved AML alert AML-2026-0003 — Unusual frequency', ipAddress: '192.168.1.13' },
    { actorName: 'admin', role: 'CBSuperAdmin', action: 'CREATE', entity: 'Dealer', entityId: 'D005', details: 'Registered new dealer: Gulf Remittance Co. (Tier 2)', ipAddress: '192.168.1.10' },
    { actorName: 'admin', role: 'CBSuperAdmin', action: 'EXPORT', entity: 'Reports', details: 'Exported monthly FX transaction report for March 2026', ipAddress: '192.168.1.10' },
    { actorName: 'fxdesk', role: 'FXInterventionDesk', action: 'CREATE', entity: 'OMO Session', entityId: 'OMO-2026-003', details: 'Created Injection session OMO-2026-003 for $3,000,000 at SL 558', ipAddress: '192.168.1.11' },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }
  console.log('✅ Audit logs seeded');

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const notifications = [
    { type: 'OMO', title: 'New OMO Session Open', message: 'Injection session OMO-2026-003 is open. Rate: SL 558. Total: $3,000,000', dealerId: null, sessionId: 'OMO-2026-003' },
    { type: 'Settlement', title: 'Allocation Result: OMO-2026-001', message: 'You have been allocated $400,000 at SL 565/USD. Settlement due within 24 hours.', dealerId: 'D001', sessionId: 'OMO-2026-001' },
    { type: 'Settlement', title: 'Allocation Result: OMO-2026-001', message: 'You have been allocated $450,000 at SL 565/USD. Settlement due within 24 hours.', dealerId: 'D002', sessionId: 'OMO-2026-001' },
    { type: 'Rate', title: 'Rate Limits Updated', message: 'CB has updated rate controls. Buy: 558–575, Sell: 560–580 SLS/USD.', dealerId: null, sessionId: null },
    { type: 'System', title: 'System Maintenance', message: 'Scheduled maintenance on April 10, 2026 from 02:00–04:00 AM.', dealerId: null, sessionId: null },
    { type: 'OMO', title: 'Bid Submitted', message: 'Your bid of $480,000 for OMO-2026-003 has been received.', dealerId: 'D002', sessionId: 'OMO-2026-003' },
    { type: 'Transaction', title: 'High Volume Transaction', message: 'Transaction FX-20260304-00006 for $55,000 has triggered an AML review.', dealerId: 'D002', sessionId: null },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        type: n.type as 'OMO' | 'Transaction' | 'System' | 'Rate' | 'Settlement',
        title: n.title,
        message: n.message,
        dealerId: n.dealerId,
        sessionId: n.sessionId,
      },
    });
  }
  console.log('✅ Notifications seeded');

  console.log('\n✨ Database seeding complete!\n');
  console.log('CB Portal login:     any CB username / admin123');
  console.log('Dealer Portal login: dealer / dealer123  (D002 = Premier Exchange Co.)');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
