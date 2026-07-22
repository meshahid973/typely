import type { TestConfiguration, TestMetrics, WordJudgement } from "../typing/types";
import type { JudgementCounts, ScoreBreakdown } from "./types";

export function countJudgements(judgements: WordJudgement[]): JudgementCounts {
  const counts: JudgementCounts = {
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
  };

  for (const judgement of judgements) {
    counts[judgement.type] += 1;
  }

  return counts;
}

export function calculateModifierMultiplier(configuration: TestConfiguration) {
  let multiplier = 1;

  if (configuration.numbers) multiplier *= 1.05;
  if (configuration.punctuation) multiplier *= 1.08;
  if (configuration.capitals) multiplier *= 1.04;
  if (configuration.noBackspace) multiplier *= 1.15;
  if (configuration.hidden) multiplier *= 1.2;

  return Math.round(multiplier * 1000) / 1000;
}

export function calculateScore(
  metrics: TestMetrics,
  judgements: WordJudgement[],
  configuration: TestConfiguration,
): ScoreBreakdown {
  const counts = countJudgements(judgements);
  const baseScore =
    metrics.correctKeystrokes * 100 +
    counts.perfect * 50 +
    counts.great * 25 +
    metrics.maxCombo * 5;
  const accuracyMultiplier = (metrics.accuracy / 100) ** 3;
  const consistencyMultiplier = 0.75 + metrics.consistency / 400;
  const modifierMultiplier = calculateModifierMultiplier(configuration);
  const finalScore = Math.max(
    0,
    Math.round(baseScore * accuracyMultiplier * consistencyMultiplier * modifierMultiplier),
  );
  const xpEarned = Math.max(1, Math.min(2500, Math.round(finalScore / 120)));

  return {
    baseScore,
    accuracyMultiplier,
    consistencyMultiplier,
    modifierMultiplier,
    finalScore,
    xpEarned,
  };
}
