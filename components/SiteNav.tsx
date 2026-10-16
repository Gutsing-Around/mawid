"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";

const LINKS = [
  { href: "/", label: "ملصقات" },
  { href: "/tickets", label: "تذاكر" },
  { href: "/my-list", label: "★ قائمتي" },
] as const;

/** Switches between the two layouts and the favourites page. */
export function SiteNav() {
  const pathname = usePathname();
  const { favorites } = useFavorites();

  return (
    <nav aria-label="الصفحات" className="flex gap-1 text-sm">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className="rounded-md px-3 py-1.5 text-muted transition hover:text-ink aria-[current=page]:bg-chip aria-[current=page]:text-ink aria-[current=page]:shadow-[inset_0_-2px_0_var(--signal)]"
        >
          {label}
          {href === "/my-list" && favorites.length > 0 && (
            <span className="ms-1.5 font-mono text-xs text-signal">{favorites.length}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
