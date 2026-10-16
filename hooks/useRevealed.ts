"use client";

import { useCallback, useSyncExternalStore } from "react";

// Shows whose mature artwork the visitor chose to see, for this visit only (resets on reload).
const revealed = new Set<number>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Whether a show's mature artwork has been revealed. Revealing it once shows it
 * everywhere on the page: card, popup, hero and favourites.
 */
export function useRevealed(mediaId: number): [boolean, () => void] {
  const isRevealed = useSyncExternalStore(
    subscribe,
    () => revealed.has(mediaId),
    () => false,
  );
  const reveal = useCallback(() => {
    revealed.add(mediaId);
    listeners.forEach((notify) => notify());
  }, [mediaId]);
  return [isRevealed, reveal];
}
