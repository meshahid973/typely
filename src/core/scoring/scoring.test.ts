import { describe, expect, it } from "vitest";
import type { TestConfiguration, TestMetrics, TypingEvent, WordJudgement } from "../typing/types";
import {
  calculateConsistency,
  calculateGrade,
  calculateModifierMultiplier,
  calculatePerformanceRating,
  calculateTextDifficulty,
} from "./performance";

const configuration: TestConfiguration = {
  mode: "time",
  value: 30,
  punctuation: false,
  numbers: false,
  capitals: false,
  symbols: false,
  noBackspace: false,
  hidden: false,
  focusMode: false,
  noLiveWpm: false,
  suddenDeath: false,
  accuracyTarget: null,
  minimumPace: null,
  challengeId: null,
  ghostRace: false,
};

const metrics: TestMetrics = {
  wpm: 104,
  rawWpm: 106,
  accuracy: 98.7,
  consistency: 93,
  correctCharacters: 260,
  incorrectCharacters: 0,
  totalCharacters: 260,
  correctKeystrokes: 260,
  incorrectKeystrokes: 3,
  totalKeystrokes: 263,
  currentCombo: 80,
  maxCombo: 160,
  backspaces: 3,
  correctionDependency: 3 / 263,
  errorRate: 3 / 263,
};

const perfect: WordJudgement = {
  id: "judgement-1",
  timestamp: 1000,
  wordIndex: 0,
  type: "perfect",
  mistakeCount: 0,
  backspaceCount: 0,
  durationMs: 500,
  averageIntervalMs: 100,
  wpm: 96,
};

function eventsAt(timestamps: number[]): TypingEvent[] {
  return timestamps.map((timestamp, index) => ({
    id: `event-${index}`,
    timestamp,
    type: "character",
    expectedCharacter: "a",
    enteredCharacter: "a",
    targetIndex: index,
    wordIndex: 0,
    characterIndex: index,
    correct: true,
  }));
}

describe("typing performance", () => {
  it("rewards clean speed more than faster inaccurate typing", () => {
    const difficulty = { stars: 2.5, label: "advanced" as const, tags: ["standard"] };
    const clean = calculatePerformanceRating({
      metrics,
      durationMs: 60000,
      difficulty,
      correctionDependency: metrics.correctionDependency,
      longestCleanStreak: metrics.maxCombo,
    });
    const messy = calculatePerformanceRating({
      metrics: {
        ...metrics,
        wpm: 120,
        rawWpm: 132,
        accuracy: 91,
        consistency: 75,
        incorrectKeystrokes: 26,
        totalKeystrokes: 286,
      },
      durationMs: 60000,
      difficulty,
      correctionDependency: 0.12,
      longestCleanStreak: 34,
    });

    expect(clean).toBeGreaterThan(messy);
    expect(clean).toBeGreaterThan(350);
  });

  it("produces higher difficulty for punctuation, symbols, and strict rules", () => {
    const simple = calculateTextDifficulty(
      "the quick brown fox jumps over the lazy dog",
      configuration,
    );
    const technical = calculateTextDifficulty(
      "const total = (value ?? 0) * 42; verify_result(total)!",
      {
        ...configuration,
        punctuation: true,
        numbers: true,
        symbols: true,
        noBackspace: true,
      },
    );

    expect(technical.stars).toBeGreaterThan(simple.stars);
    expect(technical.tags).toContain("symbols");
  });
});

describe("grades", () => {
  it("reserves SS+ for a truly perfect and consistent run", () => {
    expect(
      calculateGrade({
        metrics: {
          ...metrics,
          accuracy: 100,
          consistency: 97,
          incorrectKeystrokes: 0,
        },
        judgements: [perfect],
        failureReason: null,
      }),
    ).toBe("SS+");
  });

  it("forces failed challenges to D", () => {
    expect(
      calculateGrade({ metrics, judgements: [perfect], failureReason: "accuracy-challenge" }),
    ).toBe("D");
  });
});

describe("modifiers", () => {
  it("stacks only performance-affecting modifiers", () => {
    const multiplier = calculateModifierMultiplier({
      ...configuration,
      punctuation: true,
      noBackspace: true,
      suddenDeath: true,
      noLiveWpm: true,
    });

    expect(multiplier).toBeGreaterThan(1.4);
    expect(calculateModifierMultiplier({ ...configuration, noLiveWpm: true })).toBe(1);
  });
});

describe("consistency", () => {
  it("rewards steady intervals", () => {
    const steady = eventsAt([0, 100, 200, 300, 400]);
    const uneven = eventsAt([0, 40, 360, 410, 980]);

    expect(calculateConsistency(steady)).toBeGreaterThan(calculateConsistency(uneven));
  });

  it("does not double-penalise a long pause", () => {
    const paused = eventsAt([0, 100, 200, 300, 5000, 5100, 5200, 5300]);
    expect(calculateConsistency(paused)).toBeGreaterThanOrEqual(95);
  });
});
