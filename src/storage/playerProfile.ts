import type { TestResult } from "../app/app.types";
import type { AvatarStyle, PlayerProfile } from "../features/progression/types";

export const defaultProfile: PlayerProfile = {
  name: "Player",
  avatarStyle: "blush",
  totalXp: 0,
  testsCompleted: 0,
  totalTypedCharacters: 0,
  practiceTimeMs: 0,
  createdAt: new Date().toISOString(),
};

const avatarStyles: AvatarStyle[] = ["blush", "lime", "lavender", "sky"];

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export function createProfileFromResults(results: TestResult[]): PlayerProfile {
  return {
    ...defaultProfile,
    totalXp: results.reduce((sum, result) => sum + result.xpEarned, 0),
    testsCompleted: results.length,
    totalTypedCharacters: results.reduce((sum, result) => sum + result.totalCharacters, 0),
    practiceTimeMs: results.reduce((sum, result) => sum + result.durationMs, 0),
  };
}

export function normalizeProfile(value: unknown, results: TestResult[] = []): PlayerProfile {
  if (typeof value !== "object" || value === null) {
    return createProfileFromResults(results);
  }

  const stored = value as Record<string, unknown>;
  const fallback = createProfileFromResults(results);
  const avatarStyle = avatarStyles.includes(stored.avatarStyle as AvatarStyle)
    ? (stored.avatarStyle as AvatarStyle)
    : fallback.avatarStyle;
  const createdAt =
    typeof stored.createdAt === "string" && Number.isFinite(Date.parse(stored.createdAt))
      ? stored.createdAt
      : fallback.createdAt;

  return {
    name: readString(stored.name, fallback.name).slice(0, 24),
    avatarStyle,
    totalXp: Math.max(0, readNumber(stored.totalXp, fallback.totalXp)),
    testsCompleted: Math.max(0, readNumber(stored.testsCompleted, fallback.testsCompleted)),
    totalTypedCharacters: Math.max(
      0,
      readNumber(stored.totalTypedCharacters, fallback.totalTypedCharacters),
    ),
    practiceTimeMs: Math.max(0, readNumber(stored.practiceTimeMs, fallback.practiceTimeMs)),
    createdAt,
  };
}
