"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MonitorPlay, RefreshCw, Send, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PresentCardView } from "@/components/present-card-view";
import { pushPresent } from "@/lib/present-channel";
import type { AskResult, DriveStatus, MaterialDoc, PresentCard } from "@/lib/types";
import { cn } from "@/lib/utils";

type MaterialMeta = Omit<MaterialDoc, "content">;

const QUICK = [
  "tire load sensitivity",
  "lateral weight transfer",
  "downforce vs drag",
  "Ackermann steering",
  "tractive force limit",
];

export function InstructorConsole() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [topics, setTopics] = useState<string[]>([]);
  const [materials, setMaterials] = useState<MaterialMeta[]>([]);
  const [drive, setDrive] = useState<DriveStatus | null>(null);
  const [result, setResult] = useState<AskResult | null>(null);
  const [presented, setPresented] = useState<PresentCard | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [pending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);

  async function refreshMaterials() {
    setLoadingMaterials(true);
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      setMaterials(data.materials ?? []);
      setTopics(data.topics ?? []);
      setDrive(data.drive ?? null);
    } catch {
      setError("Could not load materials.");
    } finally {
      setLoadingMaterials(false);
    }
  }

  useEffect(() => {
    void refreshMaterials();
    void fetch("/api/present", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { card: PresentCard | null; sessionNote?: string }) => {
        setPresented(data.card);
        if (data.sessionNote) setNote(data.sessionNote);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, topic }),
        });
        if (!res.ok) throw new Error("ask failed");
        const data = (await res.json()) as AskResult;
        setResult(data);
      } catch {
        setError("Lookup failed. Check the server and try again.");
      }
    });
  }

  async function present(card: PresentCard) {
    await pushPresent(card, note);
    setPresented(card);
  }

  async function clearDisplay() {
    await pushPresent(null, note);
    setPresented(null);
  }

  async function syncDrive() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/drive/sync", { method: "POST" });
      const data = (await res.json()) as DriveStatus;
      setDrive(data);
      await refreshMaterials();
    } catch {
      setError("Drive sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pit-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[var(--signal)]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--signal)]">
              Race vehicle classroom
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-[var(--aluminum)] md:text-6xl">
              Pitboard
            </h1>
            <p className="mt-3 max-w-xl text-base text-[var(--aluminum)]/70 md:text-lg">
              Introduce a topic, pull grounded notes from your allowed materials, then push a clean
              card to the projector tab while you talk.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/display"
              target="_blank"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-white/15 bg-white/5 text-[var(--aluminum)]",
              )}
            >
              <MonitorPlay className="mr-2 h-4 w-4" />
              Open projector tab
            </Link>
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-[var(--aluminum)]"
              onClick={() => void syncDrive()}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Drive
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-sm md:p-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTopic("all")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  topic === "all"
                    ? "bg-[var(--signal)] text-[#10140f]"
                    : "bg-white/5 text-[var(--aluminum)]/70 hover:bg-white/10",
                )}
              >
                all topics
              </button>
              {topics.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTopic(t)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    topic === t
                      ? "bg-[var(--signal)] text-[#10140f]"
                      : "bg-white/5 text-[var(--aluminum)]/70 hover:bg-white/10",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                ask(query);
              }}
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What should we put on the board? e.g. load transfer"
                className="h-12 border-white/15 bg-black/30 text-[var(--aluminum)] placeholder:text-[var(--aluminum)]/35"
              />
              <Button
                type="submit"
                disabled={pending}
                className="h-12 bg-[var(--signal)] text-[#10140f] hover:bg-[var(--signal-dim)]"
              >
                {pending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Pull up
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setQuery(q);
                    ask(q);
                  }}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left text-sm text-[var(--aluminum)]/75 transition hover:border-[var(--signal)]/40 hover:text-[var(--aluminum)]"
                >
                  {q}
                </button>
              ))}
            </div>

            {error ? (
              <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            {result ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-white/10 text-[var(--aluminum)] hover:bg-white/10">
                    {result.mode === "llm" ? "LLM refined" : "Retrieved from materials"}
                  </Badge>
                  {result.message ? (
                    <span className="text-sm text-[var(--aluminum)]/55">{result.message}</span>
                  ) : null}
                </div>
                <PresentCardView card={result.card} />
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => void present(result.card)}
                    className="bg-[var(--signal)] text-[#10140f] hover:bg-[var(--signal-dim)]"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Push to projector
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-transparent text-[var(--aluminum)]"
                    onClick={() => void clearDisplay()}
                  >
                    Clear display
                  </Button>
                </div>
                {result.hits.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--aluminum)]/45">
                      Sources consulted
                    </p>
                    {result.hits.map((hit) => (
                      <button
                        key={hit.doc.id}
                        type="button"
                        className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-[var(--signal)]/35"
                        onClick={() => {
                          const card = {
                            ...result.card,
                            id: `alt-${hit.doc.id}-${Date.now()}`,
                            title: hit.doc.title,
                            sourceTitle: hit.doc.title,
                            sourcePath: hit.doc.path,
                            topic: hit.doc.topic,
                          };
                          setResult({
                            ...result,
                            card: {
                              ...card,
                              bullets: result.card.bullets,
                            },
                          });
                          void fetch("/api/ask", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ query: hit.doc.title, topic: hit.doc.topic }),
                          })
                            .then((r) => r.json())
                            .then((data: AskResult) => setResult(data));
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-[var(--aluminum)]">{hit.doc.title}</span>
                          <span className="font-mono text-xs text-[var(--aluminum)]/40">
                            {hit.doc.source}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--aluminum)]/55">
                          {hit.snippet}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 px-4 py-10 text-center text-[var(--aluminum)]/50">
                Ask for a topic to stage the next board card.
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--aluminum)]/45">
                Materials
              </p>
              <p className="mt-2 text-sm text-[var(--aluminum)]/70">
                {loadingMaterials
                  ? "Loading…"
                  : `${materials.length} document(s) available${
                      drive?.mode === "sample" ? " (sample local corpus)" : ""
                    }`}
              </p>
              {drive ? (
                <p className="mt-3 text-sm text-[var(--aluminum)]/55">{drive.message}</p>
              ) : null}
              {drive?.lastSyncAt ? (
                <p className="mt-2 font-mono text-xs text-[var(--aluminum)]/40">
                  Last sync: {new Date(drive.lastSyncAt).toLocaleString()} · {drive.fileCount} file(s)
                </p>
              ) : null}
              <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                {materials.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm"
                  >
                    <button
                      type="button"
                      className="truncate text-left text-[var(--aluminum)]/85 hover:text-[var(--signal)]"
                      onClick={() => {
                        setQuery(m.title);
                        ask(m.title);
                      }}
                    >
                      {m.title}
                    </button>
                    <Badge variant="outline" className="shrink-0 border-white/10 text-[var(--aluminum)]/50">
                      {m.topic}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--aluminum)]/45">
                Session note
              </p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for yourself (not shown on projector)"
                className="mt-3 min-h-24 border-white/15 bg-black/30 text-[var(--aluminum)]"
              />
              <p className="mt-4 text-sm text-[var(--aluminum)]/55">
                Projector now showing:{" "}
                <span className="text-[var(--aluminum)]">
                  {presented ? presented.title : "nothing — push a card"}
                </span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
