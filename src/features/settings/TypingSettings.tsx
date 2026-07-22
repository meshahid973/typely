import type { AppSettings, CaretStyle } from "../../app/app.types";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Toggle } from "../../components/ui/Toggle";

interface TypingSettingsProps {
  settings: AppSettings;
  onChange: (settings: Partial<AppSettings>) => void;
}

const caretOptions: Array<{ value: CaretStyle; label: string }> = [
  { value: "bar", label: "Bar" },
  { value: "block", label: "Block" },
];

export function TypingSettings({ settings, onChange }: TypingSettingsProps) {
  return (
    <section className="settings-section" aria-labelledby="typing-heading">
      <div className="settings-section-heading">
        <h3 id="typing-heading">Typing</h3>
        <p>Control the feedback shown during a run.</p>
      </div>
      <SegmentedControl
        label="Caret style"
        value={settings.caretStyle}
        options={caretOptions}
        onChange={(caretStyle) => onChange({ caretStyle })}
      />
      <Toggle
        id="live-stats"
        label="Live stats"
        description="Show WPM and accuracy while typing."
        checked={settings.liveStats}
        onChange={(liveStats) => onChange({ liveStats })}
      />
    </section>
  );
}
