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
import { useHudLayoutAnimation } from "./useHudLayoutAnimation";

interface LiveStatsProps {
  configuration: TestConfiguration;
  metrics: TestMetrics;
  progress: number;
  elapsedMs: number;
  status: TestStatus;
  showLiveStats: boolean;
  cadence: CadenceMetrics;
  feedback: TypingFeedback;
  reducedMotion: boolean;
}

function getTimeValue(configuration: TestConfiguration, elapsedMs: number, progress: number) {
  if (configuration.mode === "time") {
    return Math.max(0, configuration.value - Math.floor(elapsedMs / 1000));
  }

  return `${Math.round(progress * 100)}%`;
}

function getComboMessage(feedback: TypingFeedback, combo: number) {
  if (feedback.comboRecord) {
    return { value: `${feedback.comboRecord}×`, label: "new best", kind: "record" };
  }

  if (feedback.comboMilestone) {
    const label = feedback.comboMilestone >= 100 ? "locked in" : "steady";
    return { value: `${feedback.comboMilestone}×`, label, kind: "milestone" };
  }

  if (feedback.comboBreak) {
    return { value: `${feedback.comboBreak}×`, label: "combo lost", kind: "break" };
  }

  return { value: `${combo}×`, label: "combo", kind: "normal" };
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
  reducedMotion,
}: LiveStatsProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);
  const started = status !== "ready";
  const timeValue = getTimeValue(configuration, elapsedMs, progress);
  const timeLabel = configuration.mode === "time" ? "seconds" : "progress";
  const comboVisible = showLiveStats && metrics.currentCombo >= 10;
  const comboMessage = getComboMessage(feedback, metrics.currentCombo);
  const comboFeedbackVisible = Boolean(
    feedback.comboBreak || feedback.comboMilestone || feedback.comboRecord,
  );
  const layoutKey = started && showLiveStats ? "running" : "ready";

  useHudLayoutAnimation(gridRef, layoutKey, reducedMotion);

  useEffect(() => {
    const element = comboRef.current;

    if (!element || reducedMotion || (!feedback.comboMilestone && !feedback.comboRecord)) {
      return;
    }

    for (const animation of element.getAnimations()) {
      animation.cancel();
    }

    element.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-3px) scale(1.06)" },
        { transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 440,
        easing: "cubic-bezier(0.16, 1.24, 0.3, 1)",
      },
    );
  }, [feedback.comboMilestone, feedback.comboRecord, reducedMotion]);

  return (
    <section
      className="live-hud"
      data-layout={layoutKey}
      data-status={status}
      aria-label="Live test statistics"
    >
      <div ref={gridRef} className="live-hud-grid">
        <div className="hud-stat hud-stat-time" data-hud-stat="time">
          <AnimatedValue as="strong" value={timeValue} duration={220} />
          <span>{timeLabel}</span>
        </div>
        <div className="hud-stat hud-stat-wpm" data-hud-stat="wpm">
          <AnimatedValue as="strong" value={showLiveStats ? metrics.wpm : "—"} duration={220} />
          <span>wpm</span>
        </div>
        <div className="hud-stat hud-stat-accuracy" data-hud-stat="accuracy">
          <AnimatedValue
            as="strong"
            value={showLiveStats ? `${metrics.accuracy}%` : "—"}
            duration={190}
          />
          <span>accuracy</span>
        </div>
      </div>
      <ProgressLine value={progress} energy={cadence.energy} impactSequence={feedback.sequence} />
      <div
        ref={comboRef}
        className={cn(
          "combo-ribbon",
          (comboVisible || comboFeedbackVisible) && "is-visible",
          `is-${comboMessage.kind}`,
        )}
        key={comboFeedbackVisible ? `${feedback.sequence}-${comboMessage.value}` : "combo"}
      >
        <span className="combo-ribbon-strip" aria-hidden="true" />
        <AnimatedValue as="strong" value={comboMessage.value} duration={170} />
        <span>{comboMessage.label}</span>
      </div>
    </section>
  );
}
