export type Grade = "SS+" | "SS" | "S" | "A" | "B" | "C" | "D";
export type TestFailureReason = "sudden-death" | "minimum-pace" | "accuracy-challenge" | null;

export interface JudgementCounts {
  perfect: number;
  clean: number;
  recovered: number;
  miss: number;
  burst: number;
}

export interface DifficultyRating {
  stars: number;
  label: "standard" | "advanced" | "technical" | "expert";
  tags: string[];
}

export interface PerformanceBreakdown {
  scoringVersion: number;
  performanceRating: number;
  difficulty: DifficultyRating;
  grade: Grade;
  badges: import("../typing/types").ResultBadgeId[];
  correctionDependency: number;
  errorRate: number;
  longestCleanStreak: number;
  longestCleanWordStreak: number;
  longestAccuracyStreakMs: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  accuracyMultiplier: number;
  consistencyMultiplier: number;
  modifierMultiplier: number;
  finalScore: number;
  xpEarned: number;
}
