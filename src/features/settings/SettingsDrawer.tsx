import { Accessibility, Database, Keyboard, Palette, Sparkles, Volume2 } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { Drawer } from "../../components/ui/Drawer";
import { cn } from "../../utils/cn";
import { AccessibilitySettings } from "./AccessibilitySettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { AudioSettings } from "./AudioSettings";
import { DataSettings } from "./DataSettings";
import { GameplaySettings } from "./GameplaySettings";
import { TypingSettings } from "./TypingSettings";

type SettingsCategory = "appearance" | "typing" | "gameplay" | "audio" | "accessibility" | "data";

const categories = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "typing", label: "Typing", icon: Keyboard },
  { id: "gameplay", label: "Gameplay", icon: Sparkles },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "data", label: "Data", icon: Database },
] satisfies Array<{ id: SettingsCategory; label: string; icon: typeof Palette }>;

export function SettingsDrawer() {
  const { settings, settingsOpen, closeSettings, updateSettings } = useApp();
  const [category, setCategory] = useState<SettingsCategory>("appearance");

  return (
    <Drawer
      open={settingsOpen}
      title="Settings"
      description="Tune the interface without leaving your test."
      onClose={closeSettings}
    >
      <nav className="settings-categories" aria-label="Settings categories">
        {categories.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.id}
              className={cn(category === item.id && "is-active")}
              aria-current={category === item.id ? "page" : undefined}
              onClick={() => setCategory(item.id)}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="settings-category-content" key={category}>
        {category === "appearance" && (
          <AppearanceSettings settings={settings} onChange={updateSettings} />
        )}
        {category === "typing" && <TypingSettings settings={settings} onChange={updateSettings} />}
        {category === "gameplay" && (
          <GameplaySettings settings={settings} onChange={updateSettings} />
        )}
        {category === "audio" && <AudioSettings settings={settings} onChange={updateSettings} />}
        {category === "accessibility" && (
          <AccessibilitySettings settings={settings} onChange={updateSettings} />
        )}
        {category === "data" && <DataSettings />}
      </div>
    </Drawer>
  );
}
