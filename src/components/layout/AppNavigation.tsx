import { BarChart3, History, Keyboard, type LucideIcon, Settings } from "lucide-react";
import { useApp } from "../../app/AppContext";
import type { AppView } from "../../app/app.types";
import { cn } from "../../lib/cn";

interface NavigationItem {
  view: AppView;
  label: string;
  icon: LucideIcon;
}

const navigation: NavigationItem[] = [
  { view: "practice", label: "Practice", icon: Keyboard },
  { view: "history", label: "History", icon: History },
  { view: "insights", label: "Insights", icon: BarChart3 },
  { view: "settings", label: "Settings", icon: Settings },
];

export function AppNavigation() {
  const { view, setView, results } = useApp();

  return (
    <nav className="app-navigation" aria-label="Main navigation">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = item.view === view;

        return (
          <button
            type="button"
            key={item.view}
            className={cn("navigation-link", active && "is-active")}
            aria-current={active ? "page" : undefined}
            title={item.label}
            onClick={() => setView(item.view)}
          >
            <Icon size={17} strokeWidth={2} />
            <span>{item.label}</span>
            {item.view === "history" && results.length > 0 && (
              <small>{Math.min(results.length, 99)}</small>
            )}
          </button>
        );
      })}
    </nav>
  );
}
