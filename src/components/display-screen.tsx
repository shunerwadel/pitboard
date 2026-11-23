"use client";

import { useEffect, useState } from "react";
import {
  PRESENT_CHANNEL,
  PRESENT_STORAGE_KEY,
  readLocalPresent,
} from "@/lib/present-channel";
import type { PresentState } from "@/lib/types";
import { PresentCardView } from "@/components/present-card-view";

export function DisplayScreen() {
  const [state, setState] = useState<PresentState>({
    card: null,
    updatedAt: 0,
    sessionNote: "",
  });

  useEffect(() => {
    const local = readLocalPresent();
    if (local) setState(local);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(PRESENT_CHANNEL);
      bc.onmessage = (event) => {
        setState(event.data as PresentState);
      };
    } catch {
      bc = null;
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== PRESENT_STORAGE_KEY || !e.newValue) return;
      try {
        setState(JSON.parse(e.newValue) as PresentState);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);

    const poll = async () => {
      try {
        const res = await fetch("/api/present", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as PresentState;
        setState((prev) => (data.updatedAt >= prev.updatedAt ? data : prev));
      } catch {
        /* ignore */
      }
    };
    void poll();
    const id = window.setInterval(poll, 1200);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(id);
      bc?.close();
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0b0e12] text-[var(--aluminum)]">
      <div className="pit-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,255,92,0.12),transparent_55%)]" />

      <header className="relative z-10 flex items-center justify-between px-8 py-6 md:px-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--signal)]">Pitboard</p>
          <p className="mt-1 text-sm text-[var(--aluminum)]/50">Projector display</p>
        </div>
        <p className="font-mono text-xs text-[var(--aluminum)]/35">
          {state.updatedAt ? new Date(state.updatedAt).toLocaleTimeString() : "waiting"}
        </p>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16 md:px-12">
        {state.card ? (
          <div key={state.card.id} className="w-full max-w-5xl animate-in fade-in zoom-in-95 duration-500">
            <PresentCardView card={state.card} large />
          </div>
        ) : (
          <div className="max-w-xl text-center">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
              Standing by
            </h1>
            <p className="mt-4 text-lg text-[var(--aluminum)]/55">
              From the instructor console, pull up a topic and press{" "}
              <span className="text-[var(--signal)]">Push to projector</span>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
