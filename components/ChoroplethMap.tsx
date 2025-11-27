"use client";

import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

type Stat = { country: string; good: number; bad: number };

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** simple color interpolation between red (bad) and green (good) */
function colorForRatio(ratio: number) {
  const t = (ratio + 1) / 2; // 0..1
  const r = Math.round(239 * (1 - t));   // red  -> 239
  const g = Math.round(68 + (187 * t));  // 68→255
  const b = Math.round(90 * (1 - t));    // keep low blue
  return `rgb(${r},${g},${b})`;
}


export default function ChoroplethMap() {
  const [stats, setStats] = useState<Record<string, Stat>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.success) {
          // convert to map by ISO2 (uppercased)
          const map: Record<string, Stat> = {};
          (data.stats || []).forEach((s: Stat) => {
            if (s.country) map[s.country.toUpperCase()] = s;
          });
          setStats(map);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Loading map…</div>;

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl border border-slate-600 bg-slate-800 p-6">
    <ComposableMap
      projectionConfig={{ scale: 220 }}
      width={1400}
      height={700}
      style={{ width: "100%", height: "auto" }}  // 👈 stretches to full card width
    > 
        <Geographies geography={GEO_URL} >
          {({ geographies }) =>
            geographies.map((geo) => {
              // try common properties: ISO_A2 / ISO_A2 / id
              // different topojson/geojson sources use different keys — fallback sequence below
              const props = geo.properties as any;
              const iso =
                (props && (props.ISO_A2 || props.iso_a2 || props.ISO_A2)) ||
                props?.iso ||
                (geo.id ? String(geo.id) : undefined);

              const code = iso ? String(iso).toUpperCase() : undefined;
              const stat = code ? stats[code] : undefined;

              // compute ratio: good - bad normalized to [-1,1]
              let fill = "#0f172a"; // dark background for countries with no data
              if (stat) {
                const g = stat.good || 0;
                const b = stat.bad || 0;
                const ratio = g + b === 0 ? 0 : (g - b) / (g + b); // -1..1
                fill = colorForRatio(ratio);
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#020617"
                  onMouseEnter={(evt: React.MouseEvent<SVGPathElement, MouseEvent>) => {
  // ...
                  }}
                  style={{
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
