import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { useEffect } from "react";
import { IconButton } from "../ui/IconButton";
import { AppNavigation } from "./AppNavigation";
import { ProfileChip } from "./ProfileChip";

function runWindowAction(action: (window: ReturnType<typeof getCurrentWindow>) => Promise<void>) {
  if (!window.__TAURI_INTERNALS__) {
    return;
  }

  void action(getCurrentWindow()).catch(() => undefined);
}

export function Titlebar() {
  useEffect(() => {
    const root = document.documentElement;

    if (!window.__TAURI_INTERNALS__) {
      root.dataset.windowMaximized = "false";
      return;
    }

    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    let active = true;

    const syncMaximized = async () => {
      try {
        const maximized = await appWindow.isMaximized();

        if (active) {
          root.dataset.windowMaximized = maximized ? "true" : "false";
        }
      } catch {
        if (active) {
          root.dataset.windowMaximized = "false";
        }
      }
    };

    void syncMaximized();
    void appWindow
      .onResized(() => {
        window.requestAnimationFrame(() => void syncMaximized());
      })
      .then((stop) => {
        if (active) {
          unlisten = stop;
        } else {
          stop();
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
      unlisten?.();
      delete root.dataset.windowMaximized;
    };
  }, []);

  return (
    <header className="titlebar">
      <div className="titlebar-brand" data-tauri-drag-region>
        <span className="titlebar-mark" aria-hidden="true">
          t
        </span>
        <span>typely</span>
      </div>
      <div className="titlebar-drag-region" data-tauri-drag-region />
      <ProfileChip />
      <AppNavigation />
      <div className="titlebar-controls">
        <IconButton
          label="Minimize"
          tone="window"
          onClick={() => runWindowAction((appWindow) => appWindow.minimize())}
        >
          <Minus size={14} strokeWidth={2.1} />
        </IconButton>
        <IconButton
          label="Maximize or restore"
          tone="window"
          onClick={() => runWindowAction((appWindow) => appWindow.toggleMaximize())}
        >
          <Square size={11} strokeWidth={2.1} />
        </IconButton>
        <IconButton
          label="Close"
          tone="window"
          className="titlebar-close"
          onClick={() => runWindowAction((appWindow) => appWindow.close())}
        >
          <X size={14} strokeWidth={2.1} />
        </IconButton>
      </div>
    </header>
  );
}
