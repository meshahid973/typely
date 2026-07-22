import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CaretStyle } from "../../app/app.types";
import type { TestStatus } from "../../core/typing/types";

interface CaretPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

interface UseTypingCaretOptions {
  copyElement: RefObject<HTMLDivElement | null>;
  activeCharacter: RefObject<HTMLSpanElement | null>;
  activeIndex: number;
  targetLength: number;
  caretStyle: CaretStyle;
  reducedMotion: boolean;
  status: TestStatus;
}

const hiddenCaret: CaretPosition = {
  x: 0,
  y: 0,
  width: 3,
  height: 0,
  visible: false,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function easeOutQuint(value: number) {
  return 1 - (1 - value) ** 5;
}

export function useTypingCaret({
  copyElement,
  activeCharacter,
  activeIndex,
  targetLength,
  caretStyle,
  reducedMotion,
  status,
}: UseTypingCaretOptions) {
  const scrollFrame = useRef<number | null>(null);
  const lineJumpFrame = useRef<number | null>(null);
  const lastLineTop = useRef(-1);
  const measureRef = useRef<() => void>(() => undefined);
  const [caret, setCaret] = useState<CaretPosition>(hiddenCaret);
  const [lineJump, setLineJump] = useState(false);

  const stopScroll = useCallback(() => {
    if (scrollFrame.current !== null) {
      window.cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = null;
    }
  }, []);

  const scrollTo = useCallback(
    (element: HTMLDivElement, targetTop: number) => {
      stopScroll();

      if (reducedMotion) {
        element.scrollTop = targetTop;
        return;
      }

      const startTop = element.scrollTop;
      const distance = targetTop - startTop;

      if (Math.abs(distance) < 1) {
        element.scrollTop = targetTop;
        return;
      }

      const startedAt = performance.now();
      const duration = 280;

      const update = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        element.scrollTop = startTop + distance * easeOutQuint(progress);

        if (progress < 1) {
          scrollFrame.current = window.requestAnimationFrame(update);
        } else {
          scrollFrame.current = null;
        }
      };

      scrollFrame.current = window.requestAnimationFrame(update);
    },
    [reducedMotion, stopScroll],
  );

  const markLineJump = useCallback(() => {
    if (lineJumpFrame.current !== null) {
      window.cancelAnimationFrame(lineJumpFrame.current);
    }

    setLineJump(true);
    lineJumpFrame.current = window.requestAnimationFrame(() => {
      lineJumpFrame.current = window.requestAnimationFrame(() => {
        setLineJump(false);
        lineJumpFrame.current = null;
      });
    });
  }, []);

  const measureCaret = useCallback(() => {
    const copy = copyElement.current;
    const active = activeCharacter.current;

    if (!copy || !active || status === "complete" || activeIndex > targetLength) {
      setCaret(hiddenCaret);
      return;
    }

    const characterHeight = active.offsetHeight;
    const blockCaret = caretStyle === "block";
    const caretHeight = blockCaret ? characterHeight : Math.max(18, characterHeight * 0.82);
    const caretWidth = blockCaret ? Math.max(10, active.offsetWidth) : 3;
    const activeTop = active.offsetTop;
    const changedLine =
      lastLineTop.current >= 0 &&
      Math.abs(activeTop - lastLineTop.current) > characterHeight * 0.55;

    if (changedLine) {
      markLineJump();
    }

    setCaret({
      x: active.offsetLeft - (blockCaret ? 1 : 2),
      y: activeTop + (characterHeight - caretHeight) / 2,
      width: caretWidth,
      height: caretHeight,
      visible: true,
    });

    const activeBottom = activeTop + characterHeight;
    const safeTop = copy.scrollTop + characterHeight * 0.3;
    const safeBottom = copy.scrollTop + copy.clientHeight - characterHeight * 1.45;

    if (!changedLine && lastLineTop.current >= 0) {
      return;
    }

    lastLineTop.current = activeTop;

    if (activeTop >= safeTop && activeBottom <= safeBottom) {
      return;
    }

    const maximumTop = Math.max(0, copy.scrollHeight - copy.clientHeight);
    const desiredTop = clamp(activeTop - copy.clientHeight * 0.38, 0, maximumTop);
    scrollTo(copy, desiredTop);
  }, [
    activeCharacter,
    activeIndex,
    caretStyle,
    copyElement,
    markLineJump,
    scrollTo,
    status,
    targetLength,
  ]);

  useLayoutEffect(() => {
    const copy = copyElement.current;

    if (activeIndex === 0 && copy) {
      stopScroll();
      copy.scrollTop = 0;
      lastLineTop.current = -1;
    }

    measureRef.current = measureCaret;
    measureCaret();
  }, [activeIndex, copyElement, measureCaret, stopScroll]);

  useLayoutEffect(() => {
    const copy = copyElement.current;

    if (!copy) {
      return;
    }

    const observer = new ResizeObserver(() => measureRef.current());
    observer.observe(copy);

    return () => observer.disconnect();
  }, [copyElement]);

  useLayoutEffect(() => {
    return () => {
      stopScroll();

      if (lineJumpFrame.current !== null) {
        window.cancelAnimationFrame(lineJumpFrame.current);
      }
    };
  }, [stopScroll]);

  const style = {
    width: `${caret.width}px`,
    height: `${caret.height}px`,
    transform: `translate3d(${caret.x}px, ${caret.y}px, 0)`,
  } satisfies CSSProperties;

  const judgementStyle = {
    transform: `translate3d(${caret.x}px, ${Math.max(0, caret.y - 28)}px, 0)`,
  } satisfies CSSProperties;

  return {
    visible: caret.visible,
    lineJump,
    style,
    judgementStyle,
  };
}
