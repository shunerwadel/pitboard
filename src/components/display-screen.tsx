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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--navy-deep)] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 88% 8%, rgba(200, 24, 24, 0.18), transparent 28%), radial-gradient(circle at 8% 18%, rgba(255,255,255,0.06), transparent 32%), linear-gradient(135deg, var(--navy-deep), var(--navy-mid))",
        }}
      />
      <div className="pit-grid-dark pointer-events-none absolute inset-0 opacity-40" />
      <header className="relative z-10 flex items-center justify-between px-8 py-5 md:px-12">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mea-logo.png"
            alt="Motorsports Engineering Academy"
            width={96}
            height={71}
            className="h-12 w-auto rounded-[var(--mea-radius)] bg-white/95 object-contain p-1 shadow-mea"
          />
          <div>
            <p className="font-display text-xs uppercase tracking-[0.22em] text-[#ffb4b4]">
              Pitboard · Projector
            </p>
            <p className="mt-1 text-sm text-white/55">{session.title}</p>
          </div>
        </div>
        <p className="font-display text-xs uppercase tracking-[0.14em] text-white/40">
          {session.updatedAt ? new Date(session.updatedAt).toLocaleTimeString() : "waiting"}
        </p>
      </header>

      <main className="relative z-10 grid flex-1 gap-6 px-6 pb-10 md:grid-cols-[1.25fr_0.9fr] md:px-10">
        <section className="flex min-h-[50vh] flex-col justify-center">
          {active ? (
            <div className="animate-in fade-in duration-500">
              <p className="font-display text-xs uppercase tracking-[0.22em] text-[#ffb4b4]">
                Anchor
              </p>
              <h1 className="brand-display mt-2 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                {active.title}
              </h1>
              <p className="mt-2 max-w-2xl text-lg text-white/65">{active.caption}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.imageUrl}
                alt={active.title}
                className="mt-6 w-full rounded-md border border-white/15 object-cover shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
              />
            </div>
          ) : (
            <div className="text-center text-white/50">No anchor selected</div>
          )}
        </section>

        <section className="flex flex-col justify-center gap-4">
          {session.dive ? (
            <div key={session.dive.id} className="animate-in fade-in zoom-in-95 duration-500">
              <PresentCardView card={session.dive} large />
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-white/20 bg-white/5 px-6 py-10 text-white/50">
              Deep dive standing by — push from the instructor console when you want detail.
            </div>
          )}

          {session.media?.kind === "chart" ? (
            <ChartView chart={session.media.chart} large />
          ) : null}
          {session.media?.kind === "image" ? (
            <figure className="overflow-hidden rounded-md border border-white/15 bg-white/5">
              <div className="flex items-center justify-between px-4 pt-3">
                <figcaption className="text-sm text-white/70">
                  {session.media.caption}
                </figcaption>
                <span className="rounded-[var(--mea-radius)] border border-[#ffb4b4]/40 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.14em] text-[#ffb4b4]">
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
