import type {
  Dealer,
  OMOSession,
  OMOBid,
  Transaction,
  AMLAlert,
  AuditLog,
  Notification,
  RateHistory,
  AllocationResult,
} from '../types';

// ─── DEALERS ────────────────────────────────────────────────────────────────

export const dealers: Dealer[] = [
  {
    id: 'D001', name: 'Dahabshiil Exchange', licenseNumber: 'FX-LIC-2019-001',
    tier: 1, buyRate: 567, sellRate: 572, dailyLimit: 500000, status: 'Active',
    walletProvider: 'Both', zaadWallet: '063-4521-001', eDahabWallet: '770-9843-001',
    registeredDate: '2019-03-15', volume30d: 3850000, txCount30d: 142, complianceScore: 98,
    contactEmail: 'fx@dahabshiil.com', contactPhone: '+252-63-4521000',
  },
  {
    id: 'D002', name: 'Premier Exchange Co.', licenseNumber: 'FX-LIC-2019-002',
    tier: 1, buyRate: 567, sellRate: 572, dailyLimit: 500000, status: 'Active',
    walletProvider: 'Both', zaadWallet: '063-7712-002', eDahabWallet: '770-3312-002',
    registeredDate: '2019-05-20', volume30d: 2940000, txCount30d: 118, complianceScore: 97,
    contactEmail: 'ops@premierexchange.so', contactPhone: '+252-63-7712000',
  },
  {
    id: 'D003', name: 'Amal Bank FX', licenseNumber: 'FX-LIC-2020-003',
    tier: 1, buyRate: 566, sellRate: 571, dailyLimit: 450000, status: 'Active',
    walletProvider: 'Zaad', zaadWallet: '063-5541-003',
    registeredDate: '2020-01-10', volume30d: 2210000, txCount30d: 95, complianceScore: 95,
    contactEmail: 'fx@amalbank.so', contactPhone: '+252-63-5541000',
  },
  {
    id: 'D004', name: 'Salaam Somali Bank FX', licenseNumber: 'FX-LIC-2020-004',
    tier: 1, buyRate: 567, sellRate: 572, dailyLimit: 400000, status: 'Active',
    walletProvider: 'Both', zaadWallet: '063-6632-004', eDahabWallet: '770-4421-004',
    registeredDate: '2020-04-22', volume30d: 1980000, txCount30d: 87, complianceScore: 94,
    contactEmail: 'fx@salaambank.so', contactPhone: '+252-63-6632000',
  },
  {
    id: 'D005', name: 'Towfiq Money Transfer', licenseNumber: 'FX-LIC-2021-005',
    tier: 1, buyRate: 565, sellRate: 570, dailyLimit: 350000, status: 'Active',
    walletProvider: 'e-Dahab', eDahabWallet: '770-8821-005',
    registeredDate: '2021-02-14', volume30d: 1650000, txCount30d: 73, complianceScore: 92,
    contactEmail: 'ops@towfiq.so', contactPhone: '+252-63-8821000',
  },
  {
    id: 'D006', name: 'Horyaal Exchange', licenseNumber: 'FX-LIC-2021-006',
    tier: 2, buyRate: 566, sellRate: 571, dailyLimit: 200000, status: 'Active',
    walletProvider: 'Zaad', zaadWallet: '063-4412-006',
    registeredDate: '2021-06-30', volume30d: 890000, txCount30d: 54, complianceScore: 90,
    contactEmail: 'info@horyaal.so', contactPhone: '+252-63-4412000',
  },
  {
    id: 'D007', name: 'Barwaaqo FX Services', licenseNumber: 'FX-LIC-2021-007',
    tier: 2, buyRate: 565, sellRate: 571, dailyLimit: 180000, status: 'Active',
    walletProvider: 'Both', zaadWallet: '063-3312-007', eDahabWallet: '770-5512-007',
    registeredDate: '2021-08-15', volume30d: 780000, txCount30d: 48, complianceScore: 88,
    contactEmail: 'fx@barwaaqo.so', contactPhone: '+252-63-3312000',
  },
  {
    id: 'D008', name: 'Nabad Currency Exchange', licenseNumber: 'FX-LIC-2022-008',
    tier: 2, buyRate: 565, sellRate: 570, dailyLimit: 150000, status: 'Active',
    walletProvider: 'Zaad', zaadWallet: '063-9921-008',
    registeredDate: '2022-01-05', volume30d: 620000, txCount30d: 42, complianceScore: 89,
    contactEmail: 'nabad@exchange.so', contactPhone: '+252-63-9921000',
  },
  {
    id: 'D009', name: 'Iftin Money Services', licenseNumber: 'FX-LIC-2022-009',
    tier: 2, buyRate: 566, sellRate: 571, dailyLimit: 120000, status: 'Active',
    walletProvider: 'e-Dahab', eDahabWallet: '770-7712-009',
    registeredDate: '2022-03-18', volume30d: 450000, txCount30d: 31, complianceScore: 85,
    contactEmail: 'info@iftin.so', contactPhone: '+252-63-7712009',
  },
  {
    id: 'D010', name: 'Xiddigta Exchange', licenseNumber: 'FX-LIC-2022-010',
    tier: 2, buyRate: 565, sellRate: 570, dailyLimit: 100000, status: 'Active',
    walletProvider: 'Zaad', zaadWallet: '063-6621-010',
    registeredDate: '2022-07-20', volume30d: 380000, txCount30d: 28, complianceScore: 84,
    contactEmail: 'xiddigta@fx.so', contactPhone: '+252-63-6621000',
  },
  {
    id: 'D011', name: 'Golis Money Transfer', licenseNumber: 'FX-LIC-2023-011',
    tier: 2, buyRate: 564, sellRate: 569, dailyLimit: 100000, status: 'Suspended',
    walletProvider: 'Both', zaadWallet: '063-5521-011', eDahabWallet: '770-3321-011',
    registeredDate: '2023-01-12', volume30d: 120000, txCount30d: 9, complianceScore: 61,
    contactEmail: 'golis@transfer.so', contactPhone: '+252-63-5521000',
  },
  {
    id: 'D012', name: 'Somtel FX Bureau', licenseNumber: 'FX-LIC-2023-012',
    tier: 2, buyRate: 565, sellRate: 571, dailyLimit: 90000, status: 'Active',
    walletProvider: 'e-Dahab', eDahabWallet: '770-9921-012',
    registeredDate: '2023-04-05', volume30d: 290000, txCount30d: 22, complianceScore: 87,
    contactEmail: 'somtel@fxbureau.so', contactPhone: '+252-63-9921012',
  },
  {
    id: 'D013', name: 'Mustaqbal Exchange', licenseNumber: 'FX-LIC-2023-013',
    tier: 2, buyRate: 566, sellRate: 571, dailyLimit: 80000, status: 'Active',
    walletProvider: 'Zaad', zaadWallet: '063-4421-013',
    registeredDate: '2023-06-22', volume30d: 215000, txCount30d: 18, complianceScore: 83,
    contactEmail: 'mustaqbal@exchange.so', contactPhone: '+252-63-4421000',
  },
  {
    id: 'D014', name: 'Caafi Currency Services', licenseNumber: 'FX-LIC-2024-014',
    tier: 2, buyRate: 563, sellRate: 568, dailyLimit: 70000, status: 'Pending',
    walletProvider: 'Both', zaadWallet: '063-7821-014', eDahabWallet: '770-6612-014',
    registeredDate: '2024-01-10', volume30d: 80000, txCount30d: 7, complianceScore: 78,
    contactEmail: 'caafi@currency.so', contactPhone: '+252-63-7821000',
  },
  {
    id: 'D015', name: 'Waaberi Money Exchange', licenseNumber: 'FX-LIC-2024-015',
    tier: 1, buyRate: 567, sellRate: 573, dailyLimit: 300000, status: 'Active',
    walletProvider: 'Both', zaadWallet: '063-8812-015', eDahabWallet: '770-5521-015',
    registeredDate: '2024-02-28', volume30d: 1120000, txCount30d: 61, complianceScore: 91,
    contactEmail: 'waaberi@exchange.so', contactPhone: '+252-63-8812000',
  },
];

