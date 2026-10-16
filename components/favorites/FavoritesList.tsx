"use client";

import Image from "next/image";
import Link from "next/link";
import { GenreTags } from "@/components/card/GenreTags";
import { MatureCover } from "@/components/card/MatureCover";
import { PlatformLogos } from "@/components/PlatformLogos";
import { useSchedule } from "@/components/schedule/ScheduleProvider";
import { Countdown } from "@/components/time/Countdown";
import { useFavorites } from "@/hooks/useFavorites";
import { useHydrated } from "@/hooks/useHydrated";
import { useClock } from "@/hooks/useNow";
import { countWithUnit, episodeLabel, formatWeekdayTime, HOUR } from "@/lib/format";
import type { EpisodeSummary, FavoriteShow } from "@/lib/types";

/**
 * The visitor's favourite shows. Shows airing this week come first, soonest first, with
 * their next episode and countdown; the rest stay listed from the details saved when they
 * were favourited.
 */
export function FavoritesList() {
  const hydrated = useHydrated();
  const { favorites, toggleFavorite } = useFavorites();
  const { matching, timeZone, generatedAt } = useSchedule();
  // Re-evaluated once a minute: an episode stays "next" until an hour after it aired.
  const cutoff = (useClock((now) => Math.floor(now / 60) * 60) ?? generatedAt) - HOUR;

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[10px] border border-line bg-surface motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-line px-6 py-14 text-center">
        <p className="font-display text-xl">قائمتك فارغة</p>
        <p className="mt-2 text-muted">اضغط ★ على أي عمل لإضافته هنا ومتابعة موعد حلقاته.</p>
        <Link href="/" className="mt-5 inline-block rounded-md border border-signal px-4 py-2 font-semibold text-signal glow-signal">
          تصفّح جدول الحلقات
        </Link>
      </div>
    );
  }

  const nextOf = (mediaId: number) => matching.find((e) => e.mediaId === mediaId && e.airingAt > cutoff);
  const rows = favorites
    .map((show) => ({ show, next: nextOf(show.mediaId) }))
    .sort((a, b) => (a.next?.airingAt ?? Infinity) - (b.next?.airingAt ?? Infinity));
  const airing = rows.filter((r) => r.next).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {countWithUnit(favorites.length, "show")} في قائمتك ·{" "}
        {airing > 0 ? `${airing} منها تُعرض هذا الأسبوع` : "لا شيء منها يُعرض هذا الأسبوع"}
      </p>
      <ul className="flex flex-col gap-3">
        {rows.map(({ show, next }) => (
          <FavoriteRow
            key={show.mediaId}
            show={show}
            next={next}
            when={next ? formatWeekdayTime(next.airingAt, timeZone) : null}
            onRemove={() => toggleFavorite(show)}
          />
        ))}
      </ul>
    </div>
  );
}

function FavoriteRow({
  show,
  next,
  when,
  onRemove,
}: {
  show: FavoriteShow;
  next: EpisodeSummary | undefined;
  when: string | null;
  onRemove: () => void;
}) {
  return (
    <li
      className="flex gap-4 rounded-[10px] border border-line border-s-[3px] bg-surface p-3.5"
      style={{ borderInlineStartColor: show.coverColor ?? "var(--line)" }}
    >
      <div
        className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-md sm:w-20"
        style={{ backgroundColor: show.coverColor ?? "var(--chip)" }}
      >
        {show.cover && (
          <MatureCover mediaId={show.mediaId} mature={Boolean(show.mature)} size="sm">
            <Image src={show.cover} alt={`غلاف ${show.title}`} fill sizes="80px" className="object-cover" />
          </MatureCover>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-3">
          <h2 className="flex-1 font-bold leading-snug">{show.title}</h2>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`إزالة ${show.title} من قائمتي`}
            className="shrink-0 cursor-pointer rounded-md border border-line px-2.5 py-1 text-xs text-muted transition hover:border-signal hover:text-signal"
          >
            إزالة
          </button>
        </div>
        {next ? (
          <>
            <GenreTags genres={next.genres} max={3} />
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold">{episodeLabel(next.episode, next.totalEpisodes)}</span>
              <span className="text-muted">{when}</span>
              <Countdown airingAt={next.airingAt} className="font-mono text-sm font-semibold" />
            </p>
            <PlatformLogos platforms={next.platforms} className="mt-auto pt-1" />
          </>
        ) : (
          <p className="text-sm text-muted">لا توجد حلقة جديدة خلال الأسبوع القادم.</p>
        )}
      </div>
    </li>
  );
}
