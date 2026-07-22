export interface CharacterUnit {
  id: string;
  value: string;
  index: number;
}

export interface TypingWordUnit {
  id: string;
  characters: CharacterUnit[];
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
