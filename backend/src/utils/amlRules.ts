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

export interface AMLThresholds {
  amlThreshold?: number;
  velocityLimit?: number;
  structuringCount?: number;
}

// Default fallback values (used when DB settings are unavailable)
const DEFAULT_AML_THRESHOLD = 50000;
const DEFAULT_VELOCITY_LIMIT = 5;
const STRUCTURING_MIN = 8000;
const STRUCTURING_MAX = 10000;
const DEFAULT_STRUCTURING_COUNT = 5;

export const runAMLChecks = (input: AMLCheckInput, thresholds?: AMLThresholds): AMLTrigger | null => {
  const amlThreshold    = thresholds?.amlThreshold    ?? DEFAULT_AML_THRESHOLD;
  const velocityLimit   = thresholds?.velocityLimit   ?? DEFAULT_VELOCITY_LIMIT;
  const structuringCount = thresholds?.structuringCount ?? DEFAULT_STRUCTURING_COUNT;

  // Rule 1: Large transaction threshold
  if (input.amountUSD >= amlThreshold) {
    return {
      triggered: true,
      type: 'ThresholdExceeded',
      priority: 'High',
      triggerRule: `Transaction amount $${input.amountUSD.toLocaleString()} exceeds threshold of $${amlThreshold.toLocaleString()}`,
    };
  }

  // Rule 2: Velocity check — too many transactions from same mobile in 60 min
  if (input.recentTxCount >= velocityLimit) {
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
  if (structuringTxs.length >= structuringCount) {
    return {
      triggered: true,
      type: 'StructuringPattern',
      priority: 'High',
      triggerRule: `${structuringTxs.length} transactions between $${STRUCTURING_MIN.toLocaleString()}–$${STRUCTURING_MAX.toLocaleString()} in 24 hours from ${input.customerWallet}`,
    };
  }

  return null;
};
