import {
  Accessibility,
  Database,
  Keyboard,
  Palette,
  Settings,
  Sparkles,
  Volume2,
} from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { Drawer } from "../../components/ui/Drawer";
import { cn } from "../../utils/cn";
import {
  AccessibilitySettings,
  AppearanceSettings,
  AudioSettings,
  DataSettings,
  GameplaySettings,
  TypingSettings,
} from "./SettingsSections";

type SettingsCategory = "appearance" | "typing" | "gameplay" | "audio" | "accessibility" | "data";
type PanelPhase = "idle" | "leaving" | "entering";

const categories = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "typing", label: "Typing", icon: Keyboard },
  { id: "gameplay", label: "Gameplay", icon: Sparkles },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "data", label: "Data", icon: Database },
] satisfies Array<{ id: SettingsCategory; label: string; icon: typeof Palette }>;

const categoryOrder = Object.fromEntries(
  categories.map((item, index) => [item.id, index]),
) as Record<SettingsCategory, number>;

export function SettingsDrawer() {
  const { settings, settingsOpen, closeSettings, updateSettings } = useApp();
  const [category, setCategory] = useState<SettingsCategory>("appearance");
  const [displayedCategory, setDisplayedCategory] = useState<SettingsCategory>("appearance");
  const [panelPhase, setPanelPhase] = useState<PanelPhase>("idle");
  const [panelDirection, setPanelDirection] = useState<"forward" | "backward">("forward");
  const panelTimer = useRef<number | null>(null);
  const panelFrame = useRef<number | null>(null);
  const tabGroupId = useId();
  const activeTabId = `${tabGroupId}-${category}-tab`;
  const activePanelId = `${tabGroupId}-${displayedCategory}-panel`;

  useEffect(() => {
    return () => {
      if (panelTimer.current !== null) window.clearTimeout(panelTimer.current);
      if (panelFrame.current !== null) window.cancelAnimationFrame(panelFrame.current);
    };
  }, []);

  const changeCategory = (nextCategory: SettingsCategory) => {
    if (nextCategory === category) return;

    setCategory(nextCategory);
    setPanelDirection(
      categoryOrder[nextCategory] > categoryOrder[displayedCategory] ? "forward" : "backward",
    );

    if (settings.reducedMotion) {
      setDisplayedCategory(nextCategory);
      setPanelPhase("idle");
      return;
    }

    if (panelTimer.current !== null) window.clearTimeout(panelTimer.current);
    if (panelFrame.current !== null) window.cancelAnimationFrame(panelFrame.current);

    setPanelPhase("leaving");
    panelTimer.current = window.setTimeout(() => {
      setDisplayedCategory(nextCategory);
      setPanelPhase("entering");
      panelFrame.current = window.requestAnimationFrame(() => {
        panelFrame.current = window.requestAnimationFrame(() => {
          setPanelPhase("idle");
          panelFrame.current = null;
        });
      });
      panelTimer.current = null;
    }, 105);
  };

  const moveCategoryFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";

    if (!horizontal && !vertical && event.key !== "Home" && event.key !== "End") return;

    event.preventDefault();
    let nextIndex = index;

    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = categories.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown")
      nextIndex = (index + 1) % categories.length;
    else nextIndex = (index - 1 + categories.length) % categories.length;

    const nextCategory = categories[nextIndex];
    changeCategory(nextCategory.id);
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
      sharedKey="settings"
      headerVisual={
        <span className="settings-drawer-shared">
          <Settings size={18} strokeWidth={2} />
        </span>
      }
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
                data-selection-target="true"
                onClick={() => changeCategory(item.id)}
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
          key={displayedCategory}
          role="tabpanel"
          aria-labelledby={activeTabId}
          data-phase={panelPhase}
          data-direction={panelDirection}
        >
          {displayedCategory === "appearance" && (
            <AppearanceSettings settings={settings} onChange={updateSettings} />
          )}
          {displayedCategory === "typing" && (
            <TypingSettings settings={settings} onChange={updateSettings} />
          )}
          {displayedCategory === "gameplay" && (
            <GameplaySettings settings={settings} onChange={updateSettings} />
          )}
          {displayedCategory === "audio" && (
            <AudioSettings settings={settings} onChange={updateSettings} />
          )}
          {displayedCategory === "accessibility" && (
            <AccessibilitySettings settings={settings} onChange={updateSettings} />
          )}
          {displayedCategory === "data" && <DataSettings />}
        </div>
      </div>
    </Drawer>
  );
}
