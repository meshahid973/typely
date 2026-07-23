import type { TestResult } from "../app/app.types";
import type { DifficultyRating, Grade, TestFailureReason } from "../core/scoring/types";
import type { SessionAnalysis } from "../core/typing/sessionAnalysis";
import type {
  PerformanceSample,
  ResultBadgeId,
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

function readNullableNumber(value: unknown, minimum: number, maximum: number) {
  if (value === null || value === undefined) return null;
  const parsed = readNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, Math.round(parsed))) : null;
}

function readDate(value: unknown) {
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return value;
  return new Date(0).toISOString();
}

function readMode(value: unknown): TestMode {
  return value === "words" ? "words" : "time";
}

function readGrade(value: unknown, accuracy: number): Grade {
  const grades: Grade[] = ["SS+", "SS", "S", "A", "B", "C", "D"];
  if (grades.includes(value as Grade)) return value as Grade;
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
    symbols: readBoolean(stored.symbols),
    noBackspace: readBoolean(stored.noBackspace),
    hidden: readBoolean(stored.hidden),
    focusMode: readBoolean(stored.focusMode),
    noLiveWpm: readBoolean(stored.noLiveWpm),
    suddenDeath: readBoolean(stored.suddenDeath),
    accuracyTarget: readNullableNumber(stored.accuracyTarget, 90, 100),
    minimumPace: readNullableNumber(stored.minimumPace, 20, 200),
    challengeId: readNullableString(stored.challengeId),
    ghostRace: readBoolean(stored.ghostRace),
  };
}

function normalizePerformanceSamples(value: unknown): PerformanceSample[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isObject).map((sample) => ({
    elapsedMs: Math.max(0, readNumber(sample.elapsedMs)),
    wpm: Math.max(0, readNumber(sample.wpm)),
    rawWpm: Math.max(0, readNumber(sample.rawWpm)),
    accuracy: Math.max(0, Math.min(100, readNumber(sample.accuracy, 100))),
    combo: Math.max(0, readNumber(sample.combo)),
  }));
}

function normalizeJudgementType(value: unknown): WordJudgementType | null {
  if (
    value === "perfect" ||
    value === "clean" ||
    value === "recovered" ||
    value === "miss" ||
    value === "burst"
  ) {
    return value;
  }
  if (value === "great") return "clean";
  if (value === "good") return "recovered";
  return null;
}

function normalizeWordJudgements(value: unknown): WordJudgement[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isObject).flatMap((judgement, index) => {
    const type = normalizeJudgementType(judgement.type);
    if (!type) return [];

    return [
      {
        id: readString(judgement.id, `judgement-${index}`),
        timestamp: Math.max(0, readNumber(judgement.timestamp)),
        wordIndex: Math.max(0, readNumber(judgement.wordIndex)),
        type,
        mistakeCount: Math.max(0, readNumber(judgement.mistakeCount)),
        backspaceCount: Math.max(0, readNumber(judgement.backspaceCount)),
        durationMs: Math.max(0, readNumber(judgement.durationMs)),
        averageIntervalMs: Math.max(0, readNumber(judgement.averageIntervalMs)),
        wpm: Math.max(0, readNumber(judgement.wpm)),
      },
    ];
  });
}

