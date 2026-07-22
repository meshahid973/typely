import type { TestResult } from "../../app/app.types";
import { calculateGrade } from "../../core/scoring/calculateGrade";
import { calculateScore } from "../../core/scoring/calculateScore";
import { createPerformanceSample } from "../../core/typing/metrics";
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
  previousBestWpm: number;
  samples: PerformanceSample[];
  target: string;
}

export function createTestResult({
  configuration,
  elapsedMs,
  events,
  judgements,
  metrics,
  previousBestWpm,
  samples,
  target,
}: CreateTestResultOptions): TestResult {
  const score = calculateScore(metrics, judgements, configuration);
  const performanceSamples = [
    ...samples.filter((sample) => Math.abs(sample.elapsedMs - elapsedMs) > 100),
    createPerformanceSample(elapsedMs, metrics),
  ];

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
    maxCombo: metrics.maxCombo,
    score: score.finalScore,
    grade: calculateGrade(metrics, judgements),
    xpEarned: score.xpEarned,
    personalBest: metrics.wpm > previousBestWpm,
    modifierMultiplier: score.modifierMultiplier,
    configuration: { ...configuration },
    wordJudgements: judgements,
    performanceSamples,
    typingEvents: events,
    target,
  };
}
