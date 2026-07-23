import type { TestResult } from "../../app/app.types";
import type { Achievement, PlayerLevel, PlayerProfile } from "./types";

const xpStep = 140;

export interface PlayerSkill {
  id: "speed" | "accuracy" | "consistency" | "endurance" | "technical" | "control";
  label: string;
  value: number;
}

export interface PlayerPerformanceProfile {
  currentRating: number;
  peakRating: number;
  bestWpm: number;
  bestCleanWpm: number;
  averageAccuracy: number;
  preferredMode: "time" | "words" | null;
  strongestSkill: PlayerSkill;
  skills: PlayerSkill[];
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function finiteNumber(value: number | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function average(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isRatedResult(result: Partial<TestResult>) {
  return finiteNumber(result.performanceRating) > 0 && finiteNumber(result.scoringVersion, 2) >= 2;
}

function isCleanRun(result: Partial<TestResult>) {
  if (result.badges?.includes("clean-run")) {
    return true;
  }

  return (
    (result.incorrectCharacters ?? 0) === 0 &&
    (result.incorrectKeystrokes ?? 0) === 0 &&
    (result.backspaces ?? 0) === 0 &&
    (result.correctionDependency ?? 0) === 0
  );
}

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

export function calculatePlayerPerformance(
  results: ReadonlyArray<Partial<TestResult>>,
): PlayerPerformanceProfile {
  const valid = results.filter((result) => !result.failedReason);
  const recent = valid.slice(0, 10);
  const ratedRecent = valid.filter(isRatedResult).slice(0, 10);
  const weightedRating = ratedRecent.reduce(
    (total, result, index) => total + finiteNumber(result.performanceRating) * (10 - index),
    0,
  );
  const weightTotal = ratedRecent.reduce((total, _, index) => total + (10 - index), 0);
  const timeCount = valid.filter((result) => result.mode === "time").length;
  const wordCount = valid.filter((result) => result.mode === "words").length;
  const averageAccuracy = average(recent.map((result) => finiteNumber(result.accuracy)));
  const averageConsistency = average(recent.map((result) => finiteNumber(result.consistency)));
  const averageCorrectionDependency = average(
    recent.map((result) => finiteNumber(result.correctionDependency)),
  );
  const averageDifficulty = average(recent.map((result) => finiteNumber(result.difficulty?.stars)));
  const enduranceEvidence = average(
    recent.map((result) => {
      const durationFactor = Math.min(1, finiteNumber(result.durationMs) / 120000);
      return durationFactor * (finiteNumber(result.consistency) / 100) * 100;
    }),
  );
  const bestWpm = valid.reduce((best, result) => Math.max(best, finiteNumber(result.wpm)), 0);
  const bestCleanWpm = valid
    .filter(isCleanRun)
    .reduce((best, result) => Math.max(best, finiteNumber(result.wpm)), 0);

  const skills: PlayerSkill[] = [
    { id: "speed", label: "Speed", value: clampScore((bestWpm / 140) * 100) },
    { id: "accuracy", label: "Accuracy", value: clampScore(averageAccuracy) },
    { id: "consistency", label: "Consistency", value: clampScore(averageConsistency) },
    { id: "endurance", label: "Endurance", value: clampScore(enduranceEvidence) },
    { id: "technical", label: "Technical", value: clampScore((averageDifficulty / 6) * 100) },
    {
      id: "control",
      label: "Control",
      value: clampScore(100 - averageCorrectionDependency * 160),
    },
  ];
  const strongestSkill = skills.reduce((best, skill) => (skill.value > best.value ? skill : best));

  return {
    currentRating: weightTotal === 0 ? 0 : Math.round(weightedRating / weightTotal),
    peakRating: valid
      .filter(isRatedResult)
      .reduce((peak, result) => Math.max(peak, finiteNumber(result.performanceRating)), 0),
    bestWpm,
    bestCleanWpm,
    averageAccuracy: Math.round(averageAccuracy * 10) / 10,
    preferredMode:
      timeCount === 0 && wordCount === 0 ? null : timeCount >= wordCount ? "time" : "words",
    strongestSkill,
    skills,
  };
}

export function getAchievements(results: TestResult[]): Achievement[] {
  const valid = results.filter((result) => !result.failedReason);
  const bestWpm = valid.reduce((best, result) => Math.max(best, finiteNumber(result.wpm)), 0);
  const bestCombo = valid.reduce(
    (best, result) => Math.max(best, finiteNumber(result.maxCombo)),
    0,
  );
  const peakRating = valid.reduce(
    (best, result) => Math.max(best, finiteNumber(result.performanceRating)),
    0,
  );
  const hasPerfect = valid.some((result) => result.grade === "SS+" || result.grade === "SS");
  const hasCleanRun = valid.some(isCleanRun);

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
      description: "Finish a test with an SS or SS+ grade.",
      unlocked: hasPerfect,
    },
    {
      id: "clean-run",
      name: "No second chances",
      description: "Finish a run without an error or correction.",
      unlocked: hasCleanRun,
    },
    {
      id: "tp-400",
      name: "Performance class",
      description: "Reach 400 Typing Performance.",
      unlocked: peakRating >= 400,
    },
    {
      id: "combo-250",
      name: "Locked in",
      description: "Reach a 250-character clean streak.",
      unlocked: bestCombo >= 250,
    },
    {
      id: "practice-25",
      name: "Regular",
      description: "Complete 25 typing tests.",
      unlocked: results.length >= 25,
    },
  ];
}
