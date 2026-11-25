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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await runExtend({
    action: parsed.data.action,
    topic: parsed.data.topic,
    context: parsed.data.context || "",
  });
  return NextResponse.json(result);
}
