import type { Metadata } from "next";
import { SchedulePage } from "@/components/schedule/SchedulePage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "جدول التذاكر",
  // Same schedule as the home page in another layout, so search engines should index "/" only.
  alternates: { canonical: "/" },
};

/** The alternative layout: tickets. */
export default function TicketsPage() {
  return (
    <>
      <h1 className="sr-only">{SITE.title}</h1>
      <SchedulePage view="tickets" />
    </>
  );
}
