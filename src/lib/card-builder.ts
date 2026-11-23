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

function isDefinitionBullet(text: string): boolean {
  // e.g. "m — vehicle mass" or "ay - lateral acceleration"
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
  return paras.slice(0, max).map((p) => (p.length > 160 ? p.slice(0, 157) + "…" : p));
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

export function cardFromDoc(doc: MaterialDoc): PresentCard {
  return {
    id: `card-${doc.id}-${Date.now()}`,
    title: stripMarkdown(doc.title),
    bullets: extractBullets(doc.content),
    formula: extractFormula(doc.content),
    cue: extractCue(doc.content),
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
  const card = cardFromDoc(primary);
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
    .map(
      (h, i) =>
        `SOURCE ${i + 1}: ${h.doc.title} (${h.doc.path})\n${h.doc.content.slice(0, 1800)}`,
    )
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
              "You help an instructor present race-vehicle engineering. Use ONLY the provided sources. Return JSON: {title, bullets: string[3-5], formula?: string, cue?: string}. Plain text only — no Markdown. No invented equations.",
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
        title: stripMarkdown(parsed.title || primary.title),
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
