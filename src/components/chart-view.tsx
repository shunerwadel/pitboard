"use client";

import type { ChartSpec } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ChartView({
  chart,
  className,
  large = false,
}: {
  chart: ChartSpec;
  className?: string;
  large?: boolean;
}) {
  const series = chart.series[0];
  const points = series?.points ?? [];
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 1);
  const w = 640;
  const h = 320;
  const pad = 44;

  const toX = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2);
  const toY = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - pad * 2);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`)
    .join(" ");

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <figcaption
          className={cn(
            "font-[family-name:var(--font-display)] text-[var(--aluminum)]",
            large ? "text-2xl" : "text-lg",
          )}
        >
          {chart.title}
        </figcaption>
        <span className="rounded-full border border-[var(--signal)]/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--signal)]">
          Generated
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#3a4553" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#3a4553" />
        <path d={path} fill="none" stroke="#c4ff5c" strokeWidth="3" />
        {points.map((p) => (
          <circle key={`${p.x}-${p.y}`} cx={toX(p.x)} cy={toY(p.y)} r="4" fill="#c4ff5c" />
        ))}
        <text x={w / 2} y={h - 12} textAnchor="middle" fill="#9aa7b5" fontSize="14">
          {chart.xLabel}
        </text>
        <text
          x={16}
          y={h / 2}
          textAnchor="middle"
          fill="#9aa7b5"
          fontSize="14"
          transform={`rotate(-90 16 ${h / 2})`}
        >
          {chart.yLabel}
        </text>
      </svg>
      {chart.note ? (
        <p className="mt-2 text-sm text-[var(--aluminum)]/55">{chart.note}</p>
      ) : null}
    </figure>
  );
}
