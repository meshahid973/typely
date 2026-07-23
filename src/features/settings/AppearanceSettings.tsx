import { Check, Moon, Sun } from "lucide-react";
import type { AppAccent, AppSettings, AppTheme, BackgroundTreatment } from "../../app/app.types";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { cn } from "../../utils/cn";

interface AppearanceSettingsProps {
  settings: AppSettings;
  onChange: (settings: Partial<AppSettings>) => void;
}

const themes: Array<{ value: AppTheme; label: string }> = [
  { value: "cream", label: "Cream" },
  { value: "night", label: "Night" },
];

const accents: Array<{ value: AppAccent; label: string }> = [
  { value: "pink", label: "Blush" },
  { value: "lime", label: "Lime" },
  { value: "lavender", label: "Lavender" },
  { value: "sky", label: "Sky" },
];

const backgroundOptions: Array<{ value: BackgroundTreatment; label: string }> = [
  { value: "plain", label: "Plain" },
  { value: "paper", label: "Paper" },
  { value: "glass", label: "Glass" },
];

export function AppearanceSettings({ settings, onChange }: AppearanceSettingsProps) {
  return (
    <section className="settings-section" aria-labelledby="appearance-heading">
      <div className="settings-section-heading">
        <h3 id="appearance-heading">Appearance</h3>
        <p>Keep Typely recognisable while adjusting its surface treatment.</p>
      </div>
      <SegmentedControl
        label="Theme"
        value={settings.theme}
        options={themes}
        onChange={(theme) => onChange({ theme })}
      />
      <SegmentedControl
        label="Background"
        value={settings.backgroundTreatment}
        options={backgroundOptions}
        onChange={(backgroundTreatment) => onChange({ backgroundTreatment })}
      />
      <fieldset className="accent-options">
        <legend className="visually-hidden">Accent colour</legend>
        {accents.map((accent) => {
          const selected = accent.value === settings.accent;

          return (
            <button
              type="button"
              key={accent.value}
              className={cn("accent-option", selected && "is-selected")}
              data-accent-choice={accent.value}
              aria-pressed={selected}
              onClick={() => onChange({ accent: accent.value })}
            >
              <span className="accent-option-swatch" aria-hidden="true" />
              <span>{accent.label}</span>
              {selected && <Check size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </fieldset>
      <div className="theme-preview" aria-hidden="true">
        {settings.theme === "cream" ? <Sun size={17} /> : <Moon size={17} />}
        <span>{settings.theme === "cream" ? "Warm cream" : "Quiet night"}</span>
      </div>
    </section>
  );
}
