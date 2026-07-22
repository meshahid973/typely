import type { PropsWithChildren } from "react";
import { PressFeedback } from "../components/feedback/PressFeedback";
import { Titlebar } from "../components/layout/Titlebar";
import { SettingsDrawer } from "../features/settings/SettingsDrawer";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-window">
      <PressFeedback />
      <Titlebar />
      <main className="app-content">{children}</main>
      <SettingsDrawer />
    </div>
  );
}
