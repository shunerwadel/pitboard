import type { AskResult, MaterialDoc, PresentCard, SearchHit } from "./types";

/** Strip common Markdown markers for projector-safe plain text. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/```\w*\n?/g, "").replace(/```/g, "").trim(),
    )
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function queryTerms(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length >= 2);
}

function isDefinitionBullet(text: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]*\s+[—–-]\s+\S/.test(text) && text.length < 60;
}

function extractBullets(content: string, max = 4): string[] {
  const lines = content.split(/\n/);
  const bullets: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s+(.+)/);
    if (m) {
      const text = stripMarkdown(m[1]);
      if (text.length > 8 && !isDefinitionBullet(text)) bullets.push(text);
    }
    if (bullets.length >= max) break;
  }
  if (bullets.length >= 2) return bullets;

  const paras = content
    .split(/\n{2,}/)
    .map((p) => stripMarkdown(p.replace(/^#+\s+/gm, "")))
    .filter((p) => p.length > 40 && !p.startsWith("```"));
  return paras.slice(0, max).map((p) => (p.length > 180 ? p.slice(0, 177) + "…" : p));
}

function extractFormula(content: string): string | undefined {
  const fence = content.match(/```(?:\n)?([\s\S]*?)```/);
  if (fence) {
    const body = fence[1].trim();
    if (body.length < 180) return body;
  }
  const inline = content.match(/`([^`]{3,80})`/);
  return inline?.[1];
}

function extractCue(content: string): string | undefined {
  const cueHeading = content.match(
    /##\s*(Classroom cue|Talk track)\s*\n+([\s\S]*?)(?=\n##\s|\n#\s|$)/i,
  );
  if (cueHeading) {
    return stripMarkdown(cueHeading[2].replace(/^Ask:\s*/i, "")).slice(0, 220);
  }
  return undefined;
}

export type DocSection = {
  title: string;
  level: number;
  body: string;
  /** title + body, used for scoring / extraction */
  text: string;
};

/** Split markdown into heading sections (plus a preamble if present). */
export function splitIntoSections(content: string): DocSection[] {
  const lines = content.split(/\n/);
  const sections: DocSection[] = [];
  let title = "";
  let level = 0;
  let bodyLines: string[] = [];

  const push = () => {
    const body = bodyLines.join("\n").trim();
    if (!title && !body) return;
    sections.push({
      title,
      level,
      body,
      text: [title, body].filter(Boolean).join("\n\n"),
    });
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)\s*$/);
    if (heading) {
      push();
      title = heading[2].trim();
      level = heading[1].length;
      bodyLines = [];
    } else {
      bodyLines.push(line);
    }
  }
  push();
  return sections.length > 0 ? sections : [{ title: "", level: 0, body: content, text: content }];
}

function scoreText(text: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (!lower.includes(term)) continue;
    const count = lower.split(term).length - 1;
    score += Math.min(count, 8) * 2;
    // Prefer denser / earlier mentions slightly.
    const idx = lower.indexOf(term);
    if (idx >= 0 && idx < 120) score += 3;
  }
  return score;
}

function windowAroundMatch(content: string, terms: string[], radius = 900): string {
  if (!content.trim()) return content;
  const lower = content.toLowerCase();
  let best = 0;
  let bestScore = -1;
  for (const term of terms) {
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(term, from);
      if (idx < 0) break;
      const local = lower.slice(Math.max(0, idx - 80), idx + term.length + 80);
      const score = scoreText(local, terms) + (idx < 200 ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = idx;
      }
      from = idx + term.length;
    }
  }
  if (bestScore < 0) return content.slice(0, radius * 2);

  const start = Math.max(0, best - Math.floor(radius * 0.35));
  const end = Math.min(content.length, best + radius);
  // Snap to nearby paragraph boundaries when possible.
  const snappedStart = content.lastIndexOf("\n\n", start);
  const snappedEnd = content.indexOf("\n\n", end);
  const a = snappedStart >= 0 && start - snappedStart < 200 ? snappedStart + 2 : start;
  const b = snappedEnd >= 0 && snappedEnd - end < 200 ? snappedEnd : end;
  return content.slice(a, b).trim();
}

/**
 * Pick the document region that best matches the instructor query:
 * prefer a markdown section whose heading/body matches; otherwise a window
 * around the strongest term hit.
 */