// ─── OMO SESSIONS ────────────────────────────────────────────────────────────

export const omoSessions: OMOSession[] = [
  {
    id: 'OMO-2024-003', type: 'Injection', fixedRate: 565, totalAmount: 2000000,
    eligibleTiers: [1, 2], startTime: '2024-03-15T09:00:00', duration: 120, status: 'Open',
    allocationMethod: 'Best Bid Price Wins', maxBidTier1: 500000, maxBidTier2: 200000,
    bids: [
      { id: 'BID-001', sessionId: 'OMO-2024-003', dealerId: 'D001', dealerName: 'Dahabshiil Exchange', tier: 1, bidAmount: 450000, submittedAt: '2024-03-15T09:18:00', status: 'Submitted', wallet: 'Both' },
      { id: 'BID-002', sessionId: 'OMO-2024-003', dealerId: 'D002', dealerName: 'Premier Exchange Co.', tier: 1, bidAmount: 500000, submittedAt: '2024-03-15T09:22:00', status: 'Submitted', wallet: 'Both' },
      { id: 'BID-003', sessionId: 'OMO-2024-003', dealerId: 'D003', dealerName: 'Amal Bank FX', tier: 1, bidAmount: 300000, submittedAt: '2024-03-15T09:31:00', status: 'Submitted', wallet: 'Zaad' },
      { id: 'BID-004', sessionId: 'OMO-2024-003', dealerId: 'D006', dealerName: 'Horyaal Exchange', tier: 2, bidAmount: 150000, submittedAt: '2024-03-15T09:35:00', status: 'Submitted', wallet: 'Zaad' },
      { id: 'BID-005', sessionId: 'OMO-2024-003', dealerId: 'D007', dealerName: 'Barwaaqo FX Services', tier: 2, bidAmount: 50000, submittedAt: '2024-03-15T09:42:00', status: 'Submitted', wallet: 'Both' },
    ],
  },
  {
    id: 'OMO-2024-002', type: 'Absorption', fixedRate: 568, totalAmount: 1500000,
    eligibleTiers: [1], startTime: '2024-03-14T14:00:00', duration: 60, status: 'Pending Allocation',
    allocationMethod: 'Equal Distribution', maxBidTier1: 400000, maxBidTier2: 0,
    bids: [
      { id: 'BID-006', sessionId: 'OMO-2024-002', dealerId: 'D001', dealerName: 'Dahabshiil Exchange', tier: 1, bidAmount: 400000, submittedAt: '2024-03-14T14:12:00', status: 'Submitted', wallet: 'Both' },
      { id: 'BID-007', sessionId: 'OMO-2024-002', dealerId: 'D004', dealerName: 'Salaam Somali Bank FX', tier: 1, bidAmount: 350000, submittedAt: '2024-03-14T14:25:00', status: 'Submitted', wallet: 'Both' },
      { id: 'BID-008', sessionId: 'OMO-2024-002', dealerId: 'D005', dealerName: 'Towfiq Money Transfer', tier: 1, bidAmount: 300000, submittedAt: '2024-03-14T14:38:00', status: 'Submitted', wallet: 'e-Dahab' },
      { id: 'BID-009', sessionId: 'OMO-2024-002', dealerId: 'D015', dealerName: 'Waaberi Money Exchange', tier: 1, bidAmount: 250000, submittedAt: '2024-03-14T14:45:00', status: 'Submitted', wallet: 'Both' },
    ],
  },
  {
    id: 'OMO-2024-001', type: 'Injection', fixedRate: 562, totalAmount: 3000000,
    eligibleTiers: [1, 2], startTime: '2024-03-10T10:00:00', duration: 180, status: 'Completed',
    allocationMethod: 'Best Bid Price Wins', maxBidTier1: 600000, maxBidTier2: 250000,
    bids: [
      { id: 'BID-010', sessionId: 'OMO-2024-001', dealerId: 'D001', dealerName: 'Dahabshiil Exchange', tier: 1, bidAmount: 600000, submittedAt: '2024-03-10T10:15:00', status: 'Allocated', allocatedAmount: 600000, wallet: 'Both' },
      { id: 'BID-011', sessionId: 'OMO-2024-001', dealerId: 'D002', dealerName: 'Premier Exchange Co.', tier: 1, bidAmount: 500000, submittedAt: '2024-03-10T10:22:00', status: 'Allocated', allocatedAmount: 500000, wallet: 'Both' },
      { id: 'BID-012', sessionId: 'OMO-2024-001', dealerId: 'D003', dealerName: 'Amal Bank FX', tier: 1, bidAmount: 450000, submittedAt: '2024-03-10T10:30:00', status: 'Allocated', allocatedAmount: 450000, wallet: 'Zaad' },
      { id: 'BID-013', sessionId: 'OMO-2024-001', dealerId: 'D004', dealerName: 'Salaam Somali Bank FX', tier: 1, bidAmount: 400000, submittedAt: '2024-03-10T10:45:00', status: 'Allocated', allocatedAmount: 400000, wallet: 'Both' },
      { id: 'BID-014', sessionId: 'OMO-2024-001', dealerId: 'D006', dealerName: 'Horyaal Exchange', tier: 2, bidAmount: 250000, submittedAt: '2024-03-10T11:00:00', status: 'Allocated', allocatedAmount: 250000, wallet: 'Zaad' },
      { id: 'BID-015', sessionId: 'OMO-2024-001', dealerId: 'D007', dealerName: 'Barwaaqo FX Services', tier: 2, bidAmount: 200000, submittedAt: '2024-03-10T11:10:00', status: 'Allocated', allocatedAmount: 200000, wallet: 'Both' },
    ],
  },
  {
    id: 'OMO-2023-018', type: 'Absorption', fixedRate: 572, totalAmount: 2500000,
    eligibleTiers: [1], startTime: '2024-02-28T09:00:00', duration: 120, status: 'Completed',
    allocationMethod: 'Equal Distribution', maxBidTier1: 500000, maxBidTier2: 0,
    bids: [
      { id: 'BID-016', sessionId: 'OMO-2023-018', dealerId: 'D001', dealerName: 'Dahabshiil Exchange', tier: 1, bidAmount: 500000, submittedAt: '2024-02-28T09:20:00', status: 'Allocated', allocatedAmount: 500000, wallet: 'Both' },
      { id: 'BID-017', sessionId: 'OMO-2023-018', dealerId: 'D002', dealerName: 'Premier Exchange Co.', tier: 1, bidAmount: 480000, submittedAt: '2024-02-28T09:35:00', status: 'Allocated', allocatedAmount: 480000, wallet: 'Both' },
      { id: 'BID-018', sessionId: 'OMO-2023-018', dealerId: 'D004', dealerName: 'Salaam Somali Bank FX', tier: 1, bidAmount: 420000, submittedAt: '2024-02-28T09:50:00', status: 'Allocated', allocatedAmount: 420000, wallet: 'Both' },
    ],
  },
  {
    id: 'OMO-2023-017', type: 'Injection', fixedRate: 558, totalAmount: 1800000,
    eligibleTiers: [1, 2], startTime: '2024-02-15T11:00:00', duration: 90, status: 'Cancelled',
    allocationMethod: 'Best Bid Price Wins', maxBidTier1: 400000, maxBidTier2: 150000, bids: [],
  },
  {
    id: 'OMO-2023-016', type: 'Injection', fixedRate: 561, totalAmount: 2200000,
    eligibleTiers: [1, 2], startTime: '2024-02-05T10:00:00', duration: 120, status: 'Completed',
    allocationMethod: 'Best Bid Price Wins', maxBidTier1: 500000, maxBidTier2: 200000,
    bids: [
      { id: 'BID-019', sessionId: 'OMO-2023-016', dealerId: 'D001', dealerName: 'Dahabshiil Exchange', tier: 1, bidAmount: 500000, submittedAt: '2024-02-05T10:18:00', status: 'Allocated', allocatedAmount: 500000, wallet: 'Both' },
      { id: 'BID-020', sessionId: 'OMO-2023-016', dealerId: 'D003', dealerName: 'Amal Bank FX', tier: 1, bidAmount: 350000, submittedAt: '2024-02-05T10:30:00', status: 'Allocated', allocatedAmount: 350000, wallet: 'Zaad' },
      { id: 'BID-021', sessionId: 'OMO-2023-016', dealerId: 'D007', dealerName: 'Barwaaqo FX Services', tier: 2, bidAmount: 180000, submittedAt: '2024-02-05T10:55:00', status: 'Allocated', allocatedAmount: 180000, wallet: 'Both' },
    ],
  },
  {
    id: 'OMO-2023-015', type: 'Absorption', fixedRate: 570, totalAmount: 1200000,
    eligibleTiers: [1], startTime: '2024-01-22T14:00:00', duration: 60, status: 'Completed',
    allocationMethod: 'Equal Distribution', maxBidTier1: 350000, maxBidTier2: 0,
    bids: [
      { id: 'BID-022', sessionId: 'OMO-2023-015', dealerId: 'D002', dealerName: 'Premier Exchange Co.', tier: 1, bidAmount: 350000, submittedAt: '2024-01-22T14:22:00', status: 'Allocated', allocatedAmount: 350000, wallet: 'Both' },
      { id: 'BID-023', sessionId: 'OMO-2023-015', dealerId: 'D005', dealerName: 'Towfiq Money Transfer', tier: 1, bidAmount: 280000, submittedAt: '2024-01-22T14:40:00', status: 'Allocated', allocatedAmount: 280000, wallet: 'e-Dahab' },
    ],
  },
];

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────

