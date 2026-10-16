import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/card/FavoriteButton";
import { GenreTags } from "@/components/card/GenreTags";
import { MatureCover } from "@/components/card/MatureCover";
import { ReminderButton } from "@/components/card/ReminderButton";
import { SeasonProgress } from "@/components/card/SeasonProgress";
import { SynopsisBlock } from "@/components/card/SynopsisBlock";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PlatformLogos } from "@/components/PlatformLogos";
import { CountdownBoxes } from "@/components/schedule/CountdownBoxes";
import { ScheduleProvider } from "@/components/schedule/ScheduleProvider";
import { LocalTime } from "@/components/time/LocalTime";
import type { ShowPageData } from "@/lib/anilist";
import { episodeLabel } from "@/lib/format";
import { genreLabel } from "@/lib/genres";
import { favoriteOf } from "@/lib/schedule";
import { SITE } from "@/lib/site";

/** A show's own page: next episode countdown, story, where to watch, reminder and favourite. */
export function ShowPage({ data, path }: { data: ShowPageData; path: string }) {
  const { show, next, generatedAt } = data;
  const episode = next ? { ...show, ...next } : null;
  const art = show.banner ?? show.cover;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: show.title,
    alternateName: [show.romaji, show.arabicTitle].filter((n) => n && n !== show.title),
    url: `${SITE.url}${path}`,
    image: show.cover ?? undefined,
    genre: show.genres.map(genreLabel),
    description: show.synopsis?.text.slice(0, 500),
    numberOfEpisodes: show.totalEpisodes ?? undefined,
    ...(next && {
      episode: {
        "@type": "TVEpisode",
        episodeNumber: next.episode,
        releasedEvent: { "@type": "PublicationEvent", startDate: new Date(next.airingAt * 1000).toISOString() },
      },
    }),
  };

  return (
    <ScheduleProvider episodes={episode ? [episode] : []} generatedAt={generatedAt}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Header />

      <section className="relative overflow-hidden border-b border-line">
        {art && (
          <MatureCover mediaId={show.mediaId} mature={show.mature} size="bg">
            <Image
              src={art}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30 [mask-image:linear-gradient(to_bottom,#000_40%,transparent)]"
            />
          </MatureCover>
        )}
        <div className="relative mx-auto grid max-w-[1100px] gap-6 px-4 py-8 sm:px-5 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10 md:py-12">
          <div
            className="relative aspect-[2/3] w-36 overflow-hidden rounded-lg shadow-2xl shadow-black/70 md:w-full"
            style={{ backgroundColor: show.coverColor ?? "var(--chip)" }}
          >
            {show.cover && (
              <MatureCover mediaId={show.mediaId} mature={show.mature}>
                <Image src={show.cover} alt={`غلاف ${show.title}`} fill priority sizes="208px" className="object-cover" />
              </MatureCover>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <nav aria-label="مسار التصفح" className="text-xs text-muted">
              <Link href="/" className="hover:text-ink">جدول الحلقات</Link>
              <span aria-hidden className="mx-2">/</span>
              <span>{show.arabicTitle ?? show.title}</span>
            </nav>

            <h1 className="font-display text-[clamp(26px,4.5vw,44px)] leading-tight text-balance">
              {show.arabicTitle ?? show.title}
            </h1>
            <div className="-mt-1 flex flex-col">
              {show.arabicTitle && <p dir="ltr" className="text-right text-lg font-semibold text-ink/85">{show.title}</p>}
              {show.romaji !== show.title && <p dir="ltr" className="text-right text-sm text-muted">{show.romaji}</p>}
            </div>
            <GenreTags genres={show.genres} variant="pills" />

            {next ? (
              <div className="mt-2 flex flex-col gap-4">
                <p className="text-muted">
                  <span className="glow-signal font-mono text-xs font-semibold tracking-[0.2em] text-signal">● الحلقة القادمة</span>
                  <br />
                  <b className="font-semibold text-ink">{episodeLabel(next.episode, show.totalEpisodes)}</b>
                  {" · "}
                  <LocalTime airingAt={next.airingAt} format="weekdayTime" />
                </p>
                <CountdownBoxes airingAt={next.airingAt} variant="boxes" />
              </div>
            ) : (
              <p className="mt-2 rounded-lg border border-line bg-surface p-4 text-muted">
                لا توجد حلقة قادمة معلنة لهذا العمل حاليًا.
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <FavoriteButton show={favoriteOf(show)} variant="full" />
              {next && (
                <ReminderButton title={show.title} episode={next.episode} airingAt={next.airingAt} path={path} />
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1100px] gap-8 px-4 pt-8 pb-12 sm:px-5 md:grid-cols-[minmax(0,1fr)_17rem]">
        <SynopsisBlock synopsis={show.synopsis} id="story" heading="h2" />

        <aside className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-base">شاهد على</h2>
            <PlatformLogos platforms={show.platforms} size="lg" />
          </section>
          {next && show.totalEpisodes ? (
            <section className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
              <h2 className="font-display text-base">تقدّم الموسم</h2>
              <p className="text-sm text-muted">{episodeLabel(next.episode, show.totalEpisodes)}</p>
              <SeasonProgress episode={next.episode} total={show.totalEpisodes} />
            </section>
          ) : null}
        </aside>

        <div className="md:col-span-2">
          <Link href="/" className="text-sm font-semibold text-accent hover:underline">
            → كل مواعيد حلقات الأنمي هذا الأسبوع
          </Link>
          <Footer />
        </div>
      </main>
    </ScheduleProvider>
  );
}
