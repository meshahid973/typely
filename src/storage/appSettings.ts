import type { AppSettings } from "../app/app.types";
import type { SoundPackId } from "../audio/audioManifest";

export const defaultSettings: AppSettings = {
  theme: "cream",
  accent: "pink",
  reducedMotion: false,
  liveStats: true,
  caretStyle: "bar",
  soundEnabled: true,
  soundPack: "clean-taps",
  interfaceVolume: 0.2,
  typingVolume: 0.22,
  judgementsEnabled: true,
  cadenceEffects: true,
  highContrast: false,
  textFocusStyle: "standard",
  trailIntensity: "subtle",
  resultMotion: "full",
  backgroundTreatment: "plain",
};

export interface StoredSettings extends Partial<AppSettings> {
  soundVolume?: number;
}

const soundPackIds: SoundPackId[] = [
  "soft-mechanical",
  "clean-taps",
  "digital",
  "typewriter",
  "muted",
  "silent",
];

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readVolume(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

export function normalizeSettings(value: StoredSettings | unknown): AppSettings {
  const stored = typeof value === "object" && value !== null ? (value as StoredSettings) : {};
  const oldVolume = stored.soundVolume;

  return {
    theme: stored.theme === "night" ? "night" : "cream",
    accent:
      stored.accent === "lime" || stored.accent === "lavender" || stored.accent === "sky"
        ? stored.accent
        : "pink",
    reducedMotion: readBoolean(stored.reducedMotion, defaultSettings.reducedMotion),
    liveStats: readBoolean(stored.liveStats, defaultSettings.liveStats),
    caretStyle:
      stored.caretStyle === "block" || stored.caretStyle === "underline"
        ? stored.caretStyle
        : "bar",
    soundEnabled: readBoolean(stored.soundEnabled, defaultSettings.soundEnabled),
    soundPack: soundPackIds.includes(stored.soundPack as SoundPackId)
      ? (stored.soundPack as SoundPackId)
      : defaultSettings.soundPack,
    interfaceVolume: readVolume(
      stored.interfaceVolume ?? oldVolume,
      defaultSettings.interfaceVolume,
    ),
    typingVolume: readVolume(stored.typingVolume ?? oldVolume, defaultSettings.typingVolume),
    judgementsEnabled: readBoolean(stored.judgementsEnabled, defaultSettings.judgementsEnabled),
    cadenceEffects: readBoolean(stored.cadenceEffects, defaultSettings.cadenceEffects),
    highContrast: readBoolean(stored.highContrast, defaultSettings.highContrast),
    textFocusStyle:
      stored.textFocusStyle === "fade-complete" || stored.textFocusStyle === "spotlight"
        ? stored.textFocusStyle
        : "standard",
    trailIntensity:
      stored.trailIntensity === "off" || stored.trailIntensity === "full"
        ? stored.trailIntensity
        : "subtle",
    resultMotion: stored.resultMotion === "calm" ? "calm" : "full",
    backgroundTreatment:
      stored.backgroundTreatment === "paper" || stored.backgroundTreatment === "glass"
        ? stored.backgroundTreatment
        : "plain",
  };
}
