"use client";

import Image from "next/image";
import { GenreTags } from "@/components/card/GenreTags";
import { MatureCover } from "@/components/card/MatureCover";
import { PlatformLogos } from "@/components/PlatformLogos";
import { episodeLabel, formatDateAt, formatTime, formatWeekdayAt } from "@/lib/format";
import { CountdownBoxes } from "./CountdownBoxes";
import { useSchedule } from "./ScheduleProvider";

/** Hero for the tickets layout: one big glowing "your next ticket". */
export function TicketHero() {
  const { byId, nextId, timeZone, openDetails } = useSchedule();
  const next = byId.get(nextId);

  if (!next) {
    return (
      <section className="rounded-[10px] border border-line bg-surface p-6 font-display text-xl">
        لا توجد حلقات قادمة ضمن هذا الاختيار
      </section>
    );
  }

  const mature = next.mature;
  return (
    <section className="grid overflow-hidden rounded-[10px] border border-t-[3px] border-line border-t-signal bg-surface shadow-[0_0_0_1px_rgb(255_46_62/0.15),0_20px_50px_-20px_rgb(255_46_62/0.35)] md:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="relative flex gap-5 overflow-hidden p-5 sm:p-6">
        {(next.banner ?? next.cover) && (
          <MatureCover mediaId={next.mediaId} mature={mature} size="bg">
            <Image src={(next.banner ?? next.cover)!} alt="" fill sizes="700px" className="object-cover opacity-15 blur-[2px]" />
          </MatureCover>
        )}
        <div
          className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-md shadow-xl shadow-black/60 sm:w-26"
          style={{ backgroundColor: next.coverColor ?? "var(--chip)" }}
        >
          {next.cover && (
            <MatureCover mediaId={next.mediaId} mature={mature} size="sm">
              <Image src={next.cover} alt="" fill sizes="104px" className="object-cover" />
            </MatureCover>
          )}
        </div>
        <div className="relative flex min-w-0 flex-col gap-1.5">
          <p className="glow-signal font-mono text-xs font-semibold tracking-[0.2em] text-signal">● تذكرتك القادمة</p>
          <h2 className="font-display text-[clamp(22px,3.4vw,32px)] leading-tight text-balance">{next.title}</h2>
          {next.arabicTitle && <p className="text-sm text-ink/80">{next.arabicTitle}</p>}
          <p className="text-[13px] font-semibold">{episodeLabel(next.episode, next.totalEpisodes)}</p>
          <GenreTags genres={next.genres} />
          <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-2">
            <PlatformLogos platforms={next.platforms} size="lg" />
            <button
              type="button"
              onClick={() => openDetails(next.id)}
              className="cursor-pointer rounded-md border border-line bg-chip px-3.5 py-2 text-sm font-semibold hover:border-muted"
            >
              التفاصيل والقصة
            </button>
          </div>
        </div>
      </div>

      <div className="ticket-stub ticket-stub-hero flex flex-col items-center justify-center gap-2 p-5 text-center">
        <p dir="ltr" className="font-mono text-[10px] tracking-[0.15em] text-muted">
          ADMIT ONE · #{String(next.id).slice(-6)}
        </p>
        <p className="font-mono text-2xl font-semibold">{formatTime(next.airingAt, timeZone)}</p>
        <p className="text-xs text-muted">
          {formatWeekdayAt(next.airingAt, timeZone)} {formatDateAt(next.airingAt, timeZone)}
        </p>
        <div className="mt-1">
          <CountdownBoxes airingAt={next.airingAt} variant="inline" />
        </div>
      </div>
    </section>
  );
}
