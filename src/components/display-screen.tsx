"use client";

import { useEffect, useState } from "react";
import { ChartView } from "@/components/chart-view";
import { PresentCardView } from "@/components/present-card-view";
import { readLocalStage, STAGE_CHANNEL, STAGE_STORAGE_KEY } from "@/lib/stage-channel";
import type { ClassSession } from "@/lib/types";
import { sampleClassSession } from "@/lib/sample-class";

export function DisplayScreen() {
  const [session, setSession] = useState<ClassSession>(sampleClassSession());

  useEffect(() => {
    const local = readLocalStage();
    if (local) setSession(local);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(STAGE_CHANNEL);
      bc.onmessage = (event) => setSession(event.data as ClassSession);
    } catch {
      bc = null;
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STAGE_STORAGE_KEY || !e.newValue) return;
      try {
        setSession(JSON.parse(e.newValue) as ClassSession);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);

    const poll = async () => {
      try {
        const res = await fetch("/api/stage", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ClassSession;
        setSession((prev) => (data.updatedAt >= prev.updatedAt ? data : prev));
      } catch {
        /* ignore */
      }
    };
    void poll();
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const id = window.setInterval(poll, 1200);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.clearInterval(id);
      bc?.close();
    };
  }, []);

  const active =
    session.anchors.find((a) => a.id === session.activeAnchorId) ?? session.anchors[0] ?? null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0b0e12] text-[var(--aluminum)]">
      <div className="pit-grid pointer-events-none absolute inset-0 opacity-30" />
      <header className="relative z-10 flex items-center justify-between px-8 py-5 md:px-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--signal)]">Pitboard</p>
          <p className="mt-1 text-sm text-[var(--aluminum)]/50">{session.title}</p>
        </div>
        <p className="font-mono text-xs text-[var(--aluminum)]/35">
          {session.updatedAt ? new Date(session.updatedAt).toLocaleTimeString() : "waiting"}
        </p>
      </header>

      <main className="relative z-10 grid flex-1 gap-6 px-6 pb-10 md:grid-cols-[1.25fr_0.9fr] md:px-10">
        <section className="flex min-h-[50vh] flex-col justify-center">
          {active ? (
            <div className="animate-in fade-in duration-500">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--signal)]">
                Anchor
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
                {active.title}
              </h1>
              <p className="mt-2 max-w-2xl text-lg text-[var(--aluminum)]/60">{active.caption}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.imageUrl}
                alt={active.title}
                className="mt-6 w-full rounded-2xl border border-white/10 object-cover shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
              />
            </div>
          ) : (
            <div className="text-center text-[var(--aluminum)]/50">No anchor selected</div>
          )}
        </section>

        <section className="flex flex-col justify-center gap-4">
          {session.dive ? (
            <div key={session.dive.id} className="animate-in fade-in zoom-in-95 duration-500">
              <PresentCardView card={session.dive} large />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 px-6 py-10 text-[var(--aluminum)]/50">
              Deep dive standing by — push from the instructor console when you want detail.
            </div>
          )}

          {session.media?.kind === "chart" ? (
            <ChartView chart={session.media.chart} large />
          ) : null}
          {session.media?.kind === "image" ? (
            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div className="flex items-center justify-between px-4 pt-3">
                <figcaption className="text-sm text-[var(--aluminum)]/70">
                  {session.media.caption}
                </figcaption>
                <span className="rounded-full border border-[var(--signal)]/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--signal)]">
                  {session.media.label}
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={session.media.imageUrl} alt={session.media.caption} className="mt-2 w-full" />
            </figure>
          ) : null}
        </section>
      </main>
    </div>
  );
}
