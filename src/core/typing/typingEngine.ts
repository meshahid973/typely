import { getTypingChallenge } from "../challenges/challenges";
import type { TestConfiguration } from "./types";
import { commonWords } from "./wordList";

const punctuationMarks = [".", ",", "?", "!", ";"];
const symbols = ["@", "#", "$", "%", "&", "*", "+", "=", "_", "/"];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function applyCapital(word: string) {
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

export function createTarget(configuration: TestConfiguration) {
  const challenge = getTypingChallenge(configuration.challengeId);
  if (challenge) return challenge.text;

  const wordCount =
    configuration.mode === "words"
      ? configuration.value
      : Math.max(80, Math.ceil(configuration.value * 4.5));
  const words = Array.from({ length: wordCount }, (_, index) => {
    let word = randomItem(commonWords);

    if (configuration.numbers && index > 0 && index % 11 === 0) {
      word = `${word}${Math.floor(Math.random() * 90 + 10)}`;
    }

    if (configuration.capitals && index % 9 === 0) word = applyCapital(word);
    if (configuration.punctuation && index > 0 && index % 7 === 0) {
      word = `${word}${randomItem(punctuationMarks)}`;
    }
    if (configuration.symbols && index > 0 && index % 8 === 0) {
      word = `${randomItem(symbols)}${word}${randomItem(symbols)}`;
    }

    return word;
  });

  return words.join(" ");
}
