import type { ClassSession } from "./types";

/** Deterministic SVG data-URL anchors for the sample class pack. */
function svgAnchor(title: string, subtitle: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12161c"/>
      <stop offset="100%" stop-color="#1c2430"/>
    </linearGradient>
  </defs>
  <rect width="960" height="540" fill="url(#g)"/>
  <rect x="48" y="48" width="864" height="444" rx="18" fill="none" stroke="${accent}" stroke-width="2" opacity="0.55"/>
  <circle cx="180" cy="270" r="78" fill="none" stroke="${accent}" stroke-width="3"/>
  <circle cx="180" cy="270" r="28" fill="${accent}" opacity="0.85"/>
  <text x="300" y="250" fill="#e8edf2" font-family="IBM Plex Sans, Arial, sans-serif" font-size="42" font-weight="600">${title}</text>
  <text x="300" y="300" fill="#9aa7b5" font-family="IBM Plex Sans, Arial, sans-serif" font-size="22">${subtitle}</text>
  <text x="48" y="520" fill="#6b7785" font-family="ui-monospace, monospace" font-size="14">PITBOARD SAMPLE ANCHOR</text>
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
        imageUrl: svgAnchor("Vehicle free-body", "Load paths · contact patches · CG", "#c4ff5c"),
        source: "sample",
      },
      {
        id: "anchor-track",
        title: "Track map",
        caption: "Where aero vs mechanical grip matter most",
        imageUrl: svgAnchor("Track map", "High-speed · hairpin · braking zones", "#5cc8ff"),
        source: "sample",
      },
      {
        id: "anchor-dil",
        title: "DiL loop",
        caption: "Driver ↔ plant ↔ cues latency loop",
        imageUrl: svgAnchor("DiL loop", "Driver · plant · visuals · motion", "#ffb45c"),
        source: "sample",
      },
    ],
    activeAnchorId: "anchor-vehicle",
    dive: null,
    media: null,
    updatedAt: Date.now(),
  };
}
