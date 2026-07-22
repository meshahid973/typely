import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSettings, TestResult } from "../../app/app.types";
import { KeyHint } from "../../components/ui/KeyHint";
import type { TestConfiguration } from "../../core/typing/types";
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

type StagePhase = "idle" | "leaving" | "entering";

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
  const [stagePhase, setStagePhase] = useState<StagePhase>("entering");
  const refreshTimeout = useRef<number | null>(null);
  const stageTimeout = useRef<number | null>(null);
  const cadenceFrame = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const test = useTypingTest({
    configuration,
    previousBestWpm,
    previousBestCombo,
    onComplete,
  });
  const active = test.status === "running" || test.status === "paused";
  const controlsDisabled = active || stagePhase === "leaving";
  const hasResult = test.lastResult !== null;

  const clearStageTimeout = useCallback(() => {
    if (stageTimeout.current !== null) {
      window.clearTimeout(stageTimeout.current);
      stageTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (refreshTimeout.current !== null) {
        window.clearTimeout(refreshTimeout.current);
      }

      clearStageTimeout();

      if (cadenceFrame.current !== null) {
        window.cancelAnimationFrame(cadenceFrame.current);
      }

      delete document.documentElement.dataset.testActive;
    };
  }, [clearStageTimeout]);

  useEffect(() => {
    document.documentElement.dataset.testActive = active ? "true" : "false";
  }, [active]);

  useEffect(() => {
    if (overlayOpen) {
      test.pause();
    }
  }, [overlayOpen, test.pause]);

  useEffect(() => {
    clearStageTimeout();

    if (settings.reducedMotion) {
      setStagePhase("idle");
      return;
    }

    setStagePhase("entering");
    stageTimeout.current = window.setTimeout(() => {
      setStagePhase("idle");
      stageTimeout.current = null;
    }, 430);
  }, [clearStageTimeout, settings.reducedMotion, test.target]);

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    if (cadenceFrame.current !== null) {
      window.cancelAnimationFrame(cadenceFrame.current);
    }

    cadenceFrame.current = window.requestAnimationFrame(() => {
      const enabled = settings.cadenceEffects && !settings.reducedMotion;
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

  const changeConfiguration = useCallback(
    (nextConfiguration: TestConfiguration) => {
      clearStageTimeout();

      if (settings.reducedMotion) {
        onConfigurationChange(nextConfiguration);
        setStagePhase("idle");
        return;
      }

      setStagePhase("leaving");
      stageTimeout.current = window.setTimeout(() => {
        onConfigurationChange(nextConfiguration);
        setStagePhase("entering");
        stageTimeout.current = window.setTimeout(() => {
          setStagePhase("idle");
          stageTimeout.current = null;
        }, 410);
      }, 115);
    },
    [clearStageTimeout, onConfigurationChange, settings.reducedMotion],
  );

  const resetTest = useCallback(() => {
    if (refreshTimeout.current !== null) {
      window.clearTimeout(refreshTimeout.current);
    }

    setRefreshing(true);
    refreshTimeout.current = window.setTimeout(() => {
      setRefreshing(false);
      refreshTimeout.current = null;
    }, 520);

    clearStageTimeout();

    if (settings.reducedMotion) {
      test.reset();
      setStagePhase("idle");
      return;
    }

    setStagePhase("leaving");
    stageTimeout.current = window.setTimeout(() => {
      test.reset();
      setStagePhase("entering");
      stageTimeout.current = window.setTimeout(() => {
        setStagePhase("idle");
        stageTimeout.current = null;
      }, 410);
    }, 115);
  }, [clearStageTimeout, settings.reducedMotion, test.reset]);

  return (
    <div
      className="view-practice"
      data-status={test.status}
      data-has-result={hasResult}
      data-stage-phase={stagePhase}
    >
      <div ref={stageRef} className="practice-stage">
        <PracticeToolbar
          configuration={configuration}
          disabled={controlsDisabled}
          refreshing={refreshing}
          stagePhase={stagePhase}
          onConfigurationChange={changeConfiguration}
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
            reducedMotion={settings.reducedMotion}
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
            stagePhase={stagePhase}
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
