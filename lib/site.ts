/** Site-wide identity and SEO copy, shared by metadata, robots, sitemap, manifest and JSON-LD. */

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Set automatically on Vercel.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const SITE = {
  name: "موعد الحلقة",
  latinName: "Mawid",
  url: resolveSiteUrl(),
  title: "موعد الحلقة | مواعيد نزول حلقات الأنمي بتوقيتك",
  description:
    "اعرف موعد نزول الحلقة القادمة من كل أنمي يُعرض هذا الأسبوع، مع عدّاد تنازلي بتوقيتك المحلي وروابط المنصات الرسمية مثل Crunchyroll وNetflix.",
  keywords: [
    "موعد الحلقة",
    "موعد نزول الحلقة",
    "مواعيد حلقات الأنمي",
    "مواعيد الانمي",
    "جدول الأنمي",
    "جدول الانمي الأسبوعي",
    "أنمي الموسم",
    "انمي",
    "عداد الحلقة القادمة",
    "anime schedule",
  ],
  /** Shown before hydration, when the visitor's time zone is still unknown. */
  defaultTimeZone: "Asia/Riyadh",
} as const;
