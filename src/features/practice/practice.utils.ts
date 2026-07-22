import type { TestConfiguration, TestMetrics } from "./practice.types";
import { commonWords } from "./words";

const punctuationMarks = [".", ",", "?", "!", ";"];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
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

export function calculateMetrics(input: string, target: string, elapsedMs: number): TestMetrics {
  let correctCharacters = 0;
  let currentCombo = 0;
  let maxCombo = 0;

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === target[index]) {
      correctCharacters += 1;
      currentCombo += 1;
      maxCombo = Math.max(maxCombo, currentCombo);
    } else {
      currentCombo = 0;
    }
  }

  const minutes = Math.max(elapsedMs / 60000, 1 / 60000);
  const totalCharacters = input.length;
  const incorrectCharacters = Math.max(0, totalCharacters - correctCharacters);
  const wpm = Math.round(correctCharacters / 5 / minutes);
  const rawWpm = Math.round(totalCharacters / 5 / minutes);
  const accuracy =
    totalCharacters === 0 ? 100 : Math.round((correctCharacters / totalCharacters) * 1000) / 10;

  return {
    wpm,
    rawWpm,
    accuracy,
    correctCharacters,
    incorrectCharacters,
    totalCharacters,
    currentCombo,
    maxCombo,
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
