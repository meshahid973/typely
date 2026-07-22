import { Check, Moon, Sun } from "lucide-react";
import type { ChangeEvent } from "react";
import { useApp } from "../../app/AppProvider";
import type { AppAccent, AppTheme, CaretStyle } from "../../app/app.types";
import { audioEngine } from "../../audio/audioEngine";
import { soundPacks } from "../../audio/audioManifest";
import { Drawer } from "../../components/ui/Drawer";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Slider } from "../../components/ui/Slider";
import { Toggle } from "../../components/ui/Toggle";
import { cn } from "../../utils/cn";

const themes: Array<{ value: AppTheme; label: string }> = [
  { value: "cream", label: "Cream" },
  { value: "night", label: "Night" },
];

const carets: Array<{ value: CaretStyle; label: string }> = [
  { value: "bar", label: "Bar" },
  { value: "block", label: "Block" },
];

const accents: Array<{ value: AppAccent; label: string }> = [
  { value: "pink", label: "Blush" },
  { value: "lime", label: "Lime" },
  { value: "lavender", label: "Lavender" },
  { value: "sky", label: "Sky" },
];

export function SettingsDrawer() {
  const { settings, settingsOpen, closeSettings, updateSettings } = useApp();

  return (
    <Drawer
      open={settingsOpen}
      title="Settings"
      description="Tune the interface without leaving your test."
      onClose={closeSettings}
    >
      <section className="settings-section" aria-labelledby="appearance-heading">
        <div className="settings-section-heading">
          <h3 id="appearance-heading">Appearance</h3>
          <p>Keep Typely calm, readable, and consistent.</p>
        </div>
        <SegmentedControl
          label="Theme"
          value={settings.theme}
          options={themes}
          onChange={(theme) => updateSettings({ theme })}
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
                onClick={() => updateSettings({ accent: accent.value })}
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

      <section className="settings-section" aria-labelledby="typing-heading">
        <div className="settings-section-heading">
          <h3 id="typing-heading">Typing</h3>
          <p>Control the feedback shown during a run.</p>
        </div>
        <SegmentedControl
          label="Caret style"
          value={settings.caretStyle}
          options={carets}
          onChange={(caretStyle) => updateSettings({ caretStyle })}
        />
        <Toggle
          id="live-stats"
          label="Live stats"
          description="Show WPM and accuracy while typing."
          checked={settings.liveStats}
          onChange={(liveStats) => updateSettings({ liveStats })}
        />
        <Toggle
          id="word-judgements"
          label="Word judgements"
          description="Show a small rating after each completed word."
          checked={settings.judgementsEnabled}
          onChange={(judgementsEnabled) => updateSettings({ judgementsEnabled })}
        />
        <Toggle
          id="cadence-effects"
          label="Cadence effects"
          description="Let the caret and progress line react to your rhythm."
          checked={settings.cadenceEffects}
          onChange={(cadenceEffects) => updateSettings({ cadenceEffects })}
        />
      </section>

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
          onChange={(soundEnabled) => updateSettings({ soundEnabled })}
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
              const soundPack = event.target.value as typeof settings.soundPack;
              updateSettings({ soundPack });
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
          disabled={!settings.soundEnabled || settings.soundPack === "silent"}
          onChange={(typingVolume) => updateSettings({ typingVolume })}
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
          disabled={!settings.soundEnabled || settings.soundPack === "silent"}
          onChange={(interfaceVolume) => updateSettings({ interfaceVolume })}
          onCommit={() => audioEngine.play("menu-select")}
        />
      </section>

      <section className="settings-section" aria-labelledby="accessibility-heading">
        <div className="settings-section-heading">
          <h3 id="accessibility-heading">Accessibility</h3>
          <p>Reduce movement while preserving clear state changes.</p>
        </div>
        <Toggle
          id="reduced-motion"
          label="Reduced motion"
          description="Removes non-essential movement and spring effects."
          checked={settings.reducedMotion}
          onChange={(reducedMotion) => updateSettings({ reducedMotion })}
        />
      </section>
    </Drawer>
  );
}
