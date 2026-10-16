import Image from "next/image";
import { PlatformLogos } from "@/components/PlatformLogos";
import { Countdown } from "@/components/time/Countdown";
import { LocalTime } from "@/components/time/LocalTime";
import { favoriteOf } from "@/lib/schedule";
import type { Episode } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { GenreTags } from "./GenreTags";
import { MatureCover } from "./MatureCover";
import { OpenDetails } from "./OpenDetails";

/** The main layout: a tall poster card. Clicking anywhere but the star or a logo opens the details. */
export function PosterCard({ episode: ep }: { episode: Episode }) {
  const color = ep.coverColor ?? "var(--line)";
  return (
    <article
      style={{ "--c": color } as React.CSSProperties}
      className="relative flex h-full flex-col overflow-hidden rounded-[10px] border border-line bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-(--c) hover:shadow-[0_10px_30px_-10px_var(--c)]"
    >
      <div className="relative aspect-[2/3]" style={{ backgroundColor: color }}>
        {ep.cover && (
          <MatureCover mediaId={ep.mediaId} mature={ep.mature}>
            <Image
              src={ep.cover}
              alt={`غلاف ${ep.title}`}
              fill
              sizes="(min-width: 1024px) 230px, (min-width: 640px) 30vw, 45vw"
              className="object-cover"
            />
          </MatureCover>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-surface to-transparent" />
        <span className="absolute top-2.5 right-2.5 rounded border border-white/15 bg-black/75 px-1.5 py-1 font-mono text-[11px] leading-none font-semibold">
          الحلقة {ep.episode}
        </span>
      </div>

      <div className="relative -mt-3 flex flex-1 flex-col gap-1 px-3 pb-3">
        <div className="flex items-start gap-1">
          <h3 dir="ltr" className="line-clamp-2 flex-1 text-right text-sm leading-snug font-bold">
            {ep.title}
          </h3>
          <FavoriteButton
            show={favoriteOf(ep)}
            variant="inline"
            className="relative z-10 -mt-0.5 -ms-1 shrink-0"
          />
        </div>
        <GenreTags genres={ep.genres} max={3} />
        <Countdown airingAt={ep.airingAt} format="clock" className="mt-1 font-poster text-2xl leading-tight" />
        <LocalTime airingAt={ep.airingAt} format="weekdayTime" className="text-xs text-muted" />
        <PlatformLogos platforms={ep.platforms} className="relative z-10 mt-auto pt-2" />
      </div>

      <OpenDetails id={ep.id} title={ep.title} />
    </article>
  );
}
