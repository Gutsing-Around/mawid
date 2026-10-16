import { genreLabel } from "@/lib/genres";
import type { Episode, EpisodeSummary, FavoriteShow } from "@/lib/types";

/** Filter state chosen in the toolbar. Empty string means "all". */
export type Filters = {
  query: string;
  genre: string;
  platform: string;
};

export type GenreOption = { value: string; label: string };

export function toSummary(episode: Episode): EpisodeSummary {
  return {
    id: episode.id,
    mediaId: episode.mediaId,
    episode: episode.episode,
    totalEpisodes: episode.totalEpisodes,
    airingAt: episode.airingAt,
    title: episode.title,
    romaji: episode.romaji,
    genres: episode.genres,
    mature: episode.mature,
    cover: episode.cover,
    coverColor: episode.coverColor,
    banner: episode.banner,
    platforms: episode.platforms,
  };
}

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
  if (query && !`${episode.title} ${episode.romaji}`.toLowerCase().includes(query)) return false;
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
