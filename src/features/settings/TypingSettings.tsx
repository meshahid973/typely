import type {
  AppSettings,
  CaretStyle,
  ResultMotion,
  TextFocusStyle,
  TrailIntensity,
} from "../../app/app.types";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Toggle } from "../../components/ui/Toggle";

interface TypingSettingsProps {
  settings: AppSettings;
  onChange: (settings: Partial<AppSettings>) => void;
}

const caretOptions: Array<{ value: CaretStyle; label: string }> = [
  { value: "bar", label: "Bar" },
  { value: "block", label: "Block" },
  { value: "underline", label: "Underline" },
];

const focusOptions: Array<{ value: TextFocusStyle; label: string }> = [
  { value: "standard", label: "Standard" },
  { value: "fade-complete", label: "Fade typed" },
  { value: "spotlight", label: "Spotlight" },
];

const trailOptions: Array<{ value: TrailIntensity; label: string }> = [
  { value: "off", label: "Off" },
  { value: "subtle", label: "Subtle" },
  { value: "full", label: "Full" },
];

const resultMotionOptions: Array<{ value: ResultMotion; label: string }> = [
  { value: "calm", label: "Calm" },
  { value: "full", label: "Full" },
];

export function TypingSettings({ settings, onChange }: TypingSettingsProps) {
  return (
    <section className="settings-section" aria-labelledby="typing-heading">
      <div className="settings-section-heading">
        <h3 id="typing-heading">Typing</h3>
        <p>Control the feedback shown during a run without changing its rules.</p>
      </div>
      <SegmentedControl
        label="Caret style"
        value={settings.caretStyle}
        options={caretOptions}
        onChange={(caretStyle) => onChange({ caretStyle })}
      />
      <SegmentedControl
        label="Text focus"
        value={settings.textFocusStyle}
        options={focusOptions}
        onChange={(textFocusStyle) => onChange({ textFocusStyle })}
      />
      <SegmentedControl
        label="Caret trail"
        value={settings.trailIntensity}
        options={trailOptions}
        onChange={(trailIntensity) => onChange({ trailIntensity })}
      />
      <SegmentedControl
        label="Result motion"
        value={settings.resultMotion}
        options={resultMotionOptions}
        onChange={(resultMotion) => onChange({ resultMotion })}
      />
      <Toggle
        id="live-stats"
        label="Live stats"
        description="Show WPM and accuracy while typing unless a session modifier hides them."
        checked={settings.liveStats}
        onChange={(liveStats) => onChange({ liveStats })}
      />
    </section>
  );
}
