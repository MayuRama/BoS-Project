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
  // Wallet balances reflect state after past OMO allocations:
  //   OMO-2026-001 (Injection): D001 Zaad +$400K, D002 Zaad +$450K, D003 Zaad +$300K
  //   OMO-2026-002 (Absorption): D001 Zaad -$400K, D004 eDahab -$350K
  const dealerData = [
    { id: 'D001', name: 'Dahabshiil Exchange',   licenseNumber: 'FX-LIC-2019-001', tier: 'Tier1', buyRate: 567, sellRate: 572, dailyLimit: 500000, status: 'Active', walletProvider: 'Both',   zaadWallet: '063-4521-001', eDahabWallet: '770-9843-001', registeredDate: '2019-03-15', volume30d: 3850000, txCount30d: 142, complianceScore: 98, zaadBalanceUSD: 250000, eDahabBalanceUSD: 150000, contactEmail: 'fx@dahabshiil.com',        contactPhone: '+252-63-4521000' },
    { id: 'D002', name: 'Premier Exchange Co.',   licenseNumber: 'FX-LIC-2019-002', tier: 'Tier1', buyRate: 567, sellRate: 572, dailyLimit: 500000, status: 'Active', walletProvider: 'Both',   zaadWallet: '063-7712-002', eDahabWallet: '770-3312-002', registeredDate: '2019-05-20', volume30d: 2940000, txCount30d: 118, complianceScore: 97, zaadBalanceUSD: 650000, eDahabBalanceUSD:  85000, contactEmail: 'ops@premierexchange.so', contactPhone: '+252-63-7712000' },
    { id: 'D003', name: 'Amal Bank FX',          licenseNumber: 'FX-LIC-2020-003', tier: 'Tier1', buyRate: 566, sellRate: 571, dailyLimit: 450000, status: 'Active', walletProvider: 'Zaad',   zaadWallet: '063-5541-003', eDahabWallet: null,            registeredDate: '2020-01-10', volume30d: 2210000, txCount30d:  95, complianceScore: 95, zaadBalanceUSD: 480000, eDahabBalanceUSD:      0, contactEmail: 'fx@amalbank.so',         contactPhone: '+252-63-5541000' },
    { id: 'D004', name: 'Salaam Somali Bank FX', licenseNumber: 'FX-LIC-2020-004', tier: 'Tier1', buyRate: 567, sellRate: 572, dailyLimit: 400000, status: 'Active', walletProvider: 'Both',   zaadWallet: '063-6632-004', eDahabWallet: '770-4421-004', registeredDate: '2020-06-01', volume30d: 1870000, txCount30d:  76, complianceScore: 94, zaadBalanceUSD: 200000, eDahabBalanceUSD:  50000, contactEmail: 'fx@salaambank.so',       contactPhone: '+252-63-6632000' },
    { id: 'D005', name: 'Gulf Remittance Co.',   licenseNumber: 'FX-LIC-2021-005', tier: 'Tier2', buyRate: 563, sellRate: 568, dailyLimit: 250000, status: 'Active', walletProvider: 'eDahab', zaadWallet: null,            eDahabWallet: '770-2211-005', registeredDate: '2021-02-14', volume30d:  980000, txCount30d:  44, complianceScore: 91, zaadBalanceUSD:      0, eDahabBalanceUSD: 175000, contactEmail: 'ops@gulfremit.so',       contactPhone: '+252-68-2211000' },
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
        zaadBalanceUSD: d.zaadBalanceUSD, eDahabBalanceUSD: d.eDahabBalanceUSD,
      },
    });
  }
  console.log('✅ Dealers seeded (D001–D005) with wallet balances');

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
    { sessionId: 'OMO-2026-001', dealerId: 'D001', tier: 'Tier1', bidAmount: 450000, status: 'Allocated', allocatedAmount: 400000, walletChoice: 'Zaad'   },
    { sessionId: 'OMO-2026-001', dealerId: 'D002', tier: 'Tier1', bidAmount: 500000, status: 'Allocated', allocatedAmount: 450000, walletChoice: 'Zaad'   },
    { sessionId: 'OMO-2026-001', dealerId: 'D003', tier: 'Tier1', bidAmount: 300000, status: 'Allocated', allocatedAmount: 300000, walletChoice: 'Zaad'   },
    { sessionId: 'OMO-2026-002', dealerId: 'D001', tier: 'Tier1', bidAmount: 400000, status: 'Allocated', allocatedAmount: 400000, walletChoice: 'Zaad'   },
    { sessionId: 'OMO-2026-002', dealerId: 'D004', tier: 'Tier1', bidAmount: 350000, status: 'Allocated', allocatedAmount: 350000, walletChoice: 'eDahab' },
    { sessionId: 'OMO-2026-003', dealerId: 'D001', tier: 'Tier1', bidAmount: 500000, status: 'Submitted', allocatedAmount: null,   walletChoice: 'Zaad'   },
    { sessionId: 'OMO-2026-003', dealerId: 'D002', tier: 'Tier1', bidAmount: 480000, status: 'Submitted', allocatedAmount: null,   walletChoice: 'Zaad'   },
    { sessionId: 'OMO-2026-003', dealerId: 'D005', tier: 'Tier2', bidAmount: 200000, status: 'Submitted', allocatedAmount: null,   walletChoice: 'eDahab' },
    { sessionId: 'OMO-2026-004', dealerId: 'D002', tier: 'Tier1', bidAmount: 300000, status: 'Submitted', allocatedAmount: null,   walletChoice: 'Zaad'   },
    { sessionId: 'OMO-2026-004', dealerId: 'D003', tier: 'Tier1', bidAmount: 250000, status: 'Submitted', allocatedAmount: null,   walletChoice: 'Zaad'   },
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
          walletChoice: b.walletChoice as 'Zaad' | 'eDahab',
        },
        update: { walletChoice: b.walletChoice as 'Zaad' | 'eDahab' },
      });
    } catch { /* skip duplicate */ }
  }
  console.log('✅ OMO bids seeded (with walletChoice)');

  // ─── ALLOCATION RESULTS ────────────────────────────────────────────────────
  // OMO-2026-001 (Injection, Allotment, SL 565): D001 $400K, D002 $450K, D003 $300K
  // OMO-2026-002 (Absorption, Best Bid, SL 572): D001 $400K, D004 $350K
  const allocationResults = [
    { sessionId: 'OMO-2026-001', dealerId: 'D001', bidAmount: 450000, allocatedAmount: 400000, fixedRate: 565, slSettlement: 400000 * 565, settlementStatus: 'Completed' },
    { sessionId: 'OMO-2026-001', dealerId: 'D002', bidAmount: 500000, allocatedAmount: 450000, fixedRate: 565, slSettlement: 450000 * 565, settlementStatus: 'Completed' },
    { sessionId: 'OMO-2026-001', dealerId: 'D003', bidAmount: 300000, allocatedAmount: 300000, fixedRate: 565, slSettlement: 300000 * 565, settlementStatus: 'Completed' },
    { sessionId: 'OMO-2026-002', dealerId: 'D001', bidAmount: 400000, allocatedAmount: 400000, fixedRate: 572, slSettlement: 400000 * 572, settlementStatus: 'Completed' },
    { sessionId: 'OMO-2026-002', dealerId: 'D004', bidAmount: 350000, allocatedAmount: 350000, fixedRate: 572, slSettlement: 350000 * 572, settlementStatus: 'Completed' },
  ];

  for (const r of allocationResults) {
    const exists = await prisma.allocationResult.findFirst({
      where: { sessionId: r.sessionId, dealerId: r.dealerId },
    });
    if (!exists) {
      await prisma.allocationResult.create({
        data: {
          sessionId: r.sessionId, dealerId: r.dealerId,
          bidAmount: r.bidAmount, allocatedAmount: r.allocatedAmount,
          fixedRate: r.fixedRate, slSettlement: r.slSettlement,
          settlementStatus: r.settlementStatus as 'Pending' | 'Completed' | 'Failed',
        },
      });
    }
  }
  console.log('✅ Allocation results seeded');

  // ─── WALLET LEDGER ─────────────────────────────────────────────────────────
  // Historical ledger entries reflecting the two completed OMO sessions
  const walletLedgerEntries = [
    // OMO-2026-001 Injection → dealers received USD (Credits)
    { dealerId: 'D001', walletType: 'Zaad',   entryType: 'Credit', amountUSD: 400000, reference: 'OMO-2026-001', description: 'OMO Injection — Allotment allocation from session OMO-2026-001', balanceAfter: 250000 + 400000 },
    { dealerId: 'D002', walletType: 'Zaad',   entryType: 'Credit', amountUSD: 450000, reference: 'OMO-2026-001', description: 'OMO Injection — Allotment allocation from session OMO-2026-001', balanceAfter: 200000 + 450000 },
    { dealerId: 'D003', walletType: 'Zaad',   entryType: 'Credit', amountUSD: 300000, reference: 'OMO-2026-001', description: 'OMO Injection — Allotment allocation from session OMO-2026-001', balanceAfter: 180000 + 300000 },
    // OMO-2026-002 Absorption → dealers sold USD back to CB (Debits)
    { dealerId: 'D001', walletType: 'Zaad',   entryType: 'Debit',  amountUSD: 400000, reference: 'OMO-2026-002', description: 'OMO Absorption — Best Bid allocation from session OMO-2026-002', balanceAfter: 250000 },
    { dealerId: 'D004', walletType: 'eDahab', entryType: 'Debit',  amountUSD: 350000, reference: 'OMO-2026-002', description: 'OMO Absorption — Best Bid allocation from session OMO-2026-002', balanceAfter: 400000 - 350000 },
  ];

  for (const entry of walletLedgerEntries) {
    const exists = await prisma.walletLedger.findFirst({
      where: { dealerId: entry.dealerId, reference: entry.reference },
    });
    if (!exists) {
      await prisma.walletLedger.create({
        data: {
          dealerId: entry.dealerId,
          walletType: entry.walletType as 'Zaad' | 'eDahab',
          entryType: entry.entryType,
          amountUSD: entry.amountUSD,
          reference: entry.reference,
          description: entry.description,
          balanceAfter: entry.balanceAfter,
        },
      });
    }
  }
  console.log('✅ Wallet ledger seeded');

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

  // ─── RECENT TRANSACTIONS (Last 7 days for dashboard charts) ──────────────
  const recentTxData = [
    // 2026-04-01 (Tuesday) — 9 transactions
    { id: 'TX016', refNumber: 'FX-20260401-00016', type: 'BuyUSD',  dealerId: 'D001', customerWallet: '063-1100-001', mobileNumber: '063-1100-001', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 1500,  rate: 572, status: 'Completed', timestamp: '2026-04-01T08:10:00Z' },
    { id: 'TX017', refNumber: 'FX-20260401-00017', type: 'SellUSD', dealerId: 'D002', customerWallet: '770-2200-002', mobileNumber: '068-2200-002', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 2200,  rate: 567, status: 'Completed', timestamp: '2026-04-01T09:30:00Z' },
    { id: 'TX018', refNumber: 'FX-20260401-00018', type: 'BuyUSD',  dealerId: 'D003', customerWallet: '063-3300-003', mobileNumber: '063-3300-003', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 4800,  rate: 572, status: 'Completed', timestamp: '2026-04-01T10:45:00Z' },
    { id: 'TX019', refNumber: 'FX-20260401-00019', type: 'SellUSD', dealerId: 'D001', customerWallet: '770-4400-004', mobileNumber: '068-4400-004', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 1100,  rate: 567, status: 'Completed', timestamp: '2026-04-01T11:20:00Z' },
    { id: 'TX020', refNumber: 'FX-20260401-00020', type: 'BuyUSD',  dealerId: 'D004', customerWallet: '063-5500-005', mobileNumber: '063-5500-005', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 7200,  rate: 572, status: 'Completed', timestamp: '2026-04-01T12:05:00Z' },
    { id: 'TX021', refNumber: 'FX-20260401-00021', type: 'BuyUSD',  dealerId: 'D002', customerWallet: '063-6600-006', mobileNumber: '063-6600-006', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 3400,  rate: 572, status: 'Completed', timestamp: '2026-04-01T13:15:00Z' },
    { id: 'TX022', refNumber: 'FX-20260401-00022', type: 'SellUSD', dealerId: 'D005', customerWallet: '770-7700-007', mobileNumber: '068-7700-007', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 5600,  rate: 567, status: 'Completed', timestamp: '2026-04-01T14:30:00Z' },
    { id: 'TX023', refNumber: 'FX-20260401-00023', type: 'BuyUSD',  dealerId: 'D001', customerWallet: '063-8800-008', mobileNumber: '063-8800-008', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 900,   rate: 572, status: 'Pending',   timestamp: '2026-04-01T15:45:00Z' },
    { id: 'TX024', refNumber: 'FX-20260401-00024', type: 'SellUSD', dealerId: 'D003', customerWallet: '770-9900-009', mobileNumber: '068-9900-009', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 2800,  rate: 567, status: 'Completed', timestamp: '2026-04-01T16:50:00Z' },
    // 2026-04-02 (Wednesday) — 9 transactions
    { id: 'TX025', refNumber: 'FX-20260402-00025', type: 'BuyUSD',  dealerId: 'D002', customerWallet: '063-1111-010', mobileNumber: '063-1111-010', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 6500,  rate: 572, status: 'Completed', timestamp: '2026-04-02T08:05:00Z' },
    { id: 'TX026', refNumber: 'FX-20260402-00026', type: 'SellUSD', dealerId: 'D004', customerWallet: '770-2222-011', mobileNumber: '068-2222-011', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 3100,  rate: 567, status: 'Completed', timestamp: '2026-04-02T09:20:00Z' },
    { id: 'TX027', refNumber: 'FX-20260402-00027', type: 'BuyUSD',  dealerId: 'D001', customerWallet: '063-3333-012', mobileNumber: '063-3333-012', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 2700,  rate: 572, status: 'Completed', timestamp: '2026-04-02T10:35:00Z' },
    { id: 'TX028', refNumber: 'FX-20260402-00028', type: 'BuyUSD',  dealerId: 'D003', customerWallet: '063-4444-013', mobileNumber: '063-4444-013', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 8000,  rate: 572, status: 'Completed', timestamp: '2026-04-02T11:50:00Z' },
    { id: 'TX029', refNumber: 'FX-20260402-00029', type: 'SellUSD', dealerId: 'D002', customerWallet: '770-5555-014', mobileNumber: '068-5555-014', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 4200,  rate: 567, status: 'Completed', timestamp: '2026-04-02T12:40:00Z' },
    { id: 'TX030', refNumber: 'FX-20260402-00030', type: 'BuyUSD',  dealerId: 'D005', customerWallet: '063-6666-015', mobileNumber: '063-6666-015', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 500,   rate: 572, status: 'Completed', timestamp: '2026-04-02T13:55:00Z' },
    { id: 'TX031', refNumber: 'FX-20260402-00031', type: 'SellUSD', dealerId: 'D001', customerWallet: '770-7777-016', mobileNumber: '068-7777-016', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 1900,  rate: 567, status: 'Failed',    timestamp: '2026-04-02T14:30:00Z' },
    { id: 'TX032', refNumber: 'FX-20260402-00032', type: 'BuyUSD',  dealerId: 'D004', customerWallet: '063-8888-017', mobileNumber: '063-8888-017', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 3900,  rate: 572, status: 'Completed', timestamp: '2026-04-02T15:45:00Z' },
    { id: 'TX033', refNumber: 'FX-20260402-00033', type: 'SellUSD', dealerId: 'D003', customerWallet: '770-9999-018', mobileNumber: '068-9999-018', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 7500,  rate: 567, status: 'Completed', timestamp: '2026-04-02T16:55:00Z' },
    // 2026-04-03 (Thursday) — 9 transactions
    { id: 'TX034', refNumber: 'FX-20260403-00034', type: 'BuyUSD',  dealerId: 'D001', customerWallet: '063-1010-019', mobileNumber: '063-1010-019', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 4100,  rate: 572, status: 'Completed', timestamp: '2026-04-03T08:15:00Z' },
    { id: 'TX035', refNumber: 'FX-20260403-00035', type: 'SellUSD', dealerId: 'D002', customerWallet: '770-2020-020', mobileNumber: '068-2020-020', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 2600,  rate: 567, status: 'Completed', timestamp: '2026-04-03T09:25:00Z' },
    { id: 'TX036', refNumber: 'FX-20260403-00036', type: 'BuyUSD',  dealerId: 'D003', customerWallet: '063-3030-021', mobileNumber: '063-3030-021', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 6800,  rate: 572, status: 'Completed', timestamp: '2026-04-03T10:40:00Z' },
    { id: 'TX037', refNumber: 'FX-20260403-00037', type: 'BuyUSD',  dealerId: 'D004', customerWallet: '063-4040-022', mobileNumber: '063-4040-022', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 1300,  rate: 572, status: 'Completed', timestamp: '2026-04-03T11:55:00Z' },
    { id: 'TX038', refNumber: 'FX-20260403-00038', type: 'SellUSD', dealerId: 'D005', customerWallet: '770-5050-023', mobileNumber: '068-5050-023', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 3700,  rate: 567, status: 'Completed', timestamp: '2026-04-03T12:50:00Z' },
    { id: 'TX039', refNumber: 'FX-20260403-00039', type: 'BuyUSD',  dealerId: 'D002', customerWallet: '063-6060-024', mobileNumber: '063-6060-024', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 5200,  rate: 572, status: 'Completed', timestamp: '2026-04-03T13:45:00Z' },
    { id: 'TX040', refNumber: 'FX-20260403-00040', type: 'SellUSD', dealerId: 'D001', customerWallet: '770-7070-025', mobileNumber: '068-7070-025', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 800,   rate: 567, status: 'Pending',   timestamp: '2026-04-03T14:30:00Z' },
    { id: 'TX041', refNumber: 'FX-20260403-00041', type: 'BuyUSD',  dealerId: 'D003', customerWallet: '063-8080-026', mobileNumber: '063-8080-026', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 9200,  rate: 572, status: 'Completed', timestamp: '2026-04-03T15:50:00Z' },
    { id: 'TX042', refNumber: 'FX-20260403-00042', type: 'SellUSD', dealerId: 'D004', customerWallet: '770-9090-027', mobileNumber: '068-9090-027', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 2100,  rate: 567, status: 'Completed', timestamp: '2026-04-03T16:40:00Z' },
    // 2026-04-04 (Friday) — 9 transactions
    { id: 'TX043', refNumber: 'FX-20260404-00043', type: 'BuyUSD',  dealerId: 'D001', customerWallet: '063-1122-028', mobileNumber: '063-1122-028', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 3300,  rate: 572, status: 'Completed', timestamp: '2026-04-04T08:05:00Z' },
    { id: 'TX044', refNumber: 'FX-20260404-00044', type: 'SellUSD', dealerId: 'D002', customerWallet: '770-2233-029', mobileNumber: '068-2233-029', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 4700,  rate: 567, status: 'Completed', timestamp: '2026-04-04T09:15:00Z' },
    { id: 'TX045', refNumber: 'FX-20260404-00045', type: 'BuyUSD',  dealerId: 'D004', customerWallet: '063-3344-030', mobileNumber: '063-3344-030', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 7700,  rate: 572, status: 'Completed', timestamp: '2026-04-04T10:30:00Z' },
    { id: 'TX046', refNumber: 'FX-20260404-00046', type: 'BuyUSD',  dealerId: 'D003', customerWallet: '063-4455-031', mobileNumber: '063-4455-031', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 1700,  rate: 572, status: 'Completed', timestamp: '2026-04-04T11:45:00Z' },
    { id: 'TX047', refNumber: 'FX-20260404-00047', type: 'SellUSD', dealerId: 'D005', customerWallet: '770-5566-032', mobileNumber: '068-5566-032', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 2400,  rate: 567, status: 'Completed', timestamp: '2026-04-04T12:55:00Z' },
    { id: 'TX048', refNumber: 'FX-20260404-00048', type: 'BuyUSD',  dealerId: 'D002', customerWallet: '063-6677-033', mobileNumber: '063-6677-033', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 6200,  rate: 572, status: 'Completed', timestamp: '2026-04-04T13:50:00Z' },
    { id: 'TX049', refNumber: 'FX-20260404-00049', type: 'SellUSD', dealerId: 'D001', customerWallet: '770-7788-034', mobileNumber: '068-7788-034', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 3800,  rate: 567, status: 'Completed', timestamp: '2026-04-04T14:40:00Z' },
    { id: 'TX050', refNumber: 'FX-20260404-00050', type: 'BuyUSD',  dealerId: 'D004', customerWallet: '063-8899-035', mobileNumber: '063-8899-035', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 5100,  rate: 572, status: 'Pending',   timestamp: '2026-04-04T15:30:00Z' },
    { id: 'TX051', refNumber: 'FX-20260404-00051', type: 'SellUSD', dealerId: 'D003', customerWallet: '770-9900-036', mobileNumber: '068-9900-036', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 1600,  rate: 567, status: 'Completed', timestamp: '2026-04-04T16:25:00Z' },
    // 2026-04-05 (Saturday) — 8 transactions
    { id: 'TX052', refNumber: 'FX-20260405-00052', type: 'BuyUSD',  dealerId: 'D002', customerWallet: '063-1212-037', mobileNumber: '063-1212-037', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 2900,  rate: 572, status: 'Completed', timestamp: '2026-04-05T08:30:00Z' },
    { id: 'TX053', refNumber: 'FX-20260405-00053', type: 'SellUSD', dealerId: 'D001', customerWallet: '770-2323-038', mobileNumber: '068-2323-038', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 4400,  rate: 567, status: 'Completed', timestamp: '2026-04-05T09:50:00Z' },
    { id: 'TX054', refNumber: 'FX-20260405-00054', type: 'BuyUSD',  dealerId: 'D003', customerWallet: '063-3434-039', mobileNumber: '063-3434-039', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 7100,  rate: 572, status: 'Completed', timestamp: '2026-04-05T11:00:00Z' },
    { id: 'TX055', refNumber: 'FX-20260405-00055', type: 'BuyUSD',  dealerId: 'D005', customerWallet: '063-4545-040', mobileNumber: '063-4545-040', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 600,   rate: 572, status: 'Completed', timestamp: '2026-04-05T12:10:00Z' },
    { id: 'TX056', refNumber: 'FX-20260405-00056', type: 'SellUSD', dealerId: 'D004', customerWallet: '770-5656-041', mobileNumber: '068-5656-041', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 3500,  rate: 567, status: 'Completed', timestamp: '2026-04-05T13:20:00Z' },
    { id: 'TX057', refNumber: 'FX-20260405-00057', type: 'BuyUSD',  dealerId: 'D001', customerWallet: '063-6767-042', mobileNumber: '063-6767-042', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 5800,  rate: 572, status: 'Completed', timestamp: '2026-04-05T14:30:00Z' },
    { id: 'TX058', refNumber: 'FX-20260405-00058', type: 'SellUSD', dealerId: 'D002', customerWallet: '770-7878-043', mobileNumber: '068-7878-043', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 2300,  rate: 567, status: 'Failed',    timestamp: '2026-04-05T15:15:00Z' },
    { id: 'TX059', refNumber: 'FX-20260405-00059', type: 'BuyUSD',  dealerId: 'D003', customerWallet: '063-8989-044', mobileNumber: '063-8989-044', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 4600,  rate: 572, status: 'Completed', timestamp: '2026-04-05T16:40:00Z' },
    // 2026-04-06 (Sunday) — 8 transactions
    { id: 'TX060', refNumber: 'FX-20260406-00060', type: 'SellUSD', dealerId: 'D001', customerWallet: '770-1010-045', mobileNumber: '068-1010-045', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 1800,  rate: 567, status: 'Completed', timestamp: '2026-04-06T08:20:00Z' },
    { id: 'TX061', refNumber: 'FX-20260406-00061', type: 'BuyUSD',  dealerId: 'D002', customerWallet: '063-2020-046', mobileNumber: '063-2020-046', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 3600,  rate: 572, status: 'Completed', timestamp: '2026-04-06T09:35:00Z' },
    { id: 'TX062', refNumber: 'FX-20260406-00062', type: 'BuyUSD',  dealerId: 'D004', customerWallet: '063-3030-047', mobileNumber: '063-3030-047', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 6400,  rate: 572, status: 'Completed', timestamp: '2026-04-06T10:50:00Z' },
    { id: 'TX063', refNumber: 'FX-20260406-00063', type: 'SellUSD', dealerId: 'D003', customerWallet: '770-4040-048', mobileNumber: '068-4040-048', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 2700,  rate: 567, status: 'Completed', timestamp: '2026-04-06T11:55:00Z' },
    { id: 'TX064', refNumber: 'FX-20260406-00064', type: 'BuyUSD',  dealerId: 'D001', customerWallet: '063-5050-049', mobileNumber: '063-5050-049', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 8500,  rate: 572, status: 'Completed', timestamp: '2026-04-06T12:45:00Z' },
    { id: 'TX065', refNumber: 'FX-20260406-00065', type: 'SellUSD', dealerId: 'D005', customerWallet: '770-6060-050', mobileNumber: '068-6060-050', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 4300,  rate: 567, status: 'Completed', timestamp: '2026-04-06T13:50:00Z' },
    { id: 'TX066', refNumber: 'FX-20260406-00066', type: 'BuyUSD',  dealerId: 'D002', customerWallet: '063-7070-051', mobileNumber: '063-7070-051', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 1400,  rate: 572, status: 'Pending',   timestamp: '2026-04-06T14:55:00Z' },
    { id: 'TX067', refNumber: 'FX-20260406-00067', type: 'SellUSD', dealerId: 'D004', customerWallet: '770-8080-052', mobileNumber: '068-8080-052', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 5300,  rate: 567, status: 'Completed', timestamp: '2026-04-06T16:00:00Z' },
    // 2026-04-07 (Monday — today) — 11 transactions
    { id: 'TX068', refNumber: 'FX-20260407-00068', type: 'BuyUSD',  dealerId: 'D001', customerWallet: '063-1001-053', mobileNumber: '063-1001-053', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 2500,  rate: 572, status: 'Completed', timestamp: '2026-04-07T07:15:00Z' },
    { id: 'TX069', refNumber: 'FX-20260407-00069', type: 'SellUSD', dealerId: 'D002', customerWallet: '770-2002-054', mobileNumber: '068-2002-054', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 3900,  rate: 567, status: 'Completed', timestamp: '2026-04-07T08:00:00Z' },
    { id: 'TX070', refNumber: 'FX-20260407-00070', type: 'BuyUSD',  dealerId: 'D003', customerWallet: '063-3003-055', mobileNumber: '063-3003-055', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 6100,  rate: 572, status: 'Completed', timestamp: '2026-04-07T08:45:00Z' },
    { id: 'TX071', refNumber: 'FX-20260407-00071', type: 'BuyUSD',  dealerId: 'D004', customerWallet: '063-4004-056', mobileNumber: '063-4004-056', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 1200,  rate: 572, status: 'Completed', timestamp: '2026-04-07T09:20:00Z' },
    { id: 'TX072', refNumber: 'FX-20260407-00072', type: 'SellUSD', dealerId: 'D001', customerWallet: '770-5005-057', mobileNumber: '068-5005-057', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 4800,  rate: 567, status: 'Completed', timestamp: '2026-04-07T09:55:00Z' },
    { id: 'TX073', refNumber: 'FX-20260407-00073', type: 'BuyUSD',  dealerId: 'D002', customerWallet: '063-6006-058', mobileNumber: '063-6006-058', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 7800,  rate: 572, status: 'Completed', timestamp: '2026-04-07T10:30:00Z' },
    { id: 'TX074', refNumber: 'FX-20260407-00074', type: 'SellUSD', dealerId: 'D005', customerWallet: '770-7007-059', mobileNumber: '068-7007-059', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 2200,  rate: 567, status: 'Completed', timestamp: '2026-04-07T11:00:00Z' },
    { id: 'TX075', refNumber: 'FX-20260407-00075', type: 'BuyUSD',  dealerId: 'D003', customerWallet: '063-8008-060', mobileNumber: '063-8008-060', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 5500,  rate: 572, status: 'Completed', timestamp: '2026-04-07T11:35:00Z' },
    { id: 'TX076', refNumber: 'FX-20260407-00076', type: 'SellUSD', dealerId: 'D004', customerWallet: '770-9009-061', mobileNumber: '068-9009-061', telcoOperator: 'Somtel',  walletType: 'eDahab', amountUSD: 3200,  rate: 567, status: 'Completed', timestamp: '2026-04-07T12:10:00Z' },
    { id: 'TX077', refNumber: 'FX-20260407-00077', type: 'BuyUSD',  dealerId: 'D001', customerWallet: '063-1100-062', mobileNumber: '063-1100-062', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 9500,  rate: 572, status: 'Completed', timestamp: '2026-04-07T12:45:00Z' },
    { id: 'TX078', refNumber: 'FX-20260407-00078', type: 'BuyUSD',  dealerId: 'D002', customerWallet: '063-2200-063', mobileNumber: '063-2200-063', telcoOperator: 'Telesom', walletType: 'Zaad',   amountUSD: 4100,  rate: 572, status: 'Pending',   timestamp: '2026-04-07T13:20:00Z' },
  ];

  for (const t of recentTxData) {
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
  console.log(`✅ Recent transactions seeded (TX016–TX0${15 + recentTxData.length})`);

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
