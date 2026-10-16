"use client";

import Image from "next/image";
import { FavoriteButton } from "@/components/card/FavoriteButton";
import { GenreTags } from "@/components/card/GenreTags";
import { MatureCover } from "@/components/card/MatureCover";
import { PlatformLogos } from "@/components/PlatformLogos";
import { episodeLabel, formatWeekdayTime } from "@/lib/format";
import { favoriteOf } from "@/lib/schedule";
import { CountdownBoxes } from "./CountdownBoxes";
import { useSchedule } from "./ScheduleProvider";

/** Full-width hero for the posters layout: the next show over its own art, with a big red countdown. */
export function PosterHero() {
  const { byId, nextId, timeZone, openDetails } = useSchedule();
  const next = byId.get(nextId);
  const art = next?.banner ?? next?.cover;

  return (
    <section className="relative overflow-hidden border-b border-line">
      {art && next && (
        <MatureCover mediaId={next.mediaId} mature={next.mature} size="bg">
          <Image
            src={art}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45 [mask-image:linear-gradient(to_right,#000,transparent_75%)]"
          />
        </MatureCover>
      )}
      <div className="relative mx-auto max-w-[1240px] px-4 py-12 sm:px-5 md:py-14">
        <p className="glow-signal font-mono text-xs font-semibold tracking-[0.25em] text-signal">● الحلقة القادمة</p>
        {next ? (
          <>
            <h2
              dir="ltr"
              className="mt-3 mb-1.5 max-w-[16ch] text-right font-poster text-[clamp(34px,6vw,72px)] leading-[1.02] text-balance uppercase"
            >
              {next.title}
            </h2>
            <p className="text-muted">
              <b className="font-semibold text-ink">{episodeLabel(next.episode, next.totalEpisodes)}</b>
              {" · "}
              {formatWeekdayTime(next.airingAt, timeZone)}
            </p>
            <GenreTags genres={next.genres} className="mt-1.5" />
            <div className="mt-6">
              <CountdownBoxes airingAt={next.airingAt} variant="boxes" />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">شاهدها على</span>
              <PlatformLogos platforms={next.platforms} size="lg" />
              <button
                type="button"
                onClick={() => openDetails(next.id)}
                className="cursor-pointer rounded-md border border-line bg-chip px-4 py-2 text-sm font-semibold hover:border-muted"
              >
                التفاصيل والقصة
              </button>
              <FavoriteButton
                show={favoriteOf(next)}
                variant="full"
              />
            </div>
          </>
        ) : (
          <h2 className="mt-3 font-display text-2xl">لا توجد حلقات قادمة ضمن هذا الاختيار</h2>
        )}
      </div>
    </section>
  );
}
