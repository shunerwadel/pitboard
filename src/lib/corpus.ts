import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import type { MaterialDoc, SearchHit } from "./types";

const TEXT_EXT = new Set([".md", ".txt", ".markdown"]);

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
  let best = 0;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx >= 0) {
      best = idx;
      break;
    }
  }
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

  const terms = q.split(/\s+/).filter(Boolean);
  const scored: SearchHit[] = [];

  for (const doc of docs) {
    const hay = `${doc.title}\n${doc.topic}\n${doc.tags.join(" ")}\n${doc.content}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (!hay.includes(term)) continue;
      const titleHit = doc.title.toLowerCase().includes(term) ? 8 : 0;
      const topicHit = doc.topic.toLowerCase().includes(term) ? 5 : 0;
      const tagHit = doc.tags.some((t) => t.toLowerCase().includes(term)) ? 4 : 0;
      const count = hay.split(term).length - 1;
      score += titleHit + topicHit + tagHit + Math.min(count, 6);
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
