import type { ChangeEvent } from "react";

interface SliderProps {
  id: string;
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onCommit?: () => void;
}

export function Slider({
  id,
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  disabled = false,
  onChange,
  onCommit,
}: SliderProps) {
  return (
    <label className="slider-control" htmlFor={id} data-disabled={disabled}>
      <span className="slider-heading">
        <strong>{label}</strong>
        <span>{valueLabel}</span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
      />
    </label>
  );
}