// wallets[i], mobileNumbers[i], telcos[i], walletTypes[i] are aligned
const wallets =     ['063-1234-567', '063-9876-543', '770-1122-334', '770-5566-778', '063-4411-223', '770-8899-001', '063-7788-990', '770-3344-556', '063-2233-445', '770-6677-889'];
const mobileNumbers = ['063-1234-567', '063-9876-543', '068-1122-334', '068-5566-778', '063-4411-223', '068-8899-001', '063-7788-990', '068-3344-556', '063-2233-445', '068-6677-889'];
const telcos =      ['Telesom',       'Telesom',       'Somtel',       'Somtel',       'Telesom',       'Somtel',       'Telesom',       'Somtel',       'Telesom',       'Somtel'] as const;
const walletTypes = ['Zaad',          'Zaad',          'e-Dahab',      'e-Dahab',      'Zaad',          'e-Dahab',      'Zaad',          'e-Dahab',      'Zaad',          'e-Dahab'] as const;

const tx = (
  id: string, ref: string, type: 'Buy USD' | 'Sell USD',
  dealerId: string, dealerName: string, wi: number,
  amountUSD: number, rate: number, status: 'Completed' | 'Pending' | 'Failed' | 'Cancelled',
  timestamp: string
): Transaction => ({
  id, refNumber: ref, type, dealerId, dealerName,
  customerWallet: wallets[wi], mobileNumber: mobileNumbers[wi],
  telcoOperator: telcos[wi], walletType: walletTypes[wi],
  amountUSD, amountSL: amountUSD * rate, rate, status, timestamp,
});

