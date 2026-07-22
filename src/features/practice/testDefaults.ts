import type { CadenceMetrics, TypingFeedback } from "../../core/typing/types";

export const emptyCadence: CadenceMetrics = {
  energy: 0,
  speed: 0,
  consistency: 1,
  averageIntervalMs: 0,
};

export const emptyFeedback: TypingFeedback = {
  sequence: 0,
  impact: "none",
  started: false,
  wordJudgement: null,
  comboMilestone: null,
  comboBreak: null,
  comboRecord: null,
};
