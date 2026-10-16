import type { MetadataRoute } from "next";
import { getSchedule } from "@/lib/anilist";
import { showPath } from "@/lib/schedule";
import { SITE } from "@/lib/site";

/** The home page plus a page for every show airing this week. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { episodes } = await getSchedule();
  const shows = new Set(episodes.map((e) => showPath(e)));
  return [
    { url: SITE.url, changeFrequency: "hourly", priority: 1 },
    ...[...shows].map((path) => ({
      url: `${SITE.url}${path}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
