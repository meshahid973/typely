import { describe, expect, it } from "vitest";
import { calculateMetrics, calculateProgress } from "./metrics";
import type { TestConfiguration, TypingEvent } from "./types";
import {
  applyTypingEvents,
  createRestartEvent,
  createTargetPositions,
  createTypingEvents,
  emptyTypingSessionStats,
  getCorrectedIndices,
  summarizeTypingEvents,
} from "./typingEvents";

const configuration: TestConfiguration = {
  mode: "time",
  value: 30,
  punctuation: false,
  numbers: false,
  capitals: false,
  symbols: false,
  noBackspace: false,
  hidden: false,
  focusMode: false,
  noLiveWpm: false,
  suddenDeath: false,
  accuracyTarget: null,
  minimumPace: null,
  challengeId: null,
  ghostRace: false,
};

function createEvents(previousInput: string, nextInput: string, target: string, timestamp: number) {
  return createTypingEvents({
    previousInput,
    nextInput,
    target,
    targetPositions: createTargetPositions(target),
    timestamp,
    sequenceStart: timestamp,
  });
}

describe("calculateMetrics", () => {
  it("calculates corrected and raw WPM from different evidence", () => {
    const target = "hello";
    const events = createEvents("", "hello", target, 1000);
    const stats = applyTypingEvents(emptyTypingSessionStats, events).stats;
    const metrics = calculateMetrics("hello", target, 60000, events, stats);

    expect(metrics.wpm).toBe(1);
    expect(metrics.rawWpm).toBe(1);
    expect(metrics.accuracy).toBe(100);
    expect(metrics.maxCombo).toBe(5);
  });

  it("keeps corrected mistakes in accuracy and correction dependency", () => {
    const target = "hello";
    const first = createEvents("", "hez", target, 1000);
    const deleted = createEvents("hez", "he", target, 1100);
    const corrected = createEvents("he", "hel", target, 1200);
    const events = [...first, ...deleted, ...corrected];
    let stats = applyTypingEvents(emptyTypingSessionStats, first).stats;
    stats = applyTypingEvents(stats, deleted).stats;
    stats = applyTypingEvents(stats, corrected).stats;
    const metrics = calculateMetrics("hel", target, 60000, events, stats);

    expect(metrics.correctCharacters).toBe(3);
    expect(metrics.incorrectKeystrokes).toBe(1);
    expect(metrics.totalKeystrokes).toBe(4);
    expect(metrics.accuracy).toBe(75);
    expect(metrics.backspaces).toBe(1);
    expect(metrics.correctionDependency).toBeCloseTo(0.25);
  });

  it("prevents unstable opening WPM", () => {
    const target = "hello";
    const events = createEvents("", "h", target, 100);
    const stats = applyTypingEvents(emptyTypingSessionStats, events).stats;
    const metrics = calculateMetrics("h", target, 100, events, stats, true);

    expect(metrics.wpm).toBe(0);
    expect(metrics.rawWpm).toBe(0);
  });

  it("does not count backspace as raw typing", () => {
    const target = "hello";
    const inputEvents = createEvents("", "he", target, 1000);
    const backspaceEvents = createEvents("he", "h", target, 1100);
    const allEvents: TypingEvent[] = [...inputEvents, ...backspaceEvents];
    let stats = applyTypingEvents(emptyTypingSessionStats, inputEvents).stats;
    stats = applyTypingEvents(stats, backspaceEvents).stats;
    const metrics = calculateMetrics("h", target, 60000, allEvents, stats);

    expect(metrics.totalKeystrokes).toBe(2);
    expect(metrics.backspaces).toBe(1);
  });

  it("summarises events after a restart marker", () => {
    const target = "hello";
    const events = [createRestartEvent(0), ...createEvents("", "hel", target, 1000)];
    expect(summarizeTypingEvents(events).correctKeystrokes).toBe(3);
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
    const first = createEvents("", "hez", target, 1000);
    const deleted = createEvents("hez", "he", target, 1100);
    const corrected = createEvents("he", "hel", target, 1200);
    const correctedIndices = getCorrectedIndices([...first, ...deleted, ...corrected]);

    expect(correctedIndices.has(2)).toBe(true);
    expect(correctedIndices.has(3)).toBe(false);
  });
});
