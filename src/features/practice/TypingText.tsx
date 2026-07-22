import { memo } from "react";
import { TypingCharacter } from "./TypingCharacter";
import type { TypingWordUnit } from "./typingTextTypes";

interface TypingTextProps {
  words: TypingWordUnit[];
}

export const TypingText = memo(function TypingText({ words }: TypingTextProps) {
  return words.map((word) => (
    <span className="typing-word" key={word.id}>
      {word.characters.map((unit) => (
        <TypingCharacter key={unit.id} unit={unit} />
      ))}
    </span>
  ));
});
