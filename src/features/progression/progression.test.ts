import { expect, it } from "vitest";
import type { TestResult } from "../../app/app.types";
import { calculatePlayerLevel, calculatePlayerPerformance } from "./progression";

it("keeps a new player at level one", () => {
  expect(calculatePlayerLevel(0)).toMatchObject({ level: 1, currentXp: 0, requiredXp: 140 });
});

it("carries extra xp into later levels", () => {
  expect(calculatePlayerLevel(450)).toMatchObject({ level: 3, currentXp: 30, requiredXp: 420 });
});

it("derives a performance profile from valid recent results", () => {
  const results = [
    {
      scoringVersion: 2,
      performanceRating: 420,
      badges: ["clean-run"],
      wpm: 105,
      accuracy: 99.2,
      consistency: 92,
      correctionDependency: 0.01,
      durationMs: 60000,
      difficulty: { stars: 4, label: "technical", tags: ["symbols"] },
      mode: "time",
      failedReason: null,
      incorrectCharacters: 0,
    },
    {
      scoringVersion: 2,
      performanceRating: 360,
      badges: [],
      wpm: 96,
      accuracy: 98.5,
      consistency: 88,
      correctionDependency: 0.03,
      durationMs: 120000,
      difficulty: { stars: 3, label: "advanced", tags: ["endurance"] },
      mode: "words",
      failedReason: null,
      incorrectCharacters: 0,
    },
  ] satisfies Array<Partial<TestResult>>;

  const profile = calculatePlayerPerformance(results);
  expect(profile.currentRating).toBeGreaterThan(360);
  expect(profile.peakRating).toBe(420);
  expect(profile.bestCleanWpm).toBe(105);
  expect(profile.skills).toHaveLength(6);
});

it("handles imported results without badge metadata", () => {
  const imported = [
    {
      performanceRating: 0,
      wpm: 72,
      accuracy: 96,
      consistency: 84,
      durationMs: 30000,
      difficulty: { stars: 1, label: "standard", tags: [] },
      mode: "time",
      failedReason: null,
      incorrectCharacters: 2,
    },
  ] satisfies Array<Partial<TestResult>>;

  expect(() => calculatePlayerPerformance(imported)).not.toThrow();
});
