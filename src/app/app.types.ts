import type { SoundPackId } from "../audio/audioManifest";
import type { DifficultyRating, Grade, TestFailureReason } from "../core/scoring/types";
import type { SessionAnalysis } from "../core/typing/sessionAnalysis";
import type {
  PerformanceSample,
  ResultBadgeId,
  TestConfiguration,
  TestMode,
  TypingEvent,
  WordJudgement,
} from "../core/typing/types";
import type { PlayerProfile } from "../features/progression/types";

export type AppView = "practice" | "history" | "insights";
export type AppTheme = "cream" | "night";
export type AppAccent = "pink" | "lime" | "lavender" | "sky";
export type CaretStyle = "bar" | "block" | "underline";
export type TextFocusStyle = "standard" | "fade-complete" | "spotlight";
export type TrailIntensity = "off" | "subtle" | "full";
export type ResultMotion = "calm" | "full";
export type BackgroundTreatment = "plain" | "paper" | "glass";

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
  textFocusStyle: TextFocusStyle;
  trailIntensity: TrailIntensity;
  resultMotion: ResultMotion;
  backgroundTreatment: BackgroundTreatment;
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
  backspaces: number;
  maxCombo: number;
  longestCleanStreak: number;
  longestCleanWordStreak: number;
  longestAccuracyStreakMs: number;
  correctionDependency: number;
  errorRate: number;
  performanceRating: number;
  difficulty: DifficultyRating;
  score: number;
  grade: Grade;
  badges: ResultBadgeId[];
  failedReason: TestFailureReason;
  scoringVersion: number;
  xpEarned: number;
  personalBest: boolean;
  modifierMultiplier: number;
  configuration: TestConfiguration;
  wordJudgements: WordJudgement[];
  performanceSamples: PerformanceSample[];
  typingEvents: TypingEvent[];
  target: string;
  analysis: SessionAnalysis;
  comparison: {
    resultId: string;
    wpmDelta: number;
    accuracyDelta: number;
    consistencyDelta: number;
    performanceDelta: number;
  } | null;
}

export type { PlayerProfile };
