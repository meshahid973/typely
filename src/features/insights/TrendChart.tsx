interface TrendChartProps {
  values: number[];
  label: string;
  suffix?: string;
}

function pointsFor(values: number[]) {
  if (values.length === 0) {
    return "";
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(1, maximum - minimum);

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 36 - ((value - minimum) / range) * 30;
      return `${x},${y}`;
    })
    .join(" ");
}

export function TrendChart({ values, label, suffix = "" }: TrendChartProps) {
  const latest = values.at(-1) ?? 0;

  return (
    <figure className="trend-chart" aria-label={label}>
      <figcaption>
        <span>{label}</span>
        <strong>
          {latest}
          {suffix}
        </strong>
      </figcaption>
      <svg viewBox="0 0 100 40" role="img" aria-label={`${label}: ${values.join(", ")}`}>
        <line x1="0" y1="36" x2="100" y2="36" />
        {values.length > 1 ? (
          <polyline points={pointsFor(values)} />
        ) : (
          <circle cx="50" cy="20" r="1.8" />
        )}
      </svg>
    </figure>
  );
}
