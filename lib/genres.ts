/** Arabic names for AniList's fixed genre list. Unknown genres fall back to the English name. */
const GENRE_AR: Record<string, string> = {
  Action: "أكشن",
  Adventure: "مغامرة",
  Comedy: "كوميدي",
  Drama: "دراما",
  Ecchi: "إيحاءات للكبار",
  Fantasy: "فانتازيا",
  Horror: "رعب",
  "Mahou Shoujo": "فتيات سحريات",
  Mecha: "ميكا",
  Music: "موسيقى",
  Mystery: "غموض",
  Psychological: "نفسي",
  Romance: "رومانسي",
  "Sci-Fi": "خيال علمي",
  "Slice of Life": "شريحة من الحياة",
  Sports: "رياضي",
  Supernatural: "خارق للطبيعة",
  Thriller: "إثارة",
};

export function genreLabel(genre: string): string {
  return GENRE_AR[genre] ?? genre;
}

/** Genres shown with a warning colour. */
export function isMatureGenre(genre: string): boolean {
  return genre === "Ecchi";
}

/** Tags count only when AniList ranks them at least this relevant to the show (0–100). */
const MATURE_TAG_MIN_RANK = 40;

/**
 * Whether a show's artwork should be blurred until the visitor chooses to see it:
 * a mature genre (Ecchi), or a tag AniList marks as adult (or "Nudity") that is
 * reasonably relevant to the show. Fully adult titles never reach the site at all.
 */
export function isMatureContent(
  genres: string[],
  tags: { name: string; rank: number | null; isAdult: boolean | null }[],
): boolean {
  if (genres.some(isMatureGenre)) return true;
  return tags.some(
    (tag) => (tag.isAdult || tag.name === "Nudity") && (tag.rank ?? 0) >= MATURE_TAG_MIN_RANK,
  );
}
