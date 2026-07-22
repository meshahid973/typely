import type { AppSettings, PlayerProfile, TestResult } from "../app/app.types";
import { normalizeSettings } from "./appSettings";
import { normalizeProfile } from "./playerProfile";
import { normalizeResults } from "./resultHistory";

export const appDataVersion = 3;

export interface AppDataBackup {
  version: number;
  exportedAt: string;
  settings: AppSettings;
  profile: PlayerProfile;
  results: TestResult[];
}

export function createAppDataBackup(
  settings: AppSettings,
  profile: PlayerProfile,
  results: TestResult[],
): AppDataBackup {
  return {
    version: appDataVersion,
    exportedAt: new Date().toISOString(),
    settings,
    profile,
    results,
  };
}

export function parseAppDataBackup(value: unknown): AppDataBackup {
  if (typeof value !== "object" || value === null) {
    throw new Error("The selected file is not a Typely backup.");
  }

  const stored = value as Record<string, unknown>;
  const version =
    typeof stored.version === "number" && Number.isFinite(stored.version)
      ? Math.max(1, Math.floor(stored.version))
      : 1;

  if (version > appDataVersion) {
    throw new Error("This backup was created by a newer Typely version.");
  }

  const results = normalizeResults(stored.results);

  return {
    version,
    exportedAt:
      typeof stored.exportedAt === "string" && Number.isFinite(Date.parse(stored.exportedAt))
        ? stored.exportedAt
        : new Date().toISOString(),
    settings: normalizeSettings(stored.settings),
    profile: normalizeProfile(stored.profile, results),
    results,
  };
}

export function downloadAppDataBackup(backup: AppDataBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = backup.exportedAt.slice(0, 10);

  anchor.href = url;
  anchor.download = `typely-backup-${date}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
