import type { TestResult } from "../../app/app.types";
import type { Grade } from "../../core/scoring/types";
import type { TestMode } from "../../core/typing/types";

export type ModeFilter = "all" | TestMode;
export type GradeFilter = "all" | Grade;

export interface HistoryFilterState {
  mode: ModeFilter;
  grade: GradeFilter;
  modifiersOnly: boolean;
}

export const defaultHistoryFilters: HistoryFilterState = {
  mode: "all",
  grade: "all",
  modifiersOnly: false,
};

export function hasModifiers(result: TestResult) {
  const configuration = result.configuration;
  return (
    configuration.punctuation ||
    configuration.numbers ||
    configuration.capitals ||
    configuration.noBackspace ||
    configuration.hidden
  );
}

export function filterHistoryResults(results: TestResult[], filters: HistoryFilterState) {
  return results.filter((result) => {
    if (filters.mode !== "all" && result.mode !== filters.mode) {
      return false;
    }

    if (filters.grade !== "all" && result.grade !== filters.grade) {
      return false;
    }

    if (filters.modifiersOnly && !hasModifiers(result)) {
      return false;
    }

    return true;
  });
}
