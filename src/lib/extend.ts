import { stripMarkdown } from "./card-builder";
import type { ChartSpec, StageMedia } from "./types";

function fallbackChart(topic: string): ChartSpec {
  const points = Array.from({ length: 9 }, (_, i) => {
    const x = i * 200;
    const mu = 1.6 / (1 + 0.0012 * x);
    return { x, y: Number((mu * x).toFixed(1)) };
  });
  return {
    id: `chart-${Date.now()}`,
    title: `Illustrative curve · ${topic}`,
    xLabel: "Normal load Fz",
    yLabel: "Lateral force Fy",
    series: [{ name: "Load sensitive tire", points }],
    note: "Generated teaching sketch — not measured data from your notes.",
    provenance: "generated",
  };
}

async function llmChart(topic: string, context: string): Promise<ChartSpec> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallbackChart(topic);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Return JSON chart spec: {title, xLabel, yLabel, points:[{x,y}], note}. Use 6-10 illustrative points for a teaching sketch only. Never claim measured lab data.',
          },
          {
            role: "user",
            content: `Topic: ${topic}\nContext:\n${context.slice(0, 1500)}`,
          },
        ],
      }),
    });
    if (!res.ok) return fallbackChart(topic);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return fallbackChart(topic);
    const parsed = JSON.parse(raw) as {
      title?: string;
      xLabel?: string;
      yLabel?: string;
      points?: { x: number; y: number }[];
      note?: string;
    };
    const points = Array.isArray(parsed.points)
      ? parsed.points.filter((p) => typeof p.x === "number" && typeof p.y === "number")
      : [];
    if (points.length < 3) return fallbackChart(topic);
    return {
      id: `chart-${Date.now()}`,
      title: stripMarkdown(parsed.title || `Illustrative · ${topic}`),
      xLabel: stripMarkdown(parsed.xLabel || "x"),
      yLabel: stripMarkdown(parsed.yLabel || "y"),
      series: [{ name: "Generated series", points }],
      note:
        stripMarkdown(parsed.note || "") ||
        "Generated teaching sketch — not measured data from your notes.",
      provenance: "generated",
    };
  } catch {
    return fallbackChart(topic);
  }
}

function placeholderImage(topic: string): StageMedia {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#12161c"/>
  <rect x="60" y="60" width="840" height="420" rx="16" fill="#1c2430" stroke="#c4ff5c" stroke-width="2"/>
  <text x="480" y="240" text-anchor="middle" fill="#c4ff5c" font-family="Arial" font-size="28">Generated diagram placeholder</text>
  <text x="480" y="290" text-anchor="middle" fill="#e8edf2" font-family="Arial" font-size="22">${topic.replace(/[<>&]/g, "")}</text>
  <text x="480" y="340" text-anchor="middle" fill="#9aa7b5" font-family="Arial" font-size="16">Add OPENAI_API_KEY for image generation</text>
</svg>`;
  return {
    id: `img-${Date.now()}`,
    kind: "image",
    imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    caption: `Generated placeholder for ${topic}`,
    label: "generated",
  };
}

async function generateImage(topic: string, context: string): Promise<StageMedia> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return placeholderImage(topic);

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        prompt: `Simple clean teaching diagram for a race vehicle engineering classroom, no text overload, schematic style: ${topic}. Context: ${context.slice(0, 400)}`,
        size: "1024x1024",
      }),
    });
    if (!res.ok) return placeholderImage(topic);
    const data = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
    };
    const first = data.data?.[0];
    const imageUrl = first?.b64_json
      ? `data:image/png;base64,${first.b64_json}`
      : first?.url;
    if (!imageUrl) return placeholderImage(topic);
    return {
      id: `img-${Date.now()}`,
      kind: "image",
      imageUrl,
      caption: `Generated diagram · ${topic}`,
      label: "generated",
    };
  } catch {
    return placeholderImage(topic);
  }
}

export async function runExtend(opts: {
  action: "analogy" | "chart" | "image";
  topic: string;
  context: string;
}): Promise<
  | { kind: "analogy"; text: string }
  | { kind: "chart"; media: StageMedia }
  | { kind: "image"; media: StageMedia }
> {
  if (opts.action === "chart") {
    const chart = await llmChart(opts.topic, opts.context);
    return {
      kind: "chart",
      media: {
        id: chart.id,
        kind: "chart",
        chart,
        label: "generated",
      },
    };
  }
  if (opts.action === "image") {
    return { kind: "image", media: await generateImage(opts.topic, opts.context) };
  }

  // analogy
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      kind: "analogy",
      text: "Outside AI (fallback): compare the system to a crowded elevator — capacity doesn’t scale linearly as you add people; balance and timing matter as much as peak force.",
    };
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              "Suggest 2 short classroom analogies for race-vehicle topics. Plain text. Do not invent equations. Do not claim these come from the instructor notes.",
          },
          {
            role: "user",
            content: `Topic: ${opts.topic}\nNotes context:\n${opts.context.slice(0, 1600)}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return { kind: "analogy", text: "Outside AI request failed. Try again." };
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return {
      kind: "analogy",
      text: stripMarkdown(data.choices?.[0]?.message?.content || "No analogy returned."),
    };
  } catch {
    return { kind: "analogy", text: "Outside AI request failed. Try again." };
  }
}
