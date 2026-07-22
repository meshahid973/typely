import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TestResult } from "../../app/app.types";
import type { KeystrokeStats, TestConfiguration, TestStatus } from "./practice.types";
import {
  calculateMetrics,
  calculateProgress,
  createTarget,
  emptyKeystrokeStats,
  recordKeystrokes,
} from "./practice.utils";

interface UseTypingTestOptions {
  configuration: TestConfiguration;
  onComplete: (result: TestResult) => void;
}

function freshKeystrokeStats(): KeystrokeStats {
  return { ...emptyKeystrokeStats };
}

export function useTypingTest({ configuration, onComplete }: UseTypingTestOptions) {
  const [target, setTarget] = useState(() => createTarget(configuration));
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<TestStatus>("ready");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [keystrokes, setKeystrokes] = useState<KeystrokeStats>(freshKeystrokeStats);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const totalPausedRef = useRef(0);
  const inputRef = useRef("");
  const keystrokesRef = useRef<KeystrokeStats>(freshKeystrokeStats());
  const statusRef = useRef<TestStatus>("ready");

  const setCurrentStatus = useCallback((next: TestStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const getElapsed = useCallback((now = performance.now()) => {
    if (startedAtRef.current === null) {
      return 0;
    }

    const activePause = pausedAtRef.current === null ? 0 : now - pausedAtRef.current;
    return Math.max(0, now - startedAtRef.current - totalPausedRef.current - activePause);
  }, []);

  const finish = useCallback(
    (finalInput: string, finalElapsed: number) => {
      if (statusRef.current === "complete") {
        return;
      }

      const metrics = calculateMetrics(finalInput, target, finalElapsed, keystrokesRef.current);
      const result: TestResult = {
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
        mode: configuration.mode,
        modeValue: configuration.value,
        durationMs: finalElapsed,
        wpm: metrics.wpm,
        rawWpm: metrics.rawWpm,
        accuracy: metrics.accuracy,
        correctCharacters: metrics.correctCharacters,
        incorrectCharacters: metrics.incorrectCharacters,
        totalCharacters: metrics.totalCharacters,
        correctKeystrokes: metrics.correctKeystrokes,
        incorrectKeystrokes: metrics.incorrectKeystrokes,
        maxCombo: metrics.maxCombo,
        punctuation: configuration.punctuation,
        numbers: configuration.numbers,
      };

      setElapsedMs(finalElapsed);
      setCurrentStatus("complete");
      setLastResult(result);
      onComplete(result);
    },
    [configuration, onComplete, setCurrentStatus, target],
  );

  const reset = useCallback(() => {
    const nextTarget = createTarget(configuration);
    const nextKeystrokes = freshKeystrokeStats();
    inputRef.current = "";
    keystrokesRef.current = nextKeystrokes;
    startedAtRef.current = null;
    pausedAtRef.current = null;
    totalPausedRef.current = 0;
    setTarget(nextTarget);
    setInput("");
    setKeystrokes(nextKeystrokes);
    setElapsedMs(0);
    setLastResult(null);
    setCurrentStatus("ready");
  }, [configuration, setCurrentStatus]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      const elapsed = getElapsed();
      setElapsedMs(elapsed);

      if (configuration.mode === "time" && elapsed >= configuration.value * 1000) {
        finish(inputRef.current, configuration.value * 1000);
      }
    }, 80);

    return () => window.clearInterval(interval);
  }, [configuration, finish, getElapsed, status]);

  useEffect(() => {
    const handleBlur = () => {
      if (statusRef.current === "running") {
        pausedAtRef.current = performance.now();
        setCurrentStatus("paused");
      }
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [setCurrentStatus]);

  const updateInput = useCallback(
    (nextValue: string) => {
      if (statusRef.current === "complete") {
        return;
      }

      const limitedValue = nextValue.slice(0, target.length);
      const previousInput = inputRef.current;
      const now = performance.now();

      if (statusRef.current === "ready" && limitedValue.length > 0) {
        startedAtRef.current = now;
        setCurrentStatus("running");
      }

      if (statusRef.current === "paused") {
        if (pausedAtRef.current !== null) {
          totalPausedRef.current += now - pausedAtRef.current;
        }
        pausedAtRef.current = null;
        setCurrentStatus("running");
      }

      const nextKeystrokes = recordKeystrokes(
        previousInput,
        limitedValue,
        target,
        keystrokesRef.current,
      );

      inputRef.current = limitedValue;
      keystrokesRef.current = nextKeystrokes;
      setInput(limitedValue);
      setKeystrokes(nextKeystrokes);

      if (configuration.mode === "words" && limitedValue.length >= target.length) {
        finish(limitedValue, getElapsed(now));
      }
    },
    [configuration.mode, finish, getElapsed, setCurrentStatus, target],
  );

  const metrics = useMemo(
    () => calculateMetrics(input, target, elapsedMs, keystrokes, status !== "complete"),
    [elapsedMs, input, keystrokes, status, target],
  );
  const progress = useMemo(
    () => calculateProgress(configuration, input.length, target.length, elapsedMs),
    [configuration, elapsedMs, input.length, target.length],
  );

  return {
    target,
    input,
    status,
    elapsedMs,
    metrics,
    progress,
    lastResult,
    updateInput,
    reset,
  };
}
