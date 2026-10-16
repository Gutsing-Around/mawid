"use client";

import { useSchedule } from "@/components/schedule/ScheduleProvider";
import { formatTime, formatWeekdayAt, formatWeekdayTime } from "@/lib/format";

/** Airing time in the visitor's own time zone (the site default before hydration). */
export function LocalTime({
  airingAt,
  format = "time",
  className = "",
}: {
  airingAt: number;
  format?: "time" | "weekday" | "weekdayTime";
  className?: string;
}) {
  const { timeZone } = useSchedule();
  const text =
    format === "time"
      ? formatTime(airingAt, timeZone)
      : format === "weekdayTime"
        ? formatWeekdayTime(airingAt, timeZone)
        : formatWeekdayAt(airingAt, timeZone);

  return (
    <time dateTime={new Date(airingAt * 1000).toISOString()} className={className}>
      {text}
    </time>
  );
}
