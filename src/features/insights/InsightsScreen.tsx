import { BarChart3, Clock3, Gauge, Keyboard, Target, Zap } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "../../app/AppProvider";
import { AnimatedValue } from "../../components/ui/AnimatedValue";
import { GameButton } from "../../components/ui/GameButton";
import { formatLongDuration } from "../../utils/format";
import {
  createInsightSummary,
  createLetterInsights,
  createModeInsights,
  createTrendValues,
} from "./insightCalculations";
import { TrendChart } from "./TrendChart";

export function InsightsScreen() {
  const { results, setView } = useApp();
  const summary = useMemo(() => createInsightSummary(results), [results]);
  const letters = useMemo(() => createLetterInsights(results), [results]);
  const modes = useMemo(() => createModeInsights(results), [results]);
  const wpmTrend = useMemo(() => createTrendValues(results, "wpm"), [results]);
  const accuracyTrend = useMemo(() => createTrendValues(results, "accuracy"), [results]);
  const consistencyTrend = useMemo(() => createTrendValues(results, "consistency"), [results]);

  return (
    <div className="view general-view insights-view">
      <header className="view-heading">
        <div>
          <span className="view-eyebrow">your progress</span>
          <h1>Insights</h1>
          <p>Real trends calculated only from completed local tests.</p>
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
        <div className="insights-layout">
          <section className="insights-summary" aria-label="Performance summary">
            <article className="insight-primary" data-accent="true">
              <div className="insight-heading-row">
                <div>
                  <span>best speed</span>
                  <small>your fastest completed run</small>
                </div>
                <Gauge size={19} aria-hidden="true" />
              </div>
              <div className="insight-primary-value">
                <AnimatedValue as="strong" value={summary.bestWpm} />
                <span>wpm</span>
              </div>
              <div className="insight-primary-foot">
                <span>average {summary.averageWpm} wpm</span>
                {summary.recentWpmChange !== null && (
                  <strong data-positive={summary.recentWpmChange >= 0}>
                    {summary.recentWpmChange >= 0 ? "+" : ""}
                    {summary.recentWpmChange} recent
                  </strong>
                )}
              </div>
            </article>

            <article className="insight-summary-card">
              <Target size={17} aria-hidden="true" />
              <AnimatedValue as="strong" value={`${summary.averageAccuracy}%`} />
              <span>average accuracy</span>
            </article>
            <article className="insight-summary-card">
              <Zap size={17} aria-hidden="true" />
              <AnimatedValue as="strong" value={`${summary.averageConsistency}%`} />
              <span>consistency</span>
            </article>
            <article className="insight-summary-card">
              <Keyboard size={17} aria-hidden="true" />
              <AnimatedValue as="strong" value={summary.total} />
              <span>completed tests</span>
            </article>
            <article className="insight-summary-card">
              <Clock3 size={17} aria-hidden="true" />
              <strong>{formatLongDuration(summary.totalDuration)}</strong>
              <span>practice time</span>
            </article>
          </section>

          <section className="insights-trends" aria-labelledby="trends-heading">
            <header className="insights-section-heading">
              <div>
                <h2 id="trends-heading">Recent progress</h2>
                <p>Up to your latest 20 completed tests.</p>
              </div>
              {results.length < 3 && <span>More tests will make these trends clearer.</span>}
            </header>
            <div className="trend-grid">
              <TrendChart values={wpmTrend} label="WPM" />
              <TrendChart values={accuracyTrend} label="Accuracy" suffix="%" />
              <TrendChart values={consistencyTrend} label="Consistency" suffix="%" />
            </div>
          </section>

          <section className="insights-skills" aria-labelledby="skills-heading">
            <header className="insights-section-heading">
              <div>
                <h2 id="skills-heading">Skill breakdown</h2>
                <p>Letters and modes measured from real input events.</p>
              </div>
            </header>
            <div className="skill-grid">
              <article className="skill-panel">
                <header>
                  <span>needs practice</span>
                  <small>highest error rate</small>
                </header>
                {letters.weak.length === 0 ? (
                  <p className="insight-placeholder">Not enough repeated mistakes yet.</p>
                ) : (
                  <div className="letter-list">
                    {letters.weak.map((letter) => (
                      <div key={letter.character}>
                        <strong>{letter.character}</strong>
                        <span>{letter.accuracy}% accuracy</span>
                        <small>
                          {letter.mistakes}/{letter.attempts} mistakes
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="skill-panel">
                <header>
                  <span>strong letters</span>
                  <small>clean and repeated</small>
                </header>
                {letters.strong.length === 0 ? (
                  <p className="insight-placeholder">Complete more tests to compare letters.</p>
                ) : (
                  <div className="letter-list is-strong">
                    {letters.strong.map((letter) => (
                      <div key={letter.character}>
                        <strong>{letter.character}</strong>
                        <span>{letter.accuracy}% accuracy</span>
                        <small>{letter.attempts} attempts</small>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="skill-panel mode-panel">
                <header>
                  <span>best modes</span>
                  <small>most practiced first</small>
                </header>
                <div className="mode-insight-list">
                  {modes.map((mode) => (
                    <div key={mode.id}>
                      <span>
                        <strong>{mode.label}</strong>
                        <small>
                          {mode.tests} {mode.tests === 1 ? "test" : "tests"}
                        </small>
                      </span>
                      <span>
                        <strong>{mode.averageWpm} wpm</strong>
                        <small>{mode.averageAccuracy}% accuracy</small>
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
