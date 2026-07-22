export type TestMode = "time" | "words";
export type TestStatus = "ready" | "running" | "paused" | "complete";

export interface TestConfiguration {
  mode: TestMode;
  value: number;
  punctuation: boolean;
  numbers: boolean;
}

export interface KeystrokeStats {
  correct: number;
  incorrect: number;
  currentCombo: number;
  maxCombo: number;
}

export interface TestMetrics {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctCharacters: number;
  incorrectCharacters: number;
  totalCharacters: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  totalKeystrokes: number;
  currentCombo: number;
  maxCombo: number;
}
