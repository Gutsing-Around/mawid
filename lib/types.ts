/** An official streaming page for a show. */
export type Platform = {
  site: string;
  url: string;
};

/** A show's synopsis as shown in the details popup. */
export type Synopsis = {
  text: string;
  /** "ar" when hand-written or translated; "en" when only the official English text is available. */
  lang: "ar" | "en";
  /** Where the official text comes from, e.g. "Crunchyroll" (from AniList's "(Source: …)" note). */
  source: string | null;
};

/** A show's own details, the same for every episode. */
export type ShowInfo = {
  /** AniList media ID, stable across episodes of the same show. */
  mediaId: number;
  totalEpisodes: number | null;
  title: string;
  romaji: string;
  /** The Arabic name: checked (data/titles-ar.ts) or automatic from Claude; null when neither. */
  arabicTitle: string | null;
  cover: string | null;
  coverColor: string | null;
  /** Wide banner art; not every show has one. */
  banner: string | null;
  /** AniList genre names in English; translated at render time. */
  genres: string[];
  /** Mature content (genre or adult tags): artwork stays blurred until revealed. */
  mature: boolean;
  synopsis: Synopsis | null;
  platforms: Platform[];
};

/** A show's next episode. */
export type NextEpisode = {
  /** AniList airing-schedule ID, unique per episode. */
  id: number;
  episode: number;
  /** Unix timestamp in seconds. */
  airingAt: number;
};

/** One upcoming episode of a show, normalized from AniList's airing schedule. */
export type Episode = ShowInfo & NextEpisode;

/**
 * What the browser receives for each episode: everything needed for filtering, counts,
 * the heroes, favourites and the details popup (which is built in the browser on demand).
 */
export type EpisodeSummary = Episode;

/** A favourited show, stored in the browser so it stays listed even when it isn't airing this week. */
export type FavoriteShow = {
  mediaId: number;
  title: string;
  cover: string | null;
  coverColor: string | null;
  /** Mature genre: the cover stays blurred until revealed. */
  mature?: boolean;
};