function normalizeTypingEvents(value: unknown): TypingEvent[] {
  if (!Array.isArray(value)) return [];

  const eventTypes: TypingEventType[] = ["character", "backspace", "space", "restart"];

  return value.filter(isObject).flatMap((event, index) => {
    if (!eventTypes.includes(event.type as TypingEventType)) return [];

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

function normalizeDifficulty(value: unknown): DifficultyRating {
  const stored = isObject(value) ? value : {};
  const label =
    stored.label === "advanced" || stored.label === "technical" || stored.label === "expert"
      ? stored.label
      : "standard";
  const tags = Array.isArray(stored.tags)
    ? stored.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 3)
    : ["legacy"];

  return {
    stars: Math.max(1, Math.min(7, readNumber(stored.stars, 1))),
    label,
    tags: tags.length > 0 ? tags : ["legacy"],
  };
}

function normalizeBadges(value: unknown): ResultBadgeId[] {
  if (!Array.isArray(value)) return [];
  const allowed: ResultBadgeId[] = ["personal-best", "full-combo", "clean-run", "comeback"];
  return value.filter((badge): badge is ResultBadgeId => allowed.includes(badge as ResultBadgeId));
}

function readFailureReason(value: unknown): TestFailureReason {
  if (value === "sudden-death" || value === "minimum-pace" || value === "accuracy-challenge") {
    return value;
  }
  return null;
}

function normalizeAnalysis(value: unknown): SessionAnalysis {
  const stored = isObject(value) ? value : {};
  const weakKeys = Array.isArray(stored.weakKeys)
    ? stored.weakKeys
        .filter(isObject)
        .map((item) => ({
          key: readString(item.key),
          attempts: Math.max(0, readNumber(item.attempts)),
          mistakes: Math.max(0, readNumber(item.mistakes)),
          accuracy: Math.max(0, Math.min(100, readNumber(item.accuracy, 100))),
          averageIntervalMs: Math.max(0, readNumber(item.averageIntervalMs)),
        }))
        .filter((item) => item.key.length > 0)
        .slice(0, 5)
    : [];
  const slowBigrams = Array.isArray(stored.slowBigrams)
    ? stored.slowBigrams
        .filter(isObject)
        .map((item) => ({
          sequence: readString(item.sequence),
          attempts: Math.max(0, readNumber(item.attempts)),
          averageIntervalMs: Math.max(0, readNumber(item.averageIntervalMs)),
        }))
        .filter((item) => item.sequence.length > 0)
        .slice(0, 5)
    : [];
  const slowWords = Array.isArray(stored.slowWords)
    ? stored.slowWords
        .filter(isObject)
        .flatMap((item) => {
          const judgement = normalizeJudgementType(item.judgement);
          if (!judgement) return [];
          return [
            {
              word: readString(item.word),
              wordIndex: Math.max(0, readNumber(item.wordIndex)),
              wpm: Math.max(0, readNumber(item.wpm)),
              judgement,
            },
          ];
        })
        .slice(0, 5)
    : [];

  return {
    weakKeys,
    slowBigrams,
    slowWords,
    fastestWpm: Math.max(0, readNumber(stored.fastestWpm)),
    firstMistakeAtMs:
      stored.firstMistakeAtMs === null || stored.firstMistakeAtMs === undefined
        ? null
        : Math.max(0, readNumber(stored.firstMistakeAtMs)),
  };
}

function normalizeComparison(value: unknown): TestResult["comparison"] {
  if (!isObject(value)) return null;
  const resultId = readString(value.resultId);
  if (!resultId) return null;

  return {
    resultId,
    wpmDelta: readNumber(value.wpmDelta),
    accuracyDelta: readNumber(value.accuracyDelta),
    consistencyDelta: readNumber(value.consistencyDelta),
    performanceDelta: readNumber(value.performanceDelta),
  };
}

function normalizeResult(value: unknown, index: number): TestResult | null {
  if (!isObject(value)) return null;

  const wpm = Math.max(0, readNumber(value.wpm));
  const accuracy = Math.max(0, Math.min(100, readNumber(value.accuracy, 100)));
  const configuration = normalizeConfiguration(value);
  const completedAt = readDate(value.completedAt);
  const durationMs = Math.max(0, readNumber(value.durationMs));
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
  const backspaces = Math.max(0, readNumber(value.backspaces));
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const personalBest = readBoolean(value.personalBest);
  const badges = normalizeBadges(value.badges);

  if (personalBest && !badges.includes("personal-best")) badges.unshift("personal-best");

  return {
    id: readString(value.id, `legacy-result-${index}-${completedAt}`),
    completedAt,
    mode: configuration.mode,
    modeValue: configuration.value,
    durationMs,
    wpm,
    rawWpm: Math.max(0, readNumber(value.rawWpm, wpm)),
    accuracy,
    consistency: Math.max(0, Math.min(100, readNumber(value.consistency, 100))),
    correctCharacters,
    incorrectCharacters,
    totalCharacters,
    correctKeystrokes,
    incorrectKeystrokes,
    backspaces,
    maxCombo: Math.max(0, readNumber(value.maxCombo)),
    longestCleanStreak: Math.max(
      0,
      readNumber(value.longestCleanStreak, readNumber(value.maxCombo)),
    ),
    longestCleanWordStreak: Math.max(0, readNumber(value.longestCleanWordStreak)),
    longestAccuracyStreakMs: Math.max(
      0,
      readNumber(value.longestAccuracyStreakMs, accuracy === 100 ? durationMs : 0),
    ),
    correctionDependency: Math.max(
      0,
      Math.min(
        1,
        readNumber(
          value.correctionDependency,
          totalKeystrokes === 0 ? 0 : backspaces / totalKeystrokes,
        ),
      ),
    ),
    errorRate: Math.max(
      0,
      Math.min(
        1,
        readNumber(
          value.errorRate,
          totalKeystrokes === 0 ? 0 : incorrectKeystrokes / totalKeystrokes,
        ),
      ),
    ),
    performanceRating: Math.max(0, readNumber(value.performanceRating)),
    difficulty: normalizeDifficulty(value.difficulty),
    score: Math.max(0, readNumber(value.score)),
    grade: readGrade(value.grade, accuracy),
    badges,
    failedReason: readFailureReason(value.failedReason),
    scoringVersion: Math.max(1, readNumber(value.scoringVersion, 1)),
    xpEarned: Math.max(0, readNumber(value.xpEarned)),
    personalBest,
    modifierMultiplier: Math.max(1, readNumber(value.modifierMultiplier, 1)),
    configuration,
    wordJudgements: normalizeWordJudgements(value.wordJudgements),
    performanceSamples: normalizePerformanceSamples(value.performanceSamples),
    typingEvents: normalizeTypingEvents(value.typingEvents),
    target: readString(value.target),
    analysis: normalizeAnalysis(value.analysis),
    comparison: normalizeComparison(value.comparison),
  };
}

export function normalizeResults(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeResult)
    .filter((result): result is TestResult => result !== null)
    .slice(0, maximumStoredResults);
}
