import { Check, Moon, MousePointer2, Palette, Sun, Type } from "lucide-react";
import { useApp } from "../../app/AppContext";
import type { AppAccent, AppTheme, CaretStyle } from "../../app/app.types";
import { Panel } from "../../components/ui/Panel";
import { cn } from "../../lib/cn";

const accents: Array<{ value: AppAccent; label: string }> = [
  { value: "pink", label: "Blush" },
  { value: "lime", label: "Lime" },
  { value: "lavender", label: "Lavender" },
  { value: "sky", label: "Sky" },
];

export function SettingsScreen() {
  const { settings, updateSettings } = useApp();

  const setTheme = (theme: AppTheme) => updateSettings({ theme });
  const setCaret = (caretStyle: CaretStyle) => updateSettings({ caretStyle });

  return (
    <div className="view">
      <div className="view-heading">
        <div>
          <h1>Settings</h1>
          <p>Adjust the typing experience without adding clutter.</p>
        </div>
      </div>
      <div className="settings-grid">
        <Panel className="settings-card">
          <div className="settings-heading">
            <span className="settings-icon">
              <Sun size={19} />
            </span>
            <div>
              <strong>Appearance</strong>
              <small>Choose the app appearance.</small>
            </div>
          </div>
          <div className="choice-grid choice-grid-two">
            <button
              type="button"
              className={cn("choice-card", settings.theme === "cream" && "is-selected")}
              onClick={() => setTheme("cream")}
            >
              <Sun size={18} />
              <span>Cream</span>
              {settings.theme === "cream" && <Check size={16} />}
            </button>
            <button
              type="button"
              className={cn("choice-card", settings.theme === "night" && "is-selected")}
              onClick={() => setTheme("night")}
            >
              <Moon size={18} />
              <span>Night</span>
              {settings.theme === "night" && <Check size={16} />}
            </button>
          </div>
        </Panel>
        <Panel className="settings-card">
          <div className="settings-heading">
            <span className="settings-icon">
              <Palette size={19} />
            </span>
            <div>
              <strong>Accent</strong>
              <small>Used for focus and active states.</small>
            </div>
          </div>
          <div className="accent-grid">
            {accents.map((accent) => (
              <button
                type="button"
                key={accent.value}
                className={cn("accent-choice", settings.accent === accent.value && "is-selected")}
                data-accent-choice={accent.value}
                onClick={() => updateSettings({ accent: accent.value })}
              >
                <span />
                <small>{accent.label}</small>
              </button>
            ))}
          </div>
        </Panel>
        <Panel className="settings-card">
          <div className="settings-heading">
            <span className="settings-icon">
              <MousePointer2 size={19} />
            </span>
            <div>
              <strong>Caret</strong>
              <small>Choose the cursor shown while typing.</small>
            </div>
          </div>
          <div className="choice-grid choice-grid-two">
            {(["bar", "block"] as CaretStyle[]).map((style) => (
              <button
                type="button"
                key={style}
                className={cn("choice-card", settings.caretStyle === style && "is-selected")}
                onClick={() => setCaret(style)}
              >
                <span className={`caret-preview caret-preview-${style}`} />
                <span>{style === "bar" ? "Slim bar" : "Soft block"}</span>
                {settings.caretStyle === style && <Check size={16} />}
              </button>
            ))}
          </div>
        </Panel>
        <Panel className="settings-card settings-card-list">
          <button
            type="button"
            className="setting-row"
            onClick={() => updateSettings({ liveStats: !settings.liveStats })}
          >
            <span className="settings-icon">
              <Type size={19} />
            </span>
            <span>
              <strong>Live stats</strong>
              <small>Show WPM and accuracy while typing.</small>
            </span>
            <span className={cn("switch", settings.liveStats && "is-on")}>
              <span />
            </span>
          </button>
          <button
            type="button"
            className="setting-row"
            onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
          >
            <span className="settings-icon">
              <MousePointer2 size={19} />
            </span>
            <span>
              <strong>Reduced motion</strong>
              <small>Remove non-essential transitions.</small>
            </span>
            <span className={cn("switch", settings.reducedMotion && "is-on")}>
              <span />
            </span>
          </button>
        </Panel>
      </div>
    </div>
  );
}
