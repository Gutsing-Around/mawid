"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Fired on writes so other hooks in the same tab update (the native event only fires in other tabs). */
const LOCAL_EVENT = "mawid:storage";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // Storage blocked (private mode, disabled cookies, ...)
  }
}

/**
 * A JSON value persisted in localStorage. The server render and hydration use
 * `fallback`, so server and client markup always match.
 * `fallback` must be a stable reference (a module-level constant).
 */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );

  const value = useMemo(() => {
    if (raw === null) return fallback;
    try {
      const parsed: unknown = JSON.parse(raw);
      return validate(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }, [raw, fallback, validate]);

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Not persisted; nothing else to do.
      }
      window.dispatchEvent(new Event(LOCAL_EVENT));
    },
    [key],
  );

  return [value, setValue];
}
