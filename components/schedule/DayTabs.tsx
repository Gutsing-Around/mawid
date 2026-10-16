"use client";

import { countWithUnit, formatDate, formatWeekday } from "@/lib/format";
import { useSchedule } from "./ScheduleProvider";

/** Day pills with episode counts; the selected day glows red. */
export function DayTabs() {
  const { days, activeDay, selectDay, countByDay } = useSchedule();

  return (
    <nav aria-label="أيام الأسبوع" className="flex gap-1.5 overflow-x-auto pb-1">
      {days.map((day, i) => {
        const count = countByDay.get(day.key) ?? 0;
        return (
          <button
            key={day.key}
            type="button"
            aria-pressed={day.key === activeDay}
            onClick={() => selectDay(day.key)}
            title={formatDate(day.date)}
            className="relative flex flex-none cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-1.5 text-sm text-muted transition hover:text-ink aria-pressed:border-signal aria-pressed:text-ink aria-pressed:shadow-[0_0_12px_rgb(255_46_62/0.35)]"
          >
            {i === 0 ? "اليوم" : i === 1 ? "غدًا" : formatWeekday(day.date)}
            <span aria-hidden className="font-mono text-xs">{count}</span>
            <span className="sr-only">{countWithUnit(count, "episode")}</span>
          </button>
        );
      })}
    </nav>
  );
}
