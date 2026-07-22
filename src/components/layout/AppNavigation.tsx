import { BarChart3, History, Keyboard, type LucideIcon, Settings } from "lucide-react";
import { useApp } from "../../app/AppProvider";
import type { AppView } from "../../app/app.types";
import { NavigationButton } from "../ui/NavigationButton";

interface NavigationItem {
  view: AppView;
  label: string;
  icon: LucideIcon;
}

const navigation: NavigationItem[] = [
  { view: "practice", label: "Practice", icon: Keyboard },
  { view: "history", label: "History", icon: History },
  { view: "insights", label: "Insights", icon: BarChart3 },
];

export function AppNavigation() {
  const { view, setView, settingsOpen, profileOpen, openSettings, closeSettings } = useApp();

  return (
    <nav className="app-navigation" aria-label="Main navigation">
      {navigation.map((item) => {
        const Icon = item.icon;

        return (
          <NavigationButton
            key={item.view}
            active={item.view === view && !settingsOpen && !profileOpen}
            aria-label={item.label}
            title={item.label}
            onClick={() => setView(item.view)}
          >
            <Icon size={15} strokeWidth={2} />
            <span>{item.label}</span>
          </NavigationButton>
        );
      })}
      <NavigationButton
        active={settingsOpen}
        current={false}
        aria-label="Settings"
        title="Settings"
        aria-haspopup="dialog"
        aria-expanded={settingsOpen}
        onClick={settingsOpen ? closeSettings : openSettings}
      >
        <Settings size={15} strokeWidth={2} />
        <span>Settings</span>
      </NavigationButton>
    </nav>
  );
}
