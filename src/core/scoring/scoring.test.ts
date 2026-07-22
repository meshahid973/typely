import { describe, expect, it } from "vitest";
import type { TestConfiguration, TestMetrics, WordJudgement } from "../typing/types";
import { calculateConsistency } from "./calculateConsistency";
import { calculateGrade } from "./calculateGrade";
import { calculateModifierMultiplier, calculateScore } from "./calculateScore";

const configuration: TestConfiguration = {
  mode: "time",
  value: 30,
  punctuation: false,
  numbers: false,
  capitals: false,
  noBackspace: false,
  hidden: false,
};

const metrics: TestMetrics = {
  wpm: 80,
  rawWpm: 83,
  accuracy: 98,
  consistency: 90,
  correctCharacters: 200,
  incorrectCharacters: 4,
  totalCharacters: 204,
  correctKeystrokes: 200,
  incorrectKeystrokes: 4,
  totalKeystrokes: 204,
  currentCombo: 30,
  maxCombo: 60,
};

const perfect: WordJudgement = {
  id: "judgement-1",
  timestamp: 1,
  wordIndex: 0,
  type: "perfect",
  mistakeCount: 0,
};

describe("grades", () => {
  it("awards SS only for perfect accuracy without a miss", () => {
    expect(calculateGrade({ accuracy: 100 }, [perfect])).toBe("SS");
    expect(calculateGrade({ accuracy: 100 }, [{ ...perfect, type: "miss" }])).toBe("S");
  });

  it("covers every accuracy boundary", () => {
    expect(calculateGrade({ accuracy: 98 }, [])).toBe("S");
    expect(calculateGrade({ accuracy: 95 }, [])).toBe("A");
    expect(calculateGrade({ accuracy: 90 }, [])).toBe("B");
    expect(calculateGrade({ accuracy: 80 }, [])).toBe("C");
    expect(calculateGrade({ accuracy: 79.9 }, [])).toBe("D");
  });
});

describe("score", () => {
  it("applies modifier multipliers", () => {
    const modified = {
      ...configuration,
      punctuation: true,
      noBackspace: true,
    };

    expect(calculateModifierMultiplier(modified)).toBeGreaterThan(1.2);
  });

  it("rewards accuracy and clean words", () => {
    const result = calculateScore(metrics, [perfect], configuration);
    const lowAccuracy = calculateScore({ ...metrics, accuracy: 70 }, [perfect], configuration);

    expect(result.finalScore).toBeGreaterThan(lowAccuracy.finalScore);
    expect(result.xpEarned).toBeGreaterThan(0);
  });
});

describe("consistency", () => {
  it("rewards steady input intervals", () => {
    const steady = [0, 100, 200, 300, 400].map((timestamp, index) => ({
      id: `event-${index}`,
      timestamp,
      type: "character" as const,
      expectedCharacter: "a",
      enteredCharacter: "a",
      targetIndex: index,
      wordIndex: 0,
      characterIndex: index,
      correct: true,
    }));
    const uneven = [0, 40, 360, 410, 980].map((timestamp, index) => ({
      ...steady[index],
      timestamp,
    }));

    expect(calculateConsistency(steady)).toBeGreaterThan(calculateConsistency(uneven));
  });
});
