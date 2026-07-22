import { type RefObject, useLayoutEffect, useRef } from "react";

interface UseTypingTextStateOptions {
  trackElement: RefObject<HTMLDivElement | null>;
  input: string;
  target: string;
  correctedIndices: ReadonlySet<number>;
  complete: boolean;
}

function sharedPrefixLength(first: string, second: string) {
  const length = Math.min(first.length, second.length);
  let index = 0;

  while (index < length && first[index] === second[index]) {
    index += 1;
  }

  return index;
}

function setCharacterState(element: HTMLSpanElement, state: string) {
  if (element.dataset.state === state) {
    return;
  }

  element.dataset.state = state;
  element.className = `typing-character is-${state}`;
}

export function useTypingTextState({
  trackElement,
  input,
  target,
  correctedIndices,
  complete,
}: UseTypingTextStateOptions) {
  const charactersRef = useRef<HTMLSpanElement[]>([]);
  const previousInputRef = useRef("");
  const previousCorrectedRef = useRef<ReadonlySet<number>>(new Set());

  useLayoutEffect(() => {
    const track = trackElement.current;

    if (!track) {
      return;
    }

    charactersRef.current = Array.from(
      track.querySelectorAll<HTMLSpanElement>("[data-typing-index]"),
    );
    previousInputRef.current = "";
    previousCorrectedRef.current = new Set();
  }, [target, trackElement]);

  useLayoutEffect(() => {
    const characters = charactersRef.current;

    if (characters.length === 0) {
      return;
    }

    const previousInput = previousInputRef.current;
    const previousCorrected = previousCorrectedRef.current;
    const sharedLength = sharedPrefixLength(previousInput, input);
    const changedIndices = new Set<number>();
    const changedEnd = Math.max(previousInput.length, input.length);

    for (let index = sharedLength; index <= changedEnd; index += 1) {
      changedIndices.add(index);
    }

    changedIndices.add(previousInput.length);
    changedIndices.add(input.length);

    for (const index of previousCorrected) {
      if (!correctedIndices.has(index)) {
        changedIndices.add(index);
      }
    }

    for (const index of correctedIndices) {
      if (!previousCorrected.has(index)) {
        changedIndices.add(index);
      }
    }

    for (const index of changedIndices) {
      const element = characters[index];

      if (!element) {
        continue;
      }

      let state = "pending";

      if (!complete && index === input.length) {
        state = "active";
      } else if (index < input.length) {
        if (input[index] !== target[index]) {
          state = "incorrect";
        } else if (correctedIndices.has(index)) {
          state = "corrected";
        } else {
          state = "correct";
        }
      }

      setCharacterState(element, state);
    }

    previousInputRef.current = input;
    previousCorrectedRef.current = correctedIndices;
  }, [complete, correctedIndices, input, target]);
}
