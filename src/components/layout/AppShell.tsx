import type { PropsWithChildren } from "react";
import { PressFeedback } from "../../app/PressFeedback";
import { Titlebar } from "./Titlebar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-window">
      <PressFeedback />
      <Titlebar />
      <main className="app-content">{children}</main>
    </div>
  );
}
