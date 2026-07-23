import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { audioEngine } from "../audio/audioEngine";
import { applyResultToProfile } from "../features/progression/progression";
import { type AppDataBackup, appDataVersion, createAppDataBackup } from "../storage/appData";
import { defaultSettings, normalizeSettings, type StoredSettings } from "../storage/appSettings";
import { defaultProfile, normalizeProfile } from "../storage/playerProfile";
import { maximumStoredResults, normalizeResults } from "../storage/resultHistory";
import { useLocalStorage } from "../storage/useLocalStorage";
import type { AppSettings, AppView, PlayerProfile, TestResult } from "./app.types";

interface AppContextValue {
  view: AppView;
  settings: AppSettings;
  profile: PlayerProfile;
  results: TestResult[];
  settingsOpen: boolean;
  profileOpen: boolean;
  setView: (view: AppView) => void;
  openSettings: () => void;
  closeSettings: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateProfile: (profile: Partial<PlayerProfile>) => void;
  addResult: (result: TestResult) => void;
  removeResult: (id: string) => void;
  replaceResults: (results: TestResult[]) => void;
  clearResults: () => void;
  resetProfile: () => void;
  createBackup: () => AppDataBackup;
  restoreBackup: (backup: AppDataBackup) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [view, setViewState] = useState<AppView>("practice");
  const migrationComplete = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [storedSettings, setStoredSettings] = useLocalStorage<StoredSettings>(
    "typely.settings",
    defaultSettings,
  );
  const [storedResults, setStoredResults] = useLocalStorage<unknown[]>("typely.results", []);
  const results = useMemo(() => normalizeResults(storedResults), [storedResults]);
  const [storedProfile, setStoredProfile] = useLocalStorage<unknown>("typely.profile", null);
  const settings = useMemo(() => normalizeSettings(storedSettings), [storedSettings]);
  const profile = useMemo(() => normalizeProfile(storedProfile, results), [results, storedProfile]);

  useEffect(() => {
    if (migrationComplete.current) return;

    migrationComplete.current = true;
    const currentVersion = Number(window.localStorage.getItem("typely.schema") ?? 0);

    if (currentVersion < appDataVersion) {
      setStoredSettings(settings);
      setStoredResults(results);
      setStoredProfile(profile);
      try {
        window.localStorage.setItem("typely.schema", String(appDataVersion));
      } catch {
        return;
      }
    }
  }, [profile, results, setStoredProfile, setStoredResults, setStoredSettings, settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.accent = settings.accent;
    root.dataset.motion = settings.reducedMotion ? "reduced" : "full";
    root.dataset.contrast = settings.highContrast ? "high" : "normal";
    root.dataset.textFocus = settings.textFocusStyle;
    root.dataset.trail = settings.trailIntensity;
    root.dataset.resultMotion = settings.resultMotion;
    root.dataset.backgroundTreatment = settings.backgroundTreatment;

    audioEngine.configure({
      enabled: settings.soundEnabled,
      pack: settings.soundPack,
      interfaceVolume: settings.interfaceVolume,
      typingVolume: settings.typingVolume,
    });
  }, [settings]);

  const closeOverlays = useCallback(() => {
    setSettingsOpen(false);
    setProfileOpen(false);
  }, []);

  const setView = useCallback(
    (nextView: AppView) => {
      setViewState(nextView);
      closeOverlays();
    },
    [closeOverlays],
  );

  const openSettings = useCallback(() => {
    setProfileOpen(false);
    setSettingsOpen(true);
  }, []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const openProfile = useCallback(() => {
    setSettingsOpen(false);
    setProfileOpen(true);
  }, []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setStoredSettings((current) => ({
        ...normalizeSettings(current),
        ...patch,
      }));
    },
    [setStoredSettings],
  );

  const updateProfile = useCallback(
    (patch: Partial<PlayerProfile>) => {
      setStoredProfile((current: unknown) => ({
        ...normalizeProfile(current, results),
        ...patch,
      }));
    },
    [results, setStoredProfile],
  );

  const addResult = useCallback(
    (result: TestResult) => {
      setStoredResults((current) =>
        [result, ...normalizeResults(current)].slice(0, maximumStoredResults),
      );
      setStoredProfile((current: unknown) =>
        applyResultToProfile(normalizeProfile(current, results), result),
      );
    },
    [results, setStoredProfile, setStoredResults],
  );

  const removeResult = useCallback(
    (id: string) => {
      setStoredResults((current) => normalizeResults(current).filter((result) => result.id !== id));
    },
    [setStoredResults],
  );

  const replaceResults = useCallback(
    (nextResults: TestResult[]) => {
      setStoredResults(normalizeResults(nextResults));
    },
    [setStoredResults],
  );

  const clearResults = useCallback(() => setStoredResults([]), [setStoredResults]);
  const resetProfile = useCallback(() => setStoredProfile(defaultProfile), [setStoredProfile]);

  const createBackup = useCallback(
    () => createAppDataBackup(settings, profile, results),
    [profile, results, settings],
  );

  const restoreBackup = useCallback(
    (backup: AppDataBackup) => {
      setStoredSettings(backup.settings);
      setStoredProfile(backup.profile);
      setStoredResults(backup.results);
    },
    [setStoredProfile, setStoredResults, setStoredSettings],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      view,
      settings,
      profile,
      results,
      settingsOpen,
      profileOpen,
      setView,
      openSettings,
      closeSettings,
      openProfile,
      closeProfile,
      updateSettings,
      updateProfile,
      addResult,
      removeResult,
      replaceResults,
      clearResults,
      resetProfile,
      createBackup,
      restoreBackup,
    }),
    [
      view,
      settings,
      profile,
      results,
      settingsOpen,
      profileOpen,
      setView,
      openSettings,
      closeSettings,
      openProfile,
      closeProfile,
      updateSettings,
      updateProfile,
      addResult,
      removeResult,
      replaceResults,
      clearResults,
      resetProfile,
      createBackup,
      restoreBackup,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider.");
  return context;
}
