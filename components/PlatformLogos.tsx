import { platformBrand } from "@/lib/platforms";
import type { Platform } from "@/lib/types";

/**
 * Official streaming links as brand logos: the logo in the platform's colour on a dark
 * tile that glows in that colour on hover. Platforms without a logo show a short wordmark.
 */
export function PlatformLogos({
  platforms,
  size = "sm",
  className = "",
}: {
  platforms: Platform[];
  size?: "sm" | "lg";
  className?: string;
}) {
  if (platforms.length === 0) {
    return <p className={`text-xs text-muted ${className}`}>لا توجد منصة رسمية بعد</p>;
  }

  const lg = size === "lg";
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {platforms.map((p) => {
        const brand = platformBrand(p.site);
        const width = brand.logo
          ? brand.wide
            ? lg ? "w-[70px]" : "w-12"
            : lg ? "w-11" : "w-[30px]"
          : lg ? "px-3.5" : "px-2";
        return (
          <li key={p.site}>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              title={p.site}
              aria-label={`شاهد على ${p.site}`}
              style={{ "--brand": brand.color, color: brand.color } as React.CSSProperties}
              className={`grid place-items-center rounded-md border border-line bg-chip transition hover:-translate-y-px hover:border-(--brand) hover:shadow-[0_0_12px_color-mix(in_srgb,var(--brand)_55%,transparent)] focus-visible:outline-2 focus-visible:outline-(--brand) ${lg ? "h-11 rounded-[10px]" : "h-[30px]"} ${width}`}
            >
              {brand.logo ? (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className={`fill-current ${brand.wide ? (lg ? "size-13" : "size-9") : lg ? "size-6" : "size-4"}`}
                >
                  <path d={brand.logo} />
                </svg>
              ) : (
                <span dir="ltr" className={`font-bold ${lg ? "text-sm" : "text-[11px]"}`}>
                  {brand.wordmark}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
