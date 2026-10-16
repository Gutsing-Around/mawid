"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";

const ACTIVE = "bg-chip text-ink shadow-[inset_0_-2px_0_var(--signal)]";

/**
 * On the home page the layout depends on screen width (tickets on phones, posters above
 * md), so the matching layout link is highlighted with the same breakpoint.
 */
const LINKS = [
  { href: "/posters", label: "ملصقات", onHome: "md:bg-chip md:text-ink md:shadow-[inset_0_-2px_0_var(--signal)]" },
  { href: "/tickets", label: "تذاكر", onHome: "max-md:bg-chip max-md:text-ink max-md:shadow-[inset_0_-2px_0_var(--signal)]" },
  { href: "/my-list", label: "★ قائمتي", onHome: "" },
] as const;

/** Switches between the layouts and the favourites page. */
export function SiteNav() {
  const pathname = usePathname();
  const { favorites } = useFavorites();

  return (
    <nav aria-label="الصفحات" className="flex gap-1 text-sm">
      {LINKS.map(({ href, label, onHome }) => {
        const current = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-muted transition hover:text-ink ${
              current ? ACTIVE : pathname === "/" ? onHome : ""
            }`}
          >
            {label}
            {href === "/my-list" && favorites.length > 0 && (
              <span className="ms-1.5 font-mono text-xs text-signal">{favorites.length}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
