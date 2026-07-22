import { calculateConsistency } from "../scoring/calculateConsistency";
import type {
  PerformanceSample,
  TestConfiguration,
  TestMetrics,
  TypingEvent,
  TypingSessionStats,
} from "./types";
import { summarizeTypingEvents } from "./typingEvents";

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function calculateMetrics(
  input: string,
  target: string,
  elapsedMs: number,
  events: TypingEvent[],
  stats?: TypingSessionStats,
  live = false,
): TestMetrics {
  let correctCharacters = 0;

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === target[index]) {
      correctCharacters += 1;
    }
  }

  const recorded = stats ?? summarizeTypingEvents(events);
  const totalCharacters = input.length;
  const incorrectCharacters = Math.max(0, totalCharacters - correctCharacters);
  const minutes = elapsedMs / 60000;
  const stableLiveReading = elapsedMs >= 500 && recorded.totalKeystrokes >= 2;
  const canCalculateSpeed = minutes > 0 && (!live || stableLiveReading);
  const wpm = canCalculateSpeed ? Math.round(correctCharacters / 5 / minutes) : 0;
  const rawWpm = canCalculateSpeed ? Math.round(recorded.totalKeystrokes / 5 / minutes) : 0;
  const accuracy =
    recorded.totalKeystrokes === 0
      ? 100
      : roundOne((recorded.correctKeystrokes / recorded.totalKeystrokes) * 100);

  return {
    wpm,
    rawWpm,
    accuracy,
    consistency: calculateConsistency(events),
    correctCharacters,
    incorrectCharacters,
    totalCharacters,
    correctKeystrokes: recorded.correctKeystrokes,
    incorrectKeystrokes: recorded.incorrectKeystrokes,
    totalKeystrokes: recorded.totalKeystrokes,
    currentCombo: recorded.currentCombo,
    maxCombo: recorded.maxCombo,
  };
}

export function calculateProgress(
  configuration: TestConfiguration,
  inputLength: number,
  targetLength: number,
  elapsedMs: number,
) {
  const progress =
    configuration.mode === "time"
      ? elapsedMs / (configuration.value * 1000)
      : inputLength / targetLength;

  return Math.max(0, Math.min(1, progress));
}

export function createPerformanceSample(
  elapsedMs: number,
  metrics: TestMetrics,
): PerformanceSample {
  return {
    elapsedMs: Math.round(elapsedMs),
    wpm: metrics.wpm,
    rawWpm: metrics.rawWpm,
    accuracy: metrics.accuracy,
    combo: metrics.currentCombo,
  };
}
