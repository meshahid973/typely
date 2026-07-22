import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";
import type { CaretStyle } from "../../app/app.types";
import type { TestStatus } from "../../core/typing/types";

interface UseTypingCaretOptions {
  viewportElement: RefObject<HTMLDivElement | null>;
  trackElement: RefObject<HTMLDivElement | null>;
  activeIndex: number;
  targetLength: number;
  caretStyle: CaretStyle;
  lineAnchor: number;
  status: TestStatus;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function useTypingCaret({
  viewportElement,
  trackElement,
  activeIndex,
  targetLength,
  caretStyle,
  lineAnchor,
  status,
}: UseTypingCaretOptions) {
  const lineJumpFrame = useRef<number | null>(null);
  const measureFrame = useRef<number | null>(null);
  const lastLineTop = useRef(-1);
  const lastActiveIndex = useRef(0);
  const lastLaneOffset = useRef(0);
  const lastTrackPadding = useRef(-1);
  const lineHeightRef = useRef(0);
  const characterHeightRef = useRef(0);
  const measureRef = useRef<() => void>(() => undefined);

  const markLineJump = useCallback((viewport: HTMLDivElement) => {
    if (lineJumpFrame.current !== null) {
      window.cancelAnimationFrame(lineJumpFrame.current);
    }

    viewport.dataset.lineJump = "true";
    lineJumpFrame.current = window.requestAnimationFrame(() => {
      lineJumpFrame.current = window.requestAnimationFrame(() => {
        viewport.dataset.lineJump = "false";
        lineJumpFrame.current = null;
      });
    });
  }, []);

  const measure = useCallback(() => {
    const viewport = viewportElement.current;
    const track = trackElement.current;

    if (!viewport || !track || status === "complete" || activeIndex > targetLength) {
      if (viewport) {
        viewport.dataset.caretVisible = "false";
      }
      return;
    }

    const active = track.querySelector<HTMLSpanElement>(`[data-typing-index="${activeIndex}"]`);

    if (!active) {
      return;
    }

    let characterHeight = characterHeightRef.current;
    let lineHeight = lineHeightRef.current;

    if (characterHeight === 0 || lineHeight === 0) {
      characterHeight = active.offsetHeight;
      lineHeight =
        Number.parseFloat(window.getComputedStyle(active).lineHeight) || characterHeight * 1.43;
      characterHeightRef.current = characterHeight;
      lineHeightRef.current = lineHeight;
    }

    const trackPadding = Math.max(0, (viewport.clientHeight - lineHeight) * lineAnchor);

    if (Math.abs(trackPadding - lastTrackPadding.current) > 0.5) {
      lastTrackPadding.current = trackPadding;
      track.style.setProperty("--typing-track-padding", `${trackPadding}px`);
    }

    const activeTop = active.offsetTop;
    const movingForward = activeIndex >= lastActiveIndex.current;
    const changedLine =
      lastLineTop.current >= 0 && Math.abs(activeTop - lastLineTop.current) > lineHeight * 0.55;
    const rawLaneOffset = Math.max(0, activeTop - trackPadding);
    const maximumLaneOffset = Math.max(0, track.scrollHeight - viewport.clientHeight);
    const nextLaneOffset = clamp(
      movingForward ? Math.max(lastLaneOffset.current, rawLaneOffset) : rawLaneOffset,
      0,
      maximumLaneOffset,
    );
    const blockCaret = caretStyle === "block";
    const caretHeight = blockCaret ? characterHeight : Math.max(18, characterHeight * 0.82);
    const caretWidth = blockCaret ? Math.max(10, active.offsetWidth) : 3;

    if (activeIndex === 0) {
      lastLaneOffset.current = 0;
      track.style.setProperty("--lane-offset", "0px");
    } else if (Math.abs(nextLaneOffset - lastLaneOffset.current) > 0.5) {
      if (changedLine) {
        markLineJump(viewport);
      }

      lastLaneOffset.current = nextLaneOffset;
      track.style.setProperty("--lane-offset", `${-nextLaneOffset}px`);
    }

    viewport.style.setProperty("--caret-x", `${active.offsetLeft - (blockCaret ? 1 : 2)}px`);
    viewport.style.setProperty(
      "--caret-y",
      `${trackPadding + (characterHeight - caretHeight) / 2}px`,
    );
    viewport.style.setProperty("--caret-width", `${caretWidth}px`);
    viewport.style.setProperty("--caret-height", `${caretHeight}px`);
    viewport.style.setProperty("--typing-line-height", `${lineHeight}px`);
    viewport.dataset.caretVisible = "true";

    lastLineTop.current = activeTop;
    lastActiveIndex.current = activeIndex;
  }, [
    activeIndex,
    caretStyle,
    lineAnchor,
    markLineJump,
    status,
    targetLength,
    trackElement,
    viewportElement,
  ]);

  measureRef.current = measure;

  useLayoutEffect(() => {
    if (measureFrame.current !== null) {
      window.cancelAnimationFrame(measureFrame.current);
    }

    measure();
    measureFrame.current = window.requestAnimationFrame(() => {
      measureRef.current();
      measureFrame.current = null;
    });
  }, [measure]);

  useLayoutEffect(() => {
    const viewport = viewportElement.current;
    const track = trackElement.current;

    if (!viewport || !track) {
      return;
    }

    const observer = new ResizeObserver(() => {
      lineHeightRef.current = 0;
      characterHeightRef.current = 0;
      measureRef.current();
    });
    observer.observe(viewport);
    observer.observe(track);

    const handleFontsLoaded = () => {
      lineHeightRef.current = 0;
      characterHeightRef.current = 0;
      measureRef.current();
    };
    document.fonts?.addEventListener("loadingdone", handleFontsLoaded);

    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", handleFontsLoaded);
    };
  }, [trackElement, viewportElement]);

  useLayoutEffect(() => {
    return () => {
      if (lineJumpFrame.current !== null) {
        window.cancelAnimationFrame(lineJumpFrame.current);
      }

      if (measureFrame.current !== null) {
        window.cancelAnimationFrame(measureFrame.current);
      }
    };
  }, []);
}
