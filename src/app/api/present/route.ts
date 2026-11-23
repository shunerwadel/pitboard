import { NextResponse } from "next/server";
import { z } from "zod";
import { getPresentState, setPresentState } from "@/lib/present-store";

export const runtime = "nodejs";

const cardSchema = z.object({
  id: z.string(),
  title: z.string(),
  bullets: z.array(z.string()),
  formula: z.string().optional(),
  cue: z.string().optional(),
  sourceTitle: z.string(),
  sourcePath: z.string(),
  topic: z.string(),
});

const bodySchema = z.object({
  card: cardSchema.nullable(),
  sessionNote: z.string().max(280).optional(),
});

export async function GET() {
  return NextResponse.json(getPresentState());
}

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

  const state = setPresentState({
    card: parsed.data.card,
    sessionNote: parsed.data.sessionNote ?? "",
    updatedAt: Date.now(),
  });
  return NextResponse.json(state);
}
