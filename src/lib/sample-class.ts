import type { ClassSession } from "./types";

/** Deterministic SVG data-URL anchors for the sample class pack. */
function svgAnchor(title: string, subtitle: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00163a"/>
      <stop offset="100%" stop-color="#1a3558"/>
    </linearGradient>
  </defs>
  <rect width="960" height="540" fill="url(#g)"/>
  <rect x="48" y="48" width="864" height="444" rx="6" fill="none" stroke="${accent}" stroke-width="2" opacity="0.7"/>
  <circle cx="180" cy="270" r="78" fill="none" stroke="${accent}" stroke-width="3"/>
  <circle cx="180" cy="270" r="28" fill="${accent}" opacity="0.9"/>
  <text x="300" y="250" fill="#ffffff" font-family="Barlow Condensed, Arial Narrow, Arial, sans-serif" font-size="42" font-weight="700">${title}</text>
  <text x="300" y="300" fill="#d7dde5" font-family="Outfit, Arial, sans-serif" font-size="22">${subtitle}</text>
  <text x="48" y="520" fill="#6b7585" font-family="Barlow Condensed, Arial Narrow, monospace" font-size="14" letter-spacing="2">PITBOARD SAMPLE ANCHOR</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function sampleClassSession(): ClassSession {
  return {
    title: "Race systems — DiL / load / aero",
    anchors: [
      {
        id: "anchor-vehicle",
        title: "Vehicle free-body",
        caption: "Orientation diagram for load paths and tire forces",
        imageUrl: svgAnchor("Vehicle free-body", "Load paths · contact patches · CG", "#c81818"),
        source: "sample",
      },
      {
        id: "anchor-track",
        title: "Track map",
        caption: "Where aero vs mechanical grip matter most",
        imageUrl: svgAnchor("Track map", "High-speed · hairpin · braking zones", "#ffffff"),
        source: "sample",
      },
      {
        id: "anchor-dil",
        title: "DiL loop",
        caption: "Driver ↔ plant ↔ cues latency loop",
        imageUrl: svgAnchor("DiL loop", "Driver · plant · visuals · motion", "#ffb4b4"),
        source: "sample",
      },
    ],
    activeAnchorId: "anchor-vehicle",
    dive: null,
    media: null,
    updatedAt: Date.now(),
  };
}