export const transactions: Transaction[] = [
  tx('TX001','FX-2024-001823','Buy USD', 'D002','Premier Exchange Co.',       0, 1500,572,'Completed','2024-03-15T08:12:34'),
  tx('TX002','FX-2024-001822','Sell USD','D002','Premier Exchange Co.',       1,  800,567,'Completed','2024-03-15T08:05:12'),
  tx('TX003','FX-2024-001821','Buy USD', 'D001','Dahabshiil Exchange',        2, 3000,572,'Completed','2024-03-15T07:58:45'),
  tx('TX004','FX-2024-001820','Buy USD', 'D003','Amal Bank FX',               3, 2200,571,'Completed','2024-03-15T07:45:22'),
  tx('TX005','FX-2024-001819','Sell USD','D004','Salaam Somali Bank FX',      4, 1200,567,'Completed','2024-03-15T07:30:11'),
  tx('TX006','FX-2024-001818','Buy USD', 'D002','Premier Exchange Co.',       5,  500,572,'Pending',  '2024-03-15T07:22:08'),
  tx('TX007','FX-2024-001817','Sell USD','D005','Towfiq Money Transfer',      6,  950,565,'Completed','2024-03-15T07:15:54'),
  tx('TX008','FX-2024-001816','Buy USD', 'D001','Dahabshiil Exchange',        7, 4500,572,'Completed','2024-03-15T07:02:38'),
  tx('TX009','FX-2024-001815','Buy USD', 'D006','Horyaal Exchange',           8,  700,571,'Completed','2024-03-15T06:55:21'),
  tx('TX010','FX-2024-001814','Sell USD','D002','Premier Exchange Co.',       9, 1800,567,'Completed','2024-03-15T06:48:17'),
  tx('TX011','FX-2024-001813','Buy USD', 'D003','Amal Bank FX',               0, 2500,571,'Failed',   '2024-03-14T17:32:09'),
  tx('TX012','FX-2024-001812','Buy USD', 'D007','Barwaaqo FX Services',       1, 1100,570,'Completed','2024-03-14T17:18:42'),
  tx('TX013','FX-2024-001811','Sell USD','D001','Dahabshiil Exchange',        2, 3500,567,'Completed','2024-03-14T16:55:33'),
  tx('TX014','FX-2024-001810','Buy USD', 'D004','Salaam Somali Bank FX',      3,  600,572,'Completed','2024-03-14T16:42:18'),
  tx('TX015','FX-2024-001809','Buy USD', 'D002','Premier Exchange Co.',       4, 2000,572,'Completed','2024-03-14T16:30:05'),
  tx('TX016','FX-2024-001808','Sell USD','D008','Nabad Currency Exchange',    5,  450,565,'Completed','2024-03-14T15:58:44'),
  tx('TX017','FX-2024-001807','Buy USD', 'D015','Waaberi Money Exchange',     6, 5000,573,'Completed','2024-03-14T15:45:29'),
  tx('TX018','FX-2024-001806','Sell USD','D003','Amal Bank FX',               7, 1600,566,'Completed','2024-03-14T15:22:16'),
  tx('TX019','FX-2024-001805','Buy USD', 'D001','Dahabshiil Exchange',        8, 8000,572,'Completed','2024-03-14T15:08:03'),
  tx('TX020','FX-2024-001804','Sell USD','D005','Towfiq Money Transfer',      9, 2300,565,'Completed','2024-03-14T14:55:47'),
  tx('TX021','FX-2024-001803','Buy USD', 'D009','Iftin Money Services',       0,  900,571,'Pending',  '2024-03-14T14:38:22'),
  tx('TX022','FX-2024-001802','Buy USD', 'D002','Premier Exchange Co.',       1,12000,572,'Completed','2024-03-14T14:22:09'),
  tx('TX023','FX-2024-001801','Sell USD','D010','Xiddigta Exchange',          2,  750,565,'Completed','2024-03-14T14:05:58'),
  tx('TX024','FX-2024-001800','Buy USD', 'D001','Dahabshiil Exchange',        3, 3200,572,'Completed','2024-03-13T17:48:33'),
  tx('TX025','FX-2024-001799','Sell USD','D004','Salaam Somali Bank FX',      4, 1750,567,'Cancelled','2024-03-13T17:32:18'),
];

