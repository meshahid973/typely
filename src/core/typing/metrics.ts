import { calculateConsistency } from "../scoring/performance";
import type {
  PerformanceSample,
  TestConfiguration,
  TestMetrics,
  TypingEvent,
  TypingSessionStats,
} from "./types";
import { summarizeTypingEvents } from "./typingEvents";

const charactersPerWord = 5;
const millisecondsPerMinute = 60000;
const minimumLiveElapsedMs = 1000;
const minimumLiveKeystrokes = 5;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function finiteNonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function finiteNonNegativeInteger(value: number) {
  return Math.trunc(finiteNonNegative(value));
}

function countCurrentCharacters(input: string, target: string) {
  let correctCharacters = 0;

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === target[index]) correctCharacters += 1;
  }

  return {
    correctCharacters,
    incorrectCharacters: Math.max(0, input.length - correctCharacters),
  };
}

function calculateWpm(characterCount: number, elapsedMs: number) {
  if (elapsedMs <= 0 || characterCount <= 0) return 0;

  return Math.max(
    0,
    Math.round((characterCount * millisecondsPerMinute) / charactersPerWord / elapsedMs),
  );
}

export function calculateMetrics(
  input: string,
  target: string,
  elapsedMs: number,
  events: TypingEvent[],
  stats?: TypingSessionStats,
  live = false,
  consistencyOverride?: number,
): TestMetrics {
  const recorded = stats ?? summarizeTypingEvents(events);
  const safeElapsedMs = finiteNonNegative(elapsedMs);
  const { correctCharacters, incorrectCharacters } = countCurrentCharacters(input, target);
  const correctKeystrokes = finiteNonNegativeInteger(recorded.correctKeystrokes);
  const incorrectKeystrokes = finiteNonNegativeInteger(recorded.incorrectKeystrokes);
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const backspaces = finiteNonNegativeInteger(recorded.backspaces);
  const stableLiveReading =
    safeElapsedMs >= minimumLiveElapsedMs && totalKeystrokes >= minimumLiveKeystrokes;
  const canCalculateSpeed = safeElapsedMs > 0 && (!live || stableLiveReading);
  const wpm = canCalculateSpeed ? calculateWpm(correctCharacters, safeElapsedMs) : 0;
  const rawWpm = canCalculateSpeed ? calculateWpm(totalKeystrokes, safeElapsedMs) : 0;
  const accuracy =
    totalKeystrokes === 0
      ? 100
      : roundOne(clamp((correctKeystrokes / totalKeystrokes) * 100, 0, 100));
  const consistency = clamp(
    finiteNonNegative(consistencyOverride ?? calculateConsistency(events)),
    0,
    100,
  );

  return {
    wpm,
    rawWpm,
    accuracy,
    consistency,
    correctCharacters,
    incorrectCharacters,
    totalCharacters: input.length,
    correctKeystrokes,
    incorrectKeystrokes,
    totalKeystrokes,
    currentCombo: finiteNonNegativeInteger(recorded.currentCombo),
    maxCombo: finiteNonNegativeInteger(recorded.maxCombo),
    backspaces,
    correctionDependency:
      totalKeystrokes === 0 ? 0 : roundOne((backspaces / totalKeystrokes) * 100) / 100,
    errorRate:
      totalKeystrokes === 0 ? 0 : roundOne((incorrectKeystrokes / totalKeystrokes) * 100) / 100,
  };
}

export function calculateProgress(
  configuration: TestConfiguration,
  inputLength: number,
  targetLength: number,
  elapsedMs: number,
) {
  const safeInputLength = finiteNonNegative(inputLength);
  const safeTargetLength = finiteNonNegative(targetLength);
  const safeElapsedMs = finiteNonNegative(elapsedMs);
  let progress = 0;

  if (configuration.mode === "time" && configuration.value > 0) {
    progress = safeElapsedMs / (configuration.value * 1000);
  } else if (configuration.mode === "words" && safeTargetLength > 0) {
    progress = safeInputLength / safeTargetLength;
  }

  return clamp(progress, 0, 1);
}

export function createPerformanceSample(
  elapsedMs: number,
  metrics: TestMetrics,
): PerformanceSample {
  return {
    elapsedMs: Math.round(finiteNonNegative(elapsedMs)),
    wpm: metrics.wpm,
    rawWpm: metrics.rawWpm,
    accuracy: metrics.accuracy,
    combo: metrics.currentCombo,
  };
}
