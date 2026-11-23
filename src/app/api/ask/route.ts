import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAskResult, maybeRefineWithLlm } from "@/lib/card-builder";
import { loadCorpus, searchCorpus } from "@/lib/corpus";

export const runtime = "nodejs";

const bodySchema = z.object({
  query: z.string().min(1).max(500),
  topic: z.string().optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { query, topic } = parsed.data;
  let docs = await loadCorpus();
  if (topic && topic !== "all") {
    docs = docs.filter((d) => d.topic === topic);
  }
  const hits = searchCorpus(docs, query, 6);
  const base = buildAskResult(query, hits);
  const result = await maybeRefineWithLlm(query, base);
  return NextResponse.json(result);
}
