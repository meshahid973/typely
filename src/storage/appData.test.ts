import { expect, it } from "vitest";
import { parseAppDataBackup } from "./appData";

it("normalizes an old backup safely", () => {
  const backup = parseAppDataBackup({
    results: [],
    settings: { theme: "night" },
    profile: { name: "Ayyan" },
  });

  expect(backup.settings.theme).toBe("night");
  expect(backup.profile.name).toBe("Ayyan");
  expect(backup.results).toEqual([]);
});

it("rejects invalid backup content", () => {
  expect(() => parseAppDataBackup("bad")).toThrow();
});

it("rejects backups from a newer schema", () => {
  expect(() => parseAppDataBackup({ version: 999, results: [] })).toThrow();
});
