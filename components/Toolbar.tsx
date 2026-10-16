"use client";

import { useSchedule } from "@/components/schedule/ScheduleProvider";
import type { GenreOption } from "@/lib/schedule";

const CONTROL_CLASS =
  "rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition focus:border-signal focus:shadow-[0_0_0_1px_var(--signal),0_0_14px_rgb(255_46_62/0.3)] focus:outline-none";

/** Search by title, plus genre and platform filters. */
export function Toolbar({ genres, platforms }: { genres: GenreOption[]; platforms: string[] }) {
  const { filters, setQuery, setGenre, setPlatform } = useSchedule();

  return (
    <div className="flex flex-wrap gap-2.5">
      <input
        type="search"
        value={filters.query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن أنمي…"
        aria-label="ابحث عن أنمي"
        className={`min-w-0 flex-[1_1_260px] ${CONTROL_CLASS}`}
      />
      <select
        aria-label="تصفية حسب التصنيف"
        value={filters.genre}
        onChange={(e) => setGenre(e.target.value)}
        className={`cursor-pointer ${CONTROL_CLASS}`}
      >
        <option value="">كل التصنيفات</option>
        {genres.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>
      <select
        aria-label="تصفية حسب المنصة"
        value={filters.platform}
        onChange={(e) => setPlatform(e.target.value)}
        className={`cursor-pointer ${CONTROL_CLASS}`}
      >
        <option value="">كل المنصات</option>
        {platforms.map((site) => (
          <option key={site} value={site}>
            {site}
          </option>
        ))}
      </select>
    </div>
  );
}
