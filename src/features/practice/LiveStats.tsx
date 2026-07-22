import { useEffect, useRef } from "react";
import { AnimatedValue } from "../../components/ui/AnimatedValue";
import { ProgressLine } from "../../components/ui/ProgressLine";
import type {
  CadenceMetrics,
  TestConfiguration,
  TestMetrics,
  TestStatus,
  TypingFeedback,
} from "../../core/typing/types";
import { cn } from "../../utils/cn";

interface LiveStatsProps {
  configuration: TestConfiguration;
  metrics: TestMetrics;
  progress: number;
  elapsedMs: number;
  status: TestStatus;
  showLiveStats: boolean;
  cadence: CadenceMetrics;
  feedback: TypingFeedback;
}

function getTimeValue(configuration: TestConfiguration, elapsedMs: number, progress: number) {
  if (configuration.mode === "time") {
    return Math.max(0, configuration.value - Math.floor(elapsedMs / 1000));
  }

  return `${Math.round(progress * 100)}%`;
}

function feedbackText(feedback: TypingFeedback) {
  if (feedback.comboRecord) {
    return `new best · ${feedback.comboRecord}×`;
  }

  if (feedback.comboMilestone) {
    return `${feedback.comboMilestone}×`;
  }

  if (feedback.comboBreak) {
    return `${feedback.comboBreak}× lost`;
  }

  return null;
}

export function LiveStats({
  configuration,
  metrics,
  progress,
  elapsedMs,
  status,
  showLiveStats,
  cadence,
  feedback,
}: LiveStatsProps) {
  const comboRef = useRef<HTMLDivElement>(null);
  const started = status !== "ready";
  const timeValue = getTimeValue(configuration, elapsedMs, progress);
  const timeLabel = configuration.mode === "time" ? "seconds" : "progress";
  const mainValue = started && showLiveStats ? metrics.wpm : timeValue;
  const mainLabel = started && showLiveStats ? "wpm" : timeLabel;
  const comboVisible = showLiveStats && metrics.currentCombo >= 10;
  const comboFeedback = feedbackText(feedback);

  useEffect(() => {
    const element = comboRef.current;

    if (!element || (!feedback.comboMilestone && !feedback.comboRecord)) {
      return;
    }

    element.getAnimations().forEach((animation) => animation.cancel());
    element.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-3px) scale(1.12)" },
        { transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.16, 1.24, 0.3, 1)",
      },
    );
  }, [feedback.comboMilestone, feedback.comboRecord, feedback.sequence]);

  return (
    <section
      className="live-hud"
      data-status={status}
      data-combo-visible={comboVisible}
      aria-label="Live test statistics"
    >
      <div className="live-hud-row">
        <div className="live-hud-secondary live-hud-secondary-left">
          <AnimatedValue as="strong" value={started ? timeValue : "ready"} />
          <span>{started ? timeLabel : "start typing"}</span>
        </div>
        <div className="live-hud-primary">
          <AnimatedValue as="strong" value={mainValue} />
          <span>{mainLabel}</span>
        </div>
        <div className="live-hud-right">
          <div className="live-hud-secondary live-hud-secondary-right">
            <AnimatedValue as="strong" value={showLiveStats ? `${metrics.accuracy}%` : "—"} />
            <span>accuracy</span>
          </div>
          <div ref={comboRef} className={cn("combo-counter", comboVisible && "is-visible")}>
            <AnimatedValue as="strong" value={`${metrics.currentCombo}×`} />
            <span>combo</span>
          </div>
        </div>
      </div>
      <ProgressLine value={progress} energy={cadence.energy} impactSequence={feedback.sequence} />
      {comboFeedback && (
        <span
          key={`${feedback.sequence}-${comboFeedback}`}
          className={cn(
            "combo-feedback",
            Boolean(feedback.comboBreak) && "is-break",
            Boolean(feedback.comboRecord) && "is-record",
          )}
        >
          {comboFeedback}
        </span>
      )}
    </section>
  );
}
