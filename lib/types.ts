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

/** One upcoming episode, normalized from AniList's airing schedule. */
export type Episode = {
  /** AniList airing-schedule ID, unique per episode. */
  id: number;
  /** AniList media ID, stable across episodes of the same show. */
  mediaId: number;
  episode: number;
  totalEpisodes: number | null;
  /** Unix timestamp in seconds. */
  airingAt: number;
  title: string;
  romaji: string;
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

/** The slim slice of an episode the browser needs for filtering, counts, the hero and favourites. */
export type EpisodeSummary = Pick<
  Episode,
  | "id"
  | "mediaId"
  | "episode"
  | "totalEpisodes"
  | "airingAt"
  | "title"
  | "romaji"
  | "genres"
  | "mature"
  | "cover"
  | "coverColor"
  | "banner"
  | "platforms"
>;

/** A favourited show, stored in the browser so it stays listed even when it isn't airing this week. */
export type FavoriteShow = {
  mediaId: number;
  title: string;
  cover: string | null;
  coverColor: string | null;
  /** Mature genre: the cover stays blurred until revealed. */
  mature?: boolean;
};
