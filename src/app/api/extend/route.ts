import { NextResponse } from "next/server";
import { z } from "zod";
import { runExtend } from "@/lib/extend";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["analogy", "chart", "image"]),
  topic: z.string().min(1).max(300),
  context: z.string().max(4000).optional(),
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
    return NextResponse.json(
      { error: "Invalid request — topic is required and context must be under 4000 characters." },
      { status: 400 },
    );
  }

  try {
    const result = await runExtend({
      action: parsed.data.action,
      topic: parsed.data.topic.slice(0, 300),
      context: (parsed.data.context || "").slice(0, 4000),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extend failed";
    console.error("[api/extend]", message);
    return NextResponse.json(
      {
        error: `Extend failed: ${message}. Check OPENAI_API_KEY in .env.local (or use Chart/Analogy fallbacks without a key).`,
      },
      { status: 500 },
    );
  }
}
