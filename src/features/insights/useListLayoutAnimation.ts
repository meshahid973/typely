import { type RefObject, useLayoutEffect, useRef } from "react";

export function useListLayoutAnimation(
  containerRef: RefObject<HTMLElement | null>,
  layoutKey: string,
  reducedMotion: boolean,
) {
  const previousPositions = useRef(new Map<string, number>());
  const previousLayoutKey = useRef("");

  useLayoutEffect(() => {
    const layoutChanged = previousLayoutKey.current !== layoutKey;
    previousLayoutKey.current = layoutKey;
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const items = Array.from(container.querySelectorAll<HTMLElement>("[data-layout-item]"));
    const nextPositions = new Map<string, number>();

    for (const item of items) {
      const key = item.dataset.layoutItem;

      if (!key) {
        continue;
      }

      const top = item.getBoundingClientRect().top;
      const previousTop = previousPositions.current.get(key);
      nextPositions.set(key, top);

      if (!layoutChanged || previousTop === undefined || reducedMotion) {
        continue;
      }

      const delta = previousTop - top;

      if (Math.abs(delta) < 0.5) {
        continue;
      }

      for (const animation of item.getAnimations()) {
        animation.cancel();
      }

      item.animate(
        [{ transform: `translate3d(0, ${delta}px, 0)` }, { transform: "translate3d(0, 0, 0)" }],
        {
          duration: 280,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    }

    previousPositions.current = nextPositions;
  });
}