// ─── AML ALERTS ──────────────────────────────────────────────────────────────

export const amlAlerts: AMLAlert[] = [
  {
    id: 'AML-2024-023', type: 'Threshold Exceeded', dealerId: 'D011', dealerName: 'Golis Money Transfer',
    customerWallet: wallets[0], amount: 85000,
    triggerRule: 'Single transaction > $50,000 USD threshold',
    timestamp: '2024-03-15T09:45:22', priority: 'High', status: 'New',
    transactions: transactions.slice(0, 2),
  },
  {
    id: 'AML-2024-022', type: 'Structuring Pattern', dealerId: 'D009', dealerName: 'Iftin Money Services',
    customerWallet: wallets[3], amount: 47500,
    triggerRule: '5 transactions just below $10,000 within 24 hours',
    timestamp: '2024-03-15T08:30:11', priority: 'High', status: 'Under Review',
    transactions: transactions.slice(2, 5),
  },
  {
    id: 'AML-2024-021', type: 'Velocity Check', dealerId: 'D007', dealerName: 'Barwaaqo FX Services',
    customerWallet: wallets[6], amount: 32000,
    triggerRule: 'Velocity: >3 transactions per hour from same wallet',
    timestamp: '2024-03-14T16:12:44', priority: 'High', status: 'New',
    transactions: transactions.slice(5, 8),
  },
  {
    id: 'AML-2024-020', type: 'Unusual Frequency', dealerId: 'D013', dealerName: 'Mustaqbal Exchange',
    customerWallet: wallets[9], amount: 18500,
    triggerRule: 'Unusual transaction frequency: 12 txns in 2 hours',
    timestamp: '2024-03-14T14:55:33', priority: 'Medium', status: 'Under Review',
    transactions: transactions.slice(8, 10),
  },
  {
    id: 'AML-2024-019', type: 'Threshold Exceeded', dealerId: 'D006', dealerName: 'Horyaal Exchange',
    customerWallet: wallets[4], amount: 62000,
    triggerRule: 'Daily transaction limit 80% utilised by single customer',
    timestamp: '2024-03-14T11:22:17', priority: 'Medium', status: 'Under Review',
    transactions: transactions.slice(10, 13),
  },
  {
    id: 'AML-2024-018', type: 'Structuring Pattern', dealerId: 'D001', dealerName: 'Dahabshiil Exchange',
    customerWallet: wallets[7], amount: 28000,
    triggerRule: 'Multiple small transactions structuring pattern detected',
    timestamp: '2024-03-13T15:48:09', priority: 'Medium', status: 'Resolved',
    transactions: transactions.slice(13, 16),
  },
  {
    id: 'AML-2024-017', type: 'Velocity Check', dealerId: 'D010', dealerName: 'Xiddigta Exchange',
    customerWallet: wallets[2], amount: 15000,
    triggerRule: 'Cross-border transaction pattern anomaly',
    timestamp: '2024-03-13T12:30:44', priority: 'Low', status: 'Resolved',
    transactions: transactions.slice(16, 18),
  },
  {
    id: 'AML-2024-016', type: 'Unusual Frequency', dealerId: 'D012', dealerName: 'Somtel FX Bureau',
    customerWallet: wallets[5], amount: 9800,
    triggerRule: 'Unusual transaction time pattern (2-4 AM activity)',
    timestamp: '2024-03-12T03:15:28', priority: 'Low', status: 'Resolved',
    transactions: transactions.slice(18, 20),
  },
];

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

