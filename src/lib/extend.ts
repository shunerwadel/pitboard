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
  const key = process.env.OPENAI_API_KEY?.trim();
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

function sanitizeTopicLabel(topic: string): string {
  return topic.replace(/[<>&"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "topic";
}

function placeholderImage(topic: string, reason?: string): StageMedia {
  const label = sanitizeTopicLabel(topic);
  const detail = sanitizeTopicLabel(
    reason || "Add OPENAI_API_KEY in .env.local for live image generation",
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#00163a"/>
  <rect x="60" y="60" width="840" height="420" rx="6" fill="#1a3558" stroke="#c81818" stroke-width="2"/>
  <text x="480" y="230" text-anchor="middle" fill="#c81818" font-family="Barlow Condensed, Arial Narrow, Arial, sans-serif" font-size="28" font-weight="700">Generated diagram placeholder</text>
  <text x="480" y="280" text-anchor="middle" fill="#ffffff" font-family="Outfit, Arial, sans-serif" font-size="22">${label}</text>
  <text x="480" y="330" text-anchor="middle" fill="#d7dde5" font-family="Outfit, Arial, sans-serif" font-size="16">${detail}</text>
</svg>`;
  return {
    id: `img-${Date.now()}`,
    kind: "image",
    imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    caption: `Generated placeholder for ${label}`,
    label: "generated",
  };
}

async function generateImage(topic: string, context: string): Promise<StageMedia> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return placeholderImage(topic);

  try {
    // Prefer a widely available image model; fall back to placeholder on any API error.
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
        prompt: `Simple clean teaching diagram for a race vehicle engineering classroom, schematic style, minimal text: ${sanitizeTopicLabel(topic)}. ${context.slice(0, 200)}`,
        size: "1024x1024",
        n: 1,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("[extend/image]", res.status, errText.slice(0, 200));
      return placeholderImage(
        topic,
        `Image API ${res.status} — showing placeholder (check image model access on your OpenAI key)`,
      );
    }
    const data = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
    };
    const first = data.data?.[0];
    const imageUrl = first?.b64_json
      ? `data:image/png;base64,${first.b64_json}`
      : first?.url;
    if (!imageUrl) return placeholderImage(topic, "Image API returned no image");
    return {
      id: `img-${Date.now()}`,
      kind: "image",
      imageUrl,
      caption: `Generated diagram · ${sanitizeTopicLabel(topic)}`,
      label: "generated",
    };
  } catch (err) {
    console.warn("[extend/image]", err);
    return placeholderImage(topic, "Image request failed — placeholder shown");
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
  const key = process.env.OPENAI_API_KEY?.trim();
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
      const errText = await res.text().catch(() => "");
      console.warn("[extend/analogy]", res.status, errText.slice(0, 200));
      return {
        kind: "analogy",
        text: `Outside AI request failed (HTTP ${res.status}). Check OPENAI_API_KEY billing/model access, or use Notes-only mode.`,
      };
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return {
      kind: "analogy",
      text: stripMarkdown(data.choices?.[0]?.message?.content || "No analogy returned."),
    };
  } catch {
    return {
      kind: "analogy",
      text: "Outside AI request failed (network). Chart still works offline; analogies need a reachable OpenAI API.",
    };
  }
}
