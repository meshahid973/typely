import { describe, expect, it } from "vitest";
import { compareVersions, isNewerVersion } from "./version";

describe("version comparison", () => {
  it("compares stable versions", () => {
    expect(isNewerVersion("v0.4.1", "0.4.0")).toBe(true);
    expect(isNewerVersion("0.4.0", "v0.4.0")).toBe(false);
    expect(compareVersions("1.0.0", "0.9.9")).toBe(1);
  });

  it("handles missing patch values", () => {
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
  });

  it("orders prereleases below stable versions", () => {
    expect(compareVersions("1.0.0-beta.2", "1.0.0-beta.1")).toBe(1);
    expect(compareVersions("1.0.0-beta.1", "1.0.0")).toBe(-1);
  });
});
