export interface ScoreWeights {
  w1: number; // weight for recent usage (reciprocal)
  w2: number; // weight for wait time
  w3: number; // penalty weight for strikes
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  w1: 0.5,
  w2: 0.3,
  w3: 0.2,
};

export interface PriorityScoreResult {
  score: number;
  breakdown: {
    recentUsage: number;
    usageTerm: number;
    waitHours: number;
    strikes: number;
    weights: ScoreWeights;
  };
}

/**
 * Calculates an explainable waitlist priority score:
 * score = w1 * (1 / (1 + hoursUsedLast30Days)) + w2 * waitHours - w3 * strikes
 */
export function calculateWaitlistPriorityScore(
  hoursUsedLast30Days: number,
  waitHours: number,
  strikes: number,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS
): PriorityScoreResult {
  const usageTerm = 1 / (1 + Math.max(0, hoursUsedLast30Days));
  const rawScore = weights.w1 * usageTerm + weights.w2 * waitHours - weights.w3 * strikes;
  const score = Math.max(0, Number(rawScore.toFixed(3)));

  return {
    score,
    breakdown: {
      recentUsage: hoursUsedLast30Days,
      usageTerm: Number(usageTerm.toFixed(3)),
      waitHours: Number(waitHours.toFixed(1)),
      strikes,
      weights,
    },
  };
}
