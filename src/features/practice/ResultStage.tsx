import { ArrowRight, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../../app/AppProvider";
import type { TestResult } from "../../app/app.types";
import { audioEngine } from "../../audio/audioEngine";
import { AnimatedValue } from "../../components/ui/AnimatedValue";
import { GameButton } from "../../components/ui/GameButton";
import { KeyHint } from "../../components/ui/KeyHint";
import { countJudgements } from "../../core/scoring/calculateScore";
import { formatDuration } from "../../utils/format";
import { ResultTimeline } from "./ResultTimeline";

interface ResultStageProps {
  result: TestResult;
  onRestart: () => void;
  onHistory: () => void;
}

function formatAccuracy(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ResultStage({ result, onRestart, onHistory }: ResultStageProps) {
  const { settings } = useApp();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const judgementCounts = countJudgements(result.wordJudgements ?? []);

  useEffect(() => {
    audioEngine.play("test-complete");

    if (result.personalBest) {
      const timeout = window.setTimeout(
        () => audioEngine.play("personal-best"),
        settings.reducedMotion ? 0 : 430,
      );
      return () => window.clearTimeout(timeout);
    }
  }, [result.id, result.personalBest, settings.reducedMotion]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const interactiveTarget =
        event.target instanceof HTMLButtonElement ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement;

      if (event.key === "Escape") {
        event.preventDefault();

        if (detailsOpen) {
          setDetailsOpen(false);
        } else {
          onRestart();
        }
        return;
      }

      if ((event.key === "Tab" || event.key === "Enter") && !interactiveTarget) {
        event.preventDefault();
        onRestart();
        return;
      }

      if (event.key.toLowerCase() === "h" && !interactiveTarget) {
        event.preventDefault();
        onHistory();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailsOpen, onHistory, onRestart]);

  return (
    <section
      className="result-stage"
      data-grade={result.grade}
      data-details-open={detailsOpen}
      aria-labelledby="result-heading"
      aria-live="polite"
    >
      <div className="result-grade" aria-label={`Grade ${result.grade}`}>
        <span>{result.grade}</span>
        <small>grade</small>
      </div>
      <div className="result-stage-body">
        <header className="result-stage-heading">
          <span>session complete</span>
          <h2 id="result-heading">
            {result.personalBest ? "New personal best." : "Run complete."}
          </h2>
        </header>
        <div className="result-stage-primary">
          <div className="result-main-stat">
            <AnimatedValue as="strong" value={result.wpm} />
            <span>wpm</span>
          </div>
          <div className="result-main-stat result-main-stat-accuracy">
            <div>
              <AnimatedValue as="strong" value={formatAccuracy(result.accuracy)} />
              <span>%</span>
            </div>
            <span>accuracy</span>
          </div>
        </div>
        <div className="result-stage-details">
          <div>
            <span>raw</span>
            <strong>{result.rawWpm}</strong>
          </div>
          <div>
            <span>combo</span>
            <strong>{result.maxCombo}×</strong>
          </div>
          <div>
            <span>mistakes</span>
            <strong>{result.incorrectKeystrokes}</strong>
          </div>
          <div>
            <span>consistency</span>
            <strong>{result.consistency}%</strong>
          </div>
        </div>
        <ResultTimeline samples={result.performanceSamples ?? []} />
        <div className="result-rewards">
          <div>
            <span>score</span>
            <strong>{result.score.toLocaleString()}</strong>
          </div>
          <div>
            <span>earned</span>
            <strong>+{result.xpEarned} xp</strong>
          </div>
          {result.personalBest && <span className="personal-best-badge">personal best</span>}
        </div>
        <div className="result-extra" aria-hidden={!detailsOpen}>
          <div>
            <span>perfect</span>
            <strong>{judgementCounts.perfect}</strong>
          </div>
          <div>
            <span>great</span>
            <strong>{judgementCounts.great}</strong>
          </div>
          <div>
            <span>good</span>
            <strong>{judgementCounts.good}</strong>
          </div>
          <div>
            <span>miss</span>
            <strong>{judgementCounts.miss}</strong>
          </div>
          <div>
            <span>modifier</span>
            <strong>{result.modifierMultiplier.toFixed(2)}×</strong>
          </div>
          <div>
            <span>time</span>
            <strong>{formatDuration(result.durationMs)}</strong>
          </div>
        </div>
        <footer className="result-stage-footer">
          <div className="result-stage-shortcuts">
            <KeyHint shortcut="tab" label="restart" />
            <KeyHint shortcut="h" label="history" />
          </div>
          <div className="result-stage-actions">
            <GameButton onClick={onRestart}>
              <RotateCcw size={15} />
              restart
            </GameButton>
            <GameButton
              variant="secondary"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((current) => !current)}
            >
              details
              <ChevronDown className={detailsOpen ? "is-rotated" : undefined} size={15} />
            </GameButton>
            <GameButton variant="ghost" onClick={onHistory}>
              history
              <ArrowRight size={15} />
            </GameButton>
          </div>
        </footer>
      </div>
    </section>
  );
}
