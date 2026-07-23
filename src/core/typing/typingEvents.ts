import type { TargetPosition, TypingEvent, TypingFeedback, TypingSessionStats } from "./types";

export const emptyTypingSessionStats: TypingSessionStats = {
  currentCorrectCharacters: 0,
  currentIncorrectCharacters: 0,
  correctKeystrokes: 0,
  incorrectKeystrokes: 0,
  totalKeystrokes: 0,
  backspaces: 0,
  currentCombo: 0,
  maxCombo: 0,
};

function commonPrefixLength(previousInput: string, nextInput: string) {
  const limit = Math.min(previousInput.length, nextInput.length);
  let index = 0;

  while (index < limit && previousInput[index] === nextInput[index]) index += 1;
  return index;
}

export function createTargetPositions(target: string) {
  const positions: TargetPosition[] = [];
  let wordIndex = 0;
  let characterIndex = 0;

  for (let index = 0; index < target.length; index += 1) {
    const expectedCharacter = target[index];

    positions.push({ index, wordIndex, characterIndex, expectedCharacter });

    if (expectedCharacter === " ") {
      wordIndex += 1;
      characterIndex = 0;
    } else {
      characterIndex += 1;
    }
  }

  return positions;
}

export function createRestartEvent(timestamp: number): TypingEvent {
  return {
    id: "event-0",
    timestamp,
    type: "restart",
    expectedCharacter: null,
    enteredCharacter: null,
    targetIndex: 0,
    wordIndex: 0,
    characterIndex: 0,
    correct: true,
  };
}

interface CreateTypingEventsOptions {
  previousInput: string;
  nextInput: string;
  target: string;
  targetPositions: TargetPosition[];
  timestamp: number;
  sequenceStart: number;
}

export function createTypingEvents({
  previousInput,
  nextInput,
  target,
  targetPositions,
  timestamp,
  sequenceStart,
}: CreateTypingEventsOptions) {
  const events: TypingEvent[] = [];
  const sharedLength = commonPrefixLength(previousInput, nextInput);
  let sequence = sequenceStart;

  for (let index = previousInput.length - 1; index >= sharedLength; index -= 1) {
    const position = targetPositions[index];

    events.push({
      id: `event-${sequence}`,
      timestamp,
      type: "backspace",
      expectedCharacter: position?.expectedCharacter ?? null,
      enteredCharacter: previousInput[index] ?? null,
      targetIndex: index,
      wordIndex: position?.wordIndex ?? 0,
      characterIndex: position?.characterIndex ?? 0,
      correct: previousInput[index] === target[index],
    });
    sequence += 1;
  }

  for (let index = sharedLength; index < nextInput.length; index += 1) {
    const enteredCharacter = nextInput[index];
    const position = targetPositions[index];

    events.push({
      id: `event-${sequence}`,
      timestamp,
      type: enteredCharacter === " " ? "space" : "character",
      expectedCharacter: position?.expectedCharacter ?? null,
      enteredCharacter,
      targetIndex: index,
      wordIndex: position?.wordIndex ?? 0,
      characterIndex: position?.characterIndex ?? 0,
      correct: enteredCharacter === target[index],
    });
    sequence += 1;
  }

  return events;
}

export function applyTypingEvents(current: TypingSessionStats, events: TypingEvent[]) {
  let next = { ...current };
  let comboMilestone: number | null = null;
  let comboBreak: number | null = null;

  for (const event of events) {
    if (event.type === "restart") {
      next = { ...emptyTypingSessionStats };
      comboMilestone = null;
      comboBreak = null;
      continue;
    }

    if (event.type === "backspace") {
      next.backspaces += 1;

      if (event.correct) {
        next.currentCorrectCharacters = Math.max(0, next.currentCorrectCharacters - 1);
      } else {
        next.currentIncorrectCharacters = Math.max(0, next.currentIncorrectCharacters - 1);
      }

      continue;
    }

    next.totalKeystrokes += 1;

    if (event.correct) {
      next.currentCorrectCharacters += 1;
      next.correctKeystrokes += 1;
      next.currentCombo += 1;
      next.maxCombo = Math.max(next.maxCombo, next.currentCombo);

      if (
        next.currentCombo === 50 ||
        next.currentCombo === 100 ||
        next.currentCombo === 250 ||
        (next.currentCombo > 250 && next.currentCombo % 250 === 0)
      ) {
        comboMilestone = next.currentCombo;
      }
    } else {
      next.currentIncorrectCharacters += 1;
      next.incorrectKeystrokes += 1;

      if (next.currentCombo >= 10) comboBreak = next.currentCombo;
      next.currentCombo = 0;
    }
  }

  next.totalKeystrokes = next.correctKeystrokes + next.incorrectKeystrokes;
  return { stats: next, comboMilestone, comboBreak };
}

export function getTypingImpact(events: TypingEvent[]): TypingFeedback["impact"] {
  const lastEvent = events.at(-1);
  if (!lastEvent) return "none";
  if (lastEvent.type === "backspace") return "backspace";
  return lastEvent.correct ? "correct" : "incorrect";
}

export function getCorrectedIndices(events: TypingEvent[]) {
  const incorrectIndices = new Set<number>();
  const correctedIndices = new Set<number>();

  for (const event of events) {
    if (event.type === "restart" || event.type === "backspace") continue;

    if (!event.correct) {
      incorrectIndices.add(event.targetIndex);
      continue;
    }

    if (incorrectIndices.has(event.targetIndex)) correctedIndices.add(event.targetIndex);
  }

  return correctedIndices;
}

export function summarizeTypingEvents(events: TypingEvent[]) {
  return applyTypingEvents(emptyTypingSessionStats, events).stats;
}
