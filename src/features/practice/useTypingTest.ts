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
  createTargetPositions,
  createTypingEvents,
  emptyTypingSessionStats,
} from "../../core/typing/typingEvents";
import { collectNewJudgements, finalizeLastWordJudgement } from "../../core/typing/wordJudgements";
import {
  createRestartEvent,
  createTestResult,
  emptyCadence,
  emptyFeedback,
  impactFromEvents,
} from "./typingTestHelpers";
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
  const [events, setEvents] = useState<TypingEvent[]>([]);
  const [judgements, setJudgements] = useState<WordJudgement[]>([]);
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
  const statsRef = useRef<TypingSessionStats>(emptyTypingSessionStats);
  const eventsRef = useRef<TypingEvent[]>([]);
  const judgementsRef = useRef<WordJudgement[]>([]);
  const judgedWordsRef = useRef(new Set<number>());
  const samplesRef = useRef<PerformanceSample[]>([]);
  const lastSampleAtRef = useRef(0);
  const eventSequenceRef = useRef(1);
  const feedbackSequenceRef = useRef(0);
  const statusRef = useRef<TestStatus>("ready");
  const targetRef = useRef(target);
  const targetPositionsRef = useRef(createTargetPositions(target));

  const setCurrentStatus = useCallback((next: TestStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const finish = useCallback(
    (finalInput: string, finalElapsed: number) => {
      if (statusRef.current === "complete") {
        return;
      }

      const timestamp = finalElapsed;
      const finalJudgement = finalizeLastWordJudgement(
        judgedWordsRef.current,
        finalInput,
        targetRef.current,
        eventsRef.current,
        timestamp,
      );
      const finalJudgements = finalJudgement
        ? [...judgementsRef.current, finalJudgement]
        : judgementsRef.current;

      if (finalJudgement) {
        judgedWordsRef.current.add(finalJudgement.wordIndex);
        judgementsRef.current = finalJudgements;
        setJudgements(finalJudgements);
      }

      const metrics = calculateMetrics(
        finalInput,
        targetRef.current,
        finalElapsed,
        eventsRef.current,
        statsRef.current,
      );
      const result = createTestResult({
        configuration,
        elapsedMs: finalElapsed,
        events: eventsRef.current,
        input: finalInput,
        judgements: finalJudgements,
        metrics,
        previousBestWpm,
        samples: samplesRef.current,
        target: targetRef.current,
      });

      samplesRef.current = result.performanceSamples;
      setElapsedMs(finalElapsed);
      setCurrentStatus("complete");
      setLastResult(result);
      onComplete(result);
    },
    [configuration, onComplete, previousBestWpm, setCurrentStatus],
  );

  const reset = useCallback(() => {
    const nextTarget = createTarget(configuration);
    const now = performance.now();
    const initialEvents = [createRestartEvent(now)];

    inputRef.current = "";
    statsRef.current = { ...emptyTypingSessionStats };
    eventsRef.current = initialEvents;
    judgementsRef.current = [];
    judgedWordsRef.current = new Set<number>();
    samplesRef.current = [];
    lastSampleAtRef.current = 0;
    eventSequenceRef.current = 1;
    feedbackSequenceRef.current = 0;
    resetTimer();
    targetRef.current = nextTarget;
    targetPositionsRef.current = createTargetPositions(nextTarget);

    setTarget(nextTarget);
    setInput("");
    setStats({ ...emptyTypingSessionStats });
    setEvents(initialEvents);
    setJudgements([]);
    setCadence(emptyCadence);
    setFeedback(emptyFeedback);
    setElapsedMs(0);
    setLastResult(null);
    setCurrentStatus("ready");
  }, [configuration, resetTimer, setCurrentStatus]);

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

      if (elapsed - lastSampleAtRef.current >= 250) {
        const currentMetrics = calculateMetrics(
          inputRef.current,
          targetRef.current,
          elapsed,
          eventsRef.current,
          statsRef.current,
          true,
        );
        samplesRef.current.push(createPerformanceSample(elapsed, currentMetrics));
        lastSampleAtRef.current = elapsed;
      }

      if (configuration.mode === "time" && elapsed >= configuration.value * 1000) {
        finish(inputRef.current, configuration.value * 1000);
      }
    }, 80);

    return () => window.clearInterval(interval);
  }, [configuration.mode, configuration.value, finish, getElapsed, status]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") {
      return;
    }

    pauseTimer(performance.now());
    setCurrentStatus("paused");
  }, [pauseTimer, setCurrentStatus]);

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
      const activeElapsed = getElapsed(now);

      if (
        configuration.mode === "time" &&
        statusRef.current === "running" &&
        activeElapsed >= configuration.value * 1000
      ) {
        finish(inputRef.current, configuration.value * 1000);
        return emptyFeedback;
      }

      const started = statusRef.current === "ready" && limitedValue.length > 0;

      if (started) {
        startTimer(now);
        setCurrentStatus("running");
      }

      if (statusRef.current === "paused") {
        resumeTimer(now);
        setCurrentStatus("running");
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
      eventSequenceRef.current += newEvents.length;
      const allEvents = [...eventsRef.current, ...newEvents];
      const eventResult = applyTypingEvents(statsRef.current, newEvents);
      const newJudgements = collectNewJudgements(
        judgedWordsRef.current,
        newEvents,
        allEvents,
        limitedValue,
        targetRef.current,
        activeTimestamp,
      );

      for (const judgement of newJudgements) {
        judgedWordsRef.current.add(judgement.wordIndex);
      }

      const allJudgements = [...judgementsRef.current, ...newJudgements];
      const nextCadence = calculateCadence(allEvents);
      const comboRecordThreshold = Math.max(10, previousBestCombo + 1);
      const nextComboRecord =
        eventResult.stats.maxCombo >= comboRecordThreshold &&
        statsRef.current.maxCombo < comboRecordThreshold
          ? eventResult.stats.maxCombo
          : null;
      const nextFeedback: TypingFeedback = {
        sequence: feedbackSequenceRef.current + 1,
        impact: impactFromEvents(newEvents),
        started,
        wordJudgement: newJudgements.at(-1) ?? null,
        comboMilestone: eventResult.comboMilestone,
        comboBreak: eventResult.comboBreak,
        comboRecord: nextComboRecord,
      };
      feedbackSequenceRef.current = nextFeedback.sequence;

      inputRef.current = limitedValue;
      eventsRef.current = allEvents;
      statsRef.current = eventResult.stats;
      judgementsRef.current = allJudgements;

      setInput(limitedValue);
      setEvents(allEvents);
      setStats(eventResult.stats);
      setJudgements(allJudgements);
      setCadence(nextCadence);
      setFeedback(nextFeedback);

      if (configuration.mode === "words" && limitedValue.length >= targetRef.current.length) {
        finish(limitedValue, getElapsed(now));
      }

      return nextFeedback;
    },
    [
      configuration.mode,
      configuration.noBackspace,
      finish,
      getElapsed,
      previousBestCombo,
      resumeTimer,
      setCurrentStatus,
      startTimer,
    ],
  );

  const metrics = useMemo(
    () => calculateMetrics(input, target, elapsedMs, events, stats, status !== "complete"),
    [elapsedMs, events, input, stats, status, target],
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
    events,
    judgements,
    cadence,
    feedback,
    lastResult,
    updateInput,
    reset,
    pause,
  };
}
