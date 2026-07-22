import { describe, expect, it } from "vitest";
import { calculateMetrics, calculateProgress } from "./practice.utils";

const configuration = {
  mode: "time" as const,
  value: 30,
  punctuation: false,
  numbers: false,
};

describe("calculateMetrics", () => {
  it("calculates correct typing", () => {
    const metrics = calculateMetrics("hello", "hello", 60000);
    expect(metrics.wpm).toBe(1);
    expect(metrics.accuracy).toBe(100);
    expect(metrics.maxCombo).toBe(5);
  });

  it("tracks mistakes and combo resets", () => {
    const metrics = calculateMetrics("hezlo", "hello", 60000);
    expect(metrics.correctCharacters).toBe(4);
    expect(metrics.incorrectCharacters).toBe(1);
    expect(metrics.maxCombo).toBe(2);
  });
});

describe("calculateProgress", () => {
  it("caps progress at one", () => {
    expect(calculateProgress(configuration, 0, 100, 40000)).toBe(1);
  });
});
