import type { TypingEvent, WordJudgement, WordJudgementType } from "./types";

interface WordRange {
  wordIndex: number;
  start: number;
  end: number;
}

export function createWordRanges(target: string) {
  const ranges: WordRange[] = [];
  let start = 0;
  let wordIndex = 0;

  for (let index = 0; index <= target.length; index += 1) {
    if (index === target.length || target[index] === " ") {
      ranges.push({ wordIndex, start, end: index });
      wordIndex += 1;
      start = index + 1;
    }
  }

  return ranges;
}

function judgementType(mistakeCount: number, correct: boolean): WordJudgementType {
  if (!correct) {
    return "miss";
  }

  if (mistakeCount === 0) {
    return "perfect";
  }

  if (mistakeCount === 1) {
    return "great";
  }

  return "good";
}

export function judgeWord(
  wordIndex: number,
  input: string,
  target: string,
  events: TypingEvent[],
  timestamp: number,
): WordJudgement | null {
  const range = createWordRanges(target)[wordIndex];

  if (!range) {
    return null;
  }

  const expectedWord = target.slice(range.start, range.end);
  const enteredWord = input.slice(range.start, range.end);
  const mistakeCount = events.filter(
    (event) =>
      event.wordIndex === wordIndex &&
      event.type !== "backspace" &&
      event.type !== "restart" &&
      !event.correct,
  ).length;

  return {
    id: `judgement-${wordIndex}-${Math.round(timestamp)}`,
    timestamp,
    wordIndex,
    type: judgementType(mistakeCount, enteredWord === expectedWord),
    mistakeCount,
  };
}

export function collectNewJudgements(
  previousJudgedWords: ReadonlySet<number>,
  newEvents: TypingEvent[],
  allEvents: TypingEvent[],
  input: string,
  target: string,
  timestamp: number,
) {
  const completedWords = new Set<number>();

  for (const event of newEvents) {
    if (event.type === "space" && event.correct && !previousJudgedWords.has(event.wordIndex)) {
      completedWords.add(event.wordIndex);
    }
  }

  const judgements = Array.from(completedWords)
    .map((wordIndex) => judgeWord(wordIndex, input, target, allEvents, timestamp))
    .filter((value): value is WordJudgement => value !== null);

  return judgements;
}

export function finalizeLastWordJudgement(
  judgedWords: ReadonlySet<number>,
  input: string,
  target: string,
  events: TypingEvent[],
  timestamp: number,
) {
  const ranges = createWordRanges(target);
  const finalWordIndex = ranges.length - 1;

  if (finalWordIndex < 0 || judgedWords.has(finalWordIndex)) {
    return null;
  }

  const finalRange = ranges[finalWordIndex];

  if (input.length < finalRange.end) {
    return null;
  }

  return judgeWord(finalWordIndex, input, target, events, timestamp);
}
