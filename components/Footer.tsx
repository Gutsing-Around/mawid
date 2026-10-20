import { SITE_SHARE_TEXT } from "@/lib/share";
import { ShareButton } from "./ShareButton";
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
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="text-ink/80">أعجبك الموقع؟ شاركه مع أصدقائك.</span>
        <ShareButton path="/" text={SITE_SHARE_TEXT} label="شارك الموقع" opens="up" />
      </div>
    </footer>
  );
}
