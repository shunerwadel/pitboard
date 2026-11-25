import { cardFromDoc, focusContentForQuery, stripMarkdown } from "./card-builder";
import { searchCorpus } from "./corpus";
import type {
  ChatMessage,
  ChatMode,
  Citation,
  MaterialDoc,
  PresentCard,
} from "./types";

function buildCitations(docs: MaterialDoc[], query: string): Citation[] {
  return searchCorpus(docs, query, 4).map((hit) => {
    const focus = focusContentForQuery(hit.doc.content, query);
    return {
      docId: hit.doc.id,
      title: hit.doc.title,
      path: hit.doc.path,
      sectionTitle: focus.title || undefined,
      snippet: hit.snippet,
    };
  });
}

function groundedAnswer(query: string, docs: MaterialDoc[]): {
  content: string;
  card: PresentCard;
  citations: Citation[];
} {
  const hits = searchCorpus(docs, query, 4);
  const citations = buildCitations(docs, query);
  if (hits.length === 0) {
    return {
      content: `I don’t have that in the allowed materials for “${query.trim()}”. Try another phrasing or pin a notebook section for context.`,
      card: {
        id: `empty-${Date.now()}`,
        title: "Nothing in the allowed materials",
        bullets: [
          `No notes matched “${query.trim()}”.`,
          "Browse the notebook and pin a section, or sync Drive.",
        ],
        sourceTitle: "—",
        sourcePath: "",
        topic: "none",
      },
      citations: [],
    };
  }

  const primary = hits[0].doc;
  const focus = focusContentForQuery(primary.content, query);
  const card = cardFromDoc(primary, query);
  const lines = [
    `From your notes${focus.title ? ` · ${focus.title}` : ""}:`,
    ...card.bullets.map((b) => `• ${b}`),
  ];
  if (card.formula) lines.push(`Formula: ${card.formula}`);
  if (card.cue) lines.push(`Talk cue: ${card.cue}`);

  return {
    content: lines.join("\n"),
    card: {
      ...card,
      sectionTitle: focus.title || undefined,
    },
    citations,
  };
}

async function outsideAnalogies(
  query: string,
  grounded: string,
): Promise<string | undefined> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return [
      "Example analogy (offline fallback): treat tire load sensitivity like a shared Wi‑Fi router — stacking more devices on one channel doesn’t scale linearly; spreading load across channels usually raises total throughput.",
      "Media idea: sketch a diminishing-returns curve next to a balanced left/right load cartoon.",
      "Add OPENAI_API_KEY for richer live analogies.",
    ].join("\n");
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "You help a race-vehicle engineering instructor. Given grounded notes, suggest 2-3 outside analogies or media ideas. Do NOT invent formulas. Plain text bullets only. Label nothing as coming from the notes.",
          },
          {
            role: "user",
            content: `Topic: ${query}\n\nGrounded notes excerpt:\n${grounded.slice(0, 1800)}`,
          },
        ],
      }),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? stripMarkdown(text) : undefined;
  } catch {
    return undefined;
  }
}

export async function runTeachingChat(opts: {
  query: string;
  mode: ChatMode;
  docs: MaterialDoc[];
}): Promise<ChatMessage> {
  const grounded = groundedAnswer(opts.query, opts.docs);
  let outside: string | undefined;
  if (opts.mode === "notes+extend") {
    outside = await outsideAnalogies(opts.query, grounded.content);
  }

  return {
    id: `msg-${Date.now()}`,
    role: "assistant",
    content: grounded.content,
    citations: grounded.citations,
    outside,
    card: grounded.card,
    createdAt: Date.now(),
  };
}
