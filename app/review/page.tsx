import type { Metadata } from "next";
import Link from "next/link";
import { descriptions } from "@/data/descriptions";
import { translatedSynopses } from "@/data/synopses-ar";
import { arabicTitles } from "@/data/titles-ar";
import { getSchedule } from "@/lib/anilist";
import { showPath } from "@/lib/schedule";
import type { ShowInfo } from "@/lib/types";

export const metadata: Metadata = {
  title: "مراجعة الأسماء والقصص",
  // A page for the site owner, not for visitors or search engines.
  robots: { index: false, follow: false },
};

type Status = "checked" | "auto" | "missing";

const STATUS: Record<Status, { label: string; className: string }> = {
  checked: { label: "مُراجَع", className: "text-accent" },
  auto: { label: "تلقائي", className: "text-signal" },
  missing: { label: "غير متوفر", className: "text-muted" },
};

function nameStatus(show: ShowInfo): Status {
  if (arabicTitles[show.mediaId]) return "checked";
  return show.arabicTitle ? "auto" : "missing";
}

function synopsisStatus(show: ShowInfo): Status {
  if (descriptions[show.mediaId] || translatedSynopses[show.mediaId]) return "checked";
  return show.synopsis?.lang === "ar" ? "auto" : "missing";
}

/**
 * Every show airing this week, with where its Arabic name and synopsis come from: checked
 * (data files), automatic (Claude, cached) or missing. Automatic names are also listed as
 * ready-to-paste lines for data/titles-ar.ts, so they can be confirmed (and corrected) there.
 */
export default async function ReviewPage() {
  const { episodes } = await getSchedule();
  const shows = [...new Map(episodes.map((e) => [e.mediaId, e])).values()]
    .map((show) => ({ show, name: nameStatus(show), synopsis: synopsisStatus(show) }))
    // Things to look at first: automatic, then missing, then checked.
    .sort((a, b) => rank(a) - rank(b) || a.show.title.localeCompare(b.show.title));
  const autoNames = shows.filter((s) => s.name === "auto");
  const count = (key: "name" | "synopsis", status: Status) => shows.filter((s) => s[key] === status).length;

  return (
    <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 pt-8 pb-12 sm:px-5">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl">مراجعة الأسماء والقصص</h1>
        <p className="text-sm text-muted">
          {shows.length} عملًا هذا الأسبوع. الأسماء: {count("name", "checked")} مُراجَع، {count("name", "auto")} تلقائي،{" "}
          {count("name", "missing")} غير متوفر. القصص: {count("synopsis", "checked")} مُراجَع،{" "}
          {count("synopsis", "auto")} تلقائي، {count("synopsis", "missing")} بالإنجليزية فقط.
        </p>
      </header>

      {autoNames.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-xl">أسماء تلقائية جاهزة للنسخ</h2>
          <p className="text-sm text-muted">
            صحّح ما يلزم ثم انسخ الأسطر إلى <code dir="ltr">data/titles-ar.ts</code> لتصبح أسماء مُراجَعة.
          </p>
          <pre dir="ltr" className="overflow-x-auto rounded-lg border border-line bg-surface p-3 text-left font-mono text-[13px] leading-6 select-all">
            {autoNames.map(({ show }) => `  ${show.mediaId}: "${show.arabicTitle}", // ${show.title}`).join("\n")}
          </pre>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-xl">كل الأعمال</h2>
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
          {shows.map(({ show, name, synopsis }) => (
            <li key={show.mediaId} className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <Link href={showPath(show)} className="font-semibold hover:underline">
                  {show.arabicTitle ?? show.title}
                </Link>
                <p dir="ltr" className="truncate text-right text-xs text-muted">
                  {show.title} · AniList {show.mediaId}
                </p>
              </div>
              <p className="flex shrink-0 gap-4 text-xs">
                <span>
                  الاسم: <span className={STATUS[name].className}>{STATUS[name].label}</span>
                </span>
                <span>
                  القصة: <span className={STATUS[synopsis].className}>{STATUS[synopsis].label}</span>
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

const ORDER: Record<Status, number> = { auto: 0, missing: 1, checked: 2 };
const rank = (s: { name: Status; synopsis: Status }) => Math.min(ORDER[s.name], ORDER[s.synopsis]);
