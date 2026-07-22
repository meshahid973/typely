import { BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/ui/Button";

export function InsightsScreen() {
  const { results, setView } = useApp();
  const summary = useMemo(() => {
    if (results.length === 0) {
      return null;
    }

    const total = results.length;
    const averageWpm = Math.round(results.reduce((sum, result) => sum + result.wpm, 0) / total);
    const averageAccuracy =
      Math.round((results.reduce((sum, result) => sum + result.accuracy, 0) / total) * 10) / 10;
    const bestWpm = Math.max(...results.map((result) => result.wpm));
    const bestCombo = Math.max(...results.map((result) => result.maxCombo));

    return { total, averageWpm, averageAccuracy, bestWpm, bestCombo };
  }, [results]);

  return (
    <div className="view">
      <div className="view-heading">
        <div>
          <h1>Insights</h1>
          <p>A simple overview based only on completed tests.</p>
        </div>
      </div>
      {!summary ? (
        <div className="empty-state">
          <BarChart3 size={28} />
          <h2>Not enough data</h2>
          <p>Complete a few tests to build your overview.</p>
          <Button onClick={() => setView("practice")}>start typing</Button>
        </div>
      ) : (
        <div className="insight-grid">
          <article className="insight-card insight-card-main">
            <span>best speed</span>
            <strong>{summary.bestWpm}</strong>
            <small>wpm</small>
          </article>
          <article className="insight-card">
            <span>average speed</span>
            <strong>{summary.averageWpm}</strong>
            <small>wpm</small>
          </article>
          <article className="insight-card">
            <span>average accuracy</span>
            <strong>{summary.averageAccuracy}%</strong>
            <small>all tests</small>
          </article>
          <article className="insight-card">
            <span>best combo</span>
            <strong>{summary.bestCombo}</strong>
            <small>correct keys</small>
          </article>
          <article className="insight-card">
            <span>completed</span>
            <strong>{summary.total}</strong>
            <small>tests</small>
          </article>
        </div>
      )}
    </div>
  );
}
