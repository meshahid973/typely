import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { audioEngine } from "../audio/audioEngine";
import { useLocalStorage } from "../storage/useLocalStorage";
import type { AppSettings, AppView, TestResult } from "./app.types";

interface AppContextValue {
  view: AppView;
  settings: AppSettings;
  results: TestResult[];
  settingsOpen: boolean;
  setView: (view: AppView) => void;
  openSettings: () => void;
  closeSettings: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addResult: (result: TestResult) => void;
  removeResult: (id: string) => void;
  clearResults: () => void;
}

export const defaultSettings: AppSettings = {
  theme: "cream",
  accent: "pink",
  reducedMotion: false,
  liveStats: true,
  caretStyle: "bar",
  soundEnabled: true,
  soundPack: "clean-taps",
  interfaceVolume: 0.2,
  typingVolume: 0.22,
  judgementsEnabled: true,
  cadenceEffects: true,
};

interface LegacySettings extends Partial<AppSettings> {
  soundVolume?: number;
}

function normalizeSettings(stored: LegacySettings): AppSettings {
  const legacyVolume = stored.soundVolume;

  return {
    ...defaultSettings,
    ...stored,
    interfaceVolume: stored.interfaceVolume ?? legacyVolume ?? defaultSettings.interfaceVolume,
    typingVolume: stored.typingVolume ?? legacyVolume ?? defaultSettings.typingVolume,
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [view, setView] = useState<AppView>("practice");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storedSettings, setStoredSettings] = useLocalStorage<LegacySettings>(
    "typely.settings",
    defaultSettings,
  );
  const [results, setResults] = useLocalStorage<TestResult[]>("typely.results", []);
  const settings = useMemo(() => normalizeSettings(storedSettings), [storedSettings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.accent = settings.accent;
    root.dataset.motion = settings.reducedMotion ? "reduced" : "full";
    audioEngine.configure({
      enabled: settings.soundEnabled,
      pack: settings.soundPack,
      interfaceVolume: settings.interfaceVolume,
      typingVolume: settings.typingVolume,
    });
  }, [settings]);

  const navigate = useCallback((nextView: AppView) => {
    setView(nextView);
    setSettingsOpen(false);
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setStoredSettings((current) => ({
        ...normalizeSettings(current),
        ...patch,
      }));
    },
    [setStoredSettings],
  );

  const addResult = useCallback(
    (result: TestResult) => {
      setResults((current) => [result, ...current].slice(0, 100));
    },
    [setResults],
  );

  const removeResult = useCallback(
    (id: string) => {
      setResults((current) => current.filter((result) => result.id !== id));
    },
    [setResults],
  );

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const clearResults = useCallback(() => setResults([]), [setResults]);

  const value = useMemo<AppContextValue>(
    () => ({
      view,
      settings,
      results,
      settingsOpen,
      setView: navigate,
      openSettings,
      closeSettings,
      updateSettings,
      addResult,
      removeResult,
      clearResults,
    }),
    [
      addResult,
      clearResults,
      closeSettings,
      navigate,
      openSettings,
      removeResult,
      results,
      settings,
      settingsOpen,
      updateSettings,
      view,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider.");
  }

  return context;
}
