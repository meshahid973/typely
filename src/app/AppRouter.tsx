import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HistoryScreen } from "../features/history/HistoryScreen";
import { InsightsScreen } from "../features/insights/InsightsScreen";
import { PracticeScreen } from "../features/practice/PracticeScreen";
import { useApp } from "./AppProvider";
import type { AppView } from "./app.types";

type TransitionPhase = "entering" | "idle" | "leaving";
type TransitionDirection = "forward" | "backward";

const viewOrder: Record<AppView, number> = {
  practice: 0,
  history: 1,
  insights: 2,
};

function renderView(view: AppView) {
  if (view === "history") {
    return <HistoryScreen />;
  }

  if (view === "insights") {
    return <InsightsScreen />;
  }

  return <PracticeScreen />;
}

export function AppRouter() {
  const { view, settings, settingsOpen, profileOpen } = useApp();
  const [displayedView, setDisplayedView] = useState(view);
  const [phase, setPhase] = useState<TransitionPhase>("entering");
  const [direction, setDirection] = useState<TransitionDirection>("forward");
  const containerRef = useRef<HTMLDivElement>(null);
  const transitionTimer = useRef<number | null>(null);
  const enterFrame = useRef<number | null>(null);
  const scrollResetKey = `${displayedView}:${phase}:${settingsOpen}:${profileOpen}`;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPhase("idle"));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || scrollResetKey.length === 0) {
      return;
    }

    container.scrollLeft = 0;
  }, [scrollResetKey]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const keepHorizontalPosition = () => {
      if (container.scrollLeft !== 0) {
        container.scrollLeft = 0;
      }
    };

    container.addEventListener("scroll", keepHorizontalPosition, { passive: true });
    return () => container.removeEventListener("scroll", keepHorizontalPosition);
  }, []);

  useEffect(() => {
    if (view === displayedView) {
      return;
    }

    if (transitionTimer.current !== null) {
      window.clearTimeout(transitionTimer.current);
    }

    if (enterFrame.current !== null) {
      window.cancelAnimationFrame(enterFrame.current);
    }

    if (settings.reducedMotion) {
      setDisplayedView(view);
      setPhase("idle");
      return;
    }

    setDirection(viewOrder[view] >= viewOrder[displayedView] ? "forward" : "backward");
    setPhase("leaving");

    transitionTimer.current = window.setTimeout(() => {
      setDisplayedView(view);
      setPhase("entering");
      enterFrame.current = window.requestAnimationFrame(() => {
        enterFrame.current = window.requestAnimationFrame(() => {
          setPhase("idle");
          enterFrame.current = null;
        });
      });
      transitionTimer.current = null;
    }, 160);

    return () => {
      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
        transitionTimer.current = null;
      }
    };
  }, [displayedView, settings.reducedMotion, view]);

  useEffect(() => {
    return () => {
      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
      }

      if (enterFrame.current !== null) {
        window.cancelAnimationFrame(enterFrame.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="screen-transition"
      data-direction={direction}
      data-phase={phase}
    >
      {renderView(displayedView)}
    </div>
  );
}
