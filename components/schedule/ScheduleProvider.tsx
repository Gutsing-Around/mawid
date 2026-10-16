"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useClock, useToday } from "@/hooks/useNow";
import { localDayKey, nextDays, type DayInfo } from "@/lib/format";
import { matchesFilters, type Filters } from "@/lib/schedule";
import { SITE } from "@/lib/site";
import type { EpisodeSummary } from "@/lib/types";

type ScheduleContextValue = {
  filters: Filters;
  setQuery: (query: string) => void;
  setGenre: (genre: string) => void;
  setPlatform: (platform: string) => void;

  /** When the server fetched the schedule; stands in for "now" before hydration. */
  generatedAt: number;
  /**
   * Zone for times and day grouping. The site default (Riyadh) during the server
   * render and hydration, so crawlers get real content; then undefined, i.e. the visitor's own.
   */
  timeZone: string | undefined;

  /** The 7 day tabs. */
  days: DayInfo[];
  activeDay: string;
  selectDay: (dayKey: string) => void;

  /** Episodes matching the filters across all days, sorted by airing time. */
  matching: EpisodeSummary[];
  countByDay: ReadonlyMap<string, number>;
  /** IDs of the episodes to show: matching the filters and on the active day. */
  visibleIds: ReadonlySet<number>;
  /** The next episode to air among `matching` (-1 if none). Updates only when it changes. */
  nextId: number;
  byId: ReadonlyMap<number, EpisodeSummary>;

  /** Episode whose details popup is open, or null. */
  openId: number | null;
  openDetails: (id: number) => void;
  closeDetails: () => void;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

/** Holds the browser-side schedule state: filters, the selected day and the open popup. */
export function ScheduleProvider({
  episodes,
  generatedAt,
  children,
}: {
  episodes: EpisodeSummary[];
  generatedAt: number;
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const hydrated = useHydrated();
  const timeZone = hydrated ? undefined : SITE.defaultTimeZone;
  const today = useToday() ?? localDayKey(generatedAt, timeZone);
  const days = useMemo(() => nextDays(today, 7), [today]);
  const activeDay = selectedDay ?? today;

  const filters = useMemo(() => ({ query, genre, platform }), [query, genre, platform]);
  const matching = useMemo(
    () => episodes.filter((e) => matchesFilters(e, filters)),
    [episodes, filters],
  );

  const dayOf = useMemo(
    () => new Map(episodes.map((e) => [e.id, localDayKey(e.airingAt, timeZone)])),
    [episodes, timeZone],
  );

  const countByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of matching) {
      const key = dayOf.get(e.id)!;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [matching, dayOf]);

  const visibleIds = useMemo(
    () => new Set(matching.filter((e) => dayOf.get(e.id) === activeDay).map((e) => e.id)),
    [matching, dayOf, activeDay],
  );

  // The selector runs every tick but returns a number, so consumers re-render only when it changes.
  const findNext = (now: number) => matching.find((e) => e.airingAt > now)?.id ?? -1;
  const nextId = useClock(findNext) ?? findNext(generatedAt);

  const byId = useMemo(() => new Map(episodes.map((e) => [e.id, e])), [episodes]);

  const value = useMemo<ScheduleContextValue>(
    () => ({
      filters,
      setQuery,
      setGenre,
      setPlatform,
      generatedAt,
      timeZone,
      days,
      activeDay,
      selectDay: setSelectedDay,
      matching,
      countByDay,
      visibleIds,
      nextId,
      byId,
      openId,
      openDetails: setOpenId,
      closeDetails: () => setOpenId(null),
    }),
    [filters, generatedAt, timeZone, days, activeDay, matching, countByDay, visibleIds, nextId, byId, openId],
  );

  return <ScheduleContext value={value}>{children}</ScheduleContext>;
}

export function useSchedule(): ScheduleContextValue {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error("useSchedule must be used inside <ScheduleProvider>");
  return context;
}
