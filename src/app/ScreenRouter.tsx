import { useEffect, useState } from "react";
import { HistoryScreen } from "../features/history/HistoryScreen";
import { InsightsScreen } from "../features/insights/InsightsScreen";
import { PracticeScreen } from "../features/practice/PracticeScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { useApp } from "./AppContext";
import type { AppView } from "./app.types";

type TransitionPhase = "entering" | "idle" | "leaving";
type TransitionDirection = "forward" | "backward";

const viewOrder: Record<AppView, number> = {
  practice: 0,
  history: 1,
  insights: 2,
  settings: 3,
};

function renderView(view: AppView) {
  if (view === "history") {
    return <HistoryScreen />;
  }

  if (view === "insights") {
    return <InsightsScreen />;
  }

  if (view === "settings") {
    return <SettingsScreen />;
  }

  return <PracticeScreen />;
}

export function ScreenRouter() {
  const { view, settings } = useApp();
  const [displayedView, setDisplayedView] = useState(view);
  const [phase, setPhase] = useState<TransitionPhase>("entering");
  const [direction, setDirection] = useState<TransitionDirection>("forward");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPhase("idle"));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (view === displayedView) {
      return;
    }

    if (settings.reducedMotion) {
      setDisplayedView(view);
      setPhase("idle");
      return;
    }

    setDirection(viewOrder[view] >= viewOrder[displayedView] ? "forward" : "backward");
    setPhase("leaving");

    const timeout = window.setTimeout(() => {
      setDisplayedView(view);
      setPhase("entering");

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setPhase("idle"));
      });
    }, 125);

    return () => window.clearTimeout(timeout);
  }, [displayedView, settings.reducedMotion, view]);

  return (
    <div
      className="screen-transition"
      data-direction={direction}
      data-phase={phase}
      key={displayedView}
    >
      {renderView(displayedView)}
    </div>
  );
}
