export interface AMLCheckInput {
  amountUSD: number;
  mobileNumber: string;
  customerWallet: string;
  dealerId: string;
  recentTxCount: number;      // transactions from this mobile in last 60 min
  recentTxAmounts: number[];  // amounts from this wallet in last 24 hours
}

export interface AMLTrigger {
  triggered: boolean;
  type: 'ThresholdExceeded' | 'UnusualFrequency' | 'StructuringPattern' | 'VelocityCheck';
  priority: 'High' | 'Medium' | 'Low';
  triggerRule: string;
}

const AML_THRESHOLD = 50000;
const VELOCITY_LIMIT = 5;
const STRUCTURING_MIN = 8000;
const STRUCTURING_MAX = 10000;
const STRUCTURING_COUNT = 5;

export const runAMLChecks = (input: AMLCheckInput): AMLTrigger | null => {
  // Rule 1: Large transaction threshold
  if (input.amountUSD >= AML_THRESHOLD) {
    return {
      triggered: true,
      type: 'ThresholdExceeded',
      priority: 'High',
      triggerRule: `Transaction amount $${input.amountUSD.toLocaleString()} exceeds threshold of $${AML_THRESHOLD.toLocaleString()}`,
    };
  }

  // Rule 2: Velocity check — too many transactions from same mobile in 60 min
  if (input.recentTxCount >= VELOCITY_LIMIT) {
    return {
      triggered: true,
      type: 'VelocityCheck',
      priority: 'High',
      triggerRule: `${input.recentTxCount} transactions from ${input.mobileNumber} in the last 60 minutes`,
    };
  }

  // Rule 3: Unusual frequency — 3+ transactions in 60 min (lower threshold)
  if (input.recentTxCount >= 3) {
    return {
      triggered: true,
      type: 'UnusualFrequency',
      priority: 'Medium',
      triggerRule: `${input.recentTxCount} transactions from ${input.mobileNumber} in the last 60 minutes`,
    };
  }

  // Rule 4: Structuring pattern — multiple transactions just below $10k
  const structuringTxs = input.recentTxAmounts.filter(
    a => a >= STRUCTURING_MIN && a <= STRUCTURING_MAX
  );
  if (structuringTxs.length >= STRUCTURING_COUNT) {
    return {
      triggered: true,
      type: 'StructuringPattern',
      priority: 'High',
      triggerRule: `${structuringTxs.length} transactions between $${STRUCTURING_MIN.toLocaleString()}–$${STRUCTURING_MAX.toLocaleString()} in 24 hours from ${input.customerWallet}`,
    };
  }

  return null;
};
