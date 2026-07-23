import { describe, expect, it } from "vitest";
import type { TypingEvent } from "./types";
import { judgeWord } from "./wordJudgements";

function event(
  id: number,
  timestamp: number,
  enteredCharacter: string,
  expectedCharacter: string,
  targetIndex: number,
  correct = enteredCharacter === expectedCharacter,
): TypingEvent {
  return {
    id: `event-${id}`,
    timestamp,
    type: enteredCharacter === " " ? "space" : "character",
    expectedCharacter,
    enteredCharacter,
    targetIndex,
    wordIndex: 0,
    characterIndex: targetIndex,
    correct,
  };
}

describe("word judgements", () => {
  it("marks a steady error-free word perfect", () => {
    const events = [
      event(1, 0, "h", "h", 0),
      event(2, 100, "e", "e", 1),
      event(3, 200, "l", "l", 2),
      event(4, 300, "l", "l", 3),
      event(5, 400, "o", "o", 4),
      event(6, 500, " ", " ", 5),
    ];

    expect(judgeWord(0, "hello ", "hello world", events, [], 500)?.type).toBe("perfect");
  });

  it("marks a corrected mistake recovered", () => {
    const events: TypingEvent[] = [
      event(1, 0, "h", "h", 0),
      event(2, 100, "x", "e", 1, false),
      {
        ...event(3, 200, "x", "e", 1, false),
        type: "backspace",
      },
      event(4, 300, "e", "e", 1),
      event(5, 400, " ", " ", 5),
    ];

    expect(judgeWord(0, "hello ", "hello world", events, [], 400)?.type).toBe("recovered");
  });

  it("marks unresolved text as a miss", () => {
    const events = [event(1, 0, "x", "h", 0, false)];
    expect(judgeWord(0, "xello ", "hello world", events, [], 500)?.type).toBe("miss");
  });
});
