import type { TestResult } from "../../app/app.types";

export interface LetterInsight {
  character: string;
  attempts: number;
  mistakes: number;
  accuracy: number;
}

export interface ModeInsight {
  id: string;
  label: string;
  tests: number;
  averageWpm: number;
  averageAccuracy: number;
}

export interface InsightSummary {
  total: number;
  averageWpm: number;
  averageAccuracy: number;
  averageConsistency: number;
  bestWpm: number;
  bestCombo: number;
  totalDuration: number;
  recentWpmChange: number | null;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function createInsightSummary(results: TestResult[]): InsightSummary | null {
  if (results.length === 0) {
    return null;
  }

  const recent = results.slice(0, Math.min(5, results.length));
  const previous = results.slice(5, 10);
  const recentAverage = average(recent.map((result) => result.wpm));
  const previousAverage = average(previous.map((result) => result.wpm));

  return {
    total: results.length,
    averageWpm: Math.round(average(results.map((result) => result.wpm))),
    averageAccuracy: Math.round(average(results.map((result) => result.accuracy)) * 10) / 10,
    averageConsistency: Math.round(average(results.map((result) => result.consistency))),
    bestWpm: Math.max(...results.map((result) => result.wpm)),
    bestCombo: Math.max(...results.map((result) => result.maxCombo)),
    totalDuration: results.reduce((sum, result) => sum + result.durationMs, 0),
    recentWpmChange:
      previous.length === 0 ? null : Math.round((recentAverage - previousAverage) * 10) / 10,
  };
}

export function createLetterInsights(results: TestResult[]) {
  const letters = new Map<string, { attempts: number; mistakes: number }>();

  for (const result of results) {
    for (const event of result.typingEvents) {
      if (event.type === "backspace" || event.type === "restart") {
        continue;
      }

      const expected = event.expectedCharacter?.toLowerCase();

      if (!expected || !/^[a-z0-9]$/.test(expected)) {
        continue;
      }

      const current = letters.get(expected) ?? { attempts: 0, mistakes: 0 };
      current.attempts += 1;
      current.mistakes += event.correct ? 0 : 1;
      letters.set(expected, current);
    }
  }

  const values: LetterInsight[] = Array.from(letters, ([character, value]) => ({
    character,
    attempts: value.attempts,
    mistakes: value.mistakes,
    accuracy: Math.round(((value.attempts - value.mistakes) / value.attempts) * 1000) / 10,
  })).filter((item) => item.attempts >= 2);

  const weak = [...values]
    .filter((item) => item.mistakes > 0)
    .sort((left, right) => right.mistakes / right.attempts - left.mistakes / left.attempts)
    .slice(0, 6);
  const strong = [...values]
    .sort((left, right) => right.accuracy - left.accuracy || right.attempts - left.attempts)
    .slice(0, 6);

  return { weak, strong };
}

export function createModeInsights(results: TestResult[]): ModeInsight[] {
  const groups = new Map<string, TestResult[]>();

  for (const result of results) {
    const id = `${result.mode}-${result.modeValue}`;
    const group = groups.get(id) ?? [];
    group.push(result);
    groups.set(id, group);
  }

  return Array.from(groups, ([id, group]) => ({
    id,
    label: `${group[0].modeValue} ${group[0].mode === "time" ? "seconds" : "words"}`,
    tests: group.length,
    averageWpm: Math.round(average(group.map((result) => result.wpm))),
    averageAccuracy: Math.round(average(group.map((result) => result.accuracy)) * 10) / 10,
  }))
    .sort((left, right) => right.tests - left.tests || right.averageWpm - left.averageWpm)
    .slice(0, 5);
}

export function createTrendValues(results: TestResult[], key: "wpm" | "accuracy" | "consistency") {
  return results
    .slice(0, 20)
    .reverse()
    .map((result) => result[key]);
}
