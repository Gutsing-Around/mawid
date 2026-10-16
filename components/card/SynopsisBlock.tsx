import type { Synopsis } from "@/lib/types";

/** The story with its official source credit; shared by the popup and the show page. */
export function SynopsisBlock({
  synopsis,
  id,
  heading: Heading = "h3",
}: {
  synopsis: Synopsis | null;
  /** Unique id for the heading, so the section is labelled by it. */
  id: string;
  heading?: "h2" | "h3";
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <Heading id={id} className="font-display text-base">
        القصة
      </Heading>
      {synopsis ? (
        <>
          <div
            dir={synopsis.lang === "ar" ? "rtl" : "ltr"}
            className={`flex flex-col gap-2 text-[14.5px] leading-loose ${synopsis.lang === "en" ? "text-left text-ink/90" : ""}`}
          >
            {synopsis.text.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="text-xs text-muted">
            {synopsis.lang === "en" && "الوصف العربي قيد الإعداد، وهذا هو الوصف الرسمي بالإنجليزية. "}
            {synopsis.source ? `المصدر: ${synopsis.source}` : "المصدر: AniList"}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">لا يتوفر وصف لهذا العمل بعد.</p>
      )}
    </section>
  );
}
