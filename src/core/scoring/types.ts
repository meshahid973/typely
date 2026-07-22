export type Grade = "SS" | "S" | "A" | "B" | "C" | "D";

export interface JudgementCounts {
  perfect: number;
  great: number;
  good: number;
  miss: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  accuracyMultiplier: number;
  consistencyMultiplier: number;
  modifierMultiplier: number;
  finalScore: number;
  xpEarned: number;
}
