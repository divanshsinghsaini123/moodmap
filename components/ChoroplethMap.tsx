"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import countryMap from "@/lib/country-map.json"; // generated file -> { "834": { "iso2":"TZ","name":"Tanzania" }, ... }
import { STATES } from "mongoose";

type Stat = { country: string; good: number; bad: number };

/** Tooltip state */
type Tooltip = {
  name: string;
  iso?: string;
  good: number;
  bad: number;
  x: number;
  y: number;
} | null;

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** color interpolation between red (bad) and green (good) */
function colorForRatio(ratio: number) {
    if (ratio == 0 ) return "#E5E7EB"; // neutral yellow
  const t = (ratio + 1) / 2; // 0..1
  const r = Math.round(239 * (1 - t)); // red  -> 239
  const g = Math.round(68 + 187 * t); // 68→255
  const b = Math.round(90 * (1 - t)); // keep low blue
  return `rgb(${r},${g},${b})`;
}

export default function ChoroplethMap({stats} : { stats: Stat[] }) {
  const [loading, setLoading] = useState(true);
  const [statsArr, setStatsArr] = useState<Stat[]>([]);
  const [tooltip, setTooltip] = useState<Tooltip>(null);

  useEffect(() => {
    let mounted = true;
    
      try {
        if (mounted) {
          setStatsArr(stats || []);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    return () => {
      mounted = false;
    };
  }, [stats]);

  // build iso -> stat map once (O(n) on updates)
  const statsByIso = useMemo(() => {
    const m: Record<string, Stat> = {};
    for (const s of statsArr) {
      if (s && s.country) m[s.country.toUpperCase()] = s;
    }
    return m;
  }, [statsArr]);

  if (loading) return <div className="p-6">Loading map…</div>;

  return (
    <div className="relative w-full max-w-6xl mx-auto rounded-2xl border border-slate-600 bg-slate-800 p-6">
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{ position: "fixed", left: tooltip.x + 12, top: tooltip.y + 12, zIndex: 60 }}
          className="pointer-events-none bg-slate-900/90 border border-slate-700 text-sm text-slate-100 px-3 py-2 rounded-md shadow-lg"
        >
          <div className="font-semibold">
            {tooltip.name} {tooltip.iso ? `(${tooltip.iso})` : ""}
          </div>
          <div className="text-xs text-slate-300">
            Good: {tooltip.good} • Bad: {tooltip.bad}
          </div>
        </div>
      )}

      <ComposableMap projectionConfig={{ scale: 265 }} width={1300} height={700} style={{ width: "100%", height: "auto" }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((g) => {
              // typed view of the library geo object
              const geo = g as unknown as {
                rsmKey: string;
                id?: string | number;
                properties?: { name?: string };
              };

              const idKey = String(geo.id ?? "");
              // try exact id; many topojsons use numeric ids possibly without zero padding
              const info = (countryMap as Record<string, { iso2?: string; name?: string }>)[idKey]
                || (countryMap as Record<string, { iso2?: string; name?: string }>)[String(Number(idKey))];

              const iso = info?.iso2 ?? undefined;
              const name = info?.name ?? geo.properties?.name ?? "Unknown";

              const stat = iso ? statsByIso[iso.toUpperCase()] : undefined;

              let fill = "#0f172a"; // default background for no-data
              if (stat) {
                const good = stat.good || 0;
                const bad = stat.bad || 0;
                const ratio = good + bad === 0 ? 0 : (good - bad) / (good + bad); // -1..1
                fill = colorForRatio(ratio);
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={g}
                  fill={fill}
                  stroke="#020617"
                  onMouseEnter={(evt: React.MouseEvent<SVGPathElement>) => {
                    setTooltip({
                      name,
                      iso,
                      good: stat?.good ?? 0,
                      bad: stat?.bad ?? 0,
                      x: evt.clientX,
                      y: evt.clientY,
                    });
                  }}
                  onMouseMove={(evt: React.MouseEvent<SVGPathElement>) =>
                    setTooltip((t) => (t ? { ...t, x: evt.clientX, y: evt.clientY } : t))
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#ffd166", transition: "all 150ms" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-5 h-3 rounded" style={{ background: colorForRatio(1) }} />
          Good
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-3 rounded" style={{ background: colorForRatio(0) }} />
          Neutral
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-3 rounded" style={{ background: colorForRatio(-1) }} />
          Bad
        </div>
      </div>
    </div>
  );
}
