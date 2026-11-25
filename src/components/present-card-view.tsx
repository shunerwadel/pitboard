"use client";

import type { PresentCard } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PresentCardView({
  card,
  large = false,
  className,
}: {
  card: PresentCard;
  large?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "present-card relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(18,22,28,0.88)] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md",
        large ? "p-10 md:p-14" : "p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--signal)] via-[var(--signal-dim)] to-transparent" />
      <p
        className={cn(
          "font-mono uppercase tracking-[0.22em] text-[var(--signal)]",
          large ? "text-sm" : "text-xs",
        )}
      >
        {card.topic}
        {card.sectionTitle ? ` · ${card.sectionTitle}` : ""}
      </p>
      <h2
        className={cn(
          "mt-3 font-[family-name:var(--font-display)] font-semibold tracking-tight text-[var(--aluminum)]",
          large ? "text-4xl md:text-6xl leading-[1.05]" : "text-2xl",
        )}
      >
        {card.title}
      </h2>
      <ul className={cn("mt-6 space-y-3 text-[var(--aluminum)]/90", large ? "text-xl md:text-2xl" : "text-base")}>
        {card.bullets.map((b) => (
          <li key={b} className="flex gap-3">
            <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--signal)]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {card.formula ? (
        <pre
          className={cn(
            "mt-8 overflow-x-auto rounded-xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-[var(--signal)]",
            large ? "text-lg md:text-xl" : "text-sm",
          )}
        >
          {card.formula}
        </pre>
      ) : null}
      {card.cue ? (
        <p
          className={cn(
            "mt-8 border-l-2 border-[var(--signal)] pl-4 text-[var(--aluminum)]/75 italic",
            large ? "text-lg md:text-xl" : "text-sm",
          )}
        >
          {card.cue}
        </p>
      ) : null}
      {card.sourcePath ? (
        <p className={cn("mt-8 font-mono text-[var(--aluminum)]/45", large ? "text-sm" : "text-xs")}>
          Source: {card.sourceTitle} · {card.sourcePath}
        </p>
      ) : null}
    </article>
  );
}
