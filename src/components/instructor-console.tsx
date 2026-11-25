"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ImageIcon,
  LineChart,
  Loader2,
  MonitorPlay,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChartView } from "@/components/chart-view";
import { PresentCardView } from "@/components/present-card-view";
import { pushStage } from "@/lib/stage-channel";
import type {
  ChatMessage,
  ChatMode,
  ClassSession,
  DriveStatus,
  NotebookDoc,
  PresentCard,
  StageMedia,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK = [
  "Driver-in-the-Loop DiL",
  "tire load sensitivity",
  "lateral weight transfer",
  "downforce vs drag",
];

export function InstructorConsole() {
  const [docs, setDocs] = useState<NotebookDoc[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topic, setTopic] = useState("all");
  const [drive, setDrive] = useState<DriveStatus | null>(null);
  const [aiStatus, setAiStatus] = useState<{
    provider: string;
    configured: boolean;
    message: string;
  } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ChatMode>("notes");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ClassSession | null>(null);
  const [pendingMedia, setPendingMedia] = useState<StageMedia | null>(null);
  const [pendingOutside, setPendingOutside] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [extending, setExtending] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function refreshNotebook() {
    setLoading(true);
    try {
      const [nb, st] = await Promise.all([
        fetch("/api/notebook").then((r) => r.json()),
        fetch("/api/stage").then((r) => r.json()),
      ]);
      setDocs(nb.docs ?? []);
      setTopics(nb.topics ?? []);
      setDrive(nb.drive ?? null);
      setAiStatus(nb.ai ?? null);
      setSession(st as ClassSession);
    } catch {
      setError("Could not load notebook / stage.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshNotebook();
  }, []);

  function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setError(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    startTransition(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, mode, topic }),
        });
        if (!res.ok) throw new Error("chat failed");
        const data = (await res.json()) as { message: ChatMessage };
        setMessages((m) => [...m, data.message]);
        if (data.message.outside) setPendingOutside(data.message.outside);
      } catch {
        setError("Chat failed. Check the server and try again.");
      }
    });
  }

  async function syncDrive() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/drive/sync", { method: "POST" });
      const data = (await res.json()) as DriveStatus;
      setDrive(data);
      if (/failed|missing|not found|denied|invalid/i.test(data.message)) {
        setError(data.message);
      }
      await refreshNotebook();
    } catch {
      setError("Drive sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function updateStage(patch: Partial<ClassSession>) {
    const next = await pushStage(patch);
    setSession(next);
  }

  async function pushDive(card: PresentCard) {
    await updateStage({ dive: card });
  }

  async function clearDive() {
    await updateStage({ dive: null, media: null });
    setPendingMedia(null);
  }

  async function setAnchor(id: string) {
    await updateStage({ activeAnchorId: id });
  }

  async function extend(action: "analogy" | "chart" | "image") {
    const topicText = (
      query.trim() ||
      messages.filter((m) => m.role === "user").at(-1)?.content ||
      "race vehicle topic"
    ).slice(0, 300);
    const context = (
      messages.filter((m) => m.role === "assistant").at(-1)?.content || ""
    ).slice(0, 3500);
    setExtending(true);
    setError(null);
    try {
      const res = await fetch("/api/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, topic: topicText, context }),
      });
      let data: {
        kind?: string;
        text?: string;
        media?: StageMedia;
        error?: string;
      };
      try {
        data = await res.json();
      } catch {
        setError(
          `AI extend failed (${res.status}). Is the dev server still running on this port?`,
        );
        return;
      }
      if (!res.ok || data.error) {
        setError(data.error || `AI extend failed (HTTP ${res.status}).`);
        return;
      }
      if (data.kind === "analogy" && data.text) {
        setPendingOutside(data.text);
      } else if (data.media) {
        setPendingMedia(data.media);
      } else {
        setError("AI extend returned an unexpected response. Try Chart again after git pull.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "network error";
      setError(`AI extend failed: ${message}`);
    } finally {
      setExtending(false);
    }
  }

  async function approveMedia() {
    if (!pendingMedia) return;
    try {
      await updateStage({ media: pendingMedia });
      setPendingMedia(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "push failed";
      setError(`Could not push media to projector: ${message}`);
    }
  }

  const activeAnchorId = session?.activeAnchorId;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pit-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-6 md:px-6">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] bg-white/80 px-4 py-4 shadow-mea backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-5">
          <div className="flex min-w-0 items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mea-logo.png"
              alt="Motorsports Engineering Academy"
              width={104}
              height={77}
              className="h-14 w-auto object-contain"
            />
            <div className="min-w-0">
              <p className="kicker">Instructor console</p>
              <h1 className="brand-display mt-1 text-3xl font-extrabold text-[var(--navy)] md:text-4xl">
                Pitboard
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--slate)] md:text-base">
                Notebook-grounded chat for deep dives, light visual anchors on the projector, and
                optional AI extend with approve-before-push.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/display" target="_blank" className={cn(buttonVariants({ variant: "outline" }))}>
              <MonitorPlay className="mr-2 h-4 w-4" />
              Open projector
            </Link>
            <Button variant="default" onClick={() => void syncDrive()} disabled={syncing}>
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Drive
            </Button>
          </div>
        </header>

        {error ? (
          <p className="rounded-[var(--mea-radius)] border border-[var(--red)]/30 bg-[var(--red)]/5 px-3 py-2 text-sm text-[var(--red)]">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.25fr_0.95fr]">
          {/* Notebook */}
          <section className="panel p-4">
            <p className="kicker text-[0.85rem]">Notebook</p>
            <p className="mt-1 text-sm text-[var(--slate)]">
              {loading ? "Loading…" : `${docs.length} docs`}
              {drive?.mode === "sample" ? " · sample corpus" : ""}
            </p>
            {drive ? (
              <p className="mt-2 text-xs text-[var(--slate-soft)]">{drive.message}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTopic("all")}
                className={cn(
                  "rounded-[var(--mea-radius)] px-2.5 py-1 text-[11px] font-medium",
                  topic === "all"
                    ? "bg-[var(--navy)] text-white"
                    : "bg-[var(--bg-mist)] text-[var(--navy-mid)] hover:bg-[var(--line)]",
                )}
              >
                all
              </button>
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={cn(
                    "rounded-[var(--mea-radius)] px-2.5 py-1 text-[11px] font-medium",
                    topic === t
                      ? "bg-[var(--navy)] text-white"
                      : "bg-[var(--bg-mist)] text-[var(--navy-mid)] hover:bg-[var(--line)]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <ul className="mt-3 max-h-[62vh] space-y-2 overflow-y-auto pr-1">
              {docs
                .filter((d) => topic === "all" || d.topic === topic)
                .map((doc) => (
                  <li key={doc.id} className="rounded-[var(--mea-radius)] border border-[var(--line)] bg-[var(--bg-soft)]">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                      onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                    >
                      <span className="truncate text-sm font-medium text-[var(--navy)]">{doc.title}</span>
                      <Badge variant="outline">{doc.topic}</Badge>
                    </button>
                    {expanded === doc.id ? (
                      <div className="space-y-1 border-t border-[var(--line)] px-2 py-2">
                        {doc.sections.map((sec, idx) => (
                          <button
                            key={`${doc.id}-${idx}-${sec.title}`}
                            type="button"
                            className="block w-full rounded-[var(--mea-radius)] px-2 py-1.5 text-left hover:bg-white"
                            onClick={() => {
                              setQuery(sec.title);
                              ask(sec.title);
                            }}
                          >
                            <p className="text-xs font-semibold text-[var(--red)]">{sec.title}</p>
                            <p className="line-clamp-2 text-[11px] text-[var(--slate-soft)]">
                              {sec.preview}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
            </ul>
          </section>

          {/* Chat */}
          <section className="panel flex min-h-[70vh] flex-col p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="kicker text-[0.85rem]">Teaching chat</p>
                {aiStatus ? (
                  <p
                    className={cn(
                      "mt-1 text-[11px]",
                      aiStatus.configured ? "text-[var(--navy-mid)]" : "text-amber-700",
                    )}
                  >
                    {aiStatus.configured
                      ? "OpenAI connected"
                      : "OpenAI key not loaded — add OPENAI_API_KEY to .env.local"}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1 rounded-[var(--mea-radius)] bg-[var(--bg-mist)] p-1">
                <button
                  type="button"
                  onClick={() => setMode("notes")}
                  className={cn(
                    "rounded-[var(--mea-radius)] px-3 py-1 text-xs font-medium",
                    mode === "notes"
                      ? "bg-[var(--red)] text-white"
                      : "text-[var(--navy-mid)] hover:bg-white",
                  )}
                >
                  Notes only
                </button>
                <button
                  type="button"
                  onClick={() => setMode("notes+extend")}
                  className={cn(
                    "rounded-[var(--mea-radius)] px-3 py-1 text-xs font-medium",
                    mode === "notes+extend"
                      ? "bg-[var(--red)] text-white"
                      : "text-[var(--navy-mid)] hover:bg-white",
                  )}
                >
                  Notes + AI extend
                </button>
              </div>
            </div>

            <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="rounded-[var(--mea-radius)] border border-dashed border-[var(--line)] bg-[var(--bg-soft)] px-4 py-8 text-center text-sm text-[var(--slate-soft)]">
                  Introduce a topic, then chat. Grounded answers cite your notebook; extend actions
                  stay labeled until you approve them for the projector.
                </div>
              ) : null}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-[var(--mea-radius)] px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "ml-8 bg-[var(--navy)] text-white"
                      : "mr-4 border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--text)]",
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.citations && msg.citations.length > 0 ? (
                    <div className="mt-2 space-y-1 border-t border-[var(--line)] pt-2">
                      <p className="font-display text-[10px] uppercase tracking-[0.14em] text-[var(--slate-soft)]">
                        Citations
                      </p>
                      {msg.citations.map((c) => (
                        <p
                          key={`${msg.id}-${c.docId}-${c.sectionTitle}`}
                          className="text-xs text-[var(--slate)]"
                        >
                          {c.title}
                          {c.sectionTitle ? ` · ${c.sectionTitle}` : ""} — {c.path}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {msg.outside ? (
                    <div className="mt-2 rounded-[var(--mea-radius)] border border-[var(--red)]/25 bg-[var(--red)]/5 px-2 py-2">
                      <p className="font-display text-[10px] uppercase tracking-[0.14em] text-[var(--red)]">
                        Outside AI
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--slate)]">
                        {msg.outside}
                      </p>
                    </div>
                  ) : null}
                  {msg.card ? (
                    <div className="mt-3 space-y-2">
                      <PresentCardView card={msg.card} />
                      <Button size="sm" onClick={() => void pushDive(msg.card!)}>
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Push deep dive
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="rounded-[var(--mea-radius)] border border-[var(--line)] bg-white px-2 py-1 text-xs text-[var(--navy-mid)] hover:border-[var(--red)] hover:text-[var(--red)]"
                  onClick={() => {
                    setQuery(q);
                    ask(q);
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                ask(query);
              }}
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask from your notes… e.g. DiL latency"
                className="h-11"
              />
              <Button type="submit" disabled={pending} className="h-11">
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={extending}
                onClick={() => void extend("analogy")}
              >
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                Analogy
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={extending}
                onClick={() => void extend("chart")}
              >
                <LineChart className="mr-1.5 h-3.5 w-3.5" />
                Chart
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={extending}
                onClick={() => void extend("image")}
              >
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                Diagram
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void clearDive()}>
                Clear dive / media
              </Button>
            </div>
          </section>

          {/* Class strip */}
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-[var(--mea-radius)] shadow-mea">
              <div className="relative overflow-hidden bg-gradient-to-r from-[var(--navy-deep)] to-[var(--navy)] px-4 py-3 text-white">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40"
                  style={{
                    background:
                      "repeating-linear-gradient(-45deg, rgba(255,255,255,0.08) 0 12px, rgba(200,24,24,0.55) 12px 24px, transparent 24px 36px)",
                  }}
                />
                <p className="relative font-display text-[0.85rem] uppercase tracking-[0.14em] text-white/70">
                  Today&apos;s anchors
                </p>
                <p className="relative mt-1 font-display text-lg font-bold uppercase tracking-wide text-[#ffd7d7]">
                  {session?.title ?? "Loading class…"}
                </p>
              </div>
              <ul className="space-y-2 bg-white p-3">
                {(session?.anchors ?? []).map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => void setAnchor(a.id)}
                      className={cn(
                        "w-full rounded-[var(--mea-radius)] border px-3 py-2 text-left transition",
                        activeAnchorId === a.id
                          ? "border-[var(--red)] bg-[var(--red)]/5"
                          : "border-[var(--line)] bg-[var(--bg-soft)] hover:border-[var(--navy-mid)]",
                      )}
                    >
                      <p className="text-sm font-medium text-[var(--navy)]">{a.title}</p>
                      <p className="text-xs text-[var(--slate-soft)]">{a.caption}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel p-4">
              <p className="kicker text-[0.85rem]">Approve tray</p>
              <p className="mt-1 text-xs text-[var(--slate-soft)]">
                Generated content stays here until you push it to the projector.
              </p>

              {pendingOutside ? (
                <div className="mt-3 rounded-[var(--mea-radius)] border border-[var(--red)]/25 bg-[var(--red)]/5 p-3">
                  <p className="font-display text-[10px] uppercase tracking-[0.14em] text-[var(--red)]">
                    Outside AI
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--slate)]">
                    {pendingOutside}
                  </p>
                  <Button size="sm" className="mt-2" onClick={() => setPendingOutside(null)}>
                    Dismiss
                  </Button>
                </div>
              ) : null}

              {pendingMedia?.kind === "chart" ? (
                <div className="mt-3 space-y-2">
                  <ChartView chart={pendingMedia.chart} />
                  <Button className="w-full" onClick={() => void approveMedia()}>
                    Approve &amp; push chart
                  </Button>
                </div>
              ) : null}

              {pendingMedia?.kind === "image" ? (
                <div className="mt-3 space-y-2">
                  <div className="overflow-hidden rounded-[var(--mea-radius)] border border-[var(--line)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pendingMedia.imageUrl} alt={pendingMedia.caption} className="w-full" />
                  </div>
                  <p className="text-xs text-[var(--slate-soft)]">{pendingMedia.caption}</p>
                  <Button className="w-full" onClick={() => void approveMedia()}>
                    Approve &amp; push diagram
                  </Button>
                </div>
              ) : null}

              {!pendingOutside && !pendingMedia ? (
                <p className="mt-3 text-sm text-[var(--slate-soft)]">Nothing pending.</p>
              ) : null}
            </div>

            <div className="panel p-4">
              <p className="kicker text-[0.85rem]">Session note</p>
              <Textarea
                placeholder="Private reminder for you (not on projector)"
                className="mt-2 min-h-20"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
