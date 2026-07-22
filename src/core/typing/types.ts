export type TestMode = "time" | "words";
export type TestStatus = "ready" | "running" | "paused" | "complete";
export type TypingEventType = "character" | "backspace" | "space" | "restart";
export type WordJudgementType = "perfect" | "great" | "good" | "miss";

export interface TestConfiguration {
  mode: TestMode;
  value: number;
  punctuation: boolean;
  numbers: boolean;
  capitals: boolean;
  noBackspace: boolean;
  hidden: boolean;
}

export interface TargetPosition {
  index: number;
  wordIndex: number;
  characterIndex: number;
  expectedCharacter: string;
}

export interface TypingEvent {
  id: string;
  timestamp: number;
  type: TypingEventType;
  expectedCharacter: string | null;
  enteredCharacter: string | null;
  targetIndex: number;
  wordIndex: number;
  characterIndex: number;
  correct: boolean;
}

export interface TypingSessionStats {
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  totalKeystrokes: number;
  backspaces: number;
  currentCombo: number;
  maxCombo: number;
}

export interface WordJudgement {
  id: string;
  timestamp: number;
  wordIndex: number;
  type: WordJudgementType;
  mistakeCount: number;
}

export interface CadenceMetrics {
  energy: number;
  speed: number;
  consistency: number;
  averageIntervalMs: number;
}

export interface PerformanceSample {
  elapsedMs: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  combo: number;
}

export interface TypingFeedback {
  sequence: number;
  impact: "none" | "correct" | "incorrect" | "backspace";
  started: boolean;
  wordJudgement: WordJudgement | null;
  comboMilestone: number | null;
  comboBreak: number | null;
  comboRecord: number | null;
}

export interface TestMetrics {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctCharacters: number;
  incorrectCharacters: number;
  totalCharacters: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  totalKeystrokes: number;
  currentCombo: number;
  maxCombo: number;
}