export const auditLogs: AuditLog[] = [
  { id: 'LOG-001', timestamp: '2024-03-15T09:00:12', actor: 'Ibrahim Hassan', role: 'FX Intervention Desk', action: 'CREATE', entity: 'OMO Session', details: 'Created OMO session OMO-2024-003, Injection, $2M, Fixed Rate SL 565/USD', ipAddress: '10.1.2.45' },
  { id: 'LOG-002', timestamp: '2024-03-15T08:55:01', actor: 'System', role: 'System', action: 'ALERT', entity: 'AML Alert', details: 'AML-2024-023 triggered: Threshold Exceeded for Golis Money Transfer', ipAddress: '10.1.1.1' },
  { id: 'LOG-003', timestamp: '2024-03-15T08:30:55', actor: 'Faadumo Warsame', role: 'Supervisor', action: 'UPDATE', entity: 'Rate Controls', details: 'Updated rate limits: Buy ceiling SL 575 → SL 578', ipAddress: '10.1.2.48' },
  { id: 'LOG-004', timestamp: '2024-03-15T08:22:18', actor: 'Ahmed Jama', role: 'FX Intervention Desk', action: 'LOGIN', entity: 'Session', details: 'User login from web portal', ipAddress: '10.1.2.51' },
  { id: 'LOG-005', timestamp: '2024-03-14T17:35:42', actor: 'Ibrahim Hassan', role: 'FX Intervention Desk', action: 'EXECUTE', entity: 'OMO Allocation', details: 'Executed allocation for OMO-2024-001, $3M total allocated to 6 dealers at SL 562/USD', ipAddress: '10.1.2.45' },
  { id: 'LOG-006', timestamp: '2024-03-14T16:48:33', actor: 'Faadumo Warsame', role: 'Supervisor', action: 'UPDATE', entity: 'Dealer', details: 'Suspended dealer D011 (Golis Money Transfer) for compliance violation', ipAddress: '10.1.2.48' },
  { id: 'LOG-007', timestamp: '2024-03-14T15:22:11', actor: 'Omar Abdullahi', role: 'Auditor', action: 'VIEW', entity: 'Report', details: 'Accessed Transaction Summary report for period 2024-03-01 to 2024-03-14', ipAddress: '10.1.2.62' },
  { id: 'LOG-008', timestamp: '2024-03-14T14:05:29', actor: 'Ibrahim Hassan', role: 'FX Intervention Desk', action: 'CREATE', entity: 'OMO Session', details: 'Created OMO session OMO-2024-002, Absorption, $1.5M, Fixed Rate SL 568/USD', ipAddress: '10.1.2.45' },
  { id: 'LOG-009', timestamp: '2024-03-14T11:30:08', actor: 'Faadumo Warsame', role: 'Supervisor', action: 'UPDATE', entity: 'Rate Controls', details: 'Updated rate limits: Spread cap reduced from 2.5% to 2%', ipAddress: '10.1.2.48' },
  { id: 'LOG-010', timestamp: '2024-03-13T16:55:17', actor: 'Ahmed Jama', role: 'FX Intervention Desk', action: 'UPDATE', entity: 'Dealer', details: 'Approved new dealer D015 (Waaberi Money Exchange) - Tier 1', ipAddress: '10.1.2.51' },
  { id: 'LOG-011', timestamp: '2024-03-13T14:22:44', actor: 'Omar Abdullahi', role: 'Auditor', action: 'EXPORT', entity: 'Report', details: 'Exported Dealer Performance report to CSV', ipAddress: '10.1.2.62' },
  { id: 'LOG-012', timestamp: '2024-03-12T09:15:33', actor: 'System', role: 'System', action: 'ALERT', entity: 'AML Alert', details: 'AML-2024-016 triggered: Unusual transaction timing detected', ipAddress: '10.1.1.1' },
  { id: 'LOG-013', timestamp: '2024-03-11T17:42:09', actor: 'Faadumo Warsame', role: 'Supervisor', action: 'CANCEL', entity: 'OMO Session', details: 'Cancelled OMO-2023-017 due to insufficient bids', ipAddress: '10.1.2.48' },
  { id: 'LOG-014', timestamp: '2024-03-10T13:08:27', actor: 'Ibrahim Hassan', role: 'FX Intervention Desk', action: 'EXECUTE', entity: 'OMO Allocation', details: 'Executed allocation for OMO-2023-016, $2.2M allocated to 3 dealers at SL 561/USD', ipAddress: '10.1.2.45' },
  { id: 'LOG-015', timestamp: '2024-03-09T10:33:51', actor: 'Ahmed Jama', role: 'FX Intervention Desk', action: 'LOGOUT', entity: 'Session', details: 'User session terminated', ipAddress: '10.1.2.51' },
];

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

