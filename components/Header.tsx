import Link from "next/link";
import { countWithUnit } from "@/lib/format";
import { MascotFace } from "./MascotFace";
import { SiteNav } from "./SiteNav";

export function Header({ episodeCount }: { episodeCount?: number }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-display text-[26px] leading-tight font-bold">
            <MascotFace size={40} />
            <span>
              موعد <span className="glow-signal text-signal">الحلقة</span>
            </span>
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
