import type { Metadata } from "next";
import Link from "next/link";
import { Mascot } from "@/components/Mascot";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  robots: { index: false, follow: true },
};

/** 404: the confused mascot and a way back to the schedule. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Mascot pose="confused" height={240} priority />
      <p className="glow-signal font-mono text-sm font-semibold text-signal">404</p>
      <h1 className="font-display text-3xl">هذه الصفحة غير موجودة</h1>
      <p className="text-muted">ربما تغيّر الرابط أو انتهى عرض هذا العمل. جدول الحلقات ينتظرك هنا:</p>
      <Link
        href="/"
        className="glow-box-signal mt-2 rounded-md bg-signal px-5 py-2 font-semibold text-white"
      >
        جدول الحلقات
      </Link>
    </main>
  );
}
