import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.OPENAI_API_KEY?.trim() || "";
  const configured = key.length > 0;
  return NextResponse.json({
    provider: "openai",
    configured,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    imageModel: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
    message: configured
      ? "OpenAI key detected. Analogy / Chart / Diagram can call the API."
      : "No OPENAI_API_KEY in this server’s environment. Add it to .env.local and restart npm run dev. Chart still works with an offline sketch.",
  });
}
