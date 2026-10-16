import { genreLabel } from "@/lib/genres";
import type { Episode, EpisodeSummary, FavoriteShow, ShowInfo } from "@/lib/types";

/** Filter state chosen in the toolbar. Empty string means "all". */
export type Filters = {
  query: string;
  genre: string;
  platform: string;
};

export type GenreOption = { value: string; label: string };

/** What a favourite remembers about a show, so it can be listed when it isn't airing. */
export function favoriteOf(
  show: Pick<EpisodeSummary, "mediaId" | "title" | "cover" | "coverColor" | "mature">,
): FavoriteShow {
  return {
    mediaId: show.mediaId,
    title: show.title,
    cover: show.cover,
    coverColor: show.coverColor,
    mature: show.mature,
  };
}

/** The single filter rule shared by the cards, the day-tab counts and the hero. */
export function matchesFilters(episode: EpisodeSummary, filters: Filters): boolean {
  if (filters.genre && !episode.genres.includes(filters.genre)) return false;
  if (filters.platform && !episode.platforms.some((p) => p.site === filters.platform)) return false;
  const query = filters.query.trim().toLowerCase();
  const searchable = `${episode.title} ${episode.romaji} ${episode.arabicTitle ?? ""}`.toLowerCase();
  if (query && !searchable.includes(query)) return false;
  return true;
}

/** Genres present this week, sorted by their Arabic name. */
export function genreOptions(episodes: Episode[]): GenreOption[] {
  const genres = new Set(episodes.flatMap((e) => e.genres));
  return [...genres]
    .map((value) => ({ value, label: genreLabel(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "ar"));
}

/** Streaming sites present this week, alphabetically. */
export function platformOptions(episodes: Episode[]): string[] {
  const sites = new Set(episodes.flatMap((e) => e.platforms.map((p) => p.site)));
  return [...sites].sort((a, b) => a.localeCompare(b));
}

/**
 * A show page's path: a readable slug from the title plus the AniList media ID,
 * e.g. /anime/black-clover-season-2-195604. Only the ID is used to find the show.
 */
export function showPath(show: Pick<ShowInfo, "mediaId" | "title" | "romaji">): string {
  const slug = (show.title || show.romaji)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return `/anime/${slug ? `${slug}-` : ""}${show.mediaId}`;
}

/** The media ID at the end of a show slug, or null if there isn't one. */
export function mediaIdFromSlug(slug: string): number | null {
  const match = /(?:^|-)(\d+)$/.exec(slug);
  return match ? Number(match[1]) : null;
}
