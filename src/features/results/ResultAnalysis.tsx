import type { TestResult } from "../../app/app.types";
import { formatDuration } from "../../utils/format";

interface ResultAnalysisProps {
  result: TestResult;
}

function signed(value: number, suffix = "") {
  if (value === 0) return `±0${suffix}`;
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

export function ResultAnalysis({ result }: ResultAnalysisProps) {
  const { analysis, comparison } = result;

  return (
    <section className="result-analysis" aria-labelledby={`analysis-${result.id}`}>
      <header>
        <div>
          <span>session analysis</span>
          <h3 id={`analysis-${result.id}`}>Where the run changed</h3>
        </div>
        <strong>{analysis.fastestWpm} peak wpm</strong>
      </header>

      {comparison && (
        <section className="result-comparison" aria-label="Comparison with previous best">
          <span>
            <strong>{signed(comparison.wpmDelta)}</strong> wpm
          </span>
          <span>
            <strong>{signed(comparison.accuracyDelta, "%")}</strong> accuracy
          </span>
          <span>
            <strong>{signed(comparison.consistencyDelta, "%")}</strong> consistency
          </span>
          <span>
            <strong>{signed(comparison.performanceDelta)}</strong> TP
          </span>
        </section>
      )}

      <div className="result-analysis-grid">
        <article>
          <h4>Weak keys</h4>
          {analysis.weakKeys.length > 0 ? (
            <div className="analysis-chip-list">
              {analysis.weakKeys.map((item) => (
                <span key={item.key}>
                  <strong>{item.key === " " ? "space" : item.key}</strong>
                  <small>
                    {item.accuracy}% · {item.averageIntervalMs} ms
                  </small>
                </span>
              ))}
            </div>
          ) : (
            <p>No weak key was measurable in this run.</p>
          )}
        </article>

        <article>
          <h4>Slow sequences</h4>
          {analysis.slowBigrams.length > 0 ? (
            <div className="analysis-chip-list">
              {analysis.slowBigrams.map((item) => (
                <span key={item.sequence}>
                  <strong>{item.sequence}</strong>
                  <small>{item.averageIntervalMs} ms</small>
                </span>
              ))}
            </div>
          ) : (
            <p>More repeated sequences are needed for a reliable reading.</p>
          )}
        </article>

        <article>
          <h4>Difficult words</h4>
          {analysis.slowWords.length > 0 ? (
            <div className="analysis-word-list">
              {analysis.slowWords.map((item) => (
                <span key={`${item.wordIndex}-${item.word}`}>
                  <strong>{item.word}</strong>
                  <small>
                    {item.judgement} · {item.wpm} wpm
                  </small>
                </span>
              ))}
            </div>
          ) : (
            <p>No completed word data was recorded.</p>
          )}
        </article>

        <article>
          <h4>First error</h4>
          <strong className="analysis-focus-value">
            {analysis.firstMistakeAtMs === null
              ? "none"
              : formatDuration(analysis.firstMistakeAtMs)}
          </strong>
          <p>
            {analysis.firstMistakeAtMs === null
              ? "The run stayed error-free."
              : "Open the replay to inspect the exact input."}
          </p>
        </article>
      </div>
    </section>
  );
}
