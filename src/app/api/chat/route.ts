import { NextResponse } from "next/server";
import { z } from "zod";
import { runTeachingChat } from "@/lib/chat";
import { loadCorpus } from "@/lib/corpus";

export const runtime = "nodejs";

const bodySchema = z.object({
  query: z.string().min(1).max(800),
  mode: z.enum(["notes", "notes+extend"]).default("notes"),
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

  let docs = await loadCorpus();
  if (parsed.data.topic && parsed.data.topic !== "all") {
    docs = docs.filter((d) => d.topic === parsed.data.topic);
  }

  const message = await runTeachingChat({
    query: parsed.data.query,
    mode: parsed.data.mode,
    docs,
  });
  return NextResponse.json({ message });
}
