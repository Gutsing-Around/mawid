"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h2 className="font-display text-2xl">تعذّر تحميل جدول الحلقات</h2>
      <p className="text-muted">قد يكون AniList غير متاح مؤقتًا. حاول مرة أخرى بعد قليل.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="glow-box-signal cursor-pointer rounded-md bg-signal px-5 py-2 font-medium text-white"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
