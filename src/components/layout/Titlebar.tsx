import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { AppNavigation } from "./AppNavigation";

async function withAppWindow(
  action: (window: ReturnType<typeof getCurrentWindow>) => Promise<void>,
) {
  if (!window.__TAURI_INTERNALS__) {
    return;
  }

  await action(getCurrentWindow());
}

export function Titlebar() {
  return (
    <header className="titlebar">
      <div className="titlebar-brand" data-tauri-drag-region>
        <span className="titlebar-mark" aria-hidden="true">
          t
        </span>
        <span>typely</span>
      </div>
      <div className="titlebar-drag-region" data-tauri-drag-region />
      <AppNavigation />
      <div className="titlebar-controls">
        <IconButton
          label="Minimize"
          tone="window"
          onClick={() => withAppWindow((appWindow) => appWindow.minimize())}
        >
          <Minus size={14} strokeWidth={2.1} />
        </IconButton>
        <IconButton
          label="Maximize or restore"
          tone="window"
          onClick={() => withAppWindow((appWindow) => appWindow.toggleMaximize())}
        >
          <Square size={11} strokeWidth={2.1} />
        </IconButton>
        <IconButton
          label="Close"
          tone="window"
          className="titlebar-close"
          onClick={() => withAppWindow((appWindow) => appWindow.close())}
        >
          <X size={14} strokeWidth={2.1} />
        </IconButton>
      </div>
    </header>
  );
}
