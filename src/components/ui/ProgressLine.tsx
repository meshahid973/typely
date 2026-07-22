import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

interface ProgressLineProps {
  value: number;
  label?: string;
  energy?: number;
  impactSequence?: number;
}

export function ProgressLine({
  value,
  label = "Test progress",
  energy = 0,
  impactSequence = 0,
}: ProgressLineProps) {
  const normalized = Math.max(0, Math.min(1, value));
  const normalizedEnergy = Math.max(0, Math.min(1, energy));
  const fillRef = useRef<HTMLSpanElement>(null);
  const style = {
    "--progress-value": normalized,
    "--progress-energy": normalizedEnergy,
  } as CSSProperties;

  useEffect(() => {
    const element = fillRef.current;

    if (!element || impactSequence === 0 || normalizedEnergy <= 0) {
      return;
    }

    element.animate([{ scale: `1 ${1 + normalizedEnergy * 0.7}` }, { scale: "1 1" }], {
      duration: 210,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    });
  }, [impactSequence, normalizedEnergy]);

  return (
    <div
      className="progress-line"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalized * 100)}
      style={style}
    >
      <span ref={fillRef} aria-hidden="true" />
    </div>
  );
}
