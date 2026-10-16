import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ShowPage } from "@/components/show/ShowPage";
import { getSchedule, getShow } from "@/lib/anilist";
import { mediaIdFromSlug, showPath } from "@/lib/schedule";

/** Every show airing this week is prerendered; any other show is built on its first visit and cached. */
export async function generateStaticParams() {
  const { episodes } = await getSchedule();
  const paths = new Set(episodes.map((e) => showPath(e)));
  return [...paths].map((path) => ({ slug: path.slice("/anime/".length) }));
}

/** Finds the show from the ID at the end of the slug; outdated slugs redirect to the current one. */
async function load(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const mediaId = mediaIdFromSlug(slug);
  if (!mediaId) notFound();
  const data = await getShow(mediaId);
  if (!data) notFound();
  const path = showPath(data.show);
  if (`/anime/${slug}` !== path) permanentRedirect(path);
  return { data, path };
}

export async function generateMetadata({ params }: PageProps<"/anime/[slug]">): Promise<Metadata> {
  const { data, path } = await load(params);
  const { show, next } = data;
  const name = show.arabicTitle ?? show.title;

  const lead = next
    ? `موعد نزول الحلقة ${next.episode} من ${name} بتوقيتك المحلي مع عدّاد تنازلي، والقصة وروابط المشاهدة الرسمية.`
    : `قصة ${name} وروابط المشاهدة الرسمية ومواعيد الحلقات بتوقيتك المحلي.`;
  const story = show.synopsis?.lang === "ar" ? ` ${show.synopsis.text.replace(/\s+/g, " ")}` : "";
  const description = (lead + story).length > 160 ? `${(lead + story).slice(0, 157)}…` : lead + story;
  const title = next ? `موعد حلقة ${name} القادمة` : name;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "video.tv_show",
      title,
      description,
      url: path,
      ...(show.cover && !show.mature && { images: [{ url: show.cover, alt: `غلاف ${show.title}` }] }),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AnimePage({ params }: PageProps<"/anime/[slug]">) {
  const { data, path } = await load(params);
  return <ShowPage data={data} path={path} />;
}
