import { cacheLife } from "next/cache";
import { descriptions } from "@/data/descriptions";
import { translatedSynopses } from "@/data/synopses-ar";
import { arabicTitles } from "@/data/titles-ar";
import { DAY, HOUR } from "@/lib/format";
import { isMatureContent } from "@/lib/genres";
import { arabicTitleFor, translateToArabic, translationEnabled } from "@/lib/translate";
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

  const { synopses, titles } = await localize([...schedules.values()].map((s) => s.media));
  const episodes = [...schedules.values()].map(({ schedule, media }) => ({
    ...toShowInfo(media, synopses.get(media.id) ?? null, titles.get(media.id) ?? null),
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

  const { synopses, titles } = await localize([media]);
  return {
    generatedAt: Math.floor(Date.now() / 1000),
    show: toShowInfo(media, synopses.get(media.id) ?? null, titles.get(media.id) ?? null),
    next: media.nextAiringEpisode,
  };
}

class AniListNotFound extends Error {}

/** Retries after "too many requests" or a server error before giving up. */
const MAX_ATTEMPTS = 4;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function anilist<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let res: Response;
  for (let attempt = 1; ; attempt++) {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) break;
    // AniList says how long to wait (Retry-After, seconds); otherwise back off 5s, 10s, 20s.
    const retryAfter = Number(res.headers.get("retry-after"));
    const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 65) : 5 * 2 ** (attempt - 1);
    console.warn(`AniList returned HTTP ${res.status}; retrying in ${seconds}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
    await wait(seconds * 1000);
  }
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

function toShowInfo(media: AniListMedia, synopsis: Synopsis | null, arabicTitle: string | null): ShowInfo {
  const romaji = media.title?.romaji ?? media.title?.english ?? "";
  return {
    mediaId: media.id,
    totalEpisodes: media.episodes,
    title: media.title?.english ?? romaji,
    romaji,
    arabicTitle,
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

/** Arabic synopses and show names for a list of shows. */
async function localize(mediaList: AniListMedia[]) {
  const unique = [...new Map(mediaList.map((m) => [m.id, m])).values()];
  const [synopses, titles] = await Promise.all([localizeSynopses(unique), localizeTitles(unique)]);
  return { synopses, titles };
}

/**
 * Runs a Claude task for each item, a few at a time. A failure is logged and skipped (the
 * result isn't cached), so it's retried on the next refresh.
 */
async function inPool<T>(items: T[], label: (item: T) => string, task: (item: T) => Promise<void>) {
  const queue = [...items];
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        await task(item);
      } catch (error) {
        console.error(`${label(item)} failed`, error);
      }
    }
  };
  await Promise.all(Array.from({ length: TRANSLATION_CONCURRENCY }, worker));
}

/**
 * One Arabic name per show: the checked name in data/titles-ar.ts, or else an automatic one
 * from Claude (when translation is enabled), which /review lists for the owner to confirm.
 * Shows with neither are shown by their English title only.
 */
async function localizeTitles(unique: AniListMedia[]): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  const missing: AniListMedia[] = [];
  for (const media of unique) {
    if (arabicTitles[media.id]) result.set(media.id, arabicTitles[media.id]);
    else if (translationEnabled && (media.title?.romaji || media.title?.english)) missing.push(media);
  }
  await inPool(
    missing,
    (media) => `Naming AniList media ${media.id} in Arabic`,
    async (media) => {
      const name = await arabicTitleFor(media.title?.english ?? null, media.title?.romaji ?? media.title?.english ?? "");
      if (name) result.set(media.id, name);
    },
  );
  return result;
}

/**
 * One synopsis per show, in order of preference: the hand-written Arabic text in
 * data/descriptions.ts, the prepared Arabic synopses in data/synopses-ar.ts, a cached
 * Claude translation of the official English text, or the English text itself.
 */
async function localizeSynopses(unique: AniListMedia[]): Promise<Map<number, Synopsis>> {
  const result = new Map<number, Synopsis>();
  const toTranslate: { id: number; text: string; source: string | null }[] = [];

  for (const media of unique) {
    const official = media.description ? cleanDescription(media.description) : null;
    const arabic = descriptions[media.id] ?? translatedSynopses[media.id];
    if (arabic) {
      result.set(media.id, { text: arabic, lang: "ar", source: official?.source ?? null });
    } else if (official) {
      result.set(media.id, { text: official.text, lang: "en", source: official.source });
      if (translationEnabled) toTranslate.push({ id: media.id, ...official });
    }
  }

  // A failed translation keeps the English text.
  await inPool(
    toTranslate,
    (item) => `Translating the synopsis of AniList media ${item.id}`,
    async (item) => {
      const arabic = await translateToArabic(item.text);
      if (arabic) result.set(item.id, { text: arabic, lang: "ar", source: item.source });
    },
  );

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
