import { Pause, Play, RotateCcw } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { TestResult } from "../../app/app.types";
import { IconButton } from "../../components/ui/IconButton";
import { cn } from "../../utils/cn";
import { formatDuration } from "../../utils/format";
import { buildReplayFrames, getReplayFrame } from "./replay";

interface ReplayPlayerProps {
  result: TestResult;
}

const speeds = [0.5, 1, 2];

export function ReplayPlayer({ result }: ReplayPlayerProps) {
  const frames = useMemo(() => buildReplayFrames(result.typingEvents), [result.typingEvents]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animationFrame = useRef<number | null>(null);
  const lastTime = useRef(0);
  const frame = getReplayFrame(frames, elapsedMs);
  const input = frame.input;
  const duration = Math.max(result.durationMs, frames.at(-1)?.timestamp ?? 0, 1);
  const sample = [...result.performanceSamples]
    .reverse()
    .find((candidate) => candidate.elapsedMs <= elapsedMs);
  const fastestSample = result.performanceSamples.reduce(
    (fastest, candidate) => (candidate.wpm > fastest.wpm ? candidate : fastest),
    result.performanceSamples[0] ?? { elapsedMs: 0, wpm: 0, rawWpm: 0, accuracy: 100, combo: 0 },
  );
  const firstMistake = result.typingEvents.find(
    (event) => event.type !== "backspace" && !event.correct,
  );
  const roughStart = Math.max(0, input.length - 90);
  const previousSpace = result.target.lastIndexOf(" ", roughStart);
  const visibleStart = previousSpace > 0 ? previousSpace + 1 : 0;
  const visibleEnd = Math.min(result.target.length, visibleStart + 250);
  const visibleTarget = result.target.slice(visibleStart, visibleEnd);

  useEffect(() => {
    if (!playing) {
      return;
    }

    lastTime.current = performance.now();

    const update = (now: number) => {
      const delta = (now - lastTime.current) * speed;
      lastTime.current = now;

      setElapsedMs((current) => {
        const next = Math.min(duration, current + delta);

        if (next >= duration) {
          setPlaying(false);
        }

        return next;
      });

      animationFrame.current = window.requestAnimationFrame(update);
    };

    animationFrame.current = window.requestAnimationFrame(update);

    return () => {
      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [duration, playing, speed]);

  if (result.target.length === 0 || result.typingEvents.length === 0) {
    return (
      <section className="replay-player replay-unavailable" aria-label="Typing replay unavailable">
        <strong>Replay unavailable</strong>
        <span>This older result was saved before detailed typing events were recorded.</span>
      </section>
    );
  }

  const togglePlayback = () => {
    if (elapsedMs >= duration) {
      setElapsedMs(0);
    }

    setPlaying((current) => !current);
  };

  return (
    <section className="replay-player" aria-label="Typing replay">
      <header className="replay-heading">
        <div>
          <span>session replay</span>
          <strong>
            {formatDuration(elapsedMs)} / {formatDuration(duration)}
          </strong>
        </div>
        <div className="replay-live-stats">
          <span>{sample?.wpm ?? 0} wpm</span>
          <span>{sample?.accuracy ?? 100}%</span>
          <span>{sample?.combo ?? 0}×</span>
        </div>
      </header>

      <div className="replay-copy" aria-hidden="true">
        {visibleStart > 0 && <span className="replay-ellipsis">… </span>}
        {Array.from(visibleTarget).map((character, localIndex) => {
          const index = visibleStart + localIndex;
          const typed = input[index];
          const state =
            index >= input.length ? "pending" : typed === character ? "correct" : "incorrect";

          return (
            <span
              key={`${result.id}-${index}`}
              className={cn(
                "replay-character",
                `is-${state}`,
                index === input.length && "is-active",
              )}
            >
              {character}
            </span>
          );
        })}
        {visibleEnd < result.target.length && <span className="replay-ellipsis"> …</span>}
      </div>

      <input
        className="replay-seek"
        type="range"
        min={0}
        max={duration}
        step={1}
        value={elapsedMs}
        aria-label="Replay position"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setPlaying(false);
          setElapsedMs(Number(event.target.value));
        }}
      />

      <div className="replay-markers">
        <span>
          fastest <strong>{fastestSample.wpm} wpm</strong> at{" "}
          {formatDuration(fastestSample.elapsedMs)}
        </span>
        <span>
          first mistake{" "}
          <strong>{firstMistake ? formatDuration(firstMistake.timestamp) : "none"}</strong>
        </span>
      </div>

      <footer className="replay-controls">
        <div>
          <IconButton label={playing ? "Pause replay" : "Play replay"} onClick={togglePlayback}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </IconButton>
          <IconButton
            label="Restart replay"
            onClick={() => {
              setPlaying(false);
              setElapsedMs(0);
            }}
          >
            <RotateCcw size={15} />
          </IconButton>
        </div>
        <fieldset className="replay-speed">
          <legend className="visually-hidden">Replay speed</legend>
          {speeds.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={speed === value}
              onClick={() => setSpeed(value)}
            >
              {value}×
            </button>
          ))}
        </fieldset>
      </footer>
    </section>
  );
}