export function focusContentForQuery(
  content: string,
  query: string,
): { title: string; body: string; focused: string } {
  const terms = queryTerms(query);
  const sections = splitIntoSections(content);

  if (terms.length === 0) {
    const first = sections[0];
    return {
      title: first?.title || "",
      body: first?.body || content,
      focused: first?.text || content,
    };
  }

  let best = sections[0];
  let bestScore = -1;
  for (const section of sections) {
    const titleLower = section.title.toLowerCase();
    let score = scoreText(section.body, terms);
    for (const term of terms) {
      if (titleLower === term) score += 40;
      else if (titleLower.includes(term)) score += 24;
    }
    // Prefer tighter topical sections over huge catch-alls when scores tie-ish.
    if (section.body.length > 0 && section.body.length < 2500) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = section;
    }
  }

  // If headings don't help (flat notes / weak section scores), use a match window.
  if (bestScore < 4) {
    const focused = windowAroundMatch(content, terms);
    const nearbyHeading =
      [...content.slice(0, content.indexOf(focused) + 1).matchAll(/^#{1,6}\s+(.+)$/gm)].pop()?.[1] ||
      "";
    return {
      title: nearbyHeading.trim(),
      body: focused,
      focused,
    };
  }

  return {
    title: best.title,
    body: best.body || best.text,
    focused: best.text,
  };
}

export function cardFromDoc(doc: MaterialDoc, query = ""): PresentCard {
  const focus = query.trim()
    ? focusContentForQuery(doc.content, query)
    : { title: "", body: doc.content, focused: doc.content };

  const sourceRegion = focus.body || focus.focused || doc.content;
  const cardTitle = focus.title
    ? stripMarkdown(focus.title)
    : stripMarkdown(doc.title);

  return {
    id: `card-${doc.id}-${Date.now()}`,
    title: cardTitle,
    bullets: extractBullets(sourceRegion),
    formula: extractFormula(sourceRegion) || extractFormula(doc.content),
    cue: extractCue(sourceRegion) || extractCue(doc.content),
    sourceTitle: stripMarkdown(doc.title),
    sourcePath: doc.path,
    topic: doc.topic,
  };
}

export function buildAskResult(query: string, hits: SearchHit[]): AskResult {
  if (hits.length === 0) {
    return {
      card: {
        id: `empty-${Date.now()}`,
        title: "Nothing in the allowed materials",
        bullets: [
          `No notes matched “${query.trim()}”.`,
          "Try a topic pack (tires, aero, dynamics) or sync your Drive folder.",
          "I will not invent race-engineering facts outside your corpus.",
        ],
        sourceTitle: "—",
        sourcePath: "",
        topic: "none",
      },
      hits: [],
      mode: "retrieved",
      message: "No matching materials.",
    };
  }

  const primary = hits[0].doc;
  const card = cardFromDoc(primary, query);
  if (hits.length > 1) {
    const extra = hits.slice(1, 3).map((h) => `Also related: ${h.doc.title}`);
    card.bullets = [...card.bullets.slice(0, 3), ...extra].slice(0, 5);
  }
  return { card, hits, mode: "retrieved" };
}

export async function maybeRefineWithLlm(
  query: string,
  base: AskResult,
): Promise<AskResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || base.hits.length === 0) return base;

  const context = base.hits
    .slice(0, 3)
    .map((h, i) => {
      const focus = focusContentForQuery(h.doc.content, query);
      const excerpt = (focus.focused || h.doc.content).slice(0, 2200);
      return `SOURCE ${i + 1}: ${h.doc.title} (${h.doc.path})${focus.title ? ` · section: ${focus.title}` : ""}\n${excerpt}`;
    })
    .join("\n\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You help an instructor present race-vehicle engineering. Use ONLY the provided sources, focusing on the section most relevant to the instructor request. Return JSON: {title, bullets: string[3-5], formula?: string, cue?: string}. Plain text only — no Markdown. No invented equations. Title should name the specific topic asked about, not the whole document.",
          },
          {
            role: "user",
            content: `Instructor request: ${query}\n\n${context}`,
          },
        ],
      }),
    });
    if (!res.ok) return base;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return base;
    const parsed = JSON.parse(raw) as {
      title?: string;
      bullets?: string[];
      formula?: string;
      cue?: string;
    };
    const primary = base.hits[0].doc;
    return {
      ...base,
      mode: "llm",
      card: {
        id: `llm-${Date.now()}`,
        title: stripMarkdown(parsed.title || base.card.title || primary.title),
        bullets: Array.isArray(parsed.bullets)
          ? parsed.bullets
              .filter((b): b is string => typeof b === "string")
              .map(stripMarkdown)
              .slice(0, 5)
          : base.card.bullets,
        formula: parsed.formula ? stripMarkdown(parsed.formula) : base.card.formula,
        cue: parsed.cue ? stripMarkdown(parsed.cue) : base.card.cue,
        sourceTitle: primary.title,
        sourcePath: primary.path,
        topic: primary.topic,
      },
    };
  } catch {
    return base;
  }
}
