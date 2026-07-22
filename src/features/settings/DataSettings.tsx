import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { GameButton } from "../../components/ui/GameButton";
import { downloadAppDataBackup, parseAppDataBackup } from "../../storage/appData";

const maximumBackupSize = 8 * 1024 * 1024;

export function DataSettings() {
  const { results, clearResults, resetProfile, createBackup, restoreBackup } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimer = useRef<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > maximumBackupSize) {
      setMessage("That backup is too large to import safely.");
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      const backup = parseAppDataBackup(parsed);
      restoreBackup(backup);
      setMessage(`Imported ${backup.results.length} results.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The backup could not be imported.");
    }
  };

  const resetProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true);

      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }

      resetTimer.current = window.setTimeout(() => {
        setConfirmReset(false);
        resetTimer.current = null;
      }, 3000);
      return;
    }

    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }

    clearResults();
    resetProfile();
    setConfirmReset(false);
    setMessage("Local progress was reset.");
  };

  return (
    <section className="settings-section" aria-labelledby="data-heading">
      <div className="settings-section-heading">
        <h3 id="data-heading">Data</h3>
        <p>Export, restore, or clear the local data stored by Typely.</p>
      </div>
      <div className="data-actions">
        <GameButton
          variant="secondary"
          onClick={() => {
            downloadAppDataBackup(createBackup());
            setMessage("Backup exported.");
          }}
        >
          <Download size={15} />
          export backup
        </GameButton>
        <GameButton variant="secondary" onClick={() => inputRef.current?.click()}>
          <Upload size={15} />
          import backup
        </GameButton>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={importBackup}
        />
      </div>
      <div className="data-summary">
        <span>
          {results.length} detailed {results.length === 1 ? "result" : "results"} stored
        </span>
        <small>Backups include settings, profile progress, replays, and history.</small>
      </div>
      <GameButton variant="ghost" className="danger-action" onClick={resetProgress}>
        {confirmReset ? <Trash2 size={15} /> : <RotateCcw size={15} />}
        {confirmReset ? "confirm reset" : "reset local progress"}
      </GameButton>
      {message && (
        <p className="data-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
