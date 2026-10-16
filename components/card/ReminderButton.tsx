"use client";

/** How long the calendar event lasts (a typical TV episode). */
const EPISODE_MINUTES = 24;

/** 20261016T143000Z: the UTC format both Google Calendar and .ics files use. */
const utcStamp = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Escapes text for an .ics field (RFC 5545). */
const icsText = (text: string) => text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/**
 * "ذكّرني": adds the episode to the visitor's calendar so they're notified when it airs.
 * Google Calendar opens prefilled; the .ics file works with iPhone/Mac Calendar and Outlook
 * and includes an alert 10 minutes before. Times are stored in UTC, so every calendar shows
 * them in the visitor's own time zone. No account or server involved.
 */
export function ReminderButton({
  title,
  episode,
  airingAt,
  path,
  className = "",
}: {
  title: string;
  episode: number;
  airingAt: number;
  /** The show page path, linked from the event. */
  path: string;
  className?: string;
}) {
  const summary = `${title} - الحلقة ${episode}`;
  const start = utcStamp(airingAt);
  const end = utcStamp(airingAt + EPISODE_MINUTES * 60);
  const details = (origin: string) =>
    `موعد نزول الحلقة ${episode} من ${title}.\nالقصة وروابط المشاهدة الرسمية: ${origin}${path}`;

  const openGoogle = () => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: summary,
      dates: `${start}/${end}`,
      details: details(window.location.origin),
    });
    window.open(`https://calendar.google.com/calendar/render?${params}`, "_blank", "noopener");
  };

  const downloadIcs = () => {
    const url = `${window.location.origin}${path}`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mawid//موعد الحلقة//AR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:mawid-${airingAt}-${episode}@${window.location.host}`,
      `DTSTAMP:${utcStamp(Math.floor(Date.now() / 1000))}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${icsText(summary)}`,
      `DESCRIPTION:${icsText(details(window.location.origin))}`,
      `URL:${url}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT10M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsText(summary)}`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href, download: `mawid-${episode}.ics` });
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const item =
    "block w-full cursor-pointer px-4 py-2.5 text-start text-sm hover:bg-chip focus-visible:bg-chip focus-visible:outline-none";

  return (
    // <details> gives an accessible open/close toggle without extra state.
    <details className={`group relative ${className}`}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border border-line bg-chip px-4 py-2 text-sm font-semibold transition hover:border-muted group-open:border-accent group-open:text-accent [&::-webkit-details-marker]:hidden">
        <span aria-hidden>🔔</span>
        ذكّرني
      </summary>
      <div className="absolute start-0 z-30 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/70">
        <button type="button" onClick={openGoogle} className={item}>
          تقويم Google
        </button>
        <button type="button" onClick={downloadIcs} className={`${item} border-t border-line`}>
          iPhone أو Outlook
          <span className="block text-xs text-muted">ملف تقويم مع تنبيه قبل 10 دقائق</span>
        </button>
      </div>
    </details>
  );
}
