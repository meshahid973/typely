import type { PerformanceSample, TypingEvent, WordJudgement } from "./types";
import { createWordRanges } from "./wordJudgements";

export interface KeyInsight {
  key: string;
  attempts: number;
  mistakes: number;
  accuracy: number;
  averageIntervalMs: number;
}

export interface BigramInsight {
  sequence: string;
  attempts: number;
  averageIntervalMs: number;
}

export interface WordInsight {
  word: string;
  wordIndex: number;
  wpm: number;
  judgement: WordJudgement["type"];
}

export interface SessionAnalysis {
  weakKeys: KeyInsight[];
  slowBigrams: BigramInsight[];
  slowWords: WordInsight[];
  fastestWpm: number;
  firstMistakeAtMs: number | null;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function entryEvents(events: TypingEvent[]) {
  return events.filter((event) => event.type === "character" || event.type === "space");
}

export function analyseTypingSession(options: {
  target: string;
  events: TypingEvent[];
  judgements: WordJudgement[];
  samples: PerformanceSample[];
}): SessionAnalysis {
  const { target, events, judgements, samples } = options;
  const entries = entryEvents(events);
  const keyStats = new Map<string, { attempts: number; mistakes: number; intervals: number[] }>();
  const bigramStats = new Map<string, { attempts: number; intervals: number[] }>();

  for (let index = 0; index < entries.length; index += 1) {
    const event = entries[index];
    const key = event.expectedCharacter?.toLowerCase() ?? "";
    const previous = entries[index - 1];
    const interval = previous ? event.timestamp - previous.timestamp : 0;

    if (key && key !== " ") {
      const stat = keyStats.get(key) ?? { attempts: 0, mistakes: 0, intervals: [] };
      stat.attempts += 1;
      if (!event.correct) stat.mistakes += 1;
      if (interval > 0 && interval <= 1800) stat.intervals.push(interval);
      keyStats.set(key, stat);
    }

    const previousKey = previous?.expectedCharacter?.toLowerCase() ?? "";
    if (
      previousKey &&
      key &&
      previousKey !== " " &&
      key !== " " &&
      interval > 0 &&
      interval <= 1800
    ) {
      const sequence = `${previousKey}${key}`;
      const stat = bigramStats.get(sequence) ?? { attempts: 0, intervals: [] };
      stat.attempts += 1;
      stat.intervals.push(interval);
      bigramStats.set(sequence, stat);
    }
  }

  const weakKeys = Array.from(keyStats, ([key, stat]) => {
    const averageIntervalMs =
      stat.intervals.length === 0
        ? 0
        : stat.intervals.reduce((sum, value) => sum + value, 0) / stat.intervals.length;
    return {
      key,
      attempts: stat.attempts,
      mistakes: stat.mistakes,
      accuracy: roundOne(((stat.attempts - stat.mistakes) / Math.max(1, stat.attempts)) * 100),
      averageIntervalMs: Math.round(averageIntervalMs),
    };
  })
    .sort((left, right) => {
      const leftError = left.mistakes / Math.max(1, left.attempts);
      const rightError = right.mistakes / Math.max(1, right.attempts);
      return rightError - leftError || right.averageIntervalMs - left.averageIntervalMs;
    })
    .slice(0, 5);

  const slowBigrams = Array.from(bigramStats, ([sequence, stat]) => ({
    sequence,
    attempts: stat.attempts,
    averageIntervalMs: Math.round(
      stat.intervals.reduce((sum, value) => sum + value, 0) / Math.max(1, stat.intervals.length),
    ),
  }))
    .filter((item) => item.attempts >= 2)
    .sort((left, right) => right.averageIntervalMs - left.averageIntervalMs)
    .slice(0, 5);

  const ranges = createWordRanges(target);
  const slowWords = judgements
    .map((judgement) => ({
      word: ranges[judgement.wordIndex]
        ? target.slice(ranges[judgement.wordIndex].start, ranges[judgement.wordIndex].end)
        : `word ${judgement.wordIndex + 1}`,
      wordIndex: judgement.wordIndex,
      wpm: judgement.wpm,
      judgement: judgement.type,
    }))
    .sort((left, right) => {
      const leftMiss = left.judgement === "miss" ? 0 : 1;
      const rightMiss = right.judgement === "miss" ? 0 : 1;
      return leftMiss - rightMiss || left.wpm - right.wpm;
    })
    .slice(0, 5);

  return {
    weakKeys,
    slowBigrams,
    slowWords,
    fastestWpm: samples.reduce((best, sample) => Math.max(best, sample.wpm), 0),
    firstMistakeAtMs: entries.find((event) => !event.correct)?.timestamp ?? null,
  };
}
