import { Clock3, Keyboard, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { GameButton } from "../../components/ui/GameButton";
import { IconButton } from "../../components/ui/IconButton";
import { cn } from "../../utils/cn";
import { formatDate, formatDuration } from "../../utils/format";

export function HistoryScreen() {
  const { results, removeResult, clearResults, setView } = useApp();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const removeTimeout = useRef<number | null>(null);
  const clearTimeout = useRef<number | null>(null);

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
    }, 160);
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimeout.current = window.setTimeout(() => setConfirmClear(false), 2600);
      return;
    }

    clearResults();
    setConfirmClear(false);
  };

  return (
    <div className="view general-view">
      <header className="view-heading">
        <div>
          <span className="view-eyebrow">local scores</span>
          <h1>History</h1>
          <p>Your latest results stay on this device.</p>
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
          <p>Finish a typing test and your result will appear here.</p>
          <GameButton onClick={() => setView("practice")}>start typing</GameButton>
        </section>
      ) : (
        <section className="history-list" aria-label="Completed typing tests">
          <div className="history-header" aria-hidden="true">
            <span>result</span>
            <span>test</span>
            <span>accuracy</span>
            <span>combo</span>
            <span>date</span>
            <span />
          </div>
          {results.map((result) => (
            <article
              className={cn("history-row", removingId === result.id && "is-removing")}
              key={result.id}
            >
              <div className="history-main">
                <strong>{result.wpm}</strong>
                <span>wpm</span>
              </div>
              <div className="history-stat">
                <strong>{result.modeValue}</strong>
                <span>{result.mode === "time" ? "seconds" : "words"}</span>
              </div>
              <div className="history-stat">
                <strong>{result.accuracy}%</strong>
                <span>accuracy</span>
              </div>
              <div className="history-stat">
                <strong>{result.maxCombo}</strong>
                <span>combo</span>
              </div>
              <div className="history-time">
                <Clock3 size={14} aria-hidden="true" />
                <div>
                  <span>{formatDate(result.completedAt)}</span>
                  <small>{formatDuration(result.durationMs)}</small>
                </div>
              </div>
              <IconButton
                label="Delete result"
                disabled={removingId !== null}
                onClick={() => handleRemove(result.id)}
              >
                <Trash2 size={15} />
              </IconButton>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
