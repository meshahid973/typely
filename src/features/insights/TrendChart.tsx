import { type PointerEvent, useRef } from "react";

interface TrendChartProps {
  values: number[];
  label: string;
  suffix?: string;
  hoveredIndex: number | null;
  onHoverIndex: (index: number | null) => void;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  index: number;
}

function createPoints(values: number[]) {
  if (values.length === 0) {
    return [];
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(1, maximum - minimum);

  return values.map((value, index) => ({
    x: values.length === 1 ? 50 : (index / (values.length - 1)) * 100,
    y: 36 - ((value - minimum) / range) * 30,
    value,
    index,
  }));
}

function pointsAttribute(points: ChartPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function TrendChart({
  values,
  label,
  suffix = "",
  hoveredIndex,
  onHoverIndex,
}: TrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const points = createPoints(values);
  const selectedIndex = hoveredIndex === null ? Math.max(0, values.length - 1) : hoveredIndex;
  const selectedPoint = points[Math.min(selectedIndex, Math.max(0, points.length - 1))];
  const bestValue = values.length === 0 ? 0 : Math.max(...values);
  const bestIndex = values.lastIndexOf(bestValue);

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;

    if (!svg || values.length === 0) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const normalized = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const index = Math.round(normalized * Math.max(0, values.length - 1));
    onHoverIndex(index);
  };

  return (
    <figure className="trend-chart" aria-label={label}>
      <figcaption>
        <span>
          {label}
          {hoveredIndex !== null && <small>test {selectedIndex + 1}</small>}
        </span>
        <strong>
          {selectedPoint?.value ?? 0}
          {suffix}
        </strong>
      </figcaption>
      <svg
        ref={svgRef}
        viewBox="0 0 100 40"
        role="img"
        aria-label={`${label}: ${values.join(", ")}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => onHoverIndex(null)}
      >
        <line x1="0" y1="36" x2="100" y2="36" />
        {points.length > 1 ? (
          <polyline pathLength="1" points={pointsAttribute(points)} />
        ) : (
          <circle className="trend-single-point" cx="50" cy="20" r="1.8" />
        )}
        {points.map((point) => {
          const active = point.index === selectedIndex;
          const best = point.index === bestIndex;

          return (
            <g
              className="trend-point"
              data-active={active}
              data-best={best}
              key={`${label}-${point.x}-${point.value}`}
              transform={`translate(${point.x} ${point.y})`}
            >
              {best ? (
                <path d="M 0 -2.6 L 2.6 0 L 0 2.6 L -2.6 0 Z" />
              ) : (
                <circle r={active ? 2.1 : 1.45} />
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
