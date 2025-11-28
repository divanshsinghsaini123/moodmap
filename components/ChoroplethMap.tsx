"use client";

import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

type Stat = { country: string; good: number; bad: number };

// properties for the countries.geojson file
type CountryProps = {
  name?: string;
  ["ISO3166-1-Alpha-2"]?: string;
};

const GEO_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

/** simple color interpolation between red (bad) and green (good) */
function colorForRatio(ratio: number) {
  const t = (ratio + 1) / 2; // 0..1
  const r = Math.round(239 * (1 - t)); // red  -> 239
  const g = Math.round(68 + 187 * t);  // 68→255
  const b = Math.round(90 * (1 - t));  // keep low blue
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
          const map: Record<string, Stat> = {};
          (data.stats || []).forEach((s: Stat) => {
            if (s.country) map[s.country.toUpperCase()] = s;
          });
          setStats(map);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
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
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const props = geo.properties as CountryProps;

              // ISO 2-letter code from the file
              const code = props["ISO3166-1-Alpha-2"]?.toUpperCase();
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
                  // no evt parameter → no unused-var warning
                  onMouseEnter={() => {}}
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
