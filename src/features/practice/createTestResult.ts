import type { TestResult } from "../../app/app.types";
import { calculatePerformance, calculateScore } from "../../core/scoring/performance";
import type { TestFailureReason } from "../../core/scoring/types";
import { createPerformanceSample } from "../../core/typing/metrics";
import { analyseTypingSession } from "../../core/typing/sessionAnalysis";
import type {
  PerformanceSample,
  TestConfiguration,
  TestMetrics,
  TypingEvent,
  WordJudgement,
} from "../../core/typing/types";

interface CreateTestResultOptions {
  configuration: TestConfiguration;
  elapsedMs: number;
  events: TypingEvent[];
  judgements: WordJudgement[];
  metrics: TestMetrics;
  previousBestResult: TestResult | null;
  samples: PerformanceSample[];
  target: string;
  failureReason: TestFailureReason;
}

export function createTestResult({
  configuration,
  elapsedMs,
  events,
  judgements,
  metrics,
  previousBestResult,
  samples,
  target,
  failureReason,
}: CreateTestResultOptions): TestResult {
  const personalBest = !failureReason && metrics.wpm > (previousBestResult?.wpm ?? 0);
  const performanceSamples = [
    ...samples.filter((sample) => Math.abs(sample.elapsedMs - elapsedMs) > 100),
    createPerformanceSample(elapsedMs, metrics),
  ];
  const performance = calculatePerformance({
    metrics,
    judgements,
    configuration,
    durationMs: elapsedMs,
    target,
    backspaces: metrics.backspaces,
    personalBest,
    performanceSamples,
    events,
    failureReason,
  });
  const score = calculateScore(metrics, judgements, configuration, performance.performanceRating);
  const analysis = analyseTypingSession({
    target,
    events,
    judgements,
    samples: performanceSamples,
  });
  const comparison = previousBestResult
    ? {
        resultId: previousBestResult.id,
        wpmDelta: metrics.wpm - previousBestResult.wpm,
        accuracyDelta: Math.round((metrics.accuracy - previousBestResult.accuracy) * 10) / 10,
        consistencyDelta: metrics.consistency - previousBestResult.consistency,
        performanceDelta: performance.performanceRating - previousBestResult.performanceRating,
      }
    : null;

  return {
    id: crypto.randomUUID(),
    completedAt: new Date().toISOString(),
    mode: configuration.mode,
    modeValue: configuration.value,
    durationMs: elapsedMs,
    wpm: metrics.wpm,
    rawWpm: metrics.rawWpm,
    accuracy: metrics.accuracy,
    consistency: metrics.consistency,
    correctCharacters: metrics.correctCharacters,
    incorrectCharacters: metrics.incorrectCharacters,
    totalCharacters: metrics.totalCharacters,
    correctKeystrokes: metrics.correctKeystrokes,
    incorrectKeystrokes: metrics.incorrectKeystrokes,
    backspaces: metrics.backspaces,
    maxCombo: metrics.maxCombo,
    longestCleanStreak: performance.longestCleanStreak,
    longestCleanWordStreak: performance.longestCleanWordStreak,
    longestAccuracyStreakMs: performance.longestAccuracyStreakMs,
    correctionDependency: performance.correctionDependency,
    errorRate: performance.errorRate,
    performanceRating: performance.performanceRating,
    difficulty: performance.difficulty,
    score: score.finalScore,
    grade: performance.grade,
    badges: performance.badges,
    failedReason: failureReason,
    scoringVersion: performance.scoringVersion,
    xpEarned: failureReason ? Math.max(1, Math.round(score.xpEarned * 0.25)) : score.xpEarned,
    personalBest,
    modifierMultiplier: score.modifierMultiplier,
    configuration: { ...configuration },
    wordJudgements: judgements,
    performanceSamples,
    typingEvents: events,
    target,
    analysis,
    comparison,
  };
}
