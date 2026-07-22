import { useCallback, useState } from "react";

type StateUpdater<T> = T | ((current: T) => T);

function readStoredValue<T>(key: string, fallback: T) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStoredValue(key, fallback));

  const updateValue = useCallback(
    (next: StateUpdater<T>) => {
      setValue((current) => {
        const resolved = typeof next === "function" ? (next as (value: T) => T)(current) : next;
        writeStoredValue(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, updateValue] as const;
}
