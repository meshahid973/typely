import type { CharacterUnit } from "./typingTextTypes";

interface TypingCharacterProps {
  unit: CharacterUnit;
}

export function TypingCharacter({ unit }: TypingCharacterProps) {
  return (
    <span
      className="typing-character is-pending"
      data-state="pending"
      data-typing-index={unit.index}
    >
      {unit.value}
    </span>
  );
}
