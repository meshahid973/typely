import { Accessibility, Database, Keyboard, Palette, Sparkles, Volume2 } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";
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
  const tabGroupId = useId();
  const activeTabId = `${tabGroupId}-${category}-tab`;
  const activePanelId = `${tabGroupId}-${category}-panel`;

  const moveCategoryFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";

    if (!horizontal && !vertical && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();
    let nextIndex = index;

    if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = categories.length - 1;
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % categories.length;
    } else {
      nextIndex = (index - 1 + categories.length) % categories.length;
    }

    const nextCategory = categories[nextIndex];
    setCategory(nextCategory.id);
    window.requestAnimationFrame(() => {
      document.getElementById(`${tabGroupId}-${nextCategory.id}-tab`)?.focus();
    });
  };

  return (
    <Drawer
      open={settingsOpen}
      title="Settings"
      description="Personalise Typely without leaving your current screen."
      size="wide"
      className="settings-drawer"
      onClose={closeSettings}
    >
      <div className="settings-layout">
        <div
          className="settings-categories"
          role="tablist"
          aria-label="Settings categories"
          aria-orientation="vertical"
        >
          {categories.map((item, index) => {
            const Icon = item.icon;
            const selected = category === item.id;

            return (
              <button
                type="button"
                key={item.id}
                id={`${tabGroupId}-${item.id}-tab`}
                className={cn(selected && "is-active")}
                role="tab"
                aria-selected={selected}
                aria-controls={selected ? activePanelId : undefined}
                tabIndex={selected ? 0 : -1}
                onClick={() => setCategory(item.id)}
                onKeyDown={(event) => moveCategoryFocus(event, index)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
                <span className="settings-category-marker" aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div
          id={activePanelId}
          className="settings-category-content"
          key={category}
          role="tabpanel"
          aria-labelledby={activeTabId}
        >
          {category === "appearance" && (
            <AppearanceSettings settings={settings} onChange={updateSettings} />
          )}
          {category === "typing" && (
            <TypingSettings settings={settings} onChange={updateSettings} />
          )}
          {category === "gameplay" && (
            <GameplaySettings settings={settings} onChange={updateSettings} />
          )}
          {category === "audio" && <AudioSettings settings={settings} onChange={updateSettings} />}
          {category === "accessibility" && (
            <AccessibilitySettings settings={settings} onChange={updateSettings} />
          )}
          {category === "data" && <DataSettings />}
        </div>
      </div>
    </Drawer>
  );
}
