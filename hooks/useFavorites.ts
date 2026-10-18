"use client";

import { useCallback, useMemo } from "react";
import type { FavoriteShow } from "@/lib/types";
import { useLocalStorage } from "./useLocalStorage";

const KEY = "mawid.favorites";
/** Fired on window when a show is added, e.g. for the celebration pop-up. */
export const FAVORITE_ADDED_EVENT = "mawid:favorite-added";
const EMPTY: FavoriteShow[] = [];
const isFavoriteList = (value: unknown): value is FavoriteShow[] =>
  Array.isArray(value) &&
  value.every((f) => typeof f === "object" && f !== null && Number.isInteger(f.mediaId) && typeof f.title === "string");

/**
 * The visitor's favourite shows, kept in localStorage with enough detail (title, cover)
 * to list them even when they aren't airing this week. Every component using this hook
 * stays in sync, in this tab and across tabs.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage(KEY, EMPTY, isFavoriteList);
  const ids = useMemo(() => new Set(favorites.map((f) => f.mediaId)), [favorites]);

  const isFavorite = useCallback((mediaId: number) => ids.has(mediaId), [ids]);

  const toggleFavorite = useCallback(
    (show: FavoriteShow) => {
      if (ids.has(show.mediaId)) {
        setFavorites(favorites.filter((f) => f.mediaId !== show.mediaId));
      } else {
        setFavorites([...favorites, show]);
        window.dispatchEvent(new CustomEvent(FAVORITE_ADDED_EVENT, { detail: { title: show.title } }));
      }
    },
    [favorites, ids, setFavorites],
  );

  return { favorites, isFavorite, toggleFavorite };
}
