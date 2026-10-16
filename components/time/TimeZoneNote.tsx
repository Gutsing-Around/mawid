"use client";

import { useHydrated } from "@/hooks/useHydrated";

export function TimeZoneNote() {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  return (
    <span>
      الأوقات معروضة حسب منطقتك الزمنية:{" "}
      <bdi dir="ltr">{Intl.DateTimeFormat().resolvedOptions().timeZone}</bdi>
    </span>
  );
}
