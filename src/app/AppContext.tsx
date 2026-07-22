import {
  createContext,
  type PropsWithChildren,
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
  const [settings, setSettings] = useLocalStorage<AppSettings>("typely.settings", defaultSettings);
  const [results, setResults] = useLocalStorage<TestResult[]>("typely.results", []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.accent = settings.accent;
    root.dataset.motion = settings.reducedMotion ? "reduced" : "full";
  }, [settings]);

  const value = useMemo<AppContextValue>(
    () => ({
      view,
      settings,
      results,
      setView,
      updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
      addResult: (result) => setResults((current) => [result, ...current].slice(0, 250)),
      removeResult: (id) => setResults((current) => current.filter((result) => result.id !== id)),
      clearResults: () => setResults([]),
    }),
    [results, setResults, setSettings, settings, view],
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
