export type DealerTier = 1 | 2;
export type DealerStatus = 'Active' | 'Suspended' | 'Pending';
export type WalletProvider = 'Zaad' | 'e-Dahab' | 'Both';
export type TransactionType = 'Buy USD' | 'Sell USD';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed' | 'Cancelled';
export type OMOSessionStatus = 'Open' | 'Pending Allocation' | 'Completed' | 'Cancelled';
export type OMOSessionType = 'Injection' | 'Absorption';
export type AllocationMethod = 'Equal Distribution' | 'Best Bid Price Wins';
export type BidStatus = 'Submitted' | 'Allocated' | 'Partial' | 'Rejected';
export type AlertPriority = 'High' | 'Medium' | 'Low';
export type AlertStatus = 'New' | 'Under Review' | 'Resolved';
export type AlertType = 'Threshold Exceeded' | 'Unusual Frequency' | 'Structuring Pattern' | 'Velocity Check';
export type SettlementStatus = 'Pending' | 'Completed' | 'Failed';
export type NotificationType = 'OMO' | 'Transaction' | 'System' | 'Rate' | 'Settlement';

export interface Dealer {
  id: string;
  name: string;
  licenseNumber: string;
  tier: DealerTier;
  buyRate: number;
  sellRate: number;
  dailyLimit: number;
  status: DealerStatus;
  walletProvider: WalletProvider;
  zaadWallet?: string;
  eDahabWallet?: string;
  registeredDate: string;
  volume30d: number;
  txCount30d: number;
  complianceScore: number;
  contactEmail: string;
  contactPhone: string;
}

export interface OMOSession {
  id: string;
  type: OMOSessionType;
  fixedRate: number;
  totalAmount: number;
  eligibleTiers: DealerTier[];
  startTime: string;
  duration: number; // minutes
  status: OMOSessionStatus;
  bids: OMOBid[];
  allocationMethod: AllocationMethod;
  maxBidTier1: number;
  maxBidTier2: number;
}

export interface OMOBid {
  id: string;
  sessionId: string;
  dealerId: string;
  dealerName: string;
  tier: DealerTier;
  bidAmount: number;
  submittedAt: string;
  status: BidStatus;
  allocatedAmount?: number;
  wallet: WalletProvider;
}

export type TelcoOperator = 'Telesom' | 'Somtel' | 'Soltelco';

export interface Transaction {
  id: string;
  refNumber: string;
  type: TransactionType;
  dealerId: string;
  dealerName: string;
  customerWallet: string;
  mobileNumber: string;
  telcoOperator: TelcoOperator;
  walletType: 'Zaad' | 'e-Dahab';
  amountUSD: number;
  amountSL: number;
  rate: number;
  status: TransactionStatus;
  timestamp: string;
}

export interface AMLAlert {
  id: string;
  type: AlertType;
  dealerId: string;
  dealerName: string;
  customerWallet?: string;
  amount: number;
  triggerRule: string;
  timestamp: string;
  priority: AlertPriority;
  status: AlertStatus;
  transactions: Transaction[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  details: string;
  ipAddress: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  dealerId?: string;
}

export interface RateHistory {
  date: string;
  buyRate: number;
  sellRate: number;
  marketRef: number;
}

export interface AllocationResult {
  id: string;
  sessionId: string;
  sessionDate: string;
  dealerId: string;
  bidAmount: number;
  allocatedAmount: number;
  fixedRate: number;
  slSettlement: number;
  settlementStatus: SettlementStatus;
  wallet: WalletProvider;
  timestamp: string;
}
