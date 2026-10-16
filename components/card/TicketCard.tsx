import Image from "next/image";
import { PlatformLogos } from "@/components/PlatformLogos";
import { AiringProgress } from "@/components/time/AiringProgress";
import { CompactCountdown } from "@/components/time/CompactCountdown";
import { LocalTime } from "@/components/time/LocalTime";
import { episodeLabel } from "@/lib/format";
import { favoriteOf } from "@/lib/schedule";
import type { Episode } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { GenreTags } from "./GenreTags";
import { MatureCover } from "./MatureCover";
import { OpenDetails } from "./OpenDetails";

/** The alternative layout: a cinema ticket whose perforated stub holds the time and countdown. */
export function TicketCard({ episode: ep }: { episode: Episode }) {
  return (
    <article
      style={{ borderTopColor: ep.coverColor ?? "var(--line)" }}
      className="relative grid h-full grid-cols-[minmax(0,1fr)_7rem] rounded-[10px] border border-t-[3px] border-line bg-surface transition hover:border-x-muted/40 hover:border-b-muted/40 sm:grid-cols-[minmax(0,1fr)_8.5rem]"
    >
      <div className="flex min-w-0 gap-3 p-3.5">
        <div
          className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-md"
          style={{ backgroundColor: ep.coverColor ?? "var(--chip)" }}
        >
          {ep.cover && (
            <MatureCover mediaId={ep.mediaId} mature={ep.mature} size="sm">
              <Image src={ep.cover} alt={`غلاف ${ep.title}`} fill sizes="64px" className="object-cover" />
            </MatureCover>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start gap-2">
            <h3 className="flex-1 text-[15px] leading-snug font-bold">{ep.title}</h3>
            <FavoriteButton
              show={favoriteOf(ep)}
              variant="inline"
              className="relative z-10 -mt-1 shrink-0"
            />
          </div>
          {ep.romaji !== ep.title && (
            <p dir="ltr" className="text-right text-xs wrap-anywhere text-muted">
              {ep.romaji}
            </p>
          )}
          <p className="text-[12.5px] font-semibold">{episodeLabel(ep.episode, ep.totalEpisodes)}</p>
          <GenreTags genres={ep.genres} max={3} />
          <PlatformLogos platforms={ep.platforms} className="relative z-10 mt-auto pt-1.5" />
        </div>
      </div>

      <div className="ticket-stub flex flex-col items-center justify-center gap-0.5 px-2 py-3 text-center">
        <LocalTime airingAt={ep.airingAt} className="font-mono text-xl leading-tight font-semibold sm:text-[22px]" />
        <LocalTime airingAt={ep.airingAt} format="weekday" className="text-xs text-muted" />
        <CompactCountdown airingAt={ep.airingAt} className="mt-1.5 text-[13px] font-semibold" />
        <AiringProgress airingAt={ep.airingAt} className="mt-2.5 w-4/5" />
      </div>

      <OpenDetails id={ep.id} title={ep.title} />
    </article>
  );
}
