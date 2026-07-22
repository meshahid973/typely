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

  const statusLabel = status === "complete" ? "complete" : status;

  return (
    <div className="live-stats" aria-label="Live test statistics">
      <div className="live-stat live-stat-main">
        <strong>{primaryValue}</strong>
        <span>{primaryLabel}</span>
      </div>
      <div className="live-stat">
        <strong>{showLiveStats ? metrics.wpm : "—"}</strong>
        <span>wpm</span>
      </div>
      <div className="live-stat">
        <strong>{showLiveStats ? `${metrics.accuracy}%` : "—"}</strong>
        <span>accuracy</span>
      </div>
      <div className="live-stat">
        <strong>{metrics.currentCombo}</strong>
        <span>combo</span>
      </div>
      <div className="test-status" data-status={status}>
        <span />
        {statusLabel}
      </div>
    </div>
  );
}
