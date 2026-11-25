#!/usr/bin/env npx tsx
/**
 * Split outline-style instructor notes into one markdown file per Heading 3.
 *
 * Matches both nested list H3s (`* ### Title`) and standalone `### Title`.
 * Writes slug-named files into an output directory (default: materials/).
 *
 * Usage:
 *   npx --yes tsx scripts/split-outline-notes.ts <input.md> [outputDir]
 *
 * Examples (Windows PowerShell from repo root):
 *   npx --yes tsx scripts/split-outline-notes.ts .\notes\outline.md .\materials
 *   npm run split:notes -- C:\path\to\notes.md
 */

import * as fs from "node:fs";
import * as path from "node:path";

/** Nested `* ### Title` or standalone `### Title` (any leading whitespace). */
const H3_RE = /^(\s*(?:\*\s+)?)(###)\s+(.+?)\s*$/;

export type OutlineSection = {
  title: string;
  /** Raw heading line as it appeared in the source */
  headingLine: string;
  /** Body lines after the heading, until the next H3 */
  bodyLines: string[];
  startLine: number; // 1-based
};

export function slugify(title: string): string {
  const plain = title
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return plain || "section";
}

export function parseH3Sections(markdown: string): OutlineSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: OutlineSection[] = [];
  let current: OutlineSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(H3_RE);
    if (match) {
      if (current) sections.push(current);
      current = {
        title: match[3].trim(),
        headingLine: line,
        bodyLines: [],
        startLine: i + 1,
      };
      continue;
    }
    if (current) current.bodyLines.push(line);
  }
  if (current) sections.push(current);
  return sections;
}

function trimTrailingBlank(lines: string[]): string[] {
  const out = [...lines];
  while (out.length > 0 && out[out.length - 1].trim() === "") out.pop();
  return out;
}

/** Dedent body relative to the shallowest non-empty indent in the block. */
function normalizeBody(bodyLines: string[]): string {
  const trimmed = trimTrailingBlank(bodyLines);
  const indents = trimmed
    .filter((l) => l.trim().length > 0)
    .map((l) => (l.match(/^[ \t]*/)?.[0].length ?? 0));
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;
  return trimmed
    .map((l) => (l.trim().length === 0 ? "" : l.slice(minIndent)))
    .join("\n")
    .trim();
}

export function sectionMarkdown(section: OutlineSection): string {
  const body = normalizeBody(section.bodyLines);
  const parts = [`### ${section.title}`, ""];
  if (body) parts.push(body, "");
  return parts.join("\n");
}

export type WriteResult = {
  title: string;
  slug: string;
  filename: string;
  path: string;
  bytes: number;
};

export function writeSections(
  sections: OutlineSection[],
  outputDir: string,
): WriteResult[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const used = new Map<string, number>();
  const results: WriteResult[] = [];

  for (const section of sections) {
    const base = slugify(section.title);
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    const slug = n === 1 ? base : `${base}-${n}`;
    const filename = `${slug}.md`;
    const outPath = path.join(outputDir, filename);
    const content = sectionMarkdown(section);
    fs.writeFileSync(outPath, content, "utf8");
    results.push({
      title: section.title,
      slug,
      filename,
      path: outPath,
      bytes: Buffer.byteLength(content, "utf8"),
    });
  }
  return results;
}

function printHelp(): void {
  console.log(`Usage: npx --yes tsx scripts/split-outline-notes.ts <input.md> [outputDir]

Split outline notes at every Heading 3 (* ### or ###) into one .md file each.

Defaults:
  outputDir = materials/ (relative to cwd)

Also:
  npm run split:notes -- <input.md> [outputDir]`);
}

function main(argv: string[]): number {
  const args = argv.filter((a) => a !== "--");
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printHelp();
    return args.length === 0 ? 1 : 0;
  }

  const inputPath = path.resolve(args[0]);
  const outputDir = path.resolve(args[1] ?? "materials");

  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    return 1;
  }

  const markdown = fs.readFileSync(inputPath, "utf8");
  const sections = parseH3Sections(markdown);
  if (sections.length === 0) {
    console.error("No Heading 3 sections (* ### or ###) found.");
    return 1;
  }

  const results = writeSections(sections, outputDir);
  console.log(
    `Split ${results.length} H3 section(s) from ${path.relative(process.cwd(), inputPath) || inputPath}`,
  );
  console.log(`Wrote to ${path.relative(process.cwd(), outputDir) || outputDir}:`);
  for (const r of results) {
    console.log(`  - ${r.filename}  (${r.title})`);
  }
  return 0;
}

const isDirectRun = process.argv[1]
  ? path.resolve(process.argv[1]).includes(`${path.sep}split-outline-notes`)
  : false;
if (isDirectRun) {
  process.exit(main(process.argv.slice(2)));
}
