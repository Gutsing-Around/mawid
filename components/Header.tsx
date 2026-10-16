import Link from "next/link";
import { countWithUnit } from "@/lib/format";
import { SiteNav } from "./SiteNav";

export function Header({ episodeCount }: { episodeCount?: number }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-5">
        <div className="flex items-baseline gap-4">
          <Link href="/" className="font-display text-[26px] leading-tight font-bold">
            موعد <span className="glow-signal text-signal">الحلقة</span>
          </Link>
          {episodeCount !== undefined && (
            <span className="hidden items-center gap-2 font-mono text-xs text-muted sm:flex">
              <span aria-hidden className="glow-box-signal size-1.5 rounded-full bg-signal" />
              {countWithUnit(episodeCount, "episode")} هذا الأسبوع
            </span>
          )}
        </div>
        <SiteNav />
      </div>
    </header>
  );
}
