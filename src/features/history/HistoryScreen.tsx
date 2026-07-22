import { ArrowRight, Clock3, Crown, Keyboard, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../app/AppProvider";
import type { TestResult } from "../../app/app.types";
import { GameButton } from "../../components/ui/GameButton";
import { IconButton } from "../../components/ui/IconButton";
import { cn } from "../../utils/cn";
import { formatDate, formatNumber } from "../../utils/format";
import { HistoryDetailsDrawer } from "./HistoryDetailsDrawer";
import { HistoryFilters } from "./HistoryFilters";
import { defaultHistoryFilters, filterHistoryResults } from "./historyFilterUtils";

export function HistoryScreen() {
  const { results, removeResult, clearResults, setView } = useApp();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [filters, setFilters] = useState(defaultHistoryFilters);
  const removeTimeout = useRef<number | null>(null);
  const clearTimeout = useRef<number | null>(null);
  const filteredResults = useMemo(() => filterHistoryResults(results, filters), [filters, results]);

  useEffect(() => {
    return () => {
      if (removeTimeout.current !== null) {
        window.clearTimeout(removeTimeout.current);
      }

      if (clearTimeout.current !== null) {
        window.clearTimeout(clearTimeout.current);
      }
    };
  }, []);

  const handleRemove = (id: string) => {
    if (removingId !== null) {
      return;
    }

    setRemovingId(id);
    removeTimeout.current = window.setTimeout(() => {
      removeResult(id);
      setRemovingId(null);
      if (selectedResult?.id === id) {
        setSelectedResult(null);
      }
    }, 220);
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimeout.current = window.setTimeout(() => setConfirmClear(false), 2600);
      return;
    }

    clearResults();
    setSelectedResult(null);
    setConfirmClear(false);
  };

  return (
    <div className="view general-view history-view">
      <header className="view-heading">
        <div>
          <span className="view-eyebrow">local scores</span>
          <h1>History</h1>
          <p>Every completed run, replay, grade, and modifier stays on this device.</p>
        </div>
        {results.length > 0 && (
          <GameButton variant="ghost" size="small" onClick={handleClear}>
            <Trash2 size={14} />
            {confirmClear ? "confirm clear" : "clear"}
          </GameButton>
        )}
      </header>

      {results.length === 0 ? (
        <section className="empty-state" aria-labelledby="history-empty-heading">
          <Keyboard size={27} />
          <h2 id="history-empty-heading">No tests yet</h2>
          <p>Finish a typing test and your score will appear here.</p>
          <GameButton onClick={() => setView("practice")}>start typing</GameButton>
        </section>
      ) : (
        <>
          <HistoryFilters filters={filters} onChange={setFilters} />
          <section className="history-score-list" aria-label="Completed typing tests">
            {filteredResults.length === 0 ? (
              <div className="history-no-results">
                <span>No results match these filters.</span>
                <GameButton
                  variant="ghost"
                  size="small"
                  onClick={() => setFilters(defaultHistoryFilters)}
                >
                  reset filters
                </GameButton>
              </div>
            ) : (
              filteredResults.map((result) => (
                <article
                  className={cn("history-score-row", removingId === result.id && "is-removing")}
                  data-grade={result.grade}
                  key={result.id}
                >
                  <button
                    type="button"
                    className="history-score-open"
                    onClick={() => setSelectedResult(result)}
                  >
                    <span className="history-grade">{result.grade}</span>
                    <span className="history-score-main">
                      <strong>{result.wpm}</strong>
                      <small>wpm</small>
                    </span>
                    <span className="history-score-stat is-accuracy">
                      <strong>{result.accuracy}%</strong>
                      <small>accuracy</small>
                    </span>
                    <span className="history-score-stat is-combo">
                      <strong>{result.maxCombo}×</strong>
                      <small>combo</small>
                    </span>
                    <span className="history-score-stat is-score">
                      <strong>{formatNumber(result.score)}</strong>
                      <small>score</small>
                    </span>
                    <span className="history-score-date">
                      <Clock3 size={13} aria-hidden="true" />
                      <span>
                        <strong>{formatDate(result.completedAt)}</strong>
                        <small>
                          {result.modeValue} {result.mode === "time" ? "seconds" : "words"}
                        </small>
                      </span>
                    </span>
                    {result.personalBest && (
                      <span className="history-personal-best" title="Personal best">
                        <Crown size={14} aria-hidden="true" />
                      </span>
                    )}
                    <ArrowRight className="history-score-arrow" size={16} aria-hidden="true" />
                  </button>
                  <IconButton
                    label="Delete result"
                    className="history-delete"
                    disabled={removingId !== null}
                    onClick={() => handleRemove(result.id)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </article>
              ))
            )}
          </section>
        </>
      )}

      <HistoryDetailsDrawer result={selectedResult} onClose={() => setSelectedResult(null)} />
    </div>
  );
}
