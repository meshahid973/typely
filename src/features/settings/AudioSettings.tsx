import type { ChangeEvent } from "react";
import type { AppSettings } from "../../app/app.types";
import { audioEngine } from "../../audio/audioEngine";
import { soundPacks } from "../../audio/audioManifest";
import { Slider } from "../../components/ui/Slider";
import { Toggle } from "../../components/ui/Toggle";

interface AudioSettingsProps {
  settings: AppSettings;
  onChange: (settings: Partial<AppSettings>) => void;
}

export function AudioSettings({ settings, onChange }: AudioSettingsProps) {
  const audioDisabled = !settings.soundEnabled || settings.soundPack === "silent";

  return (
    <section className="settings-section" aria-labelledby="audio-heading">
      <div className="settings-section-heading">
        <h3 id="audio-heading">Audio</h3>
        <p>Original local sound packs with separate volume controls.</p>
      </div>
      <Toggle
        id="sound-enabled"
        label="Sound effects"
        description="Disable this for a completely silent session."
        checked={settings.soundEnabled}
        onChange={(soundEnabled) => onChange({ soundEnabled })}
      />
      <label className="settings-select-row" htmlFor="sound-pack">
        <span>
          <strong>Sound pack</strong>
          <small>Choose the character of typing and menu feedback.</small>
        </span>
        <select
          id="sound-pack"
          value={settings.soundPack}
          disabled={!settings.soundEnabled}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const soundPack = event.target.value as AppSettings["soundPack"];
            onChange({ soundPack });
            window.setTimeout(() => audioEngine.play("menu-select"), 0);
          }}
        >
          {soundPacks.map((pack) => (
            <option key={pack.value} value={pack.value}>
              {pack.label}
            </option>
          ))}
        </select>
      </label>
      <Slider
        id="typing-volume"
        label="Typing volume"
        valueLabel={`${Math.round(settings.typingVolume * 100)}%`}
        value={settings.typingVolume}
        min={0}
        max={1}
        step={0.05}
        disabled={audioDisabled}
        onChange={(typingVolume) => onChange({ typingVolume })}
        onCommit={() => audioEngine.play("typing-correct")}
      />
      <Slider
        id="interface-volume"
        label="Interface volume"
        valueLabel={`${Math.round(settings.interfaceVolume * 100)}%`}
        value={settings.interfaceVolume}
        min={0}
        max={1}
        step={0.05}
        disabled={audioDisabled}
        onChange={(interfaceVolume) => onChange({ interfaceVolume })}
        onCommit={() => audioEngine.play("menu-select")}
      />
    </section>
  );
}
