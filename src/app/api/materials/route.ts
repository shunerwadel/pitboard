import { NextResponse } from "next/server";
import { loadCorpus, topicsFromDocs } from "@/lib/corpus";
import { getDriveStatus } from "@/lib/drive";

export const runtime = "nodejs";

export async function GET() {
  const docs = await loadCorpus();
  const drive = await getDriveStatus();
  return NextResponse.json({
    materials: docs.map((doc) => {
      const { content: _content, ...meta } = doc;
      void _content;
      return meta;
    }),
    topics: topicsFromDocs(docs),
    drive,
  });
}
