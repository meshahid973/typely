import type { TestMode } from "../features/practice/practice.types";

export type AppView = "practice" | "history" | "insights" | "settings";
export type AppTheme = "cream" | "night";
export type AppAccent = "pink" | "lime" | "lavender" | "sky";
export type CaretStyle = "bar" | "block";

export interface AppSettings {
  theme: AppTheme;
  accent: AppAccent;
  reducedMotion: boolean;
  liveStats: boolean;
  caretStyle: CaretStyle;
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
  correctCharacters: number;
  incorrectCharacters: number;
  totalCharacters: number;
  maxCombo: number;
  punctuation: boolean;
  numbers: boolean;
}
