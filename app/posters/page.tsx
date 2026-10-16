import type { Metadata } from "next";
import { SchedulePage } from "@/components/schedule/SchedulePage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "جدول الملصقات",
  // Same schedule as the home page in another layout, so search engines should index "/" only.
  alternates: { canonical: "/" },
};

/** Always the posters layout, even on phones (the home page shows tickets there). */
export default function PostersPage() {
  return (
    <>
      <h1 className="sr-only">{SITE.title}</h1>
      <SchedulePage view="posters" />
    </>
  );
}
