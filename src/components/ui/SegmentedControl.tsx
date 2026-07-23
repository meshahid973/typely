import { cn } from "../../utils/cn";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string | number> {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: T, origin: HTMLButtonElement) => void;
}

export function SegmentedControl<T extends string | number>({
  label,
  value,
  options,
  disabled = false,
  compact = false,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className={cn("segmented-control", compact && "is-compact")} data-disabled={disabled}>
      <legend className="visually-hidden">{label}</legend>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            type="button"
            key={option.value}
            className={cn("segmented-option", selected && "is-selected")}
            aria-pressed={selected}
            data-selection-target="true"
            disabled={disabled || option.disabled}
            onClick={(event) => onChange(option.value, event.currentTarget)}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
