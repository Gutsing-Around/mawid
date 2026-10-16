import { SchedulePage } from "@/components/schedule/SchedulePage";
import { SITE } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  alternateName: SITE.latinName,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "ar",
};

/** Home: tickets on phones, posters on larger screens. */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <h1 className="sr-only">{SITE.title}</h1>
      <SchedulePage view="auto" />
    </>
  );
}
