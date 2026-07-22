import { memo, type Ref } from "react";
import { cn } from "../../lib/cn";

export interface CharacterUnit {
  id: string;
  value: string;
  index: number;
}

export interface TypingWordUnit {
  id: string;
  characters: CharacterUnit[];
}

interface TypingCharacterProps {
  unit: CharacterUnit;
  typedCharacter: string | undefined;
  active: boolean;
  elementRef?: Ref<HTMLSpanElement>;
}

export function createTypingWords(target: string) {
  let cursor = 0;
  const sourceWords = target.split(" ");

  return sourceWords.map((word, wordPosition) => {
    const start = cursor;
    const characters = Array.from(word, (value) => {
      const unit = {
        id: `${cursor}-${value.codePointAt(0) ?? 0}`,
        value,
        index: cursor,
      } satisfies CharacterUnit;

      cursor += value.length;
      return unit;
    });

    if (wordPosition < sourceWords.length - 1) {
      characters.push({
        id: `${cursor}-32`,
        value: " ",
        index: cursor,
      });
      cursor += 1;
    }

    return {
      id: `${start}-${word}`,
      characters,
    } satisfies TypingWordUnit;
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
