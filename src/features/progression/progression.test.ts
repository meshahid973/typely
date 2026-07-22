import { expect, it } from "vitest";
import { calculatePlayerLevel } from "./progression";

it("keeps a new player at level one", () => {
  expect(calculatePlayerLevel(0)).toMatchObject({ level: 1, currentXp: 0, requiredXp: 140 });
});

it("carries extra xp into later levels", () => {
  expect(calculatePlayerLevel(450)).toMatchObject({ level: 3, currentXp: 30, requiredXp: 420 });
});
