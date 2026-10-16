import { cacheLife } from "next/cache";
import { descriptions } from "@/data/descriptions";
import { translatedSynopses } from "@/data/synopses-ar";
import { arabicTitles } from "@/data/titles-ar";
import { DAY, HOUR } from "@/lib/format";
import { isMatureContent } from "@/lib/genres";
import { translateToArabic, translationEnabled } from "@/lib/translate";
import type { Episode, NextEpisode, Platform, ShowInfo, Synopsis } from "@/lib/types";

const ENDPOINT = "https://graphql.anilist.co";
const PER_PAGE = 50;
/** Safety cap; a normal week is 3–6 pages. */
const MAX_PAGES = 10;
/** Parallel translation requests when a schedule refresh finds new shows. */
const TRANSLATION_CONCURRENCY = 4;

/** The show fields every query asks for. */
const MEDIA_FIELDS = /* GraphQL */ `
  id
  isAdult
  episodes
  genres
  tags {
    name
    rank
    isAdult
  }
  description(asHtml: false)
  bannerImage
  title {
    romaji
    english
  }
  coverImage {
    large
    color
  }
  externalLinks {
    site
    url
    type
  }
`;

const SCHEDULE_QUERY = /* GraphQL */ `
  query Schedule($from: Int!, $to: Int!, $page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
        id
        episode
        airingAt
        media {
          ${MEDIA_FIELDS}
        }
      }
    }
  }
`;

const SHOW_QUERY = /* GraphQL */ `
  query Show($id: Int!) {
    Media(id: $id, type: ANIME) {
      ${MEDIA_FIELDS}
      nextAiringEpisode {
        id
        episode
        airingAt
      }
    }
  }
`;

// Response shapes: only the fields requested above. AniList marks most of them nullable.
type AniListMedia = {
  id: number;
  isAdult: boolean | null;
  episodes: number | null;
  genres: string[] | null;
  tags: { name: string; rank: number | null; isAdult: boolean | null }[] | null;
  description: string | null;
  bannerImage: string | null;
  title: { romaji: string | null; english: string | null } | null;
  coverImage: { large: string | null; color: string | null } | null;
  externalLinks: { site: string; url: string | null; type: string | null }[] | null;
};

type AniListAiringSchedule = {
  id: number;
  episode: number;
  airingAt: number;
  media: AniListMedia | null;
};

type SchedulePage = {
  pageInfo: { hasNextPage: boolean | null };
  airingSchedules: AniListAiringSchedule[];
};

type GraphQLResponse<T> = {
  data?: T | null;
  errors?: { message: string; status?: number }[];
};

export type Schedule = {
  /** When the schedule was fetched (Unix seconds); the server's notion of "now". */
  generatedAt: number;
  episodes: Episode[];
};

/** Everything a show page needs. `next` is null when no upcoming episode is announced. */
export type ShowPageData = {
  generatedAt: number;
  show: ShowInfo;
  next: NextEpisode | null;
};

/**
 * Every non-adult episode airing between one hour ago and seven days from now,
 * with Arabic synopses where available.
 *
 * Runs only on the server. The result is cached and regenerated in the
 * background every 30 minutes, so AniList sees at most a few requests per
 * half hour regardless of traffic.
 */
export async function getSchedule(): Promise<Schedule> {
  "use cache";
  cacheLife({ revalidate: 1800 });

  const now = Math.floor(Date.now() / 1000);
  // Start an hour back so episodes that just started can still show "on air now".
  const from = now - HOUR;
  const to = now + 7 * DAY;

  // Keyed by schedule ID: pages can overlap if the schedule shifts mid-pagination.
  const schedules = new Map<number, { schedule: AniListAiringSchedule; media: AniListMedia }>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { Page } = await anilist<{ Page: SchedulePage }>(SCHEDULE_QUERY, {
      from,
      to,
      page,
      perPage: PER_PAGE,
    });
    for (const schedule of Page.airingSchedules) {
      if (!schedule.media || schedule.media.isAdult) continue;
      schedules.set(schedule.id, { schedule, media: schedule.media });
    }
    if (!Page.pageInfo.hasNextPage) break;
  }

  const synopses = await localizeSynopses([...schedules.values()].map((s) => s.media));
  const episodes = [...schedules.values()].map(({ schedule, media }) => ({
    ...toShowInfo(media, synopses.get(media.id) ?? null),
    id: schedule.id,
    episode: schedule.episode,
    airingAt: schedule.airingAt,
  }));

  return { generatedAt: now, episodes: episodes.sort((a, b) => a.airingAt - b.airingAt) };
}

/**
 * One show for its page. Shows airing this week come straight from the cached schedule,
 * so prerendering every show page costs no extra AniList requests. Any other show is
 * fetched on demand (cached the same way). Returns null for unknown or adult titles.
 */
