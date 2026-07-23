import type {
  CadenceMetrics,
  ResultBadgeId,
  TestConfiguration,
  TestMetrics,
  TypingEvent,
  WordJudgement,
} from "../typing/types";
import type {
  DifficultyRating,
  Grade,
  JudgementCounts,
  PerformanceBreakdown,
  ScoreBreakdown,
  TestFailureReason,
} from "./types";

const scoringVersion = 2;
const qwertyFingerGroups = ["qaz", "wsx", "edc", "rfvtgb", "yhnujm", "ik", "ol", "p"];
const symbolPattern = /[^a-zA-Z0-9\s.,!?;:'"-]/g;
const punctuationPattern = /[.,!?;:'"-]/g;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value: number, digits = 0) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function isEntryEvent(event: TypingEvent) {
  return event.type === "character" || event.type === "space";
}

function getEntryEvents(events: TypingEvent[]) {
  return events.filter(isEntryEvent);
}

function getIntervals(events: TypingEvent[], maximumGapMs?: number) {
  const intervals: number[] = [];

  for (let index = 1; index < events.length; index += 1) {
    const interval = events[index].timestamp - events[index - 1].timestamp;

    if (!Number.isFinite(interval) || interval < 0) continue;
    if (maximumGapMs !== undefined && interval > maximumGapMs) continue;

    intervals.push(Math.max(16, interval));
  }

  return intervals;
}

function intervalConsistency(intervals: number[]) {
  if (intervals.length < 2) return 1;

  const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, value) => sum + (value - mean) ** 2, 0) / intervals.length;
  const deviation = Math.sqrt(variance);
  const coefficient = mean === 0 ? 0 : deviation / mean;
  return clamp(1 - coefficient * 1.2, 0, 1);
}

export function calculateCadence(events: TypingEvent[]): CadenceMetrics {
  const recent: TypingEvent[] = [];

  for (let index = events.length - 1; index >= 0 && recent.length < 12; index -= 1) {
    const event = events[index];
    if (isEntryEvent(event)) recent.push(event);
  }

  recent.reverse();
  const intervals = getIntervals(recent, 1200);

  if (intervals.length === 0) {
    return { energy: 0, speed: 0, consistency: 1, averageIntervalMs: 0 };
  }

  const averageIntervalMs =
    intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const consistency = intervalConsistency(intervals);
  const speed = clamp((520 - averageIntervalMs) / 420, 0, 1);
  const energy = clamp(speed * 0.68 + consistency * 0.32, 0, 1);

  return { energy, speed, consistency, averageIntervalMs };
}

export function calculateConsistency(events: TypingEvent[]) {
  const typedEvents = getEntryEvents(events);
  if (typedEvents.length < 4) return 100;

  // Pauses lower final WPM through elapsed time. They should not also destroy
  // finger-rhythm consistency after the player resumes typing.
  const intervals = getIntervals(typedEvents, 1800);
  if (intervals.length < 3) return 100;

  return Math.round(intervalConsistency(intervals) * 100);
}

export function countJudgements(judgements: WordJudgement[]): JudgementCounts {
  const counts: JudgementCounts = {
    perfect: 0,
    clean: 0,
    recovered: 0,
    miss: 0,
    burst: 0,
  };

  for (const judgement of judgements) counts[judgement.type] += 1;
  return counts;
}

