import { PosterCard } from "@/components/card/PosterCard";
import { ShowDetails } from "@/components/card/ShowDetails";
import { TicketCard } from "@/components/card/TicketCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Toolbar } from "@/components/Toolbar";
import { getSchedule } from "@/lib/anilist";
import { genreOptions, platformOptions, toSummary } from "@/lib/schedule";
import { DayTabs } from "./DayTabs";
import { EpisodeSlot } from "./EpisodeSlot";
import { GridStatus } from "./GridStatus";
import { PosterHero } from "./PosterHero";
import { ScheduleProvider } from "./ScheduleProvider";
import { TicketHero } from "./TicketHero";

export type ScheduleView = "posters" | "tickets";

/**
 * The schedule in one of its two layouts. Every card for the week, and its details,
 * is rendered here on the server; EpisodeSlot only decides what's visible and open.
 */
export async function SchedulePage({ view }: { view: ScheduleView }) {
  const { episodes, generatedAt } = await getSchedule();
  const Card = view === "posters" ? PosterCard : TicketCard;

  return (
    <ScheduleProvider episodes={episodes.map(toSummary)} generatedAt={generatedAt}>
      <Header episodeCount={episodes.length} />
      {view === "posters" && <PosterHero />}

      <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pt-6 pb-12 sm:px-5">
        {view === "tickets" && <TicketHero />}
        <Toolbar genres={genreOptions(episodes)} platforms={platformOptions(episodes)} />

        <section aria-labelledby="schedule-title" className="flex flex-col gap-4">
          <h2 id="schedule-title" className="font-display text-xl">مواعيد حلقات الأنمي هذا الأسبوع</h2>
          <DayTabs />
          <div
            className={
              view === "posters"
                ? "grid grid-cols-[repeat(auto-fill,minmax(min(200px,45%),1fr))] gap-4"
                : "grid grid-cols-[repeat(auto-fill,minmax(min(460px,100%),1fr))] gap-3.5"
            }
          >
            {episodes.map((episode) => (
              <EpisodeSlot
                key={episode.id}
                id={episode.id}
                title={episode.title}
                details={<ShowDetails episode={episode} />}
              >
                <Card episode={episode} />
              </EpisodeSlot>
            ))}
            <GridStatus />
          </div>
        </section>

        <Footer />
      </main>
    </ScheduleProvider>
  );
}
