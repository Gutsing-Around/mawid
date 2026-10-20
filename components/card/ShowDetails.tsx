import Image from "next/image";
import { PlatformLogos } from "@/components/PlatformLogos";
import { ShareButton } from "@/components/ShareButton";
import { Countdown } from "@/components/time/Countdown";
import { LocalTime } from "@/components/time/LocalTime";
import { episodeLabel } from "@/lib/format";
import { favoriteOf, showPath } from "@/lib/schedule";
import { showShareText } from "@/lib/share";
import type { Episode } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { GenreTags } from "./GenreTags";
import { MatureCover } from "./MatureCover";
import { ReminderButton } from "./ReminderButton";
import { SeasonProgress } from "./SeasonProgress";
import { SynopsisBlock } from "./SynopsisBlock";

/**
 * Content of the details popup: art, genres, the synopsis with its official source, where
 * to watch, a reminder, sharing and a link to the full show page. Rendered in the browser from the
 * episode data the page already has, so no per-show HTML is sent up front.
 */
export function ShowDetails({ episode: ep }: { episode: Episode }) {
  const art = ep.banner ?? ep.cover;
  const path = showPath(ep);
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
            {ep.arabicTitle && <p className="text-sm text-ink/80">{ep.arabicTitle}</p>}
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

        <SynopsisBlock synopsis={ep.synopsis} id={`story-${ep.id}`} />

        <section className="flex flex-col gap-2">
          <h3 className="font-display text-base">شاهد على</h3>
          <PlatformLogos platforms={ep.platforms} size="lg" />
        </section>

        <div className="flex flex-wrap items-center gap-2.5">
          <FavoriteButton show={favoriteOf(ep)} variant="full" />
          <ReminderButton title={ep.title} episode={ep.episode} airingAt={ep.airingAt} path={path} />
          <ShareButton path={path} text={showShareText(ep, ep.episode)} opens="up" />
          <a href={path} className="ms-auto text-sm font-semibold text-accent hover:underline">
            صفحة العمل ←
          </a>
        </div>
      </div>
    </div>
  );
}
