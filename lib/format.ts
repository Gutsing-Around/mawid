/**
 * Text and time formatting shared by server and client components.
 *
 * Anything that depends on the visitor's time zone (times, day keys, weekday
 * names) must only be rendered in the browser, after hydration.
 */

/** Arabic words with Western digits: "9:30 م", "14 أكتوبر". */
export const LOCALE = "ar-u-nu-latn";

export const HOUR = 60 * 60;
export const DAY = 24 * HOUR;

/** How long after its airing time an episode still counts as "on air now". */
const LIVE_WINDOW = 30 * 60;

type Unit = "day" | "hour" | "minute" | "second" | "episode" | "show";

/** [singular, dual, plural for 3–10] */
const UNIT_FORMS: Record<Unit, [string, string, string]> = {
  day: ["يوم", "يومين", "أيام"],
  hour: ["ساعة", "ساعتين", "ساعات"],
  minute: ["دقيقة", "دقيقتين", "دقائق"],
  second: ["ثانية", "ثانيتين", "ثوانٍ"],
  episode: ["حلقة", "حلقتين", "حلقات"],
  show: ["عمل", "عملين", "أعمال"],
};

/** The noun that goes with a count: 1 ساعة، 2 ساعتين، 3–10 ساعات، 11+ ساعة. */
export function unitNoun(n: number, unit: Unit): string {
  const [singular, dual, plural] = UNIT_FORMS[unit];
  if (n === 2) return dual;
  if (n >= 3 && n <= 10) return plural;
  return singular;
}

/** A count written the way it's spoken: ساعة، ساعتين، 5 ساعات، 11 ساعة. */
export function countWithUnit(n: number, unit: Unit): string {
  if (n === 1 || n === 2) return unitNoun(n, unit);
  return `${n} ${unitNoun(n, unit)}`;
}

export function episodeLabel(episode: number, total: number | null): string {
  return total ? `الحلقة ${episode} من ${total}` : `الحلقة ${episode}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function splitDuration(seconds: number) {
  const s = Math.max(0, seconds);
  return {
    days: Math.floor(s / DAY),
    hours: Math.floor((s % DAY) / HOUR),
    minutes: Math.floor((s % HOUR) / 60),
    seconds: s % 60,
  };
}

export type CountdownState = "upcoming" | "soon" | "live" | "aired";

export function countdownState(remaining: number): CountdownState {
  if (remaining > HOUR) return "upcoming";
  if (remaining > 0) return "soon";
  return remaining > -LIVE_WINDOW ? "live" : "aired";
}

/** Short countdown for cards: "بعد يومين و3 ساعات", "بعد 05:12", "تُعرض الآن". */
export function countdownText(remaining: number): string {
  const state = countdownState(remaining);
  if (state === "live") return "تُعرض الآن";
  if (state === "aired") return "عُرضت";

  const { days, hours, minutes, seconds } = splitDuration(remaining);
  if (days > 0) {
    const d = countWithUnit(days, "day");
    return hours > 0 ? `بعد ${d} و${countWithUnit(hours, "hour")}` : `بعد ${d}`;
  }
  if (hours > 0) {
    const h = countWithUnit(hours, "hour");
    return minutes > 0 ? `بعد ${h} و${countWithUnit(minutes, "minute")}` : `بعد ${h}`;
  }
  return `بعد ${pad2(minutes)}:${pad2(seconds)}`;
}

/** Poster-card countdown: "09:30:27" within a day, otherwise "بعد يومين". */
export function clockText(remaining: number): string {
  const state = countdownState(remaining);
  if (state === "live") return "تُعرض الآن";
  if (state === "aired") return "عُرضت";
  const { days, hours, minutes, seconds } = splitDuration(remaining);
  if (days > 0) return `بعد ${countWithUnit(days, "day")}`;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

// Without a `timeZone`, formatters use the runtime's zone: the visitor's when run in the browser.
// Creating Intl formatters is slow, so they're cached per options + zone.
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions, timeZone?: string) {
  const id = `${locale}|${JSON.stringify(options)}|${timeZone ?? ""}`;
  let f = formatters.get(id);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    formatters.set(id, f);
  }
  return f;
}

const DAY_KEY = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
const TIME = { hour: "numeric", minute: "2-digit" } as const;
const WEEKDAY_TIME = { weekday: "long", hour: "numeric", minute: "2-digit" } as const;

/** Calendar day as "YYYY-MM-DD", used to group episodes into day tabs. */
export function localDayKey(unixSeconds: number, timeZone?: string): string {
  return formatter("en-CA", DAY_KEY, timeZone).format(unixSeconds * 1000);
}

export const formatTime = (unixSeconds: number, timeZone?: string) =>
  formatter(LOCALE, TIME, timeZone).format(unixSeconds * 1000);
export const formatDateAt = (unixSeconds: number, timeZone?: string) =>
  formatter(LOCALE, { day: "numeric", month: "long" }, timeZone).format(unixSeconds * 1000);
export const formatWeekdayAt = (unixSeconds: number, timeZone?: string) =>
  formatter(LOCALE, { weekday: "long" }, timeZone).format(unixSeconds * 1000);
export const formatWeekdayTime = (unixSeconds: number, timeZone?: string) =>
  formatter(LOCALE, WEEKDAY_TIME, timeZone).format(unixSeconds * 1000);
// Day-tab dates are local noon, so the weekday and date are the same in any zone.
export const formatWeekday = (date: Date) => formatter(LOCALE, { weekday: "long" }).format(date);
export const formatDate = (date: Date) =>
  formatter(LOCALE, { day: "numeric", month: "long" }).format(date);

export type DayInfo = { key: string; date: Date };

/** The `count` local days starting at `todayKey`. Noon avoids DST edge cases. */
export function nextDays(todayKey: string, count: number): DayInfo[] {
  const [year, month, day] = todayKey.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(year, month - 1, day + i, 12);
    return { key: localDayKey(date.getTime() / 1000), date };
  });
}
