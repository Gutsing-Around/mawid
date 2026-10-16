import type { Metadata } from "next";
import { FavoritesList } from "@/components/favorites/FavoritesList";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScheduleProvider } from "@/components/schedule/ScheduleProvider";
import { getSchedule } from "@/lib/anilist";
import { toSummary } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "قائمتي",
  // The list lives in each visitor's browser; there's nothing here for search engines.
  robots: { index: false, follow: true },
};

/** The visitor's favourite shows. The schedule is loaded so each favourite can show its next episode. */
export default async function MyListPage() {
  const { episodes, generatedAt } = await getSchedule();

  return (
    <ScheduleProvider episodes={episodes.map(toSummary)} generatedAt={generatedAt}>
      <Header episodeCount={episodes.length} />
      <main className="mx-auto flex max-w-[900px] flex-col gap-5 px-4 pt-8 pb-12 sm:px-5">
        <h1 className="font-display text-3xl">
          <span className="glow-signal text-signal">★</span> قائمتي
        </h1>
        <FavoritesList />
        <Footer />
      </main>
    </ScheduleProvider>
  );
}
