import { Check, Download, Moon, RotateCcw, Sun, Trash2, Upload } from "lucide-react";
import { type ChangeEvent, type CSSProperties, useEffect, useRef, useState } from "react";
import { useApp } from "../../app/AppProvider";
import type { AppAccent, AppSettings, AppTheme, CaretStyle } from "../../app/app.types";
import { audioEngine } from "../../audio/audioEngine";
import { soundPacks } from "../../audio/audioManifest";
import { GameButton } from "../../components/ui/GameButton";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Slider } from "../../components/ui/Slider";
import { Toggle } from "../../components/ui/Toggle";
import { downloadAppDataBackup, parseAppDataBackup } from "../../storage/appData";
import { cn } from "../../utils/cn";
import { runThemeWipe } from "../../utils/motion";

interface SettingsSectionProps {
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

const themeWipeColours: Record<AppTheme, string> = {
  cream: "#f5f0df",
  night: "#151713",
};

const caretOptions: Array<{ value: CaretStyle; label: string }> = [
  { value: "bar", label: "Bar" },
  { value: "block", label: "Block" },
];

export function AppearanceSettings({ settings, onChange }: SettingsSectionProps) {
  return (
    <section className="settings-section" aria-labelledby="appearance-heading">
      <div
        className="settings-section-heading drawer-motion-group"
        style={{ "--drawer-group": 0 } as CSSProperties}
      >
        <h3 id="appearance-heading">Appearance</h3>
        <p>Keep Typely calm, readable, and consistent.</p>
      </div>
      <div className="drawer-motion-group" style={{ "--drawer-group": 1 } as CSSProperties}>
        <SegmentedControl
          label="Theme"
          value={settings.theme}
          options={themes}
          onChange={(theme, origin) => {
            if (theme !== settings.theme) {
              runThemeWipe(origin, () => onChange({ theme }), themeWipeColours[theme]);
            }
          }}
        />
      </div>
      <fieldset
        className="accent-options drawer-motion-group"
        style={{ "--drawer-group": 2 } as CSSProperties}
      >
        <legend className="visually-hidden">Accent colour</legend>
        {accents.map((accent) => {
          const selected = accent.value === settings.accent;

          return (
            <button
              type="button"
              key={accent.value}
              className={cn("accent-option", selected && "is-selected")}
              data-accent-choice={accent.value}
              data-selection-target="true"
              aria-pressed={selected}
              onClick={(event) => {
                if (!selected) {
                  runThemeWipe(event.currentTarget, () => onChange({ accent: accent.value }));
                }
              }}
            >
              <span className="accent-option-swatch" data-wipe-colour aria-hidden="true" />
              <span>{accent.label}</span>
              {selected && <Check size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </fieldset>
      <div
        className="theme-preview drawer-motion-group"
        style={{ "--drawer-group": 3 } as CSSProperties}
        aria-hidden="true"
      >
        {settings.theme === "cream" ? <Sun size={17} /> : <Moon size={17} />}
        <span>{settings.theme === "cream" ? "Warm cream" : "Quiet night"}</span>
      </div>
    </section>
  );
}

export function TypingSettings({ settings, onChange }: SettingsSectionProps) {
  return (
    <section className="settings-section" aria-labelledby="typing-heading">
      <div
        className="settings-section-heading drawer-motion-group"
        style={{ "--drawer-group": 0 } as CSSProperties}
      >
        <h3 id="typing-heading">Typing</h3>
        <p>Control the feedback shown during a run.</p>
      </div>
      <div className="drawer-motion-group" style={{ "--drawer-group": 1 } as CSSProperties}>
        <SegmentedControl
          label="Caret style"
          value={settings.caretStyle}
          options={caretOptions}
          onChange={(caretStyle) => onChange({ caretStyle })}
        />
      </div>
      <div className="drawer-motion-group" style={{ "--drawer-group": 2 } as CSSProperties}>
        <Toggle
          id="live-stats"
          label="Live stats"
          description="Show WPM and accuracy while typing."
          checked={settings.liveStats}
          onChange={(liveStats) => onChange({ liveStats })}
        />
      </div>
    </section>
  );
}

export function GameplaySettings({ settings, onChange }: SettingsSectionProps) {
  return (
    <section className="settings-section" aria-labelledby="gameplay-heading">
      <div
        className="settings-section-heading drawer-motion-group"
        style={{ "--drawer-group": 0 } as CSSProperties}
      >
        <h3 id="gameplay-heading">Gameplay</h3>
        <p>Choose how much game feedback appears during a run.</p>
      </div>
      <div className="drawer-motion-group" style={{ "--drawer-group": 1 } as CSSProperties}>
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
          description="Let the caret, chrome, and mode rail react to your rhythm."
          checked={settings.cadenceEffects}
          onChange={(cadenceEffects) => onChange({ cadenceEffects })}
        />
      </div>
    </section>
  );
}

export function AudioSettings({ settings, onChange }: SettingsSectionProps) {
  const audioDisabled = !settings.soundEnabled || settings.soundPack === "silent";

  return (
    <section className="settings-section" aria-labelledby="audio-heading">
      <div
        className="settings-section-heading drawer-motion-group"
        style={{ "--drawer-group": 0 } as CSSProperties}
      >
        <h3 id="audio-heading">Audio</h3>
        <p>Original local sound packs with separate volume controls.</p>
      </div>
      <div className="drawer-motion-group" style={{ "--drawer-group": 1 } as CSSProperties}>
        <Toggle
          id="sound-enabled"
          label="Sound effects"
          description="Disable this for a completely silent session."
          checked={settings.soundEnabled}
          onChange={(soundEnabled) => onChange({ soundEnabled })}
        />
        <label className="settings-select-row" htmlFor="sound-pack" data-selection-target="true">
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
      </div>
      <div className="drawer-motion-group" style={{ "--drawer-group": 2 } as CSSProperties}>
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
      </div>
    </section>
  );
}

export function AccessibilitySettings({ settings, onChange }: SettingsSectionProps) {
  return (
    <section className="settings-section" aria-labelledby="accessibility-heading">
      <div
        className="settings-section-heading drawer-motion-group"
        style={{ "--drawer-group": 0 } as CSSProperties}
      >
        <h3 id="accessibility-heading">Accessibility</h3>
        <p>Typely uses its own settings instead of Windows animation preferences.</p>
      </div>
      <div className="drawer-motion-group" style={{ "--drawer-group": 1 } as CSSProperties}>
        <Toggle
          id="reduced-motion"
          label="Reduced motion"
          description="Removes non-essential movement only when enabled here."
          checked={settings.reducedMotion}
          onChange={(reducedMotion) => onChange({ reducedMotion })}
        />
        <Toggle
          id="high-contrast"
          label="High contrast"
          description="Strengthens borders and text separation."
          checked={settings.highContrast}
          onChange={(highContrast) => onChange({ highContrast })}
        />
      </div>
    </section>
  );
}

const maximumBackupSize = 8 * 1024 * 1024;

export function DataSettings() {
  const { results, clearResults, resetProfile, createBackup, restoreBackup } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimer = useRef<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (file.size > maximumBackupSize) {
      setMessage("That backup is too large to import safely.");
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      const backup = parseAppDataBackup(parsed);
      restoreBackup(backup);
      setMessage(`Imported ${backup.results.length} results.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The backup could not be imported.");
    }
  };

  const resetProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true);

      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);

      resetTimer.current = window.setTimeout(() => {
        setConfirmReset(false);
        resetTimer.current = null;
      }, 3000);
      return;
    }

    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }

    clearResults();
    resetProfile();
    setConfirmReset(false);
    setMessage("Local progress was reset.");
  };

  return (
    <section className="settings-section" aria-labelledby="data-heading">
      <div
        className="settings-section-heading drawer-motion-group"
        style={{ "--drawer-group": 0 } as CSSProperties}
      >
        <h3 id="data-heading">Data</h3>
        <p>Export, restore, or clear the local data stored by Typely.</p>
      </div>
      <div
        className="data-actions drawer-motion-group"
        style={{ "--drawer-group": 1 } as CSSProperties}
      >
        <GameButton
          variant="secondary"
          onClick={() => {
            downloadAppDataBackup(createBackup());
            setMessage("Backup exported.");
          }}
        >
          <Download size={15} />
          export backup
        </GameButton>
        <GameButton variant="secondary" onClick={() => inputRef.current?.click()}>
          <Upload size={15} />
          import backup
        </GameButton>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={importBackup}
        />
      </div>
      <div className="drawer-motion-group" style={{ "--drawer-group": 2 } as CSSProperties}>
        <div className="data-summary">
          <span>
            {results.length} detailed {results.length === 1 ? "result" : "results"} stored
          </span>
          <small>Backups include settings, profile progress, replays, and history.</small>
        </div>
        <GameButton variant="ghost" className="danger-action" onClick={resetProgress}>
          {confirmReset ? <Trash2 size={15} /> : <RotateCcw size={15} />}
          {confirmReset ? "confirm reset" : "reset local progress"}
        </GameButton>
        {message && (
          <p className="data-message" role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
