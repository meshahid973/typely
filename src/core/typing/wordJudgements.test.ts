import { describe, expect, it } from "vitest";
import { createTargetPositions, createTypingEvents } from "./typingEvents";
import { judgeWord } from "./wordJudgements";

function buildEvents(
  previousInput: string,
  nextInput: string,
  target: string,
  sequenceStart: number,
) {
  return createTypingEvents({
    previousInput,
    nextInput,
    target,
    targetPositions: createTargetPositions(target),
    timestamp: sequenceStart * 100,
    sequenceStart,
  });
}

describe("word judgements", () => {
  it("awards perfect for a clean word", () => {
    const target = "hello world";
    const events = buildEvents("", "hello ", target, 1);
    const judgement = judgeWord(0, "hello ", target, events, 800);

    expect(judgement?.type).toBe("perfect");
  });

  it("awards great after one corrected error", () => {
    const target = "hello world";
    const first = buildEvents("", "hez", target, 1);
    const deleteError = buildEvents("hez", "he", target, 4);
    const corrected = buildEvents("he", "hello ", target, 5);
    const judgement = judgeWord(
      0,
      "hello ",
      target,
      [...first, ...deleteError, ...corrected],
      1200,
    );

    expect(judgement?.type).toBe("great");
    expect(judgement?.mistakeCount).toBe(1);
  });

  it("awards miss when a word is committed incorrectly", () => {
    const target = "hello world";
    const events = buildEvents("", "hezlo ", target, 1);
    const judgement = judgeWord(0, "hezlo ", target, events, 900);

    expect(judgement?.type).toBe("miss");
  });
});
