import { genreLabel, isMatureGenre } from "@/lib/genres";

/**
 * Genres in Arabic. "inline" is a quiet dotted line for cards; "pills" are outlined tags
 * for the details popup. Mature genres are shown in red.
 */
export function GenreTags({
  genres,
  variant = "inline",
  max,
  className = "",
}: {
  genres: string[];
  variant?: "inline" | "pills";
  max?: number;
  className?: string;
}) {
  const shown = max ? genres.slice(0, max) : genres;
  if (shown.length === 0) return null;

  if (variant === "pills") {
    return (
      <ul className={`flex flex-wrap gap-1.5 ${className}`}>
        {shown.map((genre) => (
          <li
            key={genre}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              isMatureGenre(genre) ? "border-signal/50 text-signal" : "border-line text-ink"
            }`}
          >
            {genreLabel(genre)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={`flex flex-wrap text-xs text-muted ${className}`}>
      {shown.map((genre, i) => (
        <li key={genre} className={isMatureGenre(genre) ? "text-signal" : undefined}>
          {i > 0 && <span aria-hidden className="mx-1.5 opacity-50">•</span>}
          {genreLabel(genre)}
        </li>
      ))}
    </ul>
  );
}
