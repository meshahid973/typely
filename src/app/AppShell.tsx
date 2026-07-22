import type { PropsWithChildren } from "react";
import { PressFeedback } from "../components/feedback/PressFeedback";
import { Titlebar } from "../components/layout/Titlebar";
import { ProfileDrawer } from "../features/progression/ProfileDrawer";
import { SettingsDrawer } from "../features/settings/SettingsDrawer";
import { useApp } from "./AppProvider";

export function AppShell({ children }: PropsWithChildren) {
  const { settingsOpen, profileOpen } = useApp();
  const overlayOpen = settingsOpen || profileOpen;

  return (
    <div className="app-window" data-overlay-open={overlayOpen}>
      <PressFeedback />
      <Titlebar />
      <main className="app-content">{children}</main>
      <SettingsDrawer />
      <ProfileDrawer />
    </div>
  );
}
