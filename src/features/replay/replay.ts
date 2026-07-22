import type { TypingEvent } from "../../core/typing/types";

export interface ReplayFrame {
  timestamp: number;
  input: string;
}

export function buildReplayFrames(events: TypingEvent[]): ReplayFrame[] {
  const frames: ReplayFrame[] = [{ timestamp: 0, input: "" }];
  let input = "";

  for (const event of events) {
    if (event.type === "restart") {
      input = "";
      continue;
    }

    if (event.type === "backspace") {
      input = input.slice(0, Math.max(0, event.targetIndex));
    } else if (event.enteredCharacter !== null) {
      input = `${input.slice(0, event.targetIndex)}${event.enteredCharacter}`;
    }

    const previousFrame = frames.at(-1);

    if (previousFrame?.timestamp === event.timestamp) {
      previousFrame.input = input;
    } else {
      frames.push({ timestamp: event.timestamp, input });
    }
  }

  return frames;
}

export function getReplayFrame(frames: ReplayFrame[], elapsedMs: number) {
  let low = 0;
  let high = frames.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);

    if (frames[middle].timestamp <= elapsedMs) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return frames[Math.max(0, high)] ?? frames[0];
}
