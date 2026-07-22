import { Cloud, CloudDownload, CloudUpload, LogIn, LogOut, UserPlus } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { GameButton } from "../../components/ui/GameButton";
import { parseAppDataBackup } from "../../storage/appData";
import { formatDate } from "../../utils/format";
import { useAuth } from "./AuthProvider";

type AuthMode = "login" | "register";
type SyncState = "idle" | "uploading" | "restoring";

export function AccountPanel() {
  const auth = useAuth();
  const { createBackup, restoreBackup, updateProfile } = useApp();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    if (!confirmRestore) {
      return;
    }

    const timeout = window.setTimeout(() => setConfirmRestore(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [confirmRestore]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    auth.clearError();

    try {
      const user =
        mode === "register"
          ? await auth.register({ email, password, displayName })
          : await auth.login({ email, password });

      updateProfile({ name: user.displayName });
      setPassword("");
      setMessage(mode === "register" ? "Your account is ready." : "Signed in successfully.");
    } catch {
      return;
    }
  };

  const upload = async () => {
    setSyncState("uploading");
    setMessage(null);

    try {
      const updatedAt = await auth.uploadCloudBackup(createBackup());
      setMessage(`Cloud backup saved ${formatDate(updatedAt)}.`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Cloud sync failed.");
    } finally {
      setSyncState("idle");
    }
  };

  const restore = async () => {
    if (!confirmRestore) {
      setConfirmRestore(true);
      setMessage("Press restore again to replace this device's local data.");
      return;
    }

    setConfirmRestore(false);
    setSyncState("restoring");
    setMessage(null);

    try {
      const cloudBackup = await auth.loadCloudBackup();

      if (!cloudBackup.payload) {
        setMessage("This account does not have a cloud backup yet.");
        return;
      }

      restoreBackup(parseAppDataBackup(cloudBackup.payload));
      setMessage("Cloud data restored on this device.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Cloud restore failed.");
    } finally {
      setSyncState("idle");
    }
  };

  if (!auth.configured) {
    return (
      <section className="account-panel" aria-labelledby="cloud-account-heading">
        <div className="account-panel-heading">
          <Cloud size={17} aria-hidden="true" />
          <div>
            <h3 id="cloud-account-heading">Cloud account</h3>
            <p>Add VITE_TYPELY_API_URL to your .env file to enable email accounts.</p>
          </div>
        </div>
        <div className="account-server-state" data-state="offline">
          Account server not configured
        </div>
      </section>
    );
  }

  if (auth.status === "authenticated" && auth.user) {
    return (
      <section className="account-panel" aria-labelledby="cloud-account-heading">
        <div className="account-panel-heading">
          <Cloud size={17} aria-hidden="true" />
          <div>
            <h3 id="cloud-account-heading">Cloud account</h3>
            <p>Signed in as {auth.user.email}</p>
          </div>
        </div>

        <div className="account-user-row">
          <span>{auth.user.displayName}</span>
          <small>created {formatDate(auth.user.createdAt)}</small>
        </div>

        <div className="account-sync-actions">
          <GameButton size="small" disabled={syncState !== "idle"} onClick={() => void upload()}>
            <CloudUpload size={15} aria-hidden="true" />
            {syncState === "uploading" ? "syncing" : "sync this device"}
          </GameButton>
          <GameButton
            size="small"
            variant="secondary"
            disabled={syncState !== "idle"}
            onClick={() => void restore()}
          >
            <CloudDownload size={15} aria-hidden="true" />
            {syncState === "restoring"
              ? "restoring"
              : confirmRestore
                ? "confirm restore"
                : "restore cloud data"}
          </GameButton>
        </div>

        {message && (
          <p className="account-message" role="status">
            {message}
          </p>
        )}

        <button type="button" className="account-signout" onClick={() => void auth.logout()}>
          <LogOut size={14} aria-hidden="true" />
          sign out
        </button>
      </section>
    );
  }

  return (
    <section className="account-panel" aria-labelledby="cloud-account-heading">
      <div className="account-panel-heading">
        <Cloud size={17} aria-hidden="true" />
        <div>
          <h3 id="cloud-account-heading">Cloud account</h3>
          <p>Use an email account to sync Typely between devices.</p>
        </div>
      </div>

      <fieldset className="auth-mode-switch">
        <legend className="visually-hidden">Account action</legend>
        <button
          type="button"
          aria-pressed={mode === "login"}
          onClick={() => {
            setMode("login");
            setMessage(null);
            auth.clearError();
          }}
        >
          sign in
        </button>
        <button
          type="button"
          aria-pressed={mode === "register"}
          onClick={() => {
            setMode("register");
            setMessage(null);
            auth.clearError();
          }}
        >
          create account
        </button>
      </fieldset>

      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        {mode === "register" && (
          <label>
            <span>Display name</span>
            <input
              type="text"
              value={displayName}
              maxLength={24}
              autoComplete="nickname"
              required
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
        )}
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            maxLength={254}
            autoComplete="email"
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            minLength={10}
            maxLength={128}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          {mode === "register" && <small>Use at least 10 characters.</small>}
        </label>

        {(auth.error || message) && (
          <p className="account-message" data-error={Boolean(auth.error)} role="status">
            {auth.error ?? message}
          </p>
        )}

        <GameButton type="submit" disabled={auth.status === "checking"}>
          {mode === "register" ? (
            <UserPlus size={16} aria-hidden="true" />
          ) : (
            <LogIn size={16} aria-hidden="true" />
          )}
          {auth.status === "checking"
            ? "please wait"
            : mode === "register"
              ? "create account"
              : "sign in"}
        </GameButton>
      </form>
    </section>
  );
}
