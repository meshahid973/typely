import { describe, expect, it } from "vitest";
import { defaultSettings, normalizeSettings } from "./appSettings";

describe("normalizeSettings", () => {
  it("returns safe defaults for invalid stored data", () => {
    expect(normalizeSettings(null)).toEqual(defaultSettings);
  });

  it("migrates the old shared sound volume", () => {
    const settings = normalizeSettings({ soundVolume: 0.6 });

    expect(settings.interfaceVolume).toBe(0.6);
    expect(settings.typingVolume).toBe(0.6);
  });

  it("clamps stored volumes", () => {
    const settings = normalizeSettings({ interfaceVolume: 4, typingVolume: -2 });

    expect(settings.interfaceVolume).toBe(1);
    expect(settings.typingVolume).toBe(0);
  });
});
