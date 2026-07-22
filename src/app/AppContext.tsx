import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from "../lib/useLocalStorage";
import type { AppSettings, AppView, TestResult } from "./app.types";

interface AppContextValue {
  view: AppView;
  settings: AppSettings;
  results: TestResult[];
  setView: (view: AppView) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addResult: (result: TestResult) => void;
  removeResult: (id: string) => void;
  clearResults: () => void;
}

const defaultSettings: AppSettings = {
  theme: "cream",
  accent: "pink",
  reducedMotion: false,
  liveStats: true,
  caretStyle: "bar",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [view, setView] = useState<AppView>("practice");
  const [storedSettings, setStoredSettings] = useLocalStorage<Partial<AppSettings>>(
    "typely.settings",
    defaultSettings,
  );
  const [results, setResults] = useLocalStorage<TestResult[]>("typely.results", []);
  const settings = useMemo(() => ({ ...defaultSettings, ...storedSettings }), [storedSettings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.accent = settings.accent;
    root.dataset.motion = settings.reducedMotion ? "reduced" : "full";
  }, [settings]);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setStoredSettings((current) => ({ ...defaultSettings, ...current, ...patch }));
    },
    [setStoredSettings],
  );

  const addResult = useCallback(
    (result: TestResult) => {
      setResults((current) => [result, ...current].slice(0, 250));
    },
    [setResults],
  );

  const removeResult = useCallback(
    (id: string) => {
      setResults((current) => current.filter((result) => result.id !== id));
    },
    [setResults],
  );

  const clearResults = useCallback(() => setResults([]), [setResults]);

  const value = useMemo<AppContextValue>(
    () => ({
      view,
      settings,
      results,
      setView,
      updateSettings,
      addResult,
      removeResult,
      clearResults,
    }),
    [addResult, clearResults, removeResult, results, settings, updateSettings, view],
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
