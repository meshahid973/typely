import { memo } from "react";
import { cn } from "../../utils/cn";

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
  corrected: boolean;
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
  corrected,
}: TypingCharacterProps) {
  const typed = typedCharacter !== undefined;
  const correct = typed && typedCharacter === unit.value;
  const incorrect = typed && typedCharacter !== unit.value;
  let state = "pending";

  if (active) {
    state = "active";
  } else if (incorrect) {
    state = "incorrect";
  } else if (correct && corrected) {
    state = "corrected";
  } else if (correct) {
    state = "correct";
  }

  return (
    <span
      className={cn("typing-character", `is-${state}`)}
      data-state={state}
      data-typing-index={unit.index}
    >
      {unit.value}
    </span>
  );
});
