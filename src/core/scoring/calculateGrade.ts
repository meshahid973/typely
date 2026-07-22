import type { TestMetrics, WordJudgement } from "../typing/types";
import type { Grade } from "./types";

export function calculateGrade(
  metrics: Pick<TestMetrics, "accuracy">,
  judgements: WordJudgement[],
): Grade {
  const missedWords = judgements.some((judgement) => judgement.type === "miss");

  if (metrics.accuracy === 100 && !missedWords) {
    return "SS";
  }

  if (metrics.accuracy >= 98) {
    return "S";
  }

  if (metrics.accuracy >= 95) {
    return "A";
  }

  if (metrics.accuracy >= 90) {
    return "B";
  }

  if (metrics.accuracy >= 80) {
    return "C";
  }

  return "D";
}
