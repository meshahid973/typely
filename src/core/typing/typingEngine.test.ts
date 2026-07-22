import { describe, expect, it } from "vitest";
import { createTarget } from "./typingEngine";
import {
  applyTypingEvents,
  createTargetPositions,
  createTypingEvents,
  emptyTypingSessionStats,
} from "./typingEvents";

const target = "hello world";
const targetPositions = createTargetPositions(target);

function events(previousInput: string, nextInput: string, sequenceStart = 1) {
  return createTypingEvents({
    previousInput,
    nextInput,
    target,
    targetPositions,
    timestamp: 100,
    sequenceStart,
  });
}

describe("typing events", () => {
  it("creates character events with stable positions", () => {
    const created = events("", "he");

    expect(created).toHaveLength(2);
    expect(created[0]).toMatchObject({
      id: "event-1",
      type: "character",
      wordIndex: 0,
      characterIndex: 0,
      correct: true,
    });
  });

  it("records backspace without independently resetting combo", () => {
    const entered = applyTypingEvents(emptyTypingSessionStats, events("", "hel"));
    const deleted = applyTypingEvents(entered.stats, events("hel", "he", 4));

    expect(deleted.stats.backspaces).toBe(1);
    expect(deleted.stats.currentCombo).toBe(3);
    expect(deleted.stats.totalKeystrokes).toBe(3);
  });

  it("resets combo after an incorrect character", () => {
    const created = events("", "hex");
    const result = applyTypingEvents(emptyTypingSessionStats, created);

    expect(result.stats.correctKeystrokes).toBe(2);
    expect(result.stats.incorrectKeystrokes).toBe(1);
    expect(result.stats.currentCombo).toBe(0);
    expect(result.stats.maxCombo).toBe(2);
  });

  it("keeps every event during a high-speed input burst", () => {
    const burstTarget = "a".repeat(500);
    const burst = createTypingEvents({
      previousInput: "",
      nextInput: burstTarget,
      target: burstTarget,
      targetPositions: createTargetPositions(burstTarget),
      timestamp: 1000,
      sequenceStart: 1,
    });
    const result = applyTypingEvents(emptyTypingSessionStats, burst);

    expect(burst).toHaveLength(500);
    expect(result.stats.correctKeystrokes).toBe(500);
    expect(result.stats.maxCombo).toBe(500);
  });
});

describe("createTarget", () => {
  it("creates the requested word count", () => {
    const created = createTarget({
      mode: "words",
      value: 25,
      punctuation: false,
      numbers: false,
      capitals: false,
      noBackspace: false,
      hidden: false,
    });

    expect(created.split(" ")).toHaveLength(25);
  });
});
