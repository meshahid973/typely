import { type RefObject, useLayoutEffect, useRef } from "react";

interface RectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
}

function snapshot(element: HTMLElement): RectSnapshot {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function useHudLayoutAnimation(
  containerRef: RefObject<HTMLElement | null>,
  layoutKey: string,
  reducedMotion: boolean,
) {
  const previousRects = useRef(new Map<string, RectSnapshot>());

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const elements = Array.from(container.querySelectorAll<HTMLElement>("[data-hud-stat]"));
    const currentRects = new Map<string, RectSnapshot>();

    for (const element of elements) {
      const key = element.dataset.hudStat;

      if (!key) {
        continue;
      }

      const current = snapshot(element);
      const previous = previousRects.current.get(key);
      currentRects.set(key, current);

      if (!previous || reducedMotion) {
        continue;
      }

      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      const scaleX = clamp(previous.width / Math.max(1, current.width), 0.72, 1.38);
      const scaleY = clamp(previous.height / Math.max(1, current.height), 0.72, 1.38);

      if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5 && Math.abs(scaleX - 1) < 0.01) {
        continue;
      }

      for (const animation of element.getAnimations()) {
        animation.cancel();
      }

      element.animate(
        [
          {
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`,
          },
          { transform: "translate3d(0, 0, 0) scale(1)" },
        ],
        {
          duration: 260,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    }

    previousRects.current = currentRects;
  }, [containerRef, layoutKey, reducedMotion]);
}
