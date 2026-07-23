import { Timer } from "lucide-react";
import type { KeyboardEvent } from "react";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import type { TestConfiguration, TestMode } from "../../core/typing/types";
import { cn } from "../../utils/cn";

interface ModePickerProps {
  configuration: TestConfiguration;
  disabled: boolean;
  onChange: (configuration: TestConfiguration) => void;
}

const modes: Array<{ value: TestMode; label: string }> = [
  { value: "time", label: "time" },
  { value: "words", label: "words" },
];

const timeValues = [15, 30, 60].map((value) => ({ value, label: String(value) }));
const wordValues = [25, 50].map((value) => ({ value, label: String(value) }));

export function ModePicker({ configuration, disabled, onChange }: ModePickerProps) {
  const values = configuration.mode === "time" ? timeValues : wordValues;

  const selectMode = (mode: TestMode) => {
    if (disabled || mode === configuration.mode) {
      return;
    }

    onChange({ ...configuration, mode, value: mode === "time" ? 30 : 25, challengeId: null });
  };

  const handleModeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const nextMode: TestMode = configuration.mode === "time" ? "words" : "time";
    selectMode(nextMode);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-mode-choice="${nextMode}"]`)?.focus();
    });
  };

  return (
    <div className="mode-picker" data-disabled={disabled} data-mode={configuration.mode}>
      <span className="mode-picker-icon" aria-hidden="true">
        <Timer size={14} />
      </span>
      <div
        className="mode-select-rail"
        role="tablist"
        aria-label="Test mode"
        onKeyDown={handleModeKeyDown}
      >
        <span key={configuration.mode} className="mode-select-accent" aria-hidden="true" />
        {modes.map((mode) => {
          const selected = configuration.mode === mode.value;

          return (
            <button
              type="button"
              key={mode.value}
              className={cn("mode-select-option", selected && "is-selected")}
              data-mode-choice={mode.value}
              data-selection-target="true"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => selectMode(mode.value)}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
      <span className="toolbar-divider" aria-hidden="true" />
      <SegmentedControl
        label={configuration.mode === "time" ? "Time limit" : "Word count"}
        value={configuration.value}
        options={values}
        disabled={disabled}
        compact
        onChange={(value) => onChange({ ...configuration, value, challengeId: null })}
      />
    </div>
  );
}
