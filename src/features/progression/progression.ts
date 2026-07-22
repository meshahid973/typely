import type { TestResult } from "../../app/app.types";
import type { Achievement, PlayerLevel, PlayerProfile } from "./types";

const xpStep = 140;

export function xpRequiredForLevel(level: number) {
  return Math.max(1, level) * xpStep;
}

export function calculatePlayerLevel(totalXp: number): PlayerLevel {
  let remainingXp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let requiredXp = xpRequiredForLevel(level);

  while (remainingXp >= requiredXp) {
    remainingXp -= requiredXp;
    level += 1;
    requiredXp = xpRequiredForLevel(level);
  }

  return {
    level,
    currentXp: remainingXp,
    requiredXp,
    progress: requiredXp === 0 ? 0 : remainingXp / requiredXp,
  };
}

export function applyResultToProfile(profile: PlayerProfile, result: TestResult): PlayerProfile {
  return {
    ...profile,
    totalXp: profile.totalXp + result.xpEarned,
    testsCompleted: profile.testsCompleted + 1,
    totalTypedCharacters: profile.totalTypedCharacters + result.totalCharacters,
    practiceTimeMs: profile.practiceTimeMs + result.durationMs,
  };
}

export function getAchievements(results: TestResult[]): Achievement[] {
  const bestWpm = results.reduce((best, result) => Math.max(best, result.wpm), 0);
  const bestCombo = results.reduce((best, result) => Math.max(best, result.maxCombo), 0);
  const hasPerfect = results.some((result) => result.grade === "SS");

  return [
    {
      id: "first-run",
      name: "First run",
      description: "Complete your first typing test.",
      unlocked: results.length >= 1,
    },
    {
      id: "speed-50",
      name: "Finding rhythm",
      description: "Reach 50 WPM in one test.",
      unlocked: bestWpm >= 50,
    },
    {
      id: "speed-100",
      name: "Triple digits",
      description: "Reach 100 WPM in one test.",
      unlocked: bestWpm >= 100,
    },
    {
      id: "perfect-run",
      name: "Untouchable",
      description: "Finish a test with an SS grade.",
      unlocked: hasPerfect,
    },
    {
      id: "combo-100",
      name: "Locked in",
      description: "Reach a 100 key combo.",
      unlocked: bestCombo >= 100,
    },
    {
      id: "practice-25",
      name: "Regular",
      description: "Complete 25 typing tests.",
      unlocked: results.length >= 25,
    },
  ];
}
