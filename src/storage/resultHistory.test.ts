import { describe, expect, it } from "vitest";
import { maximumStoredResults, normalizeResults } from "./resultHistory";

describe("result history", () => {
  it("migrates old results into the performance schema", () => {
    const [result] = normalizeResults([
      {
        id: "old-result",
        completedAt: "2026-07-22T00:00:00.000Z",
        mode: "time",
        modeValue: 30,
        durationMs: 30000,
        wpm: 72,
        accuracy: 96,
        maxCombo: 84,
        wordJudgements: [
          { id: "old-clean", timestamp: 1000, wordIndex: 0, type: "great", mistakeCount: 0 },
        ],
      },
    ]);

    expect(result.rawWpm).toBe(72);
    expect(result.longestCleanStreak).toBe(84);
    expect(result.grade).toBe("A");
    expect(result.configuration.symbols).toBe(false);
    expect(result.wordJudgements[0].type).toBe("clean");
    expect(result.scoringVersion).toBe(1);
    expect(result.configuration.challengeId).toBeNull();
    expect(result.analysis.weakKeys).toEqual([]);
  });

  it("normalises new challenge and badge fields", () => {
    const [result] = normalizeResults([
      {
        completedAt: "2026-07-22T00:00:00.000Z",
        wpm: 100,
        accuracy: 99,
        performanceRating: 420,
        grade: "SS+",
        badges: ["clean-run", "not-real"],
        failedReason: "sudden-death",
        difficulty: { stars: 4.2, label: "technical", tags: ["symbols"] },
        configuration: { challengeId: "technical-console", ghostRace: true },
        analysis: {
          weakKeys: [{ key: "p", attempts: 4, mistakes: 1, accuracy: 75, averageIntervalMs: 220 }],
          slowBigrams: [],
          slowWords: [],
          fastestWpm: 130,
          firstMistakeAtMs: 1200,
        },
      },
    ]);

    expect(result.performanceRating).toBe(420);
    expect(result.grade).toBe("SS+");
    expect(result.badges).toEqual(["clean-run"]);
    expect(result.failedReason).toBe("sudden-death");
    expect(result.difficulty.stars).toBe(4.2);
    expect(result.configuration.challengeId).toBe("technical-console");
    expect(result.configuration.ghostRace).toBe(true);
    expect(result.analysis.weakKeys[0].key).toBe("p");
  });

  it("drops invalid entries and limits stored history", () => {
    const values = Array.from({ length: maximumStoredResults + 10 }, (_, index) => ({
      id: `result-${index}`,
      completedAt: "2026-07-22T00:00:00.000Z",
      wpm: index,
      accuracy: 100,
    }));

    expect(normalizeResults([null, "bad", ...values])).toHaveLength(maximumStoredResults);
  });
});
