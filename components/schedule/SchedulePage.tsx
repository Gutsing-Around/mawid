import { PosterCard } from "@/components/card/PosterCard";
import { TicketCard } from "@/components/card/TicketCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Toolbar } from "@/components/Toolbar";
import { getSchedule } from "@/lib/anilist";
import { genreOptions, platformOptions } from "@/lib/schedule";
import { DayTabs } from "./DayTabs";
import { DetailsHost } from "./DetailsHost";
import { EpisodeSlot } from "./EpisodeSlot";
import { GridStatus } from "./GridStatus";
import { PosterHero } from "./PosterHero";
import { ScheduleProvider } from "./ScheduleProvider";
import { TicketHero } from "./TicketHero";

/** "auto" picks by screen width with CSS: tickets on phones, posters from the md breakpoint up. */
export type ScheduleView = "auto" | "posters" | "tickets";

const GRID = {
  posters: "grid grid-cols-[repeat(auto-fill,minmax(min(200px,45%),1fr))] gap-4",
  tickets: "grid grid-cols-[repeat(auto-fill,minmax(min(460px,100%),1fr))] gap-3.5",
  auto: "grid grid-cols-1 gap-3.5 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:gap-4",
};

/**
 * The schedule in one of its layouts. Every card for the week is rendered here on the
 * server; EpisodeSlot only decides what's visible, and DetailsHost builds the popup on demand.
 * The "auto" view renders both card styles and lets CSS show the right one, so phones
 * get tickets from the first paint with no layout flash (hidden images aren't loaded).
 */
export async function SchedulePage({ view }: { view: ScheduleView }) {
  const { episodes, generatedAt } = await getSchedule();

  return (
    <ScheduleProvider episodes={episodes} generatedAt={generatedAt}>
      <Header episodeCount={episodes.length} />
      {view === "posters" && <PosterHero />}
      {view === "auto" && (
        <div className="hidden md:block">
          <PosterHero />
        </div>
      )}

      <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pt-6 pb-12 sm:px-5">
        {view === "tickets" && <TicketHero />}
        {view === "auto" && (
          <div className="md:hidden">
            <TicketHero />
          </div>
        )}
        <Toolbar genres={genreOptions(episodes)} platforms={platformOptions(episodes)} />

        <section aria-labelledby="schedule-title" className="flex flex-col gap-4">
          <h2 id="schedule-title" className="font-display text-xl">مواعيد حلقات الأنمي هذا الأسبوع</h2>
          <DayTabs />
          <div className={GRID[view]}>
            {episodes.map((episode) => (
              <EpisodeSlot key={episode.id} id={episode.id}>
                {view === "posters" && <PosterCard episode={episode} />}
                {view === "tickets" && <TicketCard episode={episode} />}
                {view === "auto" && (
                  <>
                    <div className="hidden h-full md:block">
                      <PosterCard episode={episode} />
                    </div>
                    <div className="h-full md:hidden">
                      <TicketCard episode={episode} />
                    </div>
                  </>
                )}
              </EpisodeSlot>
            ))}
            <GridStatus />
          </div>
        </section>

        <Footer />
      </main>
      <DetailsHost />
    </ScheduleProvider>
  );
}
