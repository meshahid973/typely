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
  previousBestResult: TestResult | null;
  previousBestCombo: number;
  onConfigurationChange: (configuration: TestConfiguration) => void;
  onComplete: (result: TestResult) => void;
  onHistory: () => void;
}

type StagePhase = "idle" | "leaving" | "entering";
type ResultPhase = "idle" | "compressing" | "revealed";

export function TypingGameStage({
  configuration,
  settings,
  overlayOpen,
  previousBestResult,
  previousBestCombo,
  onConfigurationChange,
  onComplete,
  onHistory,
}: TypingGameStageProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [stagePhase, setStagePhase] = useState<StagePhase>("entering");
  const [resultPhase, setResultPhase] = useState<ResultPhase>("idle");
  const refreshTimeout = useRef<number | null>(null);
  const stageTimeout = useRef<number | null>(null);
  const resultTimeout = useRef<number | null>(null);
  const cadenceFrame = useRef<number | null>(null);
  const chromeIdleTimeout = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const previousTarget = useRef("");
  const test = useTypingTest({
    configuration,
    previousBestResult,
    ghostResult: previousBestResult,
    previousBestCombo,
    onComplete,
  });
  const active = test.status === "running" || test.status === "paused";
  const controlsDisabled = active || stagePhase === "leaving" || resultPhase !== "idle";
  const hasResult = test.lastResult !== null;

  const clearStageTimeout = useCallback(() => {
    if (stageTimeout.current !== null) {
      window.clearTimeout(stageTimeout.current);
      stageTimeout.current = null;
    }
  }, []);

  const clearResultTimeout = useCallback(() => {
    if (resultTimeout.current !== null) {
      window.clearTimeout(resultTimeout.current);
      resultTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (refreshTimeout.current !== null) window.clearTimeout(refreshTimeout.current);
      clearStageTimeout();
      clearResultTimeout();

      if (cadenceFrame.current !== null) window.cancelAnimationFrame(cadenceFrame.current);
      if (chromeIdleTimeout.current !== null) window.clearTimeout(chromeIdleTimeout.current);

      const root = document.documentElement;
      delete root.dataset.testActive;
      delete root.dataset.cadenceActive;
      root.style.removeProperty("--chrome-cadence-energy");
      root.style.removeProperty("--chrome-cadence-speed");
      root.style.removeProperty("--chrome-cadence-consistency");
    };
  }, [clearResultTimeout, clearStageTimeout]);

  useEffect(() => {
    document.documentElement.dataset.testActive = active ? "true" : "false";
  }, [active]);

  useEffect(() => {
    clearResultTimeout();

    if (!test.lastResult) {
      setResultPhase("idle");
      return;
    }

    if (settings.reducedMotion) {
      setResultPhase("revealed");
      return;
    }

    setResultPhase("compressing");
    resultTimeout.current = window.setTimeout(() => {
      setResultPhase("revealed");
      resultTimeout.current = null;
    }, 205);
  }, [clearResultTimeout, settings.reducedMotion, test.lastResult]);

  useEffect(() => {
    if (overlayOpen) test.pause();
  }, [overlayOpen, test.pause]);

  useEffect(() => {
    const targetChanged = previousTarget.current !== test.target;
    previousTarget.current = test.target;

    if (!targetChanged) return;

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
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (cadenceFrame.current !== null) window.cancelAnimationFrame(cadenceFrame.current);
    if (chromeIdleTimeout.current !== null) {
      window.clearTimeout(chromeIdleTimeout.current);
      chromeIdleTimeout.current = null;
    }

    cadenceFrame.current = window.requestAnimationFrame(() => {
      const enabled = settings.cadenceEffects && !settings.reducedMotion;
      const energy = enabled ? test.cadence.energy.toFixed(3) : "0";
      const speed = enabled ? test.cadence.speed.toFixed(3) : "0";
      const consistency = enabled ? test.cadence.consistency.toFixed(3) : "1";
      const root = document.documentElement;
      const chromeActive = enabled && test.status === "running" && test.feedback.sequence > 0;

      stage.style.setProperty("--cadence-energy", energy);
      stage.style.setProperty("--cadence-speed", speed);
      stage.style.setProperty("--cadence-consistency", consistency);
      root.style.setProperty("--chrome-cadence-energy", chromeActive ? energy : "0");
      root.style.setProperty("--chrome-cadence-speed", chromeActive ? speed : "0");
      root.style.setProperty("--chrome-cadence-consistency", chromeActive ? consistency : "1");
      root.dataset.cadenceActive = chromeActive ? "true" : "false";

      if (chromeActive) {
        chromeIdleTimeout.current = window.setTimeout(() => {
          root.dataset.cadenceActive = "false";
          root.style.setProperty("--chrome-cadence-energy", "0");
          root.style.setProperty("--chrome-cadence-speed", "0");
          root.style.setProperty("--chrome-cadence-consistency", "1");
          chromeIdleTimeout.current = null;
        }, 300);
      }

      cadenceFrame.current = null;
    });
  }, [
    settings.cadenceEffects,
    settings.reducedMotion,
    test.cadence.consistency,
    test.cadence.energy,
    test.cadence.speed,
    test.feedback.sequence,
    test.status,
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
    if (refreshTimeout.current !== null) window.clearTimeout(refreshTimeout.current);

    setRefreshing(true);
    refreshTimeout.current = window.setTimeout(() => {
      setRefreshing(false);
      refreshTimeout.current = null;
    }, 520);

    clearStageTimeout();
    clearResultTimeout();
    setResultPhase("idle");

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
  }, [clearResultTimeout, clearStageTimeout, settings.reducedMotion, test.reset]);

  return (
    <div
      className="view-practice"
      data-status={test.status}
      data-has-result={hasResult}
      data-result-phase={resultPhase}
      data-stage-phase={stagePhase}
      data-mode={configuration.mode}
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
            showLiveStats={settings.liveStats && !configuration.noLiveWpm}
            cadence={test.cadence}
            ghostProgress={test.ghostProgress}
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

        {test.lastResult && resultPhase === "revealed" && (
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
