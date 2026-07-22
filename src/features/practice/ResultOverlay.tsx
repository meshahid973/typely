import { ArrowRight, RotateCcw } from "lucide-react";
import { type CSSProperties, useEffect, useRef } from "react";
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

export function ResultOverlay({ result, onRestart, onHistory }: ResultOverlayProps) {
  const restartButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    restartButton.current?.focus();
  }, []);

  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-label="Test result">
      <div className="result-card">
        <div className="result-primary">
          <div>
            <span>wpm</span>
            <AnimatedValue as="strong" value={result.wpm} />
          </div>
          <div>
            <span>accuracy</span>
            <AnimatedValue as="strong" value={`${result.accuracy}%`} />
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
        <div className="result-actions">
          <Button ref={restartButton} onClick={onRestart}>
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
  );
}
