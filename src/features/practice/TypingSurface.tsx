import {
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  memo,
  useEffect,
  useLayoutEffect,
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
import { TypingText } from "./TypingText";
import { createTypingWords } from "./typingTextTypes";
import { useTypingCaret } from "./useTypingCaret";
import { useTypingFeedbackEffects } from "./useTypingFeedbackEffects";
import { useTypingTextState } from "./useTypingTextState";

interface TypingSurfaceProps {
  target: string;
  input: string;
  status: TestStatus;
  configuration: TestConfiguration;
  cadence: CadenceMetrics;
  feedback: TypingFeedback;
  correctedIndices: ReadonlySet<number>;
  stagePhase: "idle" | "leaving" | "entering";
  onInput: (value: string) => TypingFeedback;
  onReset: () => void;
}

export const TypingSurface = memo(function TypingSurface({
  target,
  input,
  status,
  configuration,
  cadence,
  feedback,
  correctedIndices,
  stagePhase,
  onInput,
  onReset,
}: TypingSurfaceProps) {
  const { settings } = useApp();
  const inputElement = useRef<HTMLTextAreaElement>(null);
  const viewportElement = useRef<HTMLDivElement>(null);
  const trackElement = useRef<HTMLDivElement>(null);
  const caretElement = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);
  const words = useMemo(() => createTypingWords(target), [target]);
  const activeIndex = input.length;

  useTypingCaret({
    viewportElement,
    trackElement,
    activeIndex,
    targetLength: target.length,
    caretStyle: settings.caretStyle,
    lineAnchor: configuration.mode === "words" ? 0.22 : 0.36,
    status,
  });

  useTypingTextState({
    trackElement,
    input,
    target,
    correctedIndices,
    complete: status === "complete",
  });

  const { visibleJudgement, playFeedback } = useTypingFeedbackEffects({
    cadence,
    caretElement,
    feedback,
    settings,
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const element = inputElement.current;
      element?.focus({ preventScroll: true });
      element?.setSelectionRange(element.value.length, element.value.length);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    const element = inputElement.current;

    if (!element || element.value === input) {
      return;
    }

    element.value = input;
    element.setSelectionRange(input.length, input.length);
  }, [input]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value.replace(/[\r\n]/g, "");

    if (nextValue !== event.target.value) {
      event.target.value = nextValue;
    }

    const nextFeedback = onInput(nextValue);

    if (configuration.noBackspace && nextValue.length < input.length) {
      event.target.value = input;
      event.target.setSelectionRange(input.length, input.length);
    }

    playFeedback(nextFeedback);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    audioEngine.prepare();

    if (event.key === "Tab") {
      event.preventDefault();
      onReset();
      window.setTimeout(() => inputElement.current?.focus({ preventScroll: true }), 0);
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

    if (!element) {
      return;
    }

    const end = element.value.length;

    if (element.selectionStart !== end || element.selectionEnd !== end) {
      element.setSelectionRange(end, end);
    }

    element.scrollLeft = 0;
  };

  const focusInput = () => {
    inputElement.current?.focus({ preventScroll: true });
    keepSelectionAtEnd();
  };

  const showJudgement =
    settings.judgementsEnabled &&
    !settings.reducedMotion &&
    visibleJudgement !== null &&
    status !== "complete";
  const showTrail =
    settings.cadenceEffects &&
    !settings.reducedMotion &&
    cadence.speed > 0.94 &&
    status === "running";

  return (
    <section
      className={cn("typing-surface", focused && "is-focused")}
      data-caret={settings.caretStyle}
      data-status={status}
      data-stage-phase={stagePhase}
      data-hidden-mod={configuration.hidden}
      data-impact={feedback.impact}
      data-show-trail={showTrail}
      aria-label="Typing area"
    >
      <textarea
        ref={inputElement}
        className="typing-input"
        defaultValue=""
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        aria-label="Typing input"
        disabled={status === "complete"}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        wrap="soft"
        onSelect={keepSelectionAtEnd}
        onMouseDown={(event) => {
          event.preventDefault();
          focusInput();
        }}
        onFocus={() => {
          setFocused(true);
          window.requestAnimationFrame(keepSelectionAtEnd);
        }}
        onBlur={() => setFocused(false)}
        onPaste={(event: ClipboardEvent<HTMLTextAreaElement>) => event.preventDefault()}
        onDrop={(event: DragEvent<HTMLTextAreaElement>) => event.preventDefault()}
      />
      <div ref={viewportElement} className="typing-copy" data-line-jump="false" aria-hidden="true">
        <div ref={trackElement} className="typing-track">
          <TypingText words={words} />
        </div>
        <span className="typing-caret-trail" />
        <span ref={caretElement} className="typing-caret" />
        {showJudgement && (
          <span
            key={visibleJudgement.id}
            className={cn("word-judgement", `is-${visibleJudgement.type}`)}
          >
            {visibleJudgement.type}
          </span>
        )}
      </div>
      {!focused && status !== "complete" && status !== "paused" && (
        <div className="typing-message">click to focus</div>
      )}
      {status === "paused" && <div className="typing-message">paused · type to continue</div>}
    </section>
  );
});
