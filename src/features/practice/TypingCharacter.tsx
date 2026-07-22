import { memo, type Ref } from "react";
import { cn } from "../../lib/cn";

export interface CharacterUnit {
  id: string;
  value: string;
  index: number;
}

interface TypingCharacterProps {
  unit: CharacterUnit;
  typedCharacter: string | undefined;
  active: boolean;
  elementRef?: Ref<HTMLSpanElement>;
}

export function createCharacterUnits(target: string) {
  const occurrences = new Map<string, number>();

  return Array.from(target, (value, index) => {
    const occurrence = (occurrences.get(value) ?? 0) + 1;
    occurrences.set(value, occurrence);

    return {
      id: `${value.codePointAt(0) ?? 0}-${occurrence}`,
      value,
      index,
    } satisfies CharacterUnit;
  });
}

export const TypingCharacter = memo(function TypingCharacter({
  unit,
  typedCharacter,
  active,
  elementRef,
}: TypingCharacterProps) {
  const typed = typedCharacter !== undefined;
  const correct = typed && typedCharacter === unit.value;
  const incorrect = typed && typedCharacter !== unit.value;
  let state = "pending";

  if (active) {
    state = "active";
  } else if (correct) {
    state = "correct";
  } else if (incorrect) {
    state = "incorrect";
  }

  return (
    <span
      ref={elementRef}
      className={cn(
        "typing-character",
        correct && "is-correct",
        incorrect && "is-incorrect",
        active && "is-active",
      )}
      data-state={state}
    >
      {unit.value}
    </span>
  );
});
