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
        "present-card relative overflow-hidden border border-[var(--line)] bg-white shadow-mea",
        large ? "rounded-md p-10 md:p-14" : "rounded-[var(--mea-radius)] p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--navy-deep)] via-[var(--red)] to-transparent" />
      <p
        className={cn(
          "font-display uppercase tracking-[0.14em] text-[var(--red)]",
          large ? "text-sm" : "text-xs",
        )}
      >
        {card.topic}
        {card.sectionTitle ? ` · ${card.sectionTitle}` : ""}
      </p>
      <h2
        className={cn(
          "brand-display mt-3 font-extrabold text-[var(--navy)]",
          large ? "text-4xl md:text-6xl leading-[1.05]" : "text-2xl",
        )}
      >
        {card.title}
      </h2>
      <ul className={cn("mt-6 space-y-3 text-[var(--text)]", large ? "text-xl md:text-2xl" : "text-base")}>
        {card.bullets.map((b) => (
          <li key={b} className="flex gap-3">
            <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--red)]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {card.formula ? (
        <pre
          className={cn(
            "mt-8 overflow-x-auto rounded-[var(--mea-radius)] border border-[var(--line)] bg-[var(--bg-soft)] px-4 py-3 font-mono text-[var(--navy)]",
            large ? "text-lg md:text-xl" : "text-sm",
          )}
        >
          {card.formula}
        </pre>
      ) : null}
      {card.cue ? (
        <p
          className={cn(
            "mt-8 border-l-2 border-[var(--red)] pl-4 text-[var(--slate)] italic",
            large ? "text-lg md:text-xl" : "text-sm",
          )}
        >
          {card.cue}
        </p>
      ) : null}
      {card.sourcePath ? (
        <p className={cn("mt-8 font-display uppercase tracking-[0.08em] text-[var(--slate-soft)]", large ? "text-sm" : "text-xs")}>
          Source: {card.sourceTitle} · {card.sourcePath}
        </p>
      ) : null}
    </article>
  );
}
