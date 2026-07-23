import { describe, expect, it } from "vitest";
import { analyseTypingSession } from "./sessionAnalysis";
import type { PerformanceSample, TypingEvent, WordJudgement } from "./types";

const events: TypingEvent[] = [
  {
    id: "1",
    timestamp: 0,
    type: "character",
    expectedCharacter: "t",
    enteredCharacter: "t",
    targetIndex: 0,
    wordIndex: 0,
    characterIndex: 0,
    correct: true,
  },
  {
    id: "2",
    timestamp: 100,
    type: "character",
    expectedCharacter: "h",
    enteredCharacter: "x",
    targetIndex: 1,
    wordIndex: 0,
    characterIndex: 1,
    correct: false,
  },
  {
    id: "3",
    timestamp: 300,
    type: "character",
    expectedCharacter: "h",
    enteredCharacter: "h",
    targetIndex: 1,
    wordIndex: 0,
    characterIndex: 1,
    correct: true,
  },
  {
    id: "4",
    timestamp: 650,
    type: "character",
    expectedCharacter: "e",
    enteredCharacter: "e",
    targetIndex: 2,
    wordIndex: 0,
    characterIndex: 2,
    correct: true,
  },
  {
    id: "5",
    timestamp: 750,
    type: "space",
    expectedCharacter: " ",
    enteredCharacter: " ",
    targetIndex: 3,
    wordIndex: 0,
    characterIndex: 3,
    correct: true,
  },
];

const judgements: WordJudgement[] = [
  {
    id: "word-0",
    timestamp: 750,
    wordIndex: 0,
    type: "recovered",
    mistakeCount: 1,
    backspaceCount: 0,
    durationMs: 750,
    averageIntervalMs: 187,
    wpm: 48,
  },
];

const samples: PerformanceSample[] = [
  { elapsedMs: 500, wpm: 54, rawWpm: 60, accuracy: 80, combo: 1 },
  { elapsedMs: 750, wpm: 48, rawWpm: 57, accuracy: 80, combo: 2 },
];

describe("session analysis", () => {
  it("finds real weak keys and the first mistake", () => {
    const analysis = analyseTypingSession({ target: "the test", events, judgements, samples });

    expect(analysis.weakKeys[0]).toMatchObject({ key: "h", mistakes: 1, attempts: 2 });
    expect(analysis.firstMistakeAtMs).toBe(100);
    expect(analysis.fastestWpm).toBe(54);
    expect(analysis.slowWords[0]).toMatchObject({ word: "the", judgement: "recovered" });
  });
});
