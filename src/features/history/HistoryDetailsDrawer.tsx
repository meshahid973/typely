import { AlertCircle, Clock3, Gauge, Sparkles, Target, Trophy } from "lucide-react";
import { useMemo } from "react";
import type { TestResult } from "../../app/app.types";
import { Drawer } from "../../components/ui/Drawer";
import { countJudgements } from "../../core/scoring/performance";
import { formatDate, formatDuration, formatNumber } from "../../utils/format";
import { ReplayPlayer } from "../replay/ReplayPlayer";
import { ResultAnalysis } from "../results/ResultAnalysis";
import { hasModifiers } from "./historyFilterUtils";

interface HistoryDetailsDrawerProps {
  result: TestResult | null;
  onClose: () => void;
}

function activeModifiers(result: TestResult) {
  const configuration = result.configuration;
  const modifiers: string[] = [];

  if (configuration.punctuation) modifiers.push("Punctuation");
  if (configuration.numbers) modifiers.push("Numbers");
  if (configuration.capitals) modifiers.push("Capitals");
  if (configuration.symbols) modifiers.push("Symbols");
  if (configuration.noBackspace) modifiers.push("No backspace");
  if (configuration.hidden) modifiers.push("Blind words");
  if (configuration.focusMode) modifiers.push("Focus");
  if (configuration.noLiveWpm) modifiers.push("No live stats");
  if (configuration.suddenDeath) modifiers.push("Sudden death");
  if (configuration.accuracyTarget !== null) {
    modifiers.push(`${configuration.accuracyTarget}% accuracy`);
  }
  if (configuration.minimumPace !== null)
    modifiers.push(`${configuration.minimumPace} minimum WPM`);
  if (configuration.ghostRace) modifiers.push("Ghost race");
  if (configuration.challengeId) modifiers.push("Curated challenge");

  return modifiers;
}

export function HistoryDetailsDrawer({ result, onClose }: HistoryDetailsDrawerProps) {
  const judgementCounts = useMemo(
    () => countJudgements(result?.wordJudgements ?? []),
    [result?.wordJudgements],
  );

  return (
    <Drawer
      open={result !== null}
      title="Result details"
      description={result ? formatDate(result.completedAt) : undefined}
      closeLabel="Close result details"
      size="wide"
      onClose={onClose}
    >
      {result && (
        <>
          <section className="history-detail-hero" data-grade={result.grade}>
            <div className="history-detail-grade">
              <strong>{result.grade}</strong>
              <span>grade</span>
            </div>
            <div>
              <span>
                {result.modeValue} {result.mode === "time" ? "seconds" : "words"} ·{" "}
                {result.difficulty.stars.toFixed(1)}★
              </span>
              <strong>{result.wpm} wpm</strong>
              <small>
                {result.accuracy}% accuracy · {formatNumber(result.performanceRating)} TP
              </small>
            </div>
          </section>

          <section className="history-detail-stats" aria-label="Result statistics">
            <article>
              <Gauge size={16} aria-hidden="true" />
              <strong>{result.rawWpm}</strong>
              <span>raw wpm</span>
            </article>
            <article>
              <Trophy size={16} aria-hidden="true" />
              <strong>{result.maxCombo}×</strong>
              <span>combo</span>
            </article>
            <article>
              <AlertCircle size={16} aria-hidden="true" />
              <strong>{result.incorrectKeystrokes}</strong>
              <span>mistakes</span>
            </article>
            <article>
              <Target size={16} aria-hidden="true" />
              <strong>{result.consistency}%</strong>
              <span>consistency</span>
            </article>
            <article>
              <Clock3 size={16} aria-hidden="true" />
              <strong>{formatDuration(result.durationMs)}</strong>
              <span>duration</span>
            </article>
            <article>
              <Sparkles size={16} aria-hidden="true" />
              <strong>+{result.xpEarned}</strong>
              <span>xp</span>
            </article>
          </section>

          <ReplayPlayer key={result.id} result={result} />
          <ResultAnalysis result={result} />

          <section className="history-detail-judgements" aria-labelledby="judgements-heading">
            <header>
              <div>
                <h3 id="judgements-heading">Word judgements</h3>
                <p>How cleanly and confidently each word was entered.</p>
              </div>
            </header>
            <div>
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
            </div>
          </section>

          <section className="history-detail-modifiers" aria-labelledby="modifiers-heading">
            <header>
              <h3 id="modifiers-heading">Modifiers</h3>
              <span>{result.modifierMultiplier.toFixed(2)}× score</span>
            </header>
            {hasModifiers(result) ? (
              <div>
                {activeModifiers(result).map((modifier) => (
                  <span key={modifier}>{modifier}</span>
                ))}
              </div>
            ) : (
              <p>No modifiers were enabled.</p>
            )}
          </section>
        </>
      )}
    </Drawer>
  );
}
