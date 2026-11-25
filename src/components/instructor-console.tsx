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
      <div className="pit-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-6 md:px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--signal)]">
              Hybrid classroom
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--aluminum)] md:text-5xl">
              Pitboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--aluminum)]/65 md:text-base">
              Notebook-grounded chat for deep dives, light visual anchors on the projector, and
              optional AI extend (analogies / charts / images) with approve-before-push.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/display"
              target="_blank"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-white/15 bg-white/5 text-[var(--aluminum)]",
              )}
            >
              <MonitorPlay className="mr-2 h-4 w-4" />
              Open projector
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

        {error ? (
          <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.25fr_0.95fr]">
          {/* Notebook */}
          <section className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--aluminum)]/45">
              Notebook
            </p>
            <p className="mt-1 text-sm text-[var(--aluminum)]/60">
              {loading ? "Loading…" : `${docs.length} docs`}
              {drive?.mode === "sample" ? " · sample corpus" : ""}
            </p>
            {drive ? (
              <p className="mt-2 text-xs text-[var(--aluminum)]/45">{drive.message}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTopic("all")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px]",
                  topic === "all"
                    ? "bg-[var(--signal)] text-[#10140f]"
                    : "bg-white/5 text-[var(--aluminum)]/70",
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
                    "rounded-full px-2.5 py-1 text-[11px]",
                    topic === t
                      ? "bg-[var(--signal)] text-[#10140f]"
                      : "bg-white/5 text-[var(--aluminum)]/70",
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
                  <li key={doc.id} className="rounded-xl border border-white/10 bg-white/[0.03]">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                      onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                    >
                      <span className="truncate text-sm text-[var(--aluminum)]">{doc.title}</span>
                      <Badge variant="outline" className="border-white/10 text-[var(--aluminum)]/45">
                        {doc.topic}
                      </Badge>
                    </button>
                    {expanded === doc.id ? (
                      <div className="space-y-1 border-t border-white/10 px-2 py-2">
                        {doc.sections.map((sec, idx) => (
                          <button
                            key={`${doc.id}-${idx}-${sec.title}`}
                            type="button"
                            className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/5"
                            onClick={() => {
                              setQuery(sec.title);
                              ask(sec.title);
                            }}
                          >
                            <p className="text-xs font-medium text-[var(--signal)]">{sec.title}</p>
                            <p className="line-clamp-2 text-[11px] text-[var(--aluminum)]/50">
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
          <section className="flex min-h-[70vh] flex-col rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--aluminum)]/45">
                Teaching chat
              </p>
              <div className="flex gap-1 rounded-full bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setMode("notes")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs",
                    mode === "notes"
                      ? "bg-[var(--signal)] text-[#10140f]"
                      : "text-[var(--aluminum)]/70",
                  )}
                >
                  Notes only
                </button>
                <button
                  type="button"
                  onClick={() => setMode("notes+extend")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs",
                    mode === "notes+extend"
                      ? "bg-[var(--signal)] text-[#10140f]"
                      : "text-[var(--aluminum)]/70",
                  )}
                >
                  Notes + AI extend
                </button>
              </div>
            </div>

            <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-[var(--aluminum)]/45">
                  Introduce a topic, then chat. Grounded answers cite your notebook; extend actions
                  stay labeled until you approve them for the projector.
                </div>
              ) : null}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "ml-8 bg-[var(--signal)]/15 text-[var(--aluminum)]"
                      : "mr-4 border border-white/10 bg-black/30 text-[var(--aluminum)]/90",
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.citations && msg.citations.length > 0 ? (
                    <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--aluminum)]/40">
                        Citations
                      </p>
                      {msg.citations.map((c) => (
                        <p key={`${msg.id}-${c.docId}-${c.sectionTitle}`} className="text-xs text-[var(--aluminum)]/55">
                          {c.title}
                          {c.sectionTitle ? ` · ${c.sectionTitle}` : ""} — {c.path}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {msg.outside ? (
                    <div className="mt-2 rounded-lg border border-[var(--signal)]/25 bg-[var(--signal)]/5 px-2 py-2">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--signal)]">
                        Outside AI
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--aluminum)]/75">
                        {msg.outside}
                      </p>
                    </div>
                  ) : null}
                  {msg.card ? (
                    <div className="mt-3 space-y-2">
                      <PresentCardView card={msg.card} />
                      <Button
                        size="sm"
                        className="bg-[var(--signal)] text-[#10140f] hover:bg-[var(--signal-dim)]"
                        onClick={() => void pushDive(msg.card!)}
                      >
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
                  className="rounded-md border border-white/10 px-2 py-1 text-xs text-[var(--aluminum)]/70 hover:border-[var(--signal)]/40"
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
                className="h-11 border-white/15 bg-black/30 text-[var(--aluminum)]"
              />
              <Button
                type="submit"
                disabled={pending}
                className="h-11 bg-[var(--signal)] text-[#10140f] hover:bg-[var(--signal-dim)]"
              >
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
                className="border-white/15 text-[var(--aluminum)]"
                disabled={extending}
                onClick={() => void extend("analogy")}
              >
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                Analogy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/15 text-[var(--aluminum)]"
                disabled={extending}
                onClick={() => void extend("chart")}
              >
                <LineChart className="mr-1.5 h-3.5 w-3.5" />
                Chart
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/15 text-[var(--aluminum)]"
                disabled={extending}
                onClick={() => void extend("image")}
              >
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                Diagram
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/15 text-[var(--aluminum)]"
                onClick={() => void clearDive()}
              >
                Clear dive / media
              </Button>
            </div>
          </section>

          {/* Class strip */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--aluminum)]/45">
                Today&apos;s anchors
              </p>
              <p className="mt-1 text-sm text-[var(--aluminum)]/60">
                {session?.title ?? "Loading class…"}
              </p>
              <ul className="mt-3 space-y-2">
                {(session?.anchors ?? []).map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => void setAnchor(a.id)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-left transition",
                        activeAnchorId === a.id
                          ? "border-[var(--signal)]/50 bg-[var(--signal)]/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20",
                      )}
                    >
                      <p className="text-sm text-[var(--aluminum)]">{a.title}</p>
                      <p className="text-xs text-[var(--aluminum)]/50">{a.caption}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--aluminum)]/45">
                Approve tray
              </p>
              <p className="mt-1 text-xs text-[var(--aluminum)]/50">
                Generated content stays here until you push it to the projector.
              </p>

              {pendingOutside ? (
                <div className="mt-3 rounded-lg border border-[var(--signal)]/25 bg-[var(--signal)]/5 p-3">
                  <p className="font-mono text-[10px] uppercase text-[var(--signal)]">Outside AI</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--aluminum)]/75">
                    {pendingOutside}
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 bg-[var(--signal)] text-[#10140f]"
                    onClick={() => setPendingOutside(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              ) : null}

              {pendingMedia?.kind === "chart" ? (
                <div className="mt-3 space-y-2">
                  <ChartView chart={pendingMedia.chart} />
                  <Button
                    className="w-full bg-[var(--signal)] text-[#10140f]"
                    onClick={() => void approveMedia()}
                  >
                    Approve &amp; push chart
                  </Button>
                </div>
              ) : null}

              {pendingMedia?.kind === "image" ? (
                <div className="mt-3 space-y-2">
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pendingMedia.imageUrl} alt={pendingMedia.caption} className="w-full" />
                  </div>
                  <p className="text-xs text-[var(--aluminum)]/55">{pendingMedia.caption}</p>
                  <Button
                    className="w-full bg-[var(--signal)] text-[#10140f]"
                    onClick={() => void approveMedia()}
                  >
                    Approve &amp; push diagram
                  </Button>
                </div>
              ) : null}

              {!pendingOutside && !pendingMedia ? (
                <p className="mt-3 text-sm text-[var(--aluminum)]/40">Nothing pending.</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--aluminum)]/45">
                Session note
              </p>
              <Textarea
                placeholder="Private reminder for you (not on projector)"
                className="mt-2 min-h-20 border-white/15 bg-black/30 text-[var(--aluminum)]"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
