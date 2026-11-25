import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { contentTerms, missingRequired, phraseOf } from "./query";
import type { MaterialDoc, SearchHit } from "./types";

const TEXT_EXT = new Set([".md", ".txt", ".markdown", ".csv"]);

function materialsRoot() {
  return process.env.MATERIALS_DIR
    ? path.resolve(process.env.MATERIALS_DIR)
    : path.join(process.cwd(), "materials");
}

function driveCacheRoot() {
  return path.join(materialsRoot(), ".drive-cache");
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".drive-cache") continue;
    if (entry.name === "README.md") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".drive-cache") {
        out.push(...(await walk(full)));
      } else {
        out.push(...(await walk(full)));
      }
    } else if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function toId(filePath: string, root: string) {
  return path
    .relative(root, filePath)
    .replace(/\\/g, "/")
    .replace(/\.(md|txt|markdown)$/i, "");
}

function snippetAround(content: string, terms: string[], size = 220): string {
  const lower = content.toLowerCase();
  let best = -1;
  let bestScore = -1;
  for (const term of terms) {
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(term, from);
      if (idx < 0) break;
      const window = lower.slice(Math.max(0, idx - 60), idx + term.length + 60);
      const colocated = terms.reduce((n, t) => n + (window.includes(t) ? 1 : 0), 0);
      if (colocated > bestScore) {
        bestScore = colocated;
        best = idx;
      }
      from = idx + term.length;
    }
  }
  if (best < 0) best = 0;
  const start = Math.max(0, best - 40);
  const slice = content.slice(start, start + size).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + slice + (start + size < content.length ? "…" : "");
}

export async function loadCorpus(): Promise<MaterialDoc[]> {
  const root = materialsRoot();
  const driveRoot = driveCacheRoot();
  const files = await walk(root);
  const docs: MaterialDoc[] = [];

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const parsed = matter(raw);
    const rel = path.relative(root, file);
    const fromDrive = rel.startsWith(".drive-cache" + path.sep) || rel.startsWith(".drive-cache/");
    const id = toId(file, fromDrive ? driveRoot : root);
    const data = parsed.data as Record<string, unknown>;
    const title =
      (typeof data.title === "string" && data.title) ||
      id.split("/").pop()?.replace(/[-_]/g, " ") ||
      id;
    const topic =
      (typeof data.topic === "string" && data.topic) ||
      (fromDrive ? "drive" : "general");
    const tags = Array.isArray(data.tags)
      ? data.tags.filter((t): t is string => typeof t === "string")
      : [];
    const stat = await fs.stat(file);
    docs.push({
      id: fromDrive ? `drive:${id}` : id,
      title,
      topic,
      tags,
      path: rel.replace(/\\/g, "/"),
      source: fromDrive ? "drive" : "local",
      content: parsed.content.trim(),
      updatedAt: stat.mtime.toISOString(),
    });
  }

  return docs.sort((a, b) => a.title.localeCompare(b.title));
}

export function searchCorpus(docs: MaterialDoc[], query: string, limit = 6): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return docs.slice(0, limit).map((doc) => ({
      doc,
      score: 0,
      snippet: doc.content.slice(0, 220).replace(/\s+/g, " ").trim() + "…",
    }));
  }

  const terms = contentTerms(query);
  const phrase = phraseOf(query);
  const scored: SearchHit[] = [];

  // Document frequency for light IDF — rare terms (engineer) beat ubiquitous ones (race).
  const df = new Map<string, number>();
  for (const term of terms) {
    let n = 0;
    for (const doc of docs) {
      const hay = `${doc.title}\n${doc.topic}\n${doc.tags.join(" ")}\n${doc.content}`.toLowerCase();
      if (hay.includes(term)) n += 1;
    }
    df.set(term, n);
  }

  for (const doc of docs) {
    const hay = `${doc.title}\n${doc.topic}\n${doc.tags.join(" ")}\n${doc.content}`.toLowerCase();
    const missing = missingRequired(hay, query);
    // Multi-word queries must contain the distinctive required terms.
    if (missing.length > 0) continue;

    let score = 0;
    if (phrase.length >= 4 && hay.includes(phrase)) score += 30;

    for (const term of terms) {
      if (!hay.includes(term)) continue;
      const docsWithTerm = df.get(term) || 1;
      const idf = Math.log(1 + docs.length / docsWithTerm);
      const titleHit = doc.title.toLowerCase().includes(term) ? 10 : 0;
      const topicHit = doc.topic.toLowerCase().includes(term) ? 6 : 0;
      const tagHit = doc.tags.some((t) => t.toLowerCase().includes(term)) ? 5 : 0;
      const count = Math.min(hay.split(term).length - 1, 6);
      score += (titleHit + topicHit + tagHit + count * 2) * idf;
    }

    if (score > 0) {
      scored.push({
        doc,
        score,
        snippet: snippetAround(doc.content, terms),
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function topicsFromDocs(docs: MaterialDoc[]): string[] {
  return [...new Set(docs.map((d) => d.topic))].sort();
}

export { materialsRoot, driveCacheRoot };
