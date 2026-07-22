import type { PerformanceSample } from "../../core/typing/types";

interface ResultTimelineProps {
  samples: PerformanceSample[];
}

function createPath(samples: PerformanceSample[], width: number, height: number) {
  if (samples.length === 0) {
    return "";
  }

  const maximumTime = Math.max(1, samples.at(-1)?.elapsedMs ?? 1);
  const maximumWpm = Math.max(1, ...samples.map((sample) => sample.wpm));

  return samples
    .map((sample, index) => {
      const x = (sample.elapsedMs / maximumTime) * width;
      const y = height - (sample.wpm / maximumWpm) * (height - 8) - 4;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function ResultTimeline({ samples }: ResultTimelineProps) {
  const path = createPath(samples, 800, 112);

  return (
    <div className="result-timeline">
      <div className="result-timeline-heading">
        <span>performance</span>
        <strong>{samples.at(-1)?.wpm ?? 0} wpm</strong>
      </div>
      <svg role="img" aria-label="WPM over the completed test" viewBox="0 0 800 112">
        <path className="result-timeline-baseline" d="M0 108 L800 108" />
        {path && <path className="result-timeline-path" d={path} />}
      </svg>
    </div>
  );
}
