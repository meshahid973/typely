import type { TestConfiguration } from "./types";
import { commonWords } from "./wordList";

const punctuationMarks = [".", ",", "?", "!", ";"];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function applyCapital(word: string) {
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

export function createTarget(configuration: TestConfiguration) {
  const wordCount =
    configuration.mode === "words" ? configuration.value : Math.max(180, configuration.value * 5);
  const words = Array.from({ length: wordCount }, (_, index) => {
    let word = randomItem(commonWords);

    if (configuration.numbers && index > 0 && index % 11 === 0) {
      word = `${word}${Math.floor(Math.random() * 90 + 10)}`;
    }

    if (configuration.capitals && index % 9 === 0) {
      word = applyCapital(word);
    }

    if (configuration.punctuation && index > 0 && index % 7 === 0) {
      word = `${word}${randomItem(punctuationMarks)}`;
    }

    return word;
  });

  return words.join(" ");
}
