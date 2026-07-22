import type { CSSProperties } from "react";
import { AnimatedValue } from "../../components/ui/AnimatedValue";
import { cn } from "../../lib/cn";
import type { TestConfiguration, TestMetrics, TestStatus } from "./practice.types";

interface LiveStatsProps {
  configuration: TestConfiguration;
  metrics: TestMetrics;
  progress: number;
  elapsedMs: number;
  status: TestStatus;
  showLiveStats: boolean;
}

export function LiveStats({
  configuration,
  metrics,
  progress,
  elapsedMs,
  status,
  showLiveStats,
}: LiveStatsProps) {
  const primaryValue =
    configuration.mode === "time"
      ? Math.max(0, configuration.value - Math.floor(elapsedMs / 1000))
      : `${Math.round(progress * 100)}%`;
  const primaryLabel = configuration.mode === "time" ? "seconds" : "progress";
  const progressStyle = {
    transform: `scaleX(${Math.max(0, Math.min(1, progress))})`,
  } as CSSProperties;

  return (
    <section className="live-area" data-status={status} aria-label="Live test statistics">
      <div className="live-stats">
        <div className="live-stat live-stat-main">
          <AnimatedValue as="strong" value={primaryValue} />
          <span>{primaryLabel}</span>
        </div>
        <div className="live-stat">
          <AnimatedValue as="strong" value={showLiveStats ? metrics.wpm : "—"} />
          <span>wpm</span>
        </div>
        <div className="live-stat">
          <AnimatedValue as="strong" value={showLiveStats ? `${metrics.accuracy}%` : "—"} />
          <span>accuracy</span>
        </div>
        <div className={cn("combo-counter", metrics.currentCombo > 4 && "is-visible")}>
          <AnimatedValue as="strong" value={`×${metrics.currentCombo}`} />
          <span>combo</span>
        </div>
      </div>
      <div className="test-progress" aria-hidden="true">
        <span style={progressStyle} />
      </div>
    </section>
  );
}
