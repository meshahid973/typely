import { AtSign, Hash, Timer } from "lucide-react";
import { cn } from "../../lib/cn";
import type { TestConfiguration, TestMode } from "./practice.types";

interface ModePickerProps {
  configuration: TestConfiguration;
  disabled: boolean;
  onChange: (configuration: TestConfiguration) => void;
}

const timeValues = [15, 30, 60];
const wordValues = [25, 50];

export function ModePicker({ configuration, disabled, onChange }: ModePickerProps) {
  const setMode = (mode: TestMode) => {
    onChange({ ...configuration, mode, value: mode === "time" ? 30 : 25 });
  };

  const values = configuration.mode === "time" ? timeValues : wordValues;

  return (
    <div className="mode-picker" data-disabled={disabled}>
      <div className="mode-group">
        <button
          type="button"
          className={cn("mode-button", configuration.mode === "time" && "is-active")}
          aria-pressed={configuration.mode === "time"}
          disabled={disabled}
          onClick={() => setMode("time")}
        >
          <Timer size={14} />
          <span>time</span>
        </button>
        <button
          type="button"
          className={cn("mode-button", configuration.mode === "words" && "is-active")}
          aria-pressed={configuration.mode === "words"}
          disabled={disabled}
          onClick={() => setMode("words")}
        >
          <Hash size={14} />
          <span>words</span>
        </button>
      </div>
      <span className="mode-divider" aria-hidden="true" />
      <div className="mode-group">
        {values.map((value) => (
          <button
            type="button"
            key={value}
            className={cn("mode-value", configuration.value === value && "is-active")}
            aria-pressed={configuration.value === value}
            disabled={disabled}
            onClick={() => onChange({ ...configuration, value })}
          >
            <span>{value}</span>
          </button>
        ))}
      </div>
      <span className="mode-divider" aria-hidden="true" />
      <div className="mode-group mode-group-modifiers">
        <button
          type="button"
          className={cn("mode-icon", configuration.punctuation && "is-active")}
          aria-label="Toggle punctuation"
          aria-pressed={configuration.punctuation}
          title="Punctuation"
          disabled={disabled}
          onClick={() => onChange({ ...configuration, punctuation: !configuration.punctuation })}
        >
          <AtSign size={14} />
        </button>
        <button
          type="button"
          className={cn("mode-icon", configuration.numbers && "is-active")}
          aria-label="Toggle numbers"
          aria-pressed={configuration.numbers}
          title="Numbers"
          disabled={disabled}
          onClick={() => onChange({ ...configuration, numbers: !configuration.numbers })}
        >
          <Hash size={14} />
        </button>
      </div>
    </div>
  );
}
