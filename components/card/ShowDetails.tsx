import Image from "next/image";
import { PlatformLogos } from "@/components/PlatformLogos";
import { Countdown } from "@/components/time/Countdown";
import { LocalTime } from "@/components/time/LocalTime";
import { episodeLabel } from "@/lib/format";
import { favoriteOf } from "@/lib/schedule";
import type { Episode } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { GenreTags } from "./GenreTags";
import { MatureCover } from "./MatureCover";
import { SeasonProgress } from "./SeasonProgress";

/** Content of the details popup: art, genres, the synopsis with its official source, and where to watch. */
export function ShowDetails({ episode: ep }: { episode: Episode }) {
  const art = ep.banner ?? ep.cover;
  const { synopsis } = ep;
  const mature = ep.mature;

  return (
    <div>
      <div className="relative h-40 sm:h-48" style={{ backgroundColor: ep.coverColor ?? "var(--chip)" }}>
        {art && (
          <MatureCover mediaId={ep.mediaId} mature={mature} size="bg">
            <Image
              src={art}
              alt=""
              fill
              sizes="640px"
              className={`object-cover ${ep.banner ? "" : "blur-md"} opacity-70`}
            />
          </MatureCover>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/40 to-transparent" />
      </div>

      <div className="relative -mt-20 flex flex-col gap-4 px-5 pb-6 sm:px-6">
        <div className="flex items-end gap-4">
          <div
            className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg shadow-xl shadow-black/60 sm:w-28"
            style={{ backgroundColor: ep.coverColor ?? "var(--chip)" }}
          >
            {ep.cover && (
              <MatureCover mediaId={ep.mediaId} mature={mature}>
                <Image src={ep.cover} alt={`غلاف ${ep.title}`} fill sizes="112px" className="object-cover" />
              </MatureCover>
            )}
          </div>
          <div className="min-w-0 pb-1">
            <h2 className="font-display text-xl leading-snug text-balance sm:text-2xl">{ep.title}</h2>
            {ep.romaji !== ep.title && (
              <p dir="ltr" className="text-right text-xs wrap-anywhere text-muted">
                {ep.romaji}
              </p>
            )}
          </div>
        </div>

        <GenreTags genres={ep.genres} variant="pills" />

        <div className="flex flex-col gap-2 rounded-lg border border-line bg-background/60 p-3.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold">{episodeLabel(ep.episode, ep.totalEpisodes)}</span>
            <LocalTime airingAt={ep.airingAt} format="weekdayTime" className="text-muted" />
            <Countdown airingAt={ep.airingAt} className="ms-auto font-mono text-sm font-semibold" />
          </div>
          {ep.totalEpisodes ? <SeasonProgress episode={ep.episode} total={ep.totalEpisodes} /> : null}
        </div>

        <section aria-labelledby={`story-${ep.id}`} className="flex flex-col gap-2">
          <h3 id={`story-${ep.id}`} className="font-display text-base">القصة</h3>
          {synopsis ? (
            <>
              <div
                dir={synopsis.lang === "ar" ? "rtl" : "ltr"}
                className={`flex flex-col gap-2 text-[14.5px] leading-loose ${synopsis.lang === "en" ? "text-left text-ink/90" : ""}`}
              >
                {synopsis.text.split(/\n{2,}/).map((paragraph, i) => (
                  <p key={i} className="whitespace-pre-line">{paragraph}</p>
                ))}
              </div>
              <p className="text-xs text-muted">
                {synopsis.lang === "en" && "الوصف العربي قيد الإعداد، وهذا هو الوصف الرسمي بالإنجليزية. "}
                {synopsis.source ? `المصدر: ${synopsis.source}` : "المصدر: AniList"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">لا يتوفر وصف لهذا العمل بعد.</p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-display text-base">شاهد على</h3>
          <PlatformLogos platforms={ep.platforms} size="lg" />
        </section>

        <FavoriteButton
          show={favoriteOf(ep)}
          variant="full"
          className="self-start"
        />
      </div>
    </div>
  );
}
