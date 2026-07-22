import { Clock3, Keyboard, Trash2 } from "lucide-react";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { formatDate, formatDuration } from "../../lib/format";

export function HistoryScreen() {
  const { results, removeResult, clearResults, setView } = useApp();

  return (
    <div className="view">
      <div className="view-heading">
        <div>
          <h1>History</h1>
          <p>Your latest results are stored locally on this device.</p>
        </div>
        {results.length > 0 && (
          <Button variant="ghost" onClick={clearResults}>
            <Trash2 size={16} />
            clear
          </Button>
        )}
      </div>
      {results.length === 0 ? (
        <div className="empty-state">
          <Keyboard size={28} />
          <h2>No tests yet</h2>
          <p>Complete a typing test and it will appear here.</p>
          <Button onClick={() => setView("practice")}>start typing</Button>
        </div>
      ) : (
        <div className="history-list">
          <div className="history-header">
            <span>result</span>
            <span>test</span>
            <span>accuracy</span>
            <span>combo</span>
            <span>date</span>
            <span />
          </div>
          {results.map((result, index) => (
            <article
              className="history-row"
              key={result.id}
              style={{ "--index": index } as React.CSSProperties}
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
              </div>
              <div className="history-stat">
                <strong>{result.maxCombo}</strong>
              </div>
              <div className="history-time">
                <Clock3 size={14} />
                <div>
                  <span>{formatDate(result.completedAt)}</span>
                  <small>{formatDuration(result.durationMs)}</small>
                </div>
              </div>
              <IconButton label="Delete result" onClick={() => removeResult(result.id)}>
                <Trash2 size={15} />
              </IconButton>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
