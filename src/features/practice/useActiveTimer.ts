import { useCallback, useRef } from "react";

export function useActiveTimer() {
  const startedAt = useRef<number | null>(null);
  const pausedAt = useRef<number | null>(null);
  const totalPaused = useRef(0);

  const reset = useCallback(() => {
    startedAt.current = null;
    pausedAt.current = null;
    totalPaused.current = 0;
  }, []);

  const start = useCallback((timestamp: number) => {
    startedAt.current = timestamp;
    pausedAt.current = null;
    totalPaused.current = 0;
  }, []);

  const pause = useCallback((timestamp: number) => {
    if (startedAt.current !== null && pausedAt.current === null) {
      pausedAt.current = timestamp;
    }
  }, []);

  const resume = useCallback((timestamp: number) => {
    if (pausedAt.current !== null) {
      totalPaused.current += timestamp - pausedAt.current;
      pausedAt.current = null;
    }
  }, []);

  const getElapsed = useCallback((timestamp = performance.now()) => {
    if (startedAt.current === null) {
      return 0;
    }

    const currentPause = pausedAt.current === null ? 0 : timestamp - pausedAt.current;
    return Math.max(0, timestamp - startedAt.current - totalPaused.current - currentPause);
  }, []);

  return { reset, start, pause, resume, getElapsed };
}
