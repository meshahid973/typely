import type { TypingEvent, WordJudgement, WordJudgementType } from "./types";

interface WordRange {
  wordIndex: number;
  start: number;
  end: number;
}

export function createWordRanges(target: string) {
  const ranges: WordRange[] = [];
  let start = 0;
  let wordIndex = 0;

  for (let index = 0; index <= target.length; index += 1) {
    if (index === target.length || target[index] === " ") {
      ranges.push({ wordIndex, start, end: index });
      wordIndex += 1;
      start = index + 1;
    }
  }

  return ranges;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function wordEventMetrics(wordIndex: number, events: TypingEvent[], timestamp: number) {
  const wordEvents = events.filter(
    (event) => event.wordIndex === wordIndex && event.type !== "restart",
  );
  const entryEvents = wordEvents.filter(
    (event) => event.type === "character" || event.type === "space",
  );
  const backspaceCount = wordEvents.filter((event) => event.type === "backspace").length;
  const mistakeCount = entryEvents.filter((event) => !event.correct).length;
  const firstTimestamp = entryEvents[0]?.timestamp ?? timestamp;
  const durationMs = Math.max(1, timestamp - firstTimestamp);
  const intervals = entryEvents.slice(1).map((event, index) => {
    return Math.max(1, event.timestamp - entryEvents[index].timestamp);
  });
  const averageIntervalMs =
    intervals.length === 0
      ? durationMs
      : intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const hesitationThreshold = Math.max(320, averageIntervalMs * 1.75);
  const hesitationCount = intervals.filter((interval) => interval > hesitationThreshold).length;
  const variance =
    intervals.length === 0
      ? 0
      : intervals.reduce((sum, interval) => sum + (interval - averageIntervalMs) ** 2, 0) /
        intervals.length;
  const deviation = Math.sqrt(variance);
  const intervalConsistency =
    averageIntervalMs <= 0 ? 1 : Math.max(0, Math.min(1, 1 - deviation / averageIntervalMs));

  return {
    entryEvents,
    backspaceCount,
    mistakeCount,
    durationMs,
    averageIntervalMs,
    hesitationCount,
    intervalConsistency,
  };
}

function judgementType(options: {
  correct: boolean;
  mistakeCount: number;
  backspaceCount: number;
  hesitationCount: number;
  intervalConsistency: number;
  wordWpm: number;
  previousJudgements: WordJudgement[];
}): WordJudgementType {
  const {
    correct,
    mistakeCount,
    backspaceCount,
    hesitationCount,
    intervalConsistency,
    wordWpm,
    previousJudgements,
  } = options;

  if (!correct) return "miss";
  if (mistakeCount > 0 || backspaceCount > 0) return "recovered";

  const recentWpms = previousJudgements
    .filter((judgement) => judgement.type !== "miss" && judgement.wpm > 0)
    .slice(-8)
    .map((judgement) => judgement.wpm);
  const baseline = median(recentWpms);

  if (recentWpms.length >= 3 && wordWpm >= Math.max(80, baseline * 1.22)) return "burst";
  if (hesitationCount === 0 && intervalConsistency >= 0.72) return "perfect";
  return "clean";
}

export function judgeWord(
  wordIndex: number,
  input: string,
  target: string,
  events: TypingEvent[],
  previousJudgements: WordJudgement[],
  timestamp: number,
): WordJudgement | null {
  const range = createWordRanges(target)[wordIndex];
  if (!range) return null;

  const expectedWord = target.slice(range.start, range.end);
  const enteredWord = input.slice(range.start, range.end);
  const metrics = wordEventMetrics(wordIndex, events, timestamp);
  const wordWpm = Math.min(
    300,
    Math.max(0, Math.round(expectedWord.length / 5 / (metrics.durationMs / 60000) || 0)),
  );

  return {
    id: `judgement-${wordIndex}-${Math.round(timestamp)}`,
    timestamp,
    wordIndex,
    type: judgementType({
      correct: enteredWord === expectedWord,
      mistakeCount: metrics.mistakeCount,
      backspaceCount: metrics.backspaceCount,
      hesitationCount: metrics.hesitationCount,
      intervalConsistency: metrics.intervalConsistency,
      wordWpm,
      previousJudgements,
    }),
    mistakeCount: metrics.mistakeCount,
    backspaceCount: metrics.backspaceCount,
    durationMs: Math.round(metrics.durationMs),
    averageIntervalMs: Math.round(metrics.averageIntervalMs),
    wpm: wordWpm,
  };
}

export function collectNewJudgements(
  previousJudgedWords: ReadonlySet<number>,
  newEvents: TypingEvent[],
  allEvents: TypingEvent[],
  previousJudgements: WordJudgement[],
  input: string,
  target: string,
  timestamp: number,
) {
  const completedWords = new Set<number>();

  for (const event of newEvents) {
    if (event.type === "space" && event.correct && !previousJudgedWords.has(event.wordIndex)) {
      completedWords.add(event.wordIndex);
    }
  }

  const judgements: WordJudgement[] = [];

  for (const wordIndex of completedWords) {
    const judgement = judgeWord(
      wordIndex,
      input,
      target,
      allEvents,
      [...previousJudgements, ...judgements],
      timestamp,
    );
    if (judgement) judgements.push(judgement);
  }

  return judgements;
}

export function finalizeLastWordJudgement(
  judgedWords: ReadonlySet<number>,
  input: string,
  target: string,
  events: TypingEvent[],
  previousJudgements: WordJudgement[],
  timestamp: number,
) {
  const ranges = createWordRanges(target);
  const finalWordIndex = ranges.length - 1;

  if (finalWordIndex < 0 || judgedWords.has(finalWordIndex)) return null;

  const finalRange = ranges[finalWordIndex];
  if (input.length < finalRange.end) return null;

  return judgeWord(finalWordIndex, input, target, events, previousJudgements, timestamp);
}
