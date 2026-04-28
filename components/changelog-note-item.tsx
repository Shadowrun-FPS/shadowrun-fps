"use client";

import { parseChangelogNote } from "@/lib/changelog-note";
import { sanitizeMarkdownHtml } from "@/lib/security";

/** Minimal list item — blue bullet, blue headline line, indented grey body (matches desktop launcher tone). */
export function ChangelogNoteItem({ note }: { note: string }) {
  const parsed = parseChangelogNote(note);

  if (parsed.type === "structured") {
    return (
      <li className="flex gap-3">
        <span
          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold leading-snug text-sky-400">
            {parsed.category}: {parsed.title}
          </p>
          <div
            className="pl-1 text-sm leading-relaxed text-muted-foreground sm:pl-4 [&_code]:rounded [&_code]:border [&_code]:border-white/10 [&_code]:bg-black/25 [&_code]:px-1.5 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.8125rem] [&_code]:text-sky-100/95 [&_em]:italic [&_strong]:font-semibold [&_strong]:text-foreground/95"
            dangerouslySetInnerHTML={{
              __html: sanitizeMarkdownHtml(parsed.description),
            }}
          />
        </div>
      </li>
    );
  }

  return (
    <li className="flex gap-3">
      <span
        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500"
        aria-hidden
      />
      <div
        className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground [&_code]:rounded [&_code]:border [&_code]:border-white/10 [&_code]:bg-black/25 [&_code]:px-1.5 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.8125rem] [&_code]:text-sky-100/95 [&_strong]:font-semibold [&_strong]:text-sky-400"
        dangerouslySetInnerHTML={{
          __html: sanitizeMarkdownHtml(parsed.raw),
        }}
      />
    </li>
  );
}
