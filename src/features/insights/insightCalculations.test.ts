import { expect, it } from "vitest";
import type { TestResult } from "../../app/app.types";
import { createInsightSummary, createLetterInsights } from "./insightCalculations";

const result = {
  wpm: 80,
  accuracy: 95,
  consistency: 88,
  maxCombo: 40,
  durationMs: 30000,
  typingEvents: [
    {
      id: "1",
      timestamp: 0,
      type: "character",
      expectedCharacter: "a",
      enteredCharacter: "x",
      targetIndex: 0,
      wordIndex: 0,
      characterIndex: 0,
      correct: false,
    },
    {
      id: "2",
      timestamp: 1,
      type: "character",
      expectedCharacter: "a",
      enteredCharacter: "a",
      targetIndex: 0,
      wordIndex: 0,
      characterIndex: 0,
      correct: true,
    },
  ],
} as TestResult;

it("creates honest summary values", () => {
  expect(createInsightSummary([result])).toMatchObject({ bestWpm: 80, averageAccuracy: 95 });
});

it("finds weak letters from real events", () => {
  expect(createLetterInsights([result]).weak[0]).toMatchObject({ character: "a", mistakes: 1 });
});
