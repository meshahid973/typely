import type { PropsWithChildren } from "react";
import { Titlebar } from "./Titlebar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-window">
      <Titlebar />
      <main className="app-content">{children}</main>
    </div>
  );
}
