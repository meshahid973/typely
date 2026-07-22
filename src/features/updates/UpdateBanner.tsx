import { invoke } from "@tauri-apps/api/core";
import { ArrowDownToLine, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useUpdateChecker } from "./useUpdateChecker";

async function openReleaseUrl(url: string) {
  if (window.__TAURI_INTERNALS__) {
    await invoke("open_update_url", { url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export function UpdateBanner() {
  const { currentVersion, release, dismiss } = useUpdateChecker();
  const [opening, setOpening] = useState(false);

  if (!release) {
    return null;
  }

  const handleOpen = async () => {
    if (opening) {
      return;
    }

    setOpening(true);

    try {
      await openReleaseUrl(release.downloadUrl);
    } finally {
      setOpening(false);
    }
  };

  return (
    <aside className="update-banner" aria-live="polite" data-test={release.test}>
      <div className="update-banner-icon" aria-hidden="true">
        <Sparkles size={16} strokeWidth={2.2} />
      </div>
      <div className="update-banner-copy">
        <strong>{release.test ? "Update banner test" : `${release.version} is available`}</strong>
        <span>
          {release.test
            ? "Left, Left, Up, Up, Down, Down triggered this preview."
            : `You are using v${currentVersion}. Download the newest Typely installer.`}
        </span>
      </div>
      <button
        type="button"
        className="update-banner-action"
        onClick={() => void handleOpen()}
        disabled={opening}
      >
        <ArrowDownToLine size={15} strokeWidth={2.2} />
        {release.test ? "Open releases" : opening ? "Opening…" : "Download update"}
      </button>
      <button
        type="button"
        className="update-banner-close"
        aria-label="Dismiss update"
        onClick={dismiss}
      >
        <X size={15} strokeWidth={2.2} />
      </button>
    </aside>
  );
}
