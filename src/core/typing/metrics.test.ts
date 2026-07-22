import { describe, expect, it } from "vitest";
import { calculateMetrics, calculateProgress } from "./metrics";
import type { TestConfiguration, TypingEvent } from "./types";
import {
  applyTypingEvents,
  createTargetPositions,
  createTypingEvents,
  emptyTypingSessionStats,
  getCorrectedIndices,
} from "./typingEvents";

const configuration: TestConfiguration = {
  mode: "time",
  value: 30,
  punctuation: false,
  numbers: false,
  capitals: false,
  noBackspace: false,
  hidden: false,
};

function createEvents(previousInput: string, nextInput: string, target: string, start: number) {
  return createTypingEvents({
    previousInput,
    nextInput,
    target,
    targetPositions: createTargetPositions(target),
    timestamp: start,
    sequenceStart: start,
  });
}

describe("calculateMetrics", () => {
  it("calculates correct typing", () => {
    const target = "hello";
    const events = createEvents("", "hello", target, 1);
    const stats = applyTypingEvents(emptyTypingSessionStats, events).stats;
    const metrics = calculateMetrics("hello", target, 60000, events, stats);

    expect(metrics.wpm).toBe(1);
    expect(metrics.rawWpm).toBe(1);
    expect(metrics.accuracy).toBe(100);
    expect(metrics.maxCombo).toBe(5);
  });

  it("keeps corrected mistakes in raw WPM and accuracy", () => {
    const target = "hello";
    const first = createEvents("", "hez", target, 1);
    const deleted = createEvents("hez", "he", target, 4);
    const corrected = createEvents("he", "hel", target, 5);
    const events = [...first, ...deleted, ...corrected];
    let stats = applyTypingEvents(emptyTypingSessionStats, first).stats;
    stats = applyTypingEvents(stats, deleted).stats;
    stats = applyTypingEvents(stats, corrected).stats;
    const metrics = calculateMetrics("hel", target, 60000, events, stats);

    expect(metrics.correctCharacters).toBe(3);
    expect(metrics.incorrectKeystrokes).toBe(1);
    expect(metrics.totalKeystrokes).toBe(4);
    expect(metrics.accuracy).toBe(75);
    expect(metrics.rawWpm).toBe(1);
  });

  it("stabilizes live speed at the start", () => {
    const target = "hello";
    const events = createEvents("", "h", target, 1);
    const stats = applyTypingEvents(emptyTypingSessionStats, events).stats;
    const metrics = calculateMetrics("h", target, 100, events, stats, true);

    expect(metrics.wpm).toBe(0);
    expect(metrics.rawWpm).toBe(0);
  });

  it("does not count backspace as a raw typing keystroke", () => {
    const target = "hello";
    const inputEvents = createEvents("", "he", target, 1);
    const backspaceEvents = createEvents("he", "h", target, 3);
    const allEvents: TypingEvent[] = [...inputEvents, ...backspaceEvents];
    let stats = applyTypingEvents(emptyTypingSessionStats, inputEvents).stats;
    stats = applyTypingEvents(stats, backspaceEvents).stats;
    const metrics = calculateMetrics("h", target, 60000, allEvents, stats);

    expect(metrics.totalKeystrokes).toBe(2);
    expect(stats.backspaces).toBe(1);
  });
});

describe("calculateProgress", () => {
  it("caps progress at one", () => {
    expect(calculateProgress(configuration, 0, 100, 40000)).toBe(1);
  });
});

describe("correction history", () => {
  it("keeps corrected positions without marking deleted text as corrected", () => {
    const target = "hello";
    const first = createEvents("", "hez", target, 1);
    const deleted = createEvents("hez", "he", target, 4);
    const corrected = createEvents("he", "hel", target, 5);
    const correctedIndices = getCorrectedIndices([...first, ...deleted, ...corrected]);

    expect(correctedIndices.has(2)).toBe(true);
    expect(correctedIndices.has(3)).toBe(false);
  });
});
