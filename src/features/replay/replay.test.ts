import { expect, it } from "vitest";
import type { TypingEvent } from "../../core/typing/types";
import { buildReplayFrames, getReplayFrame } from "./replay";

const events: TypingEvent[] = [
  {
    id: "1",
    timestamp: 100,
    type: "character",
    expectedCharacter: "a",
    enteredCharacter: "a",
    targetIndex: 0,
    wordIndex: 0,
    characterIndex: 0,
    correct: true,
  },
  {
    id: "2",
    timestamp: 200,
    type: "character",
    expectedCharacter: "b",
    enteredCharacter: "x",
    targetIndex: 1,
    wordIndex: 0,
    characterIndex: 1,
    correct: false,
  },
  {
    id: "3",
    timestamp: 250,
    type: "backspace",
    expectedCharacter: "b",
    enteredCharacter: "x",
    targetIndex: 1,
    wordIndex: 0,
    characterIndex: 1,
    correct: false,
  },
];

it("reconstructs input throughout a replay", () => {
  const frames = buildReplayFrames(events);
  expect(getReplayFrame(frames, 150).input).toBe("a");
  expect(getReplayFrame(frames, 225).input).toBe("ax");
  expect(getReplayFrame(frames, 300).input).toBe("a");
});
