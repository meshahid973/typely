import type { KeystrokeStats, TestConfiguration, TestMetrics } from "./practice.types";
import { commonWords } from "./words";

const punctuationMarks = [".", ",", "?", "!", ";"];

export const emptyKeystrokeStats: KeystrokeStats = {
  correct: 0,
  incorrect: 0,
  currentCombo: 0,
  maxCombo: 0,
};

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function deriveKeystrokeStats(input: string, target: string) {
  let correct = 0;
  let incorrect = 0;
  let currentCombo = 0;
  let maxCombo = 0;

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === target[index]) {
      correct += 1;
      currentCombo += 1;
      maxCombo = Math.max(maxCombo, currentCombo);
    } else {
      incorrect += 1;
      currentCombo = 0;
    }
  }

  return { correct, incorrect, currentCombo, maxCombo };
}

export function recordKeystrokes(
  previousInput: string,
  nextInput: string,
  target: string,
  current: KeystrokeStats,
) {
  let sharedLength = 0;
  const comparisonLength = Math.min(previousInput.length, nextInput.length);

  while (
    sharedLength < comparisonLength &&
    previousInput[sharedLength] === nextInput[sharedLength]
  ) {
    sharedLength += 1;
  }

  if (sharedLength === nextInput.length) {
    return current;
  }

  const next = { ...current };

  for (let index = sharedLength; index < nextInput.length; index += 1) {
    if (nextInput[index] === target[index]) {
      next.correct += 1;
      next.currentCombo += 1;
      next.maxCombo = Math.max(next.maxCombo, next.currentCombo);
    } else {
      next.incorrect += 1;
      next.currentCombo = 0;
    }
  }

  return next;
}

export function createTarget(configuration: TestConfiguration) {
  const wordCount =
    configuration.mode === "words" ? configuration.value : Math.max(180, configuration.value * 5);
  const words = Array.from({ length: wordCount }, (_, index) => {
    let word = randomItem(commonWords);

    if (configuration.numbers && index > 0 && index % 11 === 0) {
      word = `${word}${Math.floor(Math.random() * 90 + 10)}`;
    }

    if (configuration.punctuation && index % 13 === 0) {
      word = `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    }

    if (configuration.punctuation && index > 0 && index % 7 === 0) {
      word = `${word}${randomItem(punctuationMarks)}`;
    }

    return word;
  });

  return words.join(" ");
}

export function calculateMetrics(
  input: string,
  target: string,
  elapsedMs: number,
  keystrokes?: KeystrokeStats,
  live = false,
): TestMetrics {
  let correctCharacters = 0;

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === target[index]) {
      correctCharacters += 1;
    }
  }

  const recorded = keystrokes ?? deriveKeystrokeStats(input, target);
  const totalCharacters = input.length;
  const incorrectCharacters = Math.max(0, totalCharacters - correctCharacters);
  const totalKeystrokes = recorded.correct + recorded.incorrect;
  const minutes = elapsedMs / 60000;
  const stableLiveReading = elapsedMs >= 500 && totalCharacters >= 2;
  const canCalculateSpeed = minutes > 0 && (!live || stableLiveReading);
  const rawCharacters = Math.max(totalCharacters, totalKeystrokes);
  const wpm = canCalculateSpeed ? Math.round(correctCharacters / 5 / minutes) : 0;
  const rawWpm = canCalculateSpeed ? Math.round(rawCharacters / 5 / minutes) : 0;
  const accuracy =
    totalKeystrokes === 0 ? 100 : Math.round((recorded.correct / totalKeystrokes) * 1000) / 10;

  return {
    wpm,
    rawWpm,
    accuracy,
    correctCharacters,
    incorrectCharacters,
    totalCharacters,
    correctKeystrokes: recorded.correct,
    incorrectKeystrokes: recorded.incorrect,
    totalKeystrokes,
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