export const notifications: Notification[] = [
  { id: 'N001', type: 'OMO', title: 'New OMO Session Open', message: 'OMO-2024-003 is now open for bids. Injection of $2,000,000 at fixed rate SL 565/USD. Your max bid: $500,000. Session closes at 11:00 AM.', timestamp: '2024-03-15T09:00:15', read: false, dealerId: 'D002' },
  { id: 'N002', type: 'Transaction', title: 'Bid Submitted Successfully', message: 'Your bid of $500,000 for OMO-2024-003 has been received and is under review.', timestamp: '2024-03-15T09:22:05', read: false, dealerId: 'D002' },
  { id: 'N003', type: 'Rate', title: 'Rate Limit Warning', message: 'Your current sell rate of SL 572 is approaching the ceiling limit of SL 580. Please monitor market conditions.', timestamp: '2024-03-15T08:30:55', read: false, dealerId: 'D002' },
  { id: 'N004', type: 'Settlement', title: 'Settlement Completed', message: 'OMO-2024-001 allocation settlement completed. $500,000 USD credited to your Zaad wallet 063-7712-002 at SL 562/USD.', timestamp: '2024-03-14T18:05:22', read: true, dealerId: 'D002' },
  { id: 'N005', type: 'OMO', title: 'Allocation Results Available', message: 'OMO-2024-001 allocation results are available. You were allocated $500,000 out of your $500,000 bid. Full allocation!', timestamp: '2024-03-10T13:30:11', read: true, dealerId: 'D002' },
  { id: 'N006', type: 'System', title: 'System Maintenance', message: 'Scheduled system maintenance on Saturday 2024-03-16 from 02:00-04:00 AM. Portal will be unavailable during this period.', timestamp: '2024-03-09T16:00:00', read: true, dealerId: 'D002' },
  { id: 'N007', type: 'OMO', title: 'OMO Session Closed', message: 'OMO-2024-002 bidding period has closed. Allocation processing is underway. Results expected within 2 hours.', timestamp: '2024-03-14T15:00:00', read: true, dealerId: 'D002' },
  { id: 'N008', type: 'Transaction', title: 'High Volume Alert', message: 'You have processed $180,000 today, reaching 36% of your daily limit of $500,000.', timestamp: '2024-03-15T07:45:00', read: true, dealerId: 'D002' },
  { id: 'N009', type: 'System', title: 'Profile Update Required', message: 'Please update your e-Dahab wallet number by 2024-03-31 to ensure uninterrupted service.', timestamp: '2024-03-08T09:00:00', read: true, dealerId: 'D002' },
  { id: 'N010', type: 'Settlement', title: 'Pending Settlement Reminder', message: 'OMO-2024-002 settlement is pending at SL 568/USD. Ensure your Zaad wallet has sufficient balance.', timestamp: '2024-03-14T16:30:00', read: false, dealerId: 'D002' },
];

// ─── ALLOCATION RESULTS ──────────────────────────────────────────────────────

