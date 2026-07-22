import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TestResult } from "../../app/app.types";
import { calculateCadence } from "../../core/scoring/calculateConsistency";
import {
  calculateMetrics,
  calculateProgress,
  createPerformanceSample,
} from "../../core/typing/metrics";
import type {
  CadenceMetrics,
  PerformanceSample,
  TestConfiguration,
  TestStatus,
  TypingEvent,
  TypingFeedback,
  TypingSessionStats,
  WordJudgement,
} from "../../core/typing/types";
import { createTarget } from "../../core/typing/typingEngine";
import {
  applyTypingEvents,
  createRestartEvent,
  createTargetPositions,
  createTypingEvents,
  emptyTypingSessionStats,
  getTypingImpact,
} from "../../core/typing/typingEvents";
import { collectNewJudgements, finalizeLastWordJudgement } from "../../core/typing/wordJudgements";
import { createTestResult } from "./createTestResult";
import { emptyCadence, emptyFeedback } from "./testDefaults";
import { useActiveTimer } from "./useActiveTimer";

interface UseTypingTestOptions {
  configuration: TestConfiguration;
  previousBestWpm: number;
  previousBestCombo: number;
  onComplete: (result: TestResult) => void;
}

export function useTypingTest({
  configuration,
  previousBestWpm,
  previousBestCombo,
  onComplete,
}: UseTypingTestOptions) {
  const [target, setTarget] = useState(() => createTarget(configuration));
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<TestStatus>("ready");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stats, setStats] = useState<TypingSessionStats>(emptyTypingSessionStats);
  const [correctedIndices, setCorrectedIndices] = useState<ReadonlySet<number>>(new Set());
  const [cadence, setCadence] = useState<CadenceMetrics>(emptyCadence);
  const [feedback, setFeedback] = useState<TypingFeedback>(emptyFeedback);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);

  const {
    reset: resetTimer,
    start: startTimer,
    pause: pauseTimer,
    resume: resumeTimer,
    getElapsed,
  } = useActiveTimer();
  const inputRef = useRef("");
  const statusRef = useRef<TestStatus>("ready");
  const statsRef = useRef<TypingSessionStats>(emptyTypingSessionStats);
  const eventsRef = useRef<TypingEvent[]>([]);
  const incorrectIndicesRef = useRef(new Set<number>());
  const correctedIndicesRef = useRef(new Set<number>());
  const judgementsRef = useRef<WordJudgement[]>([]);
  const judgedWordsRef = useRef(new Set<number>());
  const samplesRef = useRef<PerformanceSample[]>([]);
  const lastSampleAtRef = useRef(0);
  const eventSequenceRef = useRef(1);
  const feedbackSequenceRef = useRef(0);
  const targetRef = useRef(target);
  const targetPositionsRef = useRef(createTargetPositions(target));

  const changeStatus = useCallback((nextStatus: TestStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const finishTest = useCallback(
    (finalInput: string, finalElapsedMs: number) => {
      if (statusRef.current === "complete") {
        return;
      }

      const lastJudgement = finalizeLastWordJudgement(
        judgedWordsRef.current,
        finalInput,
        targetRef.current,
        eventsRef.current,
        finalElapsedMs,
      );
      const finalJudgements = lastJudgement
        ? [...judgementsRef.current, lastJudgement]
        : [...judgementsRef.current];

      if (lastJudgement) {
        judgedWordsRef.current.add(lastJudgement.wordIndex);
        judgementsRef.current = finalJudgements;
      }

      const metrics = calculateMetrics(
        finalInput,
        targetRef.current,
        finalElapsedMs,
        eventsRef.current,
        statsRef.current,
      );
      const result = createTestResult({
        configuration,
        elapsedMs: finalElapsedMs,
        events: [...eventsRef.current],
        judgements: finalJudgements,
        metrics,
        previousBestWpm,
        samples: samplesRef.current,
        target: targetRef.current,
      });

      samplesRef.current = result.performanceSamples;
      setElapsedMs(finalElapsedMs);
      changeStatus("complete");
      setLastResult(result);
      onComplete(result);
    },
    [changeStatus, configuration, onComplete, previousBestWpm],
  );

  const reset = useCallback(() => {
    const nextTarget = createTarget(configuration);
    const restartEvent = createRestartEvent(performance.now());

    inputRef.current = "";
    statusRef.current = "ready";
    statsRef.current = { ...emptyTypingSessionStats };
    eventsRef.current = [restartEvent];
    incorrectIndicesRef.current = new Set<number>();
    correctedIndicesRef.current = new Set<number>();
    judgementsRef.current = [];
    judgedWordsRef.current = new Set<number>();
    samplesRef.current = [];
    lastSampleAtRef.current = 0;
    eventSequenceRef.current = 1;
    feedbackSequenceRef.current = 0;
    targetRef.current = nextTarget;
    targetPositionsRef.current = createTargetPositions(nextTarget);
    resetTimer();

    setTarget(nextTarget);
    setInput("");
    setStatus("ready");
    setElapsedMs(0);
    setStats({ ...emptyTypingSessionStats });
    setCorrectedIndices(new Set());
    setCadence(emptyCadence);
    setFeedback(emptyFeedback);
    setLastResult(null);
  }, [configuration, resetTimer]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      const currentElapsedMs = getElapsed();
      setElapsedMs(currentElapsedMs);

      if (currentElapsedMs - lastSampleAtRef.current >= 250) {
        const currentMetrics = calculateMetrics(
          inputRef.current,
          targetRef.current,
          currentElapsedMs,
          eventsRef.current,
          statsRef.current,
          true,
        );
        samplesRef.current.push(createPerformanceSample(currentElapsedMs, currentMetrics));
        lastSampleAtRef.current = currentElapsedMs;
      }

      const timeLimitMs = configuration.value * 1000;

      if (configuration.mode === "time" && currentElapsedMs >= timeLimitMs) {
        finishTest(inputRef.current, timeLimitMs);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [configuration.mode, configuration.value, finishTest, getElapsed, status]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") {
      return;
    }

    pauseTimer(performance.now());
    changeStatus("paused");
  }, [changeStatus, pauseTimer]);

  useEffect(() => {
    window.addEventListener("blur", pause);
    return () => window.removeEventListener("blur", pause);
  }, [pause]);

  const updateInput = useCallback(
    (nextValue: string) => {
      if (statusRef.current === "complete") {
        return emptyFeedback;
      }

      const limitedValue = nextValue.slice(0, targetRef.current.length);
      const previousInput = inputRef.current;

      if (configuration.noBackspace && limitedValue.length < previousInput.length) {
        return emptyFeedback;
      }

      if (limitedValue === previousInput) {
        return emptyFeedback;
      }

      const now = performance.now();
      const timeLimitMs = configuration.value * 1000;
      const currentElapsedMs = getElapsed(now);

      if (
        configuration.mode === "time" &&
        statusRef.current === "running" &&
        currentElapsedMs >= timeLimitMs
      ) {
        finishTest(inputRef.current, timeLimitMs);
        return emptyFeedback;
      }

      const started = statusRef.current === "ready" && limitedValue.length > 0;

      if (started) {
        startTimer(now);
        changeStatus("running");
      } else if (statusRef.current === "paused") {
        resumeTimer(now);
        changeStatus("running");
      }

      const activeTimestamp = started ? 0 : getElapsed(now);
      const newEvents = createTypingEvents({
        previousInput,
        nextInput: limitedValue,
        target: targetRef.current,
        targetPositions: targetPositionsRef.current,
        timestamp: activeTimestamp,
        sequenceStart: eventSequenceRef.current,
      });
      eventsRef.current.push(...newEvents);
      const eventResult = applyTypingEvents(statsRef.current, newEvents);
      const newJudgements = collectNewJudgements(
        judgedWordsRef.current,
        newEvents,
        eventsRef.current,
        limitedValue,
        targetRef.current,
        activeTimestamp,
      );

      eventSequenceRef.current += newEvents.length;

      let correctedChanged = false;

      for (const event of newEvents) {
        if (event.type === "restart" || event.type === "backspace") {
          continue;
        }

        if (!event.correct) {
          incorrectIndicesRef.current.add(event.targetIndex);
          continue;
        }

        if (
          incorrectIndicesRef.current.has(event.targetIndex) &&
          !correctedIndicesRef.current.has(event.targetIndex)
        ) {
          correctedIndicesRef.current.add(event.targetIndex);
          correctedChanged = true;
        }
      }

      for (const judgement of newJudgements) {
        judgedWordsRef.current.add(judgement.wordIndex);
      }

      judgementsRef.current.push(...newJudgements);
      const nextCadence = calculateCadence(eventsRef.current);
      const comboRecordTarget = Math.max(10, previousBestCombo + 1);
      const comboRecord =
        eventResult.stats.maxCombo >= comboRecordTarget &&
        statsRef.current.maxCombo < comboRecordTarget
          ? eventResult.stats.maxCombo
          : null;
      const nextFeedback: TypingFeedback = {
        sequence: feedbackSequenceRef.current + 1,
        impact: getTypingImpact(newEvents),
        started,
        wordJudgement: newJudgements.at(-1) ?? null,
        comboMilestone: eventResult.comboMilestone,
        comboBreak: eventResult.comboBreak,
        comboRecord,
      };

      feedbackSequenceRef.current = nextFeedback.sequence;
      inputRef.current = limitedValue;
      statsRef.current = eventResult.stats;

      setInput(limitedValue);
      setStats(eventResult.stats);
      setCadence(nextCadence);
      setFeedback(nextFeedback);

      if (correctedChanged) {
        setCorrectedIndices(new Set(correctedIndicesRef.current));
      }

      if (configuration.mode === "words" && limitedValue.length >= targetRef.current.length) {
        finishTest(limitedValue, getElapsed(now));
      }

      return nextFeedback;
    },
    [
      changeStatus,
      configuration.mode,
      configuration.noBackspace,
      configuration.value,
      finishTest,
      getElapsed,
      previousBestCombo,
      resumeTimer,
      startTimer,
    ],
  );

  const metrics = useMemo(
    () =>
      calculateMetrics(
        input,
        target,
        elapsedMs,
        eventsRef.current,
        stats,
        status !== "complete",
        status === "complete" ? undefined : Math.round(cadence.consistency * 100),
      ),
    [cadence.consistency, elapsedMs, input, stats, status, target],
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
    correctedIndices,
    cadence,
    feedback,
    lastResult,
    updateInput,
    reset,
    pause,
  };
}
