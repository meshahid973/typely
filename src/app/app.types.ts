import type { SoundPackId } from "../audio/audioManifest";
import type { Grade } from "../core/scoring/types";
import type {
  PerformanceSample,
  TestConfiguration,
  TestMode,
  TypingEvent,
  WordJudgement,
} from "../core/typing/types";
import type { PlayerProfile } from "../features/progression/types";

export type AppView = "practice" | "history" | "insights";
export type AppTheme = "cream" | "night";
export type AppAccent = "pink" | "lime" | "lavender" | "sky";
export type CaretStyle = "bar" | "block";

export interface AppSettings {
  theme: AppTheme;
  accent: AppAccent;
  reducedMotion: boolean;
  liveStats: boolean;
  caretStyle: CaretStyle;
  soundEnabled: boolean;
  soundPack: SoundPackId;
  interfaceVolume: number;
  typingVolume: number;
  judgementsEnabled: boolean;
  cadenceEffects: boolean;
  highContrast: boolean;
}

export interface TestResult {
  id: string;
  completedAt: string;
  mode: TestMode;
  modeValue: number;
  durationMs: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctCharacters: number;
  incorrectCharacters: number;
  totalCharacters: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  maxCombo: number;
  score: number;
  grade: Grade;
  xpEarned: number;
  personalBest: boolean;
  modifierMultiplier: number;
  configuration: TestConfiguration;
  wordJudgements: WordJudgement[];
  performanceSamples: PerformanceSample[];
  typingEvents: TypingEvent[];
  target: string;
}

export type { PlayerProfile };