export async function getShow(mediaId: number): Promise<ShowPageData | null> {
  const { episodes, generatedAt } = await getSchedule();
  const episode = episodes.find((e) => e.mediaId === mediaId);
  if (episode) {
    const { id, episode: number, airingAt, ...show } = episode;
    return { generatedAt, show, next: { id, episode: number, airingAt } };
  }
  return fetchShow(mediaId);
}

async function fetchShow(mediaId: number): Promise<ShowPageData | null> {
  "use cache";
  cacheLife({ revalidate: 1800 });

  type ShowResponse = {
    Media: (AniListMedia & { nextAiringEpisode: NextEpisode | null }) | null;
  };
  let data: ShowResponse;
  try {
    data = await anilist<ShowResponse>(SHOW_QUERY, { id: mediaId });
  } catch (error) {
    if (error instanceof AniListNotFound) return null;
    throw error;
  }
  const media = data.Media;
  if (!media || media.isAdult) return null;

  const synopses = await localizeSynopses([media]);
  return {
    generatedAt: Math.floor(Date.now() / 1000),
    show: toShowInfo(media, synopses.get(media.id) ?? null),
    next: media.nextAiringEpisode,
  };
}

class AniListNotFound extends Error {}

async function anilist<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json().catch(() => ({}))) as GraphQLResponse<T>;
  if (json.errors?.some((e) => e.status === 404)) throw new AniListNotFound("Not found");
  if (!res.ok) {
    throw new Error(`AniList request failed with HTTP ${res.status}`);
  }
  if (json.errors?.length || !json.data) {
    const reason = json.errors?.map((e) => e.message).join("; ") ?? "empty response";
    throw new Error(`AniList returned an error: ${reason}`);
  }
  return json.data;
}

function toShowInfo(media: AniListMedia, synopsis: Synopsis | null): ShowInfo {
  const romaji = media.title?.romaji ?? media.title?.english ?? "";
  return {
    mediaId: media.id,
    totalEpisodes: media.episodes,
    title: media.title?.english ?? romaji,
    romaji,
    arabicTitle: arabicTitles[media.id] ?? null,
    cover: media.coverImage?.large ?? null,
    coverColor: media.coverImage?.color ?? null,
    banner: media.bannerImage,
    genres: media.genres ?? [],
    mature: isMatureContent(media.genres ?? [], media.tags ?? []),
    synopsis,
    platforms: streamingPlatforms(media.externalLinks ?? []),
  };
}

/** Streaming links only, one per site (AniList often lists a site once per language). */
function streamingPlatforms(links: NonNullable<AniListMedia["externalLinks"]>): Platform[] {
  const bySite = new Map<string, Platform>();
  for (const link of links) {
    if (link.type !== "STREAMING" || !link.url || bySite.has(link.site)) continue;
    bySite.set(link.site, { site: link.site, url: link.url });
  }
  return [...bySite.values()];
}

/**
 * One synopsis per show, in order of preference: the hand-written Arabic text in
 * data/descriptions.ts, the prepared Arabic synopses in data/synopses-ar.ts, a cached
 * Claude translation of the official English text, or the English text itself.
 */
async function localizeSynopses(mediaList: AniListMedia[]): Promise<Map<number, Synopsis>> {
  const unique = new Map(mediaList.map((m) => [m.id, m]));
  const result = new Map<number, Synopsis>();
  const toTranslate: { id: number; text: string; source: string | null }[] = [];

  for (const media of unique.values()) {
    const official = media.description ? cleanDescription(media.description) : null;
    const arabic = descriptions[media.id] ?? translatedSynopses[media.id];
    if (arabic) {
      result.set(media.id, { text: arabic, lang: "ar", source: official?.source ?? null });
    } else if (official) {
      result.set(media.id, { text: official.text, lang: "en", source: official.source });
      if (translationEnabled) toTranslate.push({ id: media.id, ...official });
    }
  }

  // A small worker pool; a failed translation keeps the English text and is retried on the next refresh.
  const queue = [...toTranslate];
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        const arabic = await translateToArabic(item.text);
        if (arabic) result.set(item.id, { text: arabic, lang: "ar", source: item.source });
      } catch (error) {
        console.error(`Translating the synopsis of AniList media ${item.id} failed`, error);
      }
    }
  };
  await Promise.all(Array.from({ length: TRANSLATION_CONCURRENCY }, worker));

  return result;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#039": "'", apos: "'" };

/** AniList synopses contain light HTML and end with a "(Source: …)" credit; split those apart. */
function cleanDescription(raw: string): { text: string; source: string | null } {
  let text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#039|apos);/g, (_, e: string) => ENTITIES[e])
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Production notes ("Note: streamed a week early…") come after the story; drop them.
  text = text.split(/\n\s*Notes?:/i)[0];

  let source: string | null = null;
  text = text
    .replace(/\(\s*Source:\s*([^)\n]+?)\s*\)|^\s*Source:\s*(.+)$/im, (_, a?: string, b?: string) => {
      source = (a ?? b ?? "").replace(/,?\s*(edited|translated)$/i, "").trim() || null;
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text, source };
}
