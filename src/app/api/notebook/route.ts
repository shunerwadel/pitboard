import { NextResponse } from "next/server";
import { splitIntoSections } from "@/lib/card-builder";
import { loadCorpus, topicsFromDocs } from "@/lib/corpus";
import { getDriveStatus } from "@/lib/drive";
import type { NotebookDoc } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const docs = await loadCorpus();
  const notebook: NotebookDoc[] = docs.map((doc) => {
    const { content, ...meta } = doc;
    const sections = splitIntoSections(content).map((s) => ({
      title: s.title || meta.title,
      level: s.level || 1,
      preview: s.body.replace(/\s+/g, " ").trim().slice(0, 160),
    }));
    return { ...meta, sections };
  });

  return NextResponse.json({
    docs: notebook,
    topics: topicsFromDocs(docs),
    drive: await getDriveStatus(),
  });
}
