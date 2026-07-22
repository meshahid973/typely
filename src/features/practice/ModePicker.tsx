import { Timer } from "lucide-react";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import type { TestConfiguration, TestMode } from "../../core/typing/types";

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

  return (
    <div className="mode-picker" data-disabled={disabled}>
      <span className="mode-picker-icon" aria-hidden="true">
        <Timer size={14} />
      </span>
      <SegmentedControl
        label="Test mode"
        value={configuration.mode}
        options={modes}
        disabled={disabled}
        compact
        onChange={(mode) => onChange({ ...configuration, mode, value: mode === "time" ? 30 : 25 })}
      />
      <span className="toolbar-divider" aria-hidden="true" />
      <SegmentedControl
        label={configuration.mode === "time" ? "Time limit" : "Word count"}
        value={configuration.value}
        options={values}
        disabled={disabled}
        compact
        onChange={(value) => onChange({ ...configuration, value })}
      />
    </div>
  );
}
