import { ArrowRight, RotateCcw } from "lucide-react";
import type { TestResult } from "../../app/app.types";
import { Button } from "../../components/ui/Button";
import { formatDuration } from "../../lib/format";

interface ResultOverlayProps {
  result: TestResult;
  onRestart: () => void;
  onHistory: () => void;
}

export function ResultOverlay({ result, onRestart, onHistory }: ResultOverlayProps) {
  return (
    <div className="result-overlay">
      <div className="result-card">
        <div className="result-primary">
          <div>
            <span>wpm</span>
            <strong>{result.wpm}</strong>
          </div>
          <div>
            <span>accuracy</span>
            <strong>{result.accuracy}%</strong>
          </div>
        </div>
        <div className="result-details">
          <div>
            <span>raw</span>
            <strong>{result.rawWpm}</strong>
          </div>
          <div>
            <span>combo</span>
            <strong>{result.maxCombo}</strong>
          </div>
          <div>
            <span>characters</span>
            <strong>
              {result.correctCharacters}/{result.totalCharacters}
            </strong>
          </div>
          <div>
            <span>time</span>
            <strong>{formatDuration(result.durationMs)}</strong>
          </div>
        </div>
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
  );
}
