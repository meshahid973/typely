import type { TestResult } from "../../app/app.types";
import { calculateGrade } from "../../core/scoring/calculateGrade";
import { calculateScore } from "../../core/scoring/calculateScore";
import { createPerformanceSample } from "../../core/typing/metrics";
import type {
  CadenceMetrics,
  PerformanceSample,
  TestConfiguration,
  TestMetrics,
  TypingEvent,
  TypingFeedback,
  WordJudgement,
} from "../../core/typing/types";

export const emptyCadence: CadenceMetrics = {
  energy: 0,
  speed: 0,
  consistency: 1,
  averageIntervalMs: 0,
};

export const emptyFeedback: TypingFeedback = {
  sequence: 0,
  impact: "none",
  started: false,
  wordJudgement: null,
  comboMilestone: null,
  comboBreak: null,
  comboRecord: null,
};

export function createRestartEvent(timestamp: number): TypingEvent {
  return {
    id: "event-0",
    timestamp,
    type: "restart",
    expectedCharacter: null,
    enteredCharacter: null,
    targetIndex: 0,
    wordIndex: 0,
    characterIndex: 0,
    correct: true,
  };
}

export function impactFromEvents(events: TypingEvent[]): TypingFeedback["impact"] {
  const last = events.at(-1);

  if (!last) return "none";
  if (last.type === "backspace") return "backspace";
  return last.correct ? "correct" : "incorrect";
}

interface CreateResultOptions {
  configuration: TestConfiguration;
  elapsedMs: number;
  events: TypingEvent[];
  input: string;
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
  input,
  judgements,
  metrics,
  previousBestWpm,
  samples,
  target,
}: CreateResultOptions): TestResult {
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
    punctuation: configuration.punctuation,
    numbers: configuration.numbers,
  };
}
