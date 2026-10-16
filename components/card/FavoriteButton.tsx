"use client";

import { useFavorites } from "@/hooks/useFavorites";
import type { FavoriteShow } from "@/lib/types";

/**
 * Adds a show to "قائمتي" or removes it. "star" is a round icon for use over artwork,
 * "inline" a bare star beside a title, "full" a labelled button. Active stars glow red.
 */
export function FavoriteButton({
  show,
  variant = "star",
  className = "",
}: {
  show: FavoriteShow;
  variant?: "star" | "inline" | "full";
  className?: string;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(show.mediaId);
  const label = active ? "في قائمتي" : "أضف إلى قائمتي";

  if (variant === "full") {
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => toggleFavorite(show)}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition ${
          active
            ? "border-signal text-signal glow-signal"
            : "border-line bg-chip text-ink hover:border-muted"
        } ${className}`}
      >
        <span aria-hidden>★</span>
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${label}: ${show.title}`}
      title={label}
      onClick={() => toggleFavorite(show)}
      className={`grid cursor-pointer place-items-center leading-none transition ${
        variant === "inline"
          ? "size-7 text-lg"
          : "size-8 rounded-full bg-black/60 text-base backdrop-blur-sm"
      } ${
        active
          ? "scale-110 text-signal glow-signal"
          : variant === "inline"
            ? "text-muted hover:text-ink"
            : "text-white/70 hover:text-white"
      } ${className}`}
    >
      ★
    </button>
  );
}
