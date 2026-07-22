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
    <div className="mode-picker">
      <div className="mode-group">
        <button
          type="button"
          className={cn("mode-button", configuration.mode === "time" && "is-active")}
          disabled={disabled}
          onClick={() => setMode("time")}
        >
          <Timer size={14} />
          time
        </button>
        <button
          type="button"
          className={cn("mode-button", configuration.mode === "words" && "is-active")}
          disabled={disabled}
          onClick={() => setMode("words")}
        >
          <Hash size={14} />
          words
        </button>
      </div>
      <span className="mode-divider" />
      <div className="mode-group">
        {values.map((value) => (
          <button
            type="button"
            key={value}
            className={cn("mode-value", configuration.value === value && "is-active")}
            disabled={disabled}
            onClick={() => onChange({ ...configuration, value })}
          >
            {value}
          </button>
        ))}
      </div>
      <span className="mode-divider" />
      <div className="mode-group">
        <button
          type="button"
          className={cn("mode-button", configuration.punctuation && "is-active")}
          disabled={disabled}
          onClick={() => onChange({ ...configuration, punctuation: !configuration.punctuation })}
        >
          <AtSign size={14} />
          punctuation
        </button>
        <button
          type="button"
          className={cn("mode-button", configuration.numbers && "is-active")}
          disabled={disabled}
          onClick={() => onChange({ ...configuration, numbers: !configuration.numbers })}
        >
          <Hash size={14} />
          numbers
        </button>
      </div>
    </div>
  );
}
