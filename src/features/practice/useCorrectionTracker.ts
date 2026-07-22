import { useCallback, useRef, useState } from "react";

export function useCorrectionTracker(target: string, input: string) {
  const incorrectHistory = useRef(new Set<number>());
  const [correctedIndices, setCorrectedIndices] = useState(() => new Set<number>());

  const trackCorrections = useCallback(
    (nextValue: string) => {
      const nextCorrected = new Set(correctedIndices);
      const comparisonLength = Math.min(input.length, nextValue.length);
      let changedAt = 0;

      while (changedAt < comparisonLength && input[changedAt] === nextValue[changedAt]) {
        changedAt += 1;
      }

      for (let index = changedAt; index < nextValue.length; index += 1) {
        if (nextValue[index] !== target[index]) {
          incorrectHistory.current.add(index);
        } else if (incorrectHistory.current.has(index)) {
          nextCorrected.add(index);
        }
      }

      setCorrectedIndices(nextCorrected);
    },
    [correctedIndices, input, target],
  );

  return {
    correctedIndices,
    trackCorrections,
  };
}
