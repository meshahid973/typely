import { BarChart3, Clock3, Gauge, Keyboard, Target } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "../../app/AppProvider";
import type { TestResult } from "../../app/app.types";
import { AnimatedValue } from "../../components/ui/AnimatedValue";
import { GameButton } from "../../components/ui/GameButton";
import { ProgressLine } from "../../components/ui/ProgressLine";
import { formatDuration } from "../../utils/format";

interface InsightSummary {
  total: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestCombo: number;
  totalDuration: number;
  latestWpm: number;
}

function createSummary(results: TestResult[]): InsightSummary | null {
  if (results.length === 0) {
    return null;
  }

  const total = results.length;
  const averageWpm = Math.round(results.reduce((sum, result) => sum + result.wpm, 0) / total);
  const averageAccuracy =
    Math.round((results.reduce((sum, result) => sum + result.accuracy, 0) / total) * 10) / 10;
  const bestWpm = Math.max(...results.map((result) => result.wpm));
  const bestCombo = Math.max(...results.map((result) => result.maxCombo));
  const totalDuration = results.reduce((sum, result) => sum + result.durationMs, 0);

  return {
    total,
    averageWpm,
    averageAccuracy,
    bestWpm,
    bestCombo,
    totalDuration,
    latestWpm: results[0].wpm,
  };
}

export function InsightsScreen() {
  const { results, setView } = useApp();
  const summary = useMemo(() => createSummary(results), [results]);

  return (
    <div className="view general-view insights-view">
      <header className="view-heading">
        <div>
          <span className="view-eyebrow">your progress</span>
          <h1>Insights</h1>
          <p>A focused overview built only from completed tests.</p>
        </div>
      </header>

      {!summary ? (
        <section className="empty-state" aria-labelledby="insights-empty-heading">
          <BarChart3 size={27} />
          <h2 id="insights-empty-heading">Not enough data</h2>
          <p>Complete a few tests to build your overview.</p>
          <GameButton onClick={() => setView("practice")}>start typing</GameButton>
        </section>
      ) : (
        <section className="insight-overview" aria-label="Typing performance overview">
          <article className="insight-main-card">
            <div className="insight-card-heading">
              <div>
                <span>best speed</span>
                <small>your fastest completed test</small>
              </div>
              <Gauge size={20} aria-hidden="true" />
            </div>
            <div className="insight-main-value">
              <AnimatedValue as="strong" value={summary.bestWpm} />
              <span>wpm</span>
            </div>
            <div className="insight-performance-line">
              <div>
                <span>average pace</span>
                <strong>{summary.averageWpm} wpm</strong>
              </div>
              <ProgressLine value={summary.averageWpm / Math.max(1, summary.bestWpm)} />
            </div>
          </article>

          <div className="insight-side-grid">
            <article className="insight-card">
              <div className="insight-card-heading">
                <span>accuracy</span>
                <Target size={17} aria-hidden="true" />
              </div>
              <AnimatedValue as="strong" value={`${summary.averageAccuracy}%`} />
              <small>average across all tests</small>
            </article>
            <article className="insight-card">
              <div className="insight-card-heading">
                <span>completed</span>
                <Keyboard size={17} aria-hidden="true" />
              </div>
              <AnimatedValue as="strong" value={summary.total} />
              <small>{summary.total === 1 ? "test" : "tests"} stored locally</small>
            </article>
          </div>

          <div className="insight-compact-grid">
            <article className="insight-compact-card">
              <span>best combo</span>
              <AnimatedValue as="strong" value={`${summary.bestCombo}×`} />
              <small>correct keys</small>
            </article>
            <article className="insight-compact-card">
              <span>practice time</span>
              <strong>{formatDuration(summary.totalDuration)}</strong>
              <small>completed sessions</small>
            </article>
            <article className="insight-compact-card">
              <span>latest result</span>
              <AnimatedValue as="strong" value={summary.latestWpm} />
              <small>wpm</small>
            </article>
          </div>

          <div className="insight-note">
            <Clock3 size={15} aria-hidden="true" />
            <span>More detailed trends unlock naturally as your local history grows.</span>
          </div>
        </section>
      )}
    </div>
  );
}
