import {
  type ChangeEvent,
  type ClipboardEvent,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApp } from "../../app/AppContext";
import { audioEngine } from "../../audio/audioEngine";
import { cn } from "../../lib/cn";
import type { TestStatus } from "./practice.types";
import { createTypingWords, TypingCharacter } from "./TypingCharacter";

interface TypingSurfaceProps {
  target: string;
  input: string;
  status: TestStatus;
  onInput: (value: string) => void;
  onReset: () => void;
}

interface CaretPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

const hiddenCaret: CaretPosition = {
  x: 0,
  y: 0,
  width: 3,
  height: 0,
  visible: false,
};

export function TypingSurface({ target, input, status, onInput, onReset }: TypingSurfaceProps) {
  const { settings } = useApp();
  const inputElement = useRef<HTMLTextAreaElement>(null);
  const copyElement = useRef<HTMLDivElement>(null);
  const activeCharacter = useRef<HTMLSpanElement>(null);
  const lastScrollTop = useRef(0);
  const previousInputLength = useRef(0);
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState<CaretPosition>(hiddenCaret);
  const [impact, setImpact] = useState(0);
  const words = useMemo(() => createTypingWords(target), [target]);
  const activeIndex = input.length;

  useEffect(() => {
    inputElement.current?.focus();
  }, []);

  useEffect(() => {
    if (input.length > previousInputLength.current) {
      setImpact((value) => value + 1);
    }

    previousInputLength.current = input.length;
  }, [input.length]);

  const measureCaret = useCallback(() => {
    const copy = copyElement.current;
    const active = activeCharacter.current;

    if (!copy || !active || status === "complete" || activeIndex > target.length) {
      setCaret(hiddenCaret);
      return;
    }

    const characterHeight = active.offsetHeight;
    const blockCaret = settings.caretStyle === "block";
    const caretHeight = blockCaret ? characterHeight : Math.max(18, characterHeight * 0.82);
    const caretWidth = blockCaret ? Math.max(10, active.offsetWidth) : 3;

    setCaret({
      x: active.offsetLeft - (blockCaret ? 1 : 2),
      y: active.offsetTop + (characterHeight - caretHeight) / 2,
      width: caretWidth,
      height: caretHeight,
      visible: true,
    });

    const desiredTop = Math.max(
      0,
      Math.min(
        copy.scrollHeight - copy.clientHeight,
        active.offsetTop - copy.clientHeight * 0.42 + characterHeight / 2,
      ),
    );

    if (Math.abs(desiredTop - lastScrollTop.current) >= characterHeight * 0.65) {
      lastScrollTop.current = desiredTop;
      copy.scrollTo({
        top: desiredTop,
        behavior: settings.reducedMotion ? "auto" : "smooth",
      });
    }
  }, [activeIndex, settings.caretStyle, settings.reducedMotion, status, target.length]);

  useLayoutEffect(() => {
    measureCaret();
  }, [measureCaret]);

  useEffect(() => {
    const copy = copyElement.current;

    if (!copy) {
      return;
    }

    const observer = new ResizeObserver(measureCaret);
    observer.observe(copy);

    return () => observer.disconnect();
  }, [measureCaret]);

  const playInputSound = (nextValue: string) => {
    if (nextValue.length <= input.length) {
      return;
    }

    const index = input.length;
    const typedCharacter = nextValue[index];
    audioEngine.play(typedCharacter === target[index] ? "type" : "error");
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value.replace(/[\r\n]/g, "");
    playInputSound(nextValue);
    onInput(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      onReset();
      window.setTimeout(() => inputElement.current?.focus(), 0);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onReset();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  const caretStyle = {
    width: `${caret.width}px`,
    height: `${caret.height}px`,
    transform: `translate3d(${caret.x}px, ${caret.y}px, 0)`,
  } as CSSProperties;
  const impactStyle = {
    left: `${caret.x}px`,
    top: `${caret.y + caret.height + 3}px`,
  } as CSSProperties;

  return (
    <section
      className={cn("typing-surface", focused && "is-focused")}
      data-caret={settings.caretStyle}
      data-status={status}
      aria-label="Typing area"
    >
      <textarea
        ref={inputElement}
        className="typing-input"
        value={input}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        aria-label="Typing input"
        disabled={status === "complete"}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(event: ClipboardEvent<HTMLTextAreaElement>) => event.preventDefault()}
        onDrop={(event: DragEvent<HTMLTextAreaElement>) => event.preventDefault()}
      />
      <div ref={copyElement} className="typing-copy" aria-hidden="true">
        <span className={cn("typing-caret", caret.visible && "is-visible")} style={caretStyle} />
        {impact > 0 && caret.visible && (
          <span key={impact} className="typing-impact" style={impactStyle} />
        )}
        {words.map((word) => (
          <span className="typing-word" key={word.id}>
            {word.characters.map((unit) => {
              const active = unit.index === activeIndex && status !== "complete";

              return (
                <TypingCharacter
                  key={unit.id}
                  unit={unit}
                  typedCharacter={input[unit.index]}
                  active={active}
                  elementRef={active ? activeCharacter : undefined}
                />
              );
            })}
          </span>
        ))}
      </div>
      {!focused && status !== "complete" && status !== "paused" && (
        <div className="typing-message">click to focus</div>
      )}
      {status === "paused" && <div className="typing-message">paused · type to continue</div>}
    </section>
  );
}
