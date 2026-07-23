import { ArrowRight, ChevronDown, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../../app/AppProvider";
import type { TestResult } from "../../app/app.types";
import { audioEngine } from "../../audio/audioEngine";
import { AnimatedValue } from "../../components/ui/AnimatedValue";
import { GameButton } from "../../components/ui/GameButton";
import { IconButton } from "../../components/ui/IconButton";
import { KeyHint } from "../../components/ui/KeyHint";
import { countJudgements } from "../../core/scoring/performance";
import type { TestFailureReason } from "../../core/scoring/types";
import type { ResultBadgeId } from "../../core/typing/types";
import { formatDuration } from "../../utils/format";
import { shouldReduceMotion } from "../../utils/motion";
import { ReplayPlayer } from "../replay/ReplayPlayer";
import { ResultAnalysis } from "../results/ResultAnalysis";
import { ResultTimeline } from "./ResultTimeline";

interface ResultStageProps {
  result: TestResult;
  onRestart: () => void;
  onHistory: () => void;
}

const badgeLabels: Record<ResultBadgeId, string> = {
  "personal-best": "personal best",
  "full-combo": "full combo",
  "clean-run": "clean run",
  comeback: "comeback",
};

const failureLabels: Record<Exclude<TestFailureReason, null>, string> = {
  "sudden-death": "Sudden death failed.",
  "minimum-pace": "Minimum pace lost.",
  "accuracy-challenge": "Accuracy target missed.",
};

function formatAccuracy(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function resultTitle(result: TestResult) {
  if (result.failedReason) return failureLabels[result.failedReason];
  if (result.personalBest) return "New personal best.";
  return "Run complete.";
}

export function ResultStage({ result, onRestart, onHistory }: ResultStageProps) {
  const { settings } = useApp();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const judgementCounts = countJudgements(result.wordJudgements ?? []);

  useEffect(() => {
    audioEngine.play("test-complete");

    if (result.personalBest) {
      const timeout = window.setTimeout(
        () => audioEngine.play("personal-best"),
        settings.reducedMotion || shouldReduceMotion() ? 0 : 430,
      );
      return () => window.clearTimeout(timeout);
    }
  }, [result.personalBest, settings.reducedMotion]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const interactiveTarget =
        event.target instanceof HTMLButtonElement ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement;

      if (event.key === "Escape") {
        event.preventDefault();

        if (replayOpen) setReplayOpen(false);
        else if (detailsOpen) setDetailsOpen(false);
        else onRestart();
        return;
      }

      if (
        (event.key === "Tab" || event.key === "Enter") &&
        !interactiveTarget &&
        !replayOpen &&
        !detailsOpen
      ) {
        event.preventDefault();
        onRestart();
        return;
      }

      if (event.key.toLowerCase() === "r" && !interactiveTarget) {
        event.preventDefault();
        setDetailsOpen(false);
        setReplayOpen(true);
        return;
      }

      if (event.key.toLowerCase() === "h" && !interactiveTarget) {
        event.preventDefault();
        onHistory();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailsOpen, onHistory, onRestart, replayOpen]);

  return (
    <section
      className="result-stage"
      data-grade={result.grade}
      data-details-open={detailsOpen}
      data-failed={Boolean(result.failedReason)}
      aria-labelledby="result-heading"
      aria-live="polite"
    >
      <div className="result-grade" role="img" aria-label={`Grade ${result.grade}`}>
        <span>{result.grade}</span>
        <small>grade</small>
      </div>
      <div className="result-stage-body" inert={detailsOpen || replayOpen}>
        <header className="result-stage-heading">
          <span>{result.failedReason ? "challenge ended" : "session complete"}</span>
          <h2 id="result-heading">{resultTitle(result)}</h2>
        </header>
        <span className="result-stage-divider" aria-hidden="true" />

        <div className="result-performance-summary">
          <div className="result-tp-stat">
            <AnimatedValue as="strong" value={result.performanceRating} />
            <span>typing performance</span>
          </div>
          <div
            className="result-difficulty"
            role="img"
            aria-label={`${result.difficulty.stars} star difficulty`}
          >
            <strong>{result.difficulty.stars.toFixed(1)}★</strong>
            <span>{result.difficulty.label}</span>
          </div>
        </div>

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
            <span>clean words</span>
            <strong>{result.longestCleanWordStreak}</strong>
          </div>
          <div>
            <span>consistency</span>
            <strong>{result.consistency}%</strong>
          </div>
        </div>

        <ResultTimeline samples={result.performanceSamples ?? []} />

        {result.badges.length > 0 && (
          <section className="result-badges" aria-label="Run awards">
            {result.badges.map((badge) => (
              <span key={badge}>{badgeLabels[badge]}</span>
            ))}
          </section>
        )}

        <div className="result-rewards">
          <div>
            <span>score</span>
            <strong>{result.score.toLocaleString()}</strong>
          </div>
          <div>
            <span>earned</span>
            <strong>+{result.xpEarned} xp</strong>
          </div>
          <span className="result-score-version">TP v{result.scoringVersion}</span>
        </div>

        <footer className="result-stage-footer">
          <div className="result-stage-shortcuts">
            <KeyHint shortcut="tab" label="restart" />
            <KeyHint shortcut="r" label="replay" />
            <KeyHint shortcut="h" label="history" />
          </div>
          <div className="result-stage-actions">
            <GameButton onClick={onRestart}>
              <RotateCcw size={15} />
              restart
            </GameButton>
            <GameButton
              variant="secondary"
              onClick={() => {
                setDetailsOpen(false);
                setReplayOpen(true);
              }}
            >
              <Play size={15} />
              replay
            </GameButton>
            <GameButton
              variant="secondary"
              aria-expanded={detailsOpen}
              onClick={() => {
                setReplayOpen(false);
                setDetailsOpen((current) => !current);
              }}
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

      <div
        className="result-replay-layer"
        data-open={replayOpen}
        aria-hidden={!replayOpen}
        inert={!replayOpen}
      >
        <div className="result-replay-panel">
          <header>
            <div>
              <span>result replay</span>
              <strong>Watch the run exactly as it happened.</strong>
            </div>
            <IconButton label="Close replay" onClick={() => setReplayOpen(false)}>
              <X size={16} />
            </IconButton>
          </header>
          <ReplayPlayer key={result.id} result={result} />
        </div>
      </div>

      <div
        className="result-analysis-layer"
        data-open={detailsOpen}
        aria-hidden={!detailsOpen}
        inert={!detailsOpen}
      >
        <div className="result-analysis-panel">
          <header>
            <div>
              <span>performance details</span>
              <strong>Review control, word quality, and your previous best.</strong>
            </div>
            <IconButton label="Close details" onClick={() => setDetailsOpen(false)}>
              <X size={16} />
            </IconButton>
          </header>
          <div className="result-analysis-counts">
            <span>
              <strong>{judgementCounts.perfect}</strong> perfect
            </span>
            <span>
              <strong>{judgementCounts.clean}</strong> clean
            </span>
            <span>
              <strong>{judgementCounts.recovered}</strong> recovered
            </span>
            <span>
              <strong>{judgementCounts.burst}</strong> burst
            </span>
            <span>
              <strong>{judgementCounts.miss}</strong> miss
            </span>
            <span>
              <strong>{result.backspaces}</strong> corrections
            </span>
            <span>
              <strong>{result.longestCleanStreak}×</strong> clean streak
            </span>
            <span>
              <strong>{formatDuration(result.longestAccuracyStreakMs)}</strong> perfect streak
            </span>
            <span>
              <strong>{result.modifierMultiplier.toFixed(2)}×</strong> modifier
            </span>
          </div>
          <ResultAnalysis result={result} />
        </div>
      </div>
    </section>
  );
}
