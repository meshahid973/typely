import type { AppSettings } from "../../app/app.types";
import { Toggle } from "../../components/ui/Toggle";

interface GameplaySettingsProps {
  settings: AppSettings;
  onChange: (settings: Partial<AppSettings>) => void;
}

export function GameplaySettings({ settings, onChange }: GameplaySettingsProps) {
  return (
    <section className="settings-section" aria-labelledby="gameplay-heading">
      <div className="settings-section-heading">
        <h3 id="gameplay-heading">Gameplay</h3>
        <p>Choose how much game feedback appears during a run.</p>
      </div>
      <Toggle
        id="word-judgements"
        label="Word judgements"
        description="Show a small rating after each completed word."
        checked={settings.judgementsEnabled}
        onChange={(judgementsEnabled) => onChange({ judgementsEnabled })}
      />
      <Toggle
        id="cadence-effects"
        label="Cadence effects"
        description="Let the caret and progress line react to your rhythm."
        checked={settings.cadenceEffects}
        onChange={(cadenceEffects) => onChange({ cadenceEffects })}
      />
    </section>
  );
}