export function calculateLongestCleanWordStreak(judgements: WordJudgement[]) {
  let current = 0;
  let longest = 0;

  for (const judgement of judgements) {
    if (judgement.type === "perfect" || judgement.type === "clean" || judgement.type === "burst") {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

export function calculateLongestAccuracyStreakMs(events: TypingEvent[], durationMs: number) {
  let streakStart = 0;
  let longest = 0;
  let hasEntry = false;

  for (const event of events) {
    if (!isEntryEvent(event)) continue;
    hasEntry = true;

    if (!event.correct) {
      longest = Math.max(longest, event.timestamp - streakStart);
      streakStart = event.timestamp;
    }
  }

  if (hasEntry) longest = Math.max(longest, Math.max(0, durationMs - streakStart));
  return Math.round(longest);
}

export function calculateModifierMultiplier(configuration: TestConfiguration) {
  let multiplier = 1;

  if (configuration.numbers) multiplier *= 1.05;
  if (configuration.punctuation) multiplier *= 1.08;
  if (configuration.capitals) multiplier *= 1.04;
  if (configuration.symbols) multiplier *= 1.12;
  if (configuration.noBackspace) multiplier *= 1.15;
  if (configuration.hidden) multiplier *= 1.2;
  if (configuration.focusMode) multiplier *= 1.03;
  if (configuration.suddenDeath) multiplier *= 1.18;
  if (configuration.accuracyTarget !== null) {
    multiplier *= 1 + clamp(configuration.accuracyTarget - 90, 0, 10) * 0.012;
  }
  if (configuration.minimumPace !== null) {
    multiplier *= 1 + clamp(configuration.minimumPace, 0, 200) / 2000;
  }

  return round(multiplier, 3);
}

function fingerFor(character: string) {
  const lower = character.toLowerCase();
  return qwertyFingerGroups.findIndex((group) => group.includes(lower));
}

function sameFingerRatio(text: string) {
  const compact = text.toLowerCase().replace(/[^a-z]/g, "");
  if (compact.length < 2) return 0;

  let sameFingerPairs = 0;
  let pairs = 0;

  for (let index = 1; index < compact.length; index += 1) {
    const previousFinger = fingerFor(compact[index - 1]);
    const currentFinger = fingerFor(compact[index]);
    if (previousFinger < 0 || currentFinger < 0) continue;

    pairs += 1;
    if (previousFinger === currentFinger) sameFingerPairs += 1;
  }

  return pairs === 0 ? 0 : sameFingerPairs / pairs;
}

export function calculateTextDifficulty(
  target: string,
  configuration: TestConfiguration,
): DifficultyRating {
  const words = target.trim().split(/\s+/).filter(Boolean);
  const letters = target.match(/[a-zA-Z]/g)?.length ?? 0;
  const numbers = target.match(/[0-9]/g)?.length ?? 0;
  const punctuation = target.match(punctuationPattern)?.length ?? 0;
  const symbols = target.match(symbolPattern)?.length ?? 0;
  const uppercase = target.match(/[A-Z]/g)?.length ?? 0;
  const meaningfulLength = Math.max(1, target.replace(/\s/g, "").length);
  const averageWordLength = words.length === 0 ? 0 : letters / words.length;
  const fingerPressure = sameFingerRatio(target);
  const endurance = clamp(target.length / 650, 0, 1);

  let stars =
    0.85 +
    averageWordLength * 0.18 +
    fingerPressure * 1.7 +
    (punctuation / meaningfulLength) * 4.8 +
    (numbers / meaningfulLength) * 4 +
    (symbols / meaningfulLength) * 7 +
    (uppercase / meaningfulLength) * 2.2 +
    endurance * 0.9;

  if (configuration.noBackspace) stars += 0.45;
  if (configuration.hidden) stars += 0.55;
  if (configuration.suddenDeath) stars += 0.5;
  if (configuration.accuracyTarget !== null) {
    stars += clamp(configuration.accuracyTarget - 94, 0, 6) * 0.08;
  }
  if (configuration.minimumPace !== null) {
    stars += clamp(configuration.minimumPace - 40, 0, 120) / 240;
  }

  stars = round(clamp(stars, 1, 7), 1);

  const tags: string[] = [];
  if (averageWordLength >= 5.2) tags.push("long words");
  if (fingerPressure >= 0.18) tags.push("same-finger pressure");
  if (punctuation / meaningfulLength >= 0.035) tags.push("punctuation");
  if (numbers > 0) tags.push("numbers");
  if (symbols > 0) tags.push("symbols");
  if (uppercase / meaningfulLength >= 0.025) tags.push("capitalisation");
  if (target.length >= 550) tags.push("endurance");
  if (tags.length === 0) tags.push("standard");

  const label =
    stars >= 5.5 ? "expert" : stars >= 4 ? "technical" : stars >= 2.5 ? "advanced" : "standard";
  return { stars, label, tags: tags.slice(0, 3) };
}

export function calculatePerformanceRating(options: {
  metrics: TestMetrics;
  durationMs: number;
  difficulty: DifficultyRating;
  correctionDependency: number;
  longestCleanStreak: number;
}) {
  const { metrics, durationMs, difficulty, correctionDependency, longestCleanStreak } = options;
  if (metrics.wpm <= 0 || durationMs <= 0) return 0;

  const speed = metrics.wpm ** 1.18 * 1.95;
  const accuracyFactor = (clamp(metrics.accuracy, 0, 100) / 100) ** 8;
  const consistencyFactor = 0.55 + (clamp(metrics.consistency, 0, 100) / 100) * 0.45;
  const controlFactor =
    0.72 + clamp(metrics.rawWpm <= 0 ? 1 : metrics.wpm / metrics.rawWpm, 0, 1) * 0.28;
  const correctionFactor = 1 - Math.min(0.28, clamp(correctionDependency, 0, 1) * 0.55);
  const difficultyFactor = 0.85 + difficulty.stars * 0.06;
  const durationFactor = 0.78 + clamp(durationMs / 60000, 0, 1) * 0.22;
  const streakFactor = 1 + Math.min(0.08, (longestCleanStreak / 500) * 0.08);

  const rating =
    speed *
    accuracyFactor *
    consistencyFactor *
    controlFactor *
    correctionFactor *
    difficultyFactor *
    durationFactor *
    streakFactor;

  return Number.isFinite(rating) ? Math.max(0, Math.round(rating)) : 0;
}

export function calculateGrade(options: {
  metrics: TestMetrics;
  judgements: WordJudgement[];
  failureReason: TestFailureReason;
}): Grade {
  const { metrics, judgements, failureReason } = options;
  const counts = countJudgements(judgements);

  if (failureReason) return "D";
  if (
    metrics.accuracy === 100 &&
    metrics.consistency >= 95 &&
    metrics.incorrectKeystrokes === 0 &&
    counts.miss === 0
  ) {
    return "SS+";
  }
  if (metrics.accuracy >= 99.5 && metrics.consistency >= 90 && counts.miss === 0) return "SS";
  if (metrics.accuracy >= 98 && metrics.consistency >= 80) return "S";
  if (metrics.accuracy >= 95) return "A";
  if (metrics.accuracy >= 90) return "B";
  if (metrics.accuracy >= 80) return "C";
  return "D";
}

export function calculateBadges(options: {
  metrics: TestMetrics;
  judgements: WordJudgement[];
  backspaces: number;
  personalBest: boolean;
  performanceSamples: Array<{ accuracy: number; wpm: number }>;
  failureReason: TestFailureReason;
}) {
  const { metrics, judgements, backspaces, personalBest, performanceSamples, failureReason } =
    options;
  const badges: ResultBadgeId[] = [];
  const counts = countJudgements(judgements);

  if (personalBest) badges.push("personal-best");
  if (!failureReason && metrics.incorrectCharacters === 0 && counts.miss === 0)
    badges.push("full-combo");
  if (!failureReason && metrics.incorrectKeystrokes === 0 && backspaces === 0)
    badges.push("clean-run");

  const firstThird = performanceSamples.slice(
    0,
    Math.max(1, Math.ceil(performanceSamples.length / 3)),
  );
  const finalThird = performanceSamples.slice(
    -Math.max(1, Math.ceil(performanceSamples.length / 3)),
  );
  const openingAccuracy =
    firstThird.reduce((sum, sample) => sum + sample.accuracy, 0) / Math.max(1, firstThird.length);
  const closingAccuracy =
    finalThird.reduce((sum, sample) => sum + sample.accuracy, 0) / Math.max(1, finalThird.length);
  const openingWpm =
    firstThird.reduce((sum, sample) => sum + sample.wpm, 0) / Math.max(1, firstThird.length);
  const closingWpm =
    finalThird.reduce((sum, sample) => sum + sample.wpm, 0) / Math.max(1, finalThird.length);

  if (
    !failureReason &&
    performanceSamples.length >= 6 &&
    openingAccuracy < 96 &&
    closingAccuracy >= 98 &&
    closingWpm >= openingWpm
  ) {
    badges.push("comeback");
  }

  return badges;
}

export function calculatePerformance(options: {
  metrics: TestMetrics;
  judgements: WordJudgement[];
  configuration: TestConfiguration;
  durationMs: number;
  target: string;
  backspaces: number;
  personalBest: boolean;
  performanceSamples: Array<{ accuracy: number; wpm: number }>;
  events: TypingEvent[];
  failureReason: TestFailureReason;
}): PerformanceBreakdown {
  const {
    metrics,
    judgements,
    configuration,
    durationMs,
    target,
    backspaces,
    personalBest,
    performanceSamples,
    events,
    failureReason,
  } = options;
  const correctionDependency =
    metrics.totalKeystrokes === 0 ? 0 : clamp(backspaces / metrics.totalKeystrokes, 0, 1);
  const errorRate =
    metrics.totalKeystrokes === 0
      ? 0
      : clamp(metrics.incorrectKeystrokes / metrics.totalKeystrokes, 0, 1);
  const difficulty = calculateTextDifficulty(target, configuration);
  const longestCleanStreak = metrics.maxCombo;
  const longestCleanWordStreak = calculateLongestCleanWordStreak(judgements);
  const longestAccuracyStreakMs = calculateLongestAccuracyStreakMs(events, durationMs);
  const performanceRating = calculatePerformanceRating({
    metrics,
    durationMs,
    difficulty,
    correctionDependency,
    longestCleanStreak,
  });
  const grade = calculateGrade({ metrics, judgements, failureReason });
  const badges = calculateBadges({
    metrics,
    judgements,
    backspaces,
    personalBest,
    performanceSamples,
    failureReason,
  });

  return {
    scoringVersion,
    performanceRating,
    difficulty,
    grade,
    badges,
    correctionDependency,
    errorRate,
    longestCleanStreak,
    longestCleanWordStreak,
    longestAccuracyStreakMs,
  };
}

export function calculateScore(
  metrics: TestMetrics,
  judgements: WordJudgement[],
  configuration: TestConfiguration,
  performanceRating: number,
): ScoreBreakdown {
  const counts = countJudgements(judgements);
  const baseScore =
    metrics.correctCharacters * 100 +
    counts.perfect * 60 +
    counts.clean * 35 +
    counts.recovered * 15 +
    counts.burst * 75 +
    metrics.maxCombo * 5;
  const accuracyMultiplier = (clamp(metrics.accuracy, 0, 100) / 100) ** 3;
  const consistencyMultiplier = 0.75 + clamp(metrics.consistency, 0, 100) / 400;
  const modifierMultiplier = calculateModifierMultiplier(configuration);
  const calculatedScore =
    baseScore * accuracyMultiplier * consistencyMultiplier * modifierMultiplier;
  const finalScore = Number.isFinite(calculatedScore)
    ? Math.max(0, Math.round(calculatedScore))
    : 0;
  const xpEarned = Math.max(
    1,
    Math.min(2500, Math.round((finalScore + performanceRating * 45) / 160)),
  );

  return {
    baseScore: Math.round(baseScore),
    accuracyMultiplier,
    consistencyMultiplier,
    modifierMultiplier,
    finalScore,
    xpEarned,
  };
}
