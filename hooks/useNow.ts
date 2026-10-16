"use client";

import { useSyncExternalStore } from "react";
import { localDayKey } from "@/lib/format";

// One shared ticker for the whole page, however many countdowns are mounted.
let current: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

const nowSeconds = () => Math.floor(Date.now() / 1000);

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === null) {
    current = nowSeconds();
    timer = setInterval(() => {
      current = nowSeconds();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getNow(): number {
  current ??= nowSeconds();
  return current;
}

/**
 * Subscribes to the clock through a selector. The component re-renders only
 * when the selected value changes, so `select` must return a primitive.
 * Returns null on the server and during hydration.
 */
export function useClock<T extends string | number | boolean>(
  select: (nowSeconds: number) => T,
): T | null {
  return useSyncExternalStore(
    subscribe,
    () => select(getNow()),
    () => null,
  );
}

const identity = (n: number) => n;

/** Current Unix time in seconds, updated every second. */
export function useNow(): number | null {
  return useClock(identity);
}

/** The visitor's current local day ("YYYY-MM-DD"); re-renders only at midnight. */
export function useToday(): string | null {
  return useClock(localDayKey);
}
