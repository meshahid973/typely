import {
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApp } from "../../app/AppProvider";
import { audioEngine } from "../../audio/audioEngine";
import type {
  CadenceMetrics,
  TestConfiguration,
  TestStatus,
  TypingFeedback,
} from "../../core/typing/types";
import { cn } from "../../utils/cn";
import { shouldReduceMotion } from "../../utils/motion";
import { createTypingWords, TypingCharacter } from "./TypingCharacter";
import { useTypingCaret } from "./useTypingCaret";
import { useTypingFeedbackEffects } from "./useTypingFeedbackEffects";

interface TypingSurfaceProps {
  target: string;
  input: string;
  status: TestStatus;
  configuration: TestConfiguration;
  cadence: CadenceMetrics;
  feedback: TypingFeedback;
  correctedIndices: ReadonlySet<number>;
  onInput: (value: string) => TypingFeedback;
  onReset: () => void;
}

export function TypingSurface({
  target,
  input,
  status,
  configuration,
  cadence,
  feedback,
  correctedIndices,
  onInput,
  onReset,
}: TypingSurfaceProps) {
  const { settings } = useApp();
  const inputElement = useRef<HTMLTextAreaElement>(null);
  const copyElement = useRef<HTMLDivElement>(null);
  const caretElement = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);
  const words = useMemo(() => createTypingWords(target), [target]);
  const activeIndex = input.length;
  const caret = useTypingCaret({
    copyElement,
    activeIndex,
    targetLength: target.length,
    caretStyle: settings.caretStyle,
    reducedMotion: settings.reducedMotion,
    status,
  });
  const { visibleJudgement, playFeedback } = useTypingFeedbackEffects({
    cadence,
    caretElement,
    feedback,
    settings,
  });

  useEffect(() => {
    inputElement.current?.focus();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value.replace(/[\r\n]/g, "");
    playFeedback(onInput(nextValue));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    audioEngine.prepare();

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
      return;
    }

    if (configuration.noBackspace && event.key === "Backspace") {
      event.preventDefault();
      return;
    }

    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      event.preventDefault();
    }
  };

  const keepSelectionAtEnd = () => {
    const element = inputElement.current;

    if (
      !element ||
      (element.selectionStart === input.length && element.selectionEnd === input.length)
    ) {
      return;
    }

    element.setSelectionRange(input.length, input.length);
  };

  const reduceMotion = settings.reducedMotion || shouldReduceMotion();
  const showJudgement =
    settings.judgementsEnabled &&
    !reduceMotion &&
    visibleJudgement !== null &&
    status !== "complete";
  const showTrail =
    settings.cadenceEffects && !reduceMotion && cadence.speed > 0.94 && status === "running";

  return (
    <section
      className={cn("typing-surface", focused && "is-focused")}
      data-caret={settings.caretStyle}
      data-status={status}
      data-hidden-mod={configuration.hidden}
      data-impact={feedback.impact}
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
        onSelect={keepSelectionAtEnd}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(event: ClipboardEvent<HTMLTextAreaElement>) => event.preventDefault()}
        onDrop={(event: DragEvent<HTMLTextAreaElement>) => event.preventDefault()}
      />
      <div ref={copyElement} className="typing-copy" aria-hidden="true">
        {showTrail && (
          <span
            className={cn(
              "typing-caret-trail",
              caret.visible && "is-visible",
              caret.lineJump && "is-line-jump",
            )}
            style={caret.style}
          />
        )}
        <span
          ref={caretElement}
          className={cn(
            "typing-caret",
            caret.visible && "is-visible",
            caret.lineJump && "is-line-jump",
          )}
          style={caret.style}
        />
        {showJudgement && (
          <span
            key={visibleJudgement.id}
            className={cn("word-judgement", `is-${visibleJudgement.type}`)}
            style={caret.judgementStyle}
          >
            {visibleJudgement.type}
          </span>
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
                  corrected={correctedIndices.has(unit.index)}
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
