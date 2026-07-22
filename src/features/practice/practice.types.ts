export type TestMode = "time" | "words";
export type TestStatus = "ready" | "running" | "paused" | "complete";

export interface TestConfiguration {
  mode: TestMode;
  value: number;
  punctuation: boolean;
  numbers: boolean;
}

export interface TestMetrics {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctCharacters: number;
  incorrectCharacters: number;
  totalCharacters: number;
  currentCombo: number;
  maxCombo: number;
}
