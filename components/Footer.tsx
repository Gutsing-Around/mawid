import { TimeZoneNote } from "./time/TimeZoneNote";

export function Footer() {
  return (
    <footer className="flex flex-col gap-1 border-t border-line pt-3.5 text-[12.5px] text-muted">
      <p>
        موعد الحلقة يجمع مواعيد عرض حلقات الأنمي الجديدة ويحوّلها إلى توقيتك المحلي، مع روابط
        المشاهدة القانونية فقط.
      </p>
      <TimeZoneNote />
      <span>روابط المنصات الرسمية من AniList، وقد يختلف توفّر العمل حسب منطقتك.</span>
      <span>
        مصدر البيانات:{" "}
        <a
          href="https://anilist.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          AniList
        </a>
      </span>
    </footer>
  );
}
