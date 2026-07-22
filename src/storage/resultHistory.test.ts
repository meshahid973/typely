import { describe, expect, it } from "vitest";
import { maximumStoredResults, normalizeResults } from "./resultHistory";

describe("result history", () => {
  it("fills missing Phase 1 fields with safe values", () => {
    const [result] = normalizeResults([
      {
        id: "old-result",
        completedAt: "2026-07-22T00:00:00.000Z",
        mode: "time",
        modeValue: 30,
        durationMs: 30000,
        wpm: 72,
        accuracy: 96,
      },
    ]);

    expect(result.rawWpm).toBe(72);
    expect(result.maxCombo).toBe(0);
    expect(result.grade).toBe("A");
    expect(result.configuration.value).toBe(30);
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
