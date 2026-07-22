import { useEffect, useRef, useState } from "react";
import { useApp } from "../../app/AppContext";
import { cn } from "../../lib/cn";
import type { TestStatus } from "./practice.types";

interface TypingSurfaceProps {
  target: string;
  input: string;
  status: TestStatus;
  onInput: (value: string) => void;
  onReset: () => void;
}

export function TypingSurface({ target, input, status, onInput, onReset }: TypingSurfaceProps) {
  const { settings } = useApp();
  const inputElement = useRef<HTMLTextAreaElement>(null);
  const copyElement = useRef<HTMLDivElement>(null);
  const activeCharacter = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    inputElement.current?.focus();
  }, [target]);

  useEffect(() => {
    const copy = copyElement.current;
    const active = activeCharacter.current;

    if (!copy || !active) {
      return;
    }

    const nextTop = active.offsetTop - copy.clientHeight / 2 + active.clientHeight / 2;
    copy.scrollTo({
      top: Math.max(0, nextTop),
      behavior: settings.reducedMotion ? "auto" : "smooth",
    });
  }, [input.length, settings.reducedMotion]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      onReset();
      window.setTimeout(() => inputElement.current?.focus(), 0);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onReset();
    }
  };

  return (
    <div
      className={cn("typing-surface", focused && "is-focused")}
      data-caret={settings.caretStyle}
      onClick={() => inputElement.current?.focus()}
    >
      <textarea
        ref={inputElement}
        className="typing-input"
        value={input}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="Typing input"
        onChange={(event) => onInput(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
      />
      <div ref={copyElement} className="typing-copy" aria-hidden="true">
        {Array.from(target).map((character, index) => {
          const typedCharacter = input[index];
          const typed = index < input.length;
          const correct = typed && typedCharacter === character;
          const incorrect = typed && typedCharacter !== character;
          const active = index === input.length && status !== "complete";

          return (
            <span
              key={`${index}-${character}`}
              ref={active ? activeCharacter : undefined}
              className={cn(
                "typing-character",
                correct && "is-correct",
                incorrect && "is-incorrect",
                active && "is-active",
              )}
            >
              {character}
            </span>
          );
        })}
      </div>
      {!focused && status !== "complete" && status !== "paused" && (
        <div className="typing-message">click to focus</div>
      )}
      {status === "paused" && <div className="typing-message">paused · type to continue</div>}
    </div>
  );
}
