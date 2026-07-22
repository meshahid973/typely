import { ArrowRight, RotateCcw } from "lucide-react";
import { type CSSProperties, useEffect } from "react";
import type { TestResult } from "../../app/app.types";
import { AnimatedValue } from "../../components/ui/AnimatedValue";
import { Button } from "../../components/ui/Button";
import { formatDuration } from "../../lib/format";

interface ResultOverlayProps {
  result: TestResult;
  onRestart: () => void;
  onHistory: () => void;
}

const detailDelay = (index: number) => ({ "--delay": `${150 + index * 45}ms` }) as CSSProperties;

function formatAccuracy(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ResultOverlay({ result, onRestart, onHistory }: ResultOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "Tab" || event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        onRestart();
      }

      if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        onHistory();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onHistory, onRestart]);

  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="result-card">
        <div className="result-heading">
          <span>session complete</span>
          <strong id="result-title">Nice run.</strong>
        </div>
        <div className="result-primary">
          <div className="result-score">
            <AnimatedValue as="strong" value={result.wpm} />
            <span>wpm</span>
          </div>
          <div className="result-score">
            <div className="result-accuracy-value">
              <AnimatedValue as="strong" value={formatAccuracy(result.accuracy)} />
              <span>%</span>
            </div>
            <span>accuracy</span>
          </div>
        </div>
        <div className="result-details">
          <div style={detailDelay(0)}>
            <span>raw</span>
            <strong>{result.rawWpm}</strong>
          </div>
          <div style={detailDelay(1)}>
            <span>mistakes</span>
            <strong>{result.incorrectKeystrokes ?? result.incorrectCharacters}</strong>
          </div>
          <div style={detailDelay(2)}>
            <span>combo</span>
            <strong>{result.maxCombo}</strong>
          </div>
          <div style={detailDelay(3)}>
            <span>time</span>
            <strong>{formatDuration(result.durationMs)}</strong>
          </div>
        </div>
        <div className="result-footer">
          <span className="result-shortcuts">tab restart · h history</span>
          <div className="result-actions">
            <Button onClick={onRestart}>
              <RotateCcw size={16} />
              restart
            </Button>
            <Button variant="ghost" onClick={onHistory}>
              history
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
