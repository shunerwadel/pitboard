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

  const openaiKey = process.env.OPENAI_API_KEY?.trim() || "";
  return NextResponse.json({
    docs: notebook,
    topics: topicsFromDocs(docs),
    drive: await getDriveStatus(),
    ai: {
      provider: "openai",
      configured: openaiKey.length > 0,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      message:
        openaiKey.length > 0
          ? "OpenAI key detected for AI extend."
          : "No OPENAI_API_KEY loaded. Add it to .env.local and restart npm run dev.",
    },
  });
}