export const allocationResults: AllocationResult[] = [
  { id: 'AR-001', sessionId: 'OMO-2024-001', sessionDate: '2024-03-10', dealerId: 'D002', bidAmount: 500000, allocatedAmount: 500000, fixedRate: 562, slSettlement: 281000000, settlementStatus: 'Completed', wallet: 'Both', timestamp: '2024-03-10T13:15:00' },
  { id: 'AR-002', sessionId: 'OMO-2023-016', sessionDate: '2024-02-05', dealerId: 'D002', bidAmount: 350000, allocatedAmount: 280000, fixedRate: 561, slSettlement: 157080000, settlementStatus: 'Completed', wallet: 'Both', timestamp: '2024-02-05T12:45:00' },
  { id: 'AR-003', sessionId: 'OMO-2023-018', sessionDate: '2024-02-28', dealerId: 'D002', bidAmount: 480000, allocatedAmount: 480000, fixedRate: 572, slSettlement: 274560000, settlementStatus: 'Completed', wallet: 'Both', timestamp: '2024-02-28T11:30:00' },
  { id: 'AR-004', sessionId: 'OMO-2024-002', sessionDate: '2024-03-14', dealerId: 'D002', bidAmount: 0, allocatedAmount: 0, fixedRate: 568, slSettlement: 0, settlementStatus: 'Pending', wallet: 'Both', timestamp: '2024-03-14T16:00:00' },
  { id: 'AR-005', sessionId: 'OMO-2023-015', sessionDate: '2024-01-22', dealerId: 'D002', bidAmount: 350000, allocatedAmount: 350000, fixedRate: 570, slSettlement: 199500000, settlementStatus: 'Completed', wallet: 'Both', timestamp: '2024-01-22T15:22:00' },
];

// ─── RATE HISTORY ────────────────────────────────────────────────────────────

export const rateHistory: RateHistory[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2024-03-15');
  date.setDate(date.getDate() - (29 - i));
  const base = 570;
  const variation = Math.sin(i * 0.4) * 4 + (i % 3 === 0 ? 1 : -0.5);
  const marketRef = Math.round(base + variation);
  return {
    date: date.toISOString().split('T')[0],
    buyRate: marketRef - 3,
    sellRate: marketRef + 4,
    marketRef,
  };
});

// ─── DASHBOARD CHART DATA ────────────────────────────────────────────────────

export const volumeLast7Days = [
  { day: 'Mon Mar 9',  volume: 3820000 },
  { day: 'Tue Mar 10', volume: 4150000 },
  { day: 'Wed Mar 11', volume: 3650000 },
  { day: 'Thu Mar 12', volume: 4820000 },
  { day: 'Fri Mar 13', volume: 5200000 },
  { day: 'Sat Mar 14', volume: 3900000 },
  { day: 'Sun Mar 15', volume: 4280000 },
];

export const dealerActivity = [
  { name: 'Dahabshiil',    volume: 920000 },
  { name: 'Premier Exch.', volume: 780000 },
  { name: 'Amal Bank',     volume: 610000 },
  { name: 'Salaam Bank',   volume: 540000 },
  { name: 'Waaberi',       volume: 430000 },
];

export const transactionTypeSplit = [
  { name: 'Buy USD',  value: 58 },
  { name: 'Sell USD', value: 42 },
];

export const dealerVolumeLast7Days = [
  { day: 'Mon', volume: 32000 },
  { day: 'Tue', volume: 41000 },
  { day: 'Wed', volume: 28000 },
  { day: 'Thu', volume: 45000 },
  { day: 'Fri', volume: 38000 },
  { day: 'Sat', volume: 22000 },
  { day: 'Sun', volume: 39000 },
];

// ─── TELCO & WALLET ANALYTICS ────────────────────────────────────────────────

export const telcoVolumeData = [
  { day: 'Mar 9',  telesom: 2180000, somtel: 1640000 },
  { day: 'Mar 10', telesom: 2390000, somtel: 1760000 },
  { day: 'Mar 11', telesom: 2100000, somtel: 1550000 },
  { day: 'Mar 12', telesom: 2750000, somtel: 2070000 },
  { day: 'Mar 13', telesom: 3010000, somtel: 2190000 },
  { day: 'Mar 14', telesom: 2240000, somtel: 1660000 },
  { day: 'Mar 15', telesom: 2490000, somtel: 1790000 },
];

export const telcoTxCountData = [
  { day: 'Mar 9',  telesom: 38, somtel: 29 },
  { day: 'Mar 10', telesom: 44, somtel: 31 },
  { day: 'Mar 11', telesom: 35, somtel: 25 },
  { day: 'Mar 12', telesom: 51, somtel: 37 },
  { day: 'Mar 13', telesom: 58, somtel: 40 },
  { day: 'Mar 14', telesom: 41, somtel: 30 },
  { day: 'Mar 15', telesom: 47, somtel: 33 },
];

export const telcoSplit = [
  { name: 'Telesom (Zaad)',  value: 57, volume: 19160000 },
  { name: 'Somtel (e-Dahab)', value: 43, volume: 14660000 },
];

export const walletSettlementData = [
  { wallet: 'Zaad',   success: 312, failed: 8,  pending: 12 },
  { wallet: 'e-Dahab', success: 238, failed: 6,  pending: 9  },
];

export const walletAvgTxData = [
  { day: 'Mar 9',  zaad: 2850, edahab: 2420 },
  { day: 'Mar 10', zaad: 3100, edahab: 2680 },
  { day: 'Mar 11', zaad: 2700, edahab: 2350 },
  { day: 'Mar 12', zaad: 3280, edahab: 2890 },
  { day: 'Mar 13', zaad: 3450, edahab: 3020 },
  { day: 'Mar 14', zaad: 2950, edahab: 2540 },
  { day: 'Mar 15', zaad: 3200, edahab: 2760 },
];
