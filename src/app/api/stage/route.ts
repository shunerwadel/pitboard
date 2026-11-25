import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, patchSession } from "@/lib/session-store";

export const runtime = "nodejs";

const cardSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    bullets: z.array(z.string()),
    formula: z.string().optional(),
    cue: z.string().optional(),
    sourceTitle: z.string(),
    sourcePath: z.string(),
    topic: z.string(),
    sectionTitle: z.string().optional(),
  })
  .nullable();

const mediaSchema = z
  .union([
    z.object({
      id: z.string(),
      kind: z.literal("chart"),
      label: z.literal("generated"),
      chart: z.object({
        id: z.string(),
        title: z.string(),
        xLabel: z.string(),
        yLabel: z.string(),
        series: z.array(
          z.object({
            name: z.string(),
            points: z.array(
              z.object({
                x: z.number(),
                y: z.number(),
                label: z.string().optional(),
              }),
            ),
          }),
        ),
        note: z.string().optional(),
        provenance: z.literal("generated"),
      }),
    }),
    z.object({
      id: z.string(),
      kind: z.literal("image"),
      imageUrl: z.string(),
      caption: z.string(),
      label: z.enum(["generated", "notes"]),
    }),
  ])
  .nullable();

const bodySchema = z.object({
  title: z.string().optional(),
  activeAnchorId: z.string().nullable().optional(),
  dive: cardSchema.optional(),
  media: mediaSchema.optional(),
  anchors: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        caption: z.string(),
        imageUrl: z.string(),
        source: z.enum(["upload", "notes", "generated", "sample"]),
      }),
    )
    .optional(),
});

export async function GET() {
  return NextResponse.json(getSession());
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
  const session = patchSession(parsed.data);
  return NextResponse.json(session);
}
