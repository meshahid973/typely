import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSettings, TestResult } from "../../app/app.types";
import { KeyHint } from "../../components/ui/KeyHint";
import type { TestConfiguration } from "../../core/typing/types";
import { shouldReduceMotion } from "../../utils/motion";
import { LiveStats } from "./LiveStats";
import { PracticeToolbar } from "./PracticeToolbar";
import { ResultStage } from "./ResultStage";
import { TypingSurface } from "./TypingSurface";
import { useTypingTest } from "./useTypingTest";

interface TypingGameStageProps {
  configuration: TestConfiguration;
  settings: AppSettings;
  overlayOpen: boolean;
  previousBestWpm: number;
  previousBestCombo: number;
  onConfigurationChange: (configuration: TestConfiguration) => void;
  onComplete: (result: TestResult) => void;
  onHistory: () => void;
}

export function TypingGameStage({
  configuration,
  settings,
  overlayOpen,
  previousBestWpm,
  previousBestCombo,
  onConfigurationChange,
  onComplete,
  onHistory,
}: TypingGameStageProps) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimeout = useRef<number | null>(null);
  const cadenceFrame = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const test = useTypingTest({
    configuration,
    previousBestWpm,
    previousBestCombo,
    onComplete,
  });
  const active = test.status === "running" || test.status === "paused";
  const hasResult = test.lastResult !== null;

  useEffect(() => {
    return () => {
      if (refreshTimeout.current !== null) {
        window.clearTimeout(refreshTimeout.current);
      }

      if (cadenceFrame.current !== null) {
        window.cancelAnimationFrame(cadenceFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    if (overlayOpen) {
      test.pause();
    }
  }, [overlayOpen, test.pause]);

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    if (cadenceFrame.current !== null) {
      window.cancelAnimationFrame(cadenceFrame.current);
    }

    cadenceFrame.current = window.requestAnimationFrame(() => {
      const enabled = settings.cadenceEffects && !settings.reducedMotion && !shouldReduceMotion();
      stage.style.setProperty("--cadence-energy", enabled ? test.cadence.energy.toFixed(3) : "0");
      stage.style.setProperty("--cadence-speed", enabled ? test.cadence.speed.toFixed(3) : "0");
      stage.style.setProperty(
        "--cadence-consistency",
        enabled ? test.cadence.consistency.toFixed(3) : "1",
      );
      cadenceFrame.current = null;
    });
  }, [
    settings.cadenceEffects,
    settings.reducedMotion,
    test.cadence.consistency,
    test.cadence.energy,
    test.cadence.speed,
  ]);

  const resetTest = useCallback(() => {
    test.reset();
    setRefreshing(true);

    if (refreshTimeout.current !== null) {
      window.clearTimeout(refreshTimeout.current);
    }

    refreshTimeout.current = window.setTimeout(() => setRefreshing(false), 420);
  }, [test.reset]);

  return (
    <div className="view-practice" data-status={test.status} data-has-result={hasResult}>
      <div ref={stageRef} className="practice-stage">
        <PracticeToolbar
          configuration={configuration}
          disabled={active}
          refreshing={refreshing}
          onConfigurationChange={onConfigurationChange}
          onRefresh={resetTest}
        />

        <div className="practice-session">
          <LiveStats
            configuration={configuration}
            metrics={test.metrics}
            progress={test.progress}
            elapsedMs={test.elapsedMs}
            status={test.status}
            showLiveStats={settings.liveStats}
            cadence={test.cadence}
            feedback={test.feedback}
          />
          <TypingSurface
            key={test.target}
            target={test.target}
            input={test.input}
            status={test.status}
            configuration={configuration}
            cadence={test.cadence}
            feedback={test.feedback}
            correctedIndices={test.correctedIndices}
            onInput={test.updateInput}
            onReset={resetTest}
          />
          <div className="typing-hints" data-hidden={active}>
            <KeyHint shortcut="tab" label="restart" />
            <KeyHint shortcut="esc" label="reset" />
          </div>
        </div>

        {test.lastResult && (
          <ResultStage
            key={test.lastResult.id}
            result={test.lastResult}
            onRestart={resetTest}
            onHistory={onHistory}
          />
        )}
      </div>
    </div>
  );
}
