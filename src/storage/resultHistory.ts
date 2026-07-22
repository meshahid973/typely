import type { TestResult } from "../app/app.types";
import type { Grade } from "../core/scoring/types";
import type {
  PerformanceSample,
  TestConfiguration,
  TestMode,
  TypingEvent,
  TypingEventType,
  WordJudgement,
  WordJudgementType,
} from "../core/typing/types";

export const maximumStoredResults = 50;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function readDate(value: unknown) {
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) {
    return value;
  }

  return new Date(0).toISOString();
}

function readMode(value: unknown): TestMode {
  return value === "words" ? "words" : "time";
}

function readGrade(value: unknown, accuracy: number): Grade {
  const grades: Grade[] = ["SS", "S", "A", "B", "C", "D"];

  if (grades.includes(value as Grade)) {
    return value as Grade;
  }

  if (accuracy === 100) return "SS";
  if (accuracy >= 98) return "S";
  if (accuracy >= 95) return "A";
  if (accuracy >= 90) return "B";
  if (accuracy >= 80) return "C";
  return "D";
}

function normalizeConfiguration(value: Record<string, unknown>): TestConfiguration {
  const stored = isObject(value.configuration) ? value.configuration : {};
  const mode = readMode(stored.mode ?? value.mode);
  const defaultValue = mode === "time" ? 30 : 25;

  return {
    mode,
    value: Math.max(1, readNumber(stored.value ?? value.modeValue, defaultValue)),
    punctuation: readBoolean(stored.punctuation ?? value.punctuation),
    numbers: readBoolean(stored.numbers ?? value.numbers),
    capitals: readBoolean(stored.capitals),
    noBackspace: readBoolean(stored.noBackspace),
    hidden: readBoolean(stored.hidden),
  };
}

function normalizePerformanceSamples(value: unknown): PerformanceSample[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isObject).map((sample) => ({
    elapsedMs: Math.max(0, readNumber(sample.elapsedMs)),
    wpm: Math.max(0, readNumber(sample.wpm)),
    rawWpm: Math.max(0, readNumber(sample.rawWpm)),
    accuracy: Math.max(0, Math.min(100, readNumber(sample.accuracy, 100))),
    combo: Math.max(0, readNumber(sample.combo)),
  }));
}

function normalizeWordJudgements(value: unknown): WordJudgement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const judgementTypes: WordJudgementType[] = ["perfect", "great", "good", "miss"];

  return value.filter(isObject).flatMap((judgement, index) => {
    if (!judgementTypes.includes(judgement.type as WordJudgementType)) {
      return [];
    }

    return [
      {
        id: readString(judgement.id, `judgement-${index}`),
        timestamp: Math.max(0, readNumber(judgement.timestamp)),
        wordIndex: Math.max(0, readNumber(judgement.wordIndex)),
        type: judgement.type as WordJudgementType,
        mistakeCount: Math.max(0, readNumber(judgement.mistakeCount)),
      },
    ];
  });
}

function normalizeTypingEvents(value: unknown): TypingEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const eventTypes: TypingEventType[] = ["character", "backspace", "space", "restart"];

  return value.filter(isObject).flatMap((event, index) => {
    if (!eventTypes.includes(event.type as TypingEventType)) {
      return [];
    }

    return [
      {
        id: readString(event.id, `event-${index}`),
        timestamp: Math.max(0, readNumber(event.timestamp)),
        type: event.type as TypingEventType,
        expectedCharacter: readNullableString(event.expectedCharacter),
        enteredCharacter: readNullableString(event.enteredCharacter),
        targetIndex: Math.max(0, readNumber(event.targetIndex)),
        wordIndex: Math.max(0, readNumber(event.wordIndex)),
        characterIndex: Math.max(0, readNumber(event.characterIndex)),
        correct: readBoolean(event.correct),
      },
    ];
  });
}

function normalizeResult(value: unknown, index: number): TestResult | null {
  if (!isObject(value)) {
    return null;
  }

  const wpm = Math.max(0, readNumber(value.wpm));
  const accuracy = Math.max(0, Math.min(100, readNumber(value.accuracy, 100)));
  const configuration = normalizeConfiguration(value);
  const completedAt = readDate(value.completedAt);
  const totalCharacters = Math.max(0, readNumber(value.totalCharacters));
  const correctCharacters = Math.max(0, readNumber(value.correctCharacters, totalCharacters));
  const incorrectCharacters = Math.max(
    0,
    readNumber(value.incorrectCharacters, totalCharacters - correctCharacters),
  );
  const correctKeystrokes = Math.max(0, readNumber(value.correctKeystrokes, correctCharacters));
  const incorrectKeystrokes = Math.max(
    0,
    readNumber(value.incorrectKeystrokes, incorrectCharacters),
  );

  return {
    id: readString(value.id, `legacy-result-${index}-${completedAt}`),
    completedAt,
    mode: configuration.mode,
    modeValue: configuration.value,
    durationMs: Math.max(0, readNumber(value.durationMs)),
    wpm,
    rawWpm: Math.max(0, readNumber(value.rawWpm, wpm)),
    accuracy,
    consistency: Math.max(0, Math.min(100, readNumber(value.consistency, 100))),
    correctCharacters,
    incorrectCharacters,
    totalCharacters,
    correctKeystrokes,
    incorrectKeystrokes,
    maxCombo: Math.max(0, readNumber(value.maxCombo)),
    score: Math.max(0, readNumber(value.score)),
    grade: readGrade(value.grade, accuracy),
    xpEarned: Math.max(0, readNumber(value.xpEarned)),
    personalBest: readBoolean(value.personalBest),
    modifierMultiplier: Math.max(1, readNumber(value.modifierMultiplier, 1)),
    configuration,
    wordJudgements: normalizeWordJudgements(value.wordJudgements),
    performanceSamples: normalizePerformanceSamples(value.performanceSamples),
    typingEvents: normalizeTypingEvents(value.typingEvents),
    target: readString(value.target),
  };
}

export function normalizeResults(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeResult)
    .filter((result): result is TestResult => result !== null)
    .slice(0, maximumStoredResults);
}
