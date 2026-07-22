import { AlertCircle, Clock3, Gauge, Sparkles, Target, Trophy } from "lucide-react";
import { useMemo } from "react";
import type { TestResult } from "../../app/app.types";
import { Drawer } from "../../components/ui/Drawer";
import { countJudgements } from "../../core/scoring/calculateScore";
import { formatDate, formatDuration, formatNumber } from "../../utils/format";
import { ReplayPlayer } from "../replay/ReplayPlayer";
import { hasModifiers } from "./historyFilterUtils";

interface HistoryDetailsDrawerProps {
  result: TestResult | null;
  onClose: () => void;
}

function activeModifiers(result: TestResult) {
  const modifiers: string[] = [];

  if (result.configuration.punctuation) modifiers.push("Punctuation");
  if (result.configuration.numbers) modifiers.push("Numbers");
  if (result.configuration.capitals) modifiers.push("Capitals");
  if (result.configuration.noBackspace) modifiers.push("No backspace");
  if (result.configuration.hidden) modifiers.push("Hidden");

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
                {result.modeValue} {result.mode === "time" ? "seconds" : "words"}
              </span>
              <strong>{result.wpm} wpm</strong>
              <small>
                {result.accuracy}% accuracy · {formatNumber(result.score)} score
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

          <section className="history-detail-judgements" aria-labelledby="judgements-heading">
            <header>
              <div>
                <h3 id="judgements-heading">Word judgements</h3>
                <p>How cleanly each completed word was entered.</p>
              </div>
            </header>
            <div>
              <span>
                <strong>{judgementCounts.perfect}</strong> perfect
              </span>
              <span>
                <strong>{judgementCounts.great}</strong> great
              </span>
              <span>
                <strong>{judgementCounts.good}</strong> good
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
