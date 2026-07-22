import { AppShell } from "../components/layout/AppShell";
import { HistoryScreen } from "../features/history/HistoryScreen";
import { InsightsScreen } from "../features/insights/InsightsScreen";
import { PracticeScreen } from "../features/practice/PracticeScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { useApp } from "./AppContext";

export function App() {
  const { view } = useApp();

  return (
    <AppShell>
      {view === "practice" && <PracticeScreen />}
      {view === "history" && <HistoryScreen />}
      {view === "insights" && <InsightsScreen />}
      {view === "settings" && <SettingsScreen />}
    </AppShell>
  );
}
