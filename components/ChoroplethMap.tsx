// "use client";

// import { useEffect, useState } from "react";
// import {
//   ComposableMap,
//   Geographies,
//   Geography,
// } from "react-simple-maps";

// type Stat = { country: string; good: number; bad: number };

// const GEO_URL =
//   // "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
  
//   "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";


// /** simple color interpolation between red (bad) and green (good) */
// function colorForRatio(ratio: number) {
//   const t = (ratio + 1) / 2; // 0..1
//   const r = Math.round(239 * (1 - t));   // red  -> 239
//   const g = Math.round(68 + (187 * t));  // 68→255
//   const b = Math.round(90 * (1 - t));    // keep low blue
//   return `rgb(${r},${g},${b})`;
// }


// export default function ChoroplethMap() {
//   const [stats, setStats] = useState<Record<string, Stat>>({});
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       try {
//         const res = await fetch("/api/stats");
//         const data = await res.json();
//         if (data.success) {
//           // convert to map by ISO2 (uppercased)
//           // console.log(data);
//           const map: Record<string, Stat> = {};
//           (data.stats || []).forEach((s: any) => {
//             if (s.country) map[(s.country as string).toUpperCase()] = s;
//           });
//           setStats(map);
//         }
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   if (loading) return <div className="p-6">Loading map…</div>;

//   return (
//     <div className="w-full max-w-6xl mx-auto rounded-2xl border border-slate-600 bg-slate-800 p-6">
//     <ComposableMap
//       projectionConfig={{ scale: 220 }}
//       width={1000}
//       height={600}
//       style={{ width: "100%", height: "auto" }}  // 👈 stretches to full card width
//     > 
//         <Geographies geography={GEO_URL} >
//           {({ geographies }) =>
//             geographies.map((geo) => {
            
//             const props = geo.properties
//             // console.log(props);
//             const code = (props as any)["ISO3166-1-Alpha-2"]?.toUpperCase();
//             // console.log(code);
//             const stat = stats[code];


//               // compute ratio: good - bad normalized to [-1,1]
//               let fill = "#0f172a"; // dark background for countries with no data

//               if (stat) {
//                 const g = stat.good || 0;
//                 const b = stat.bad || 0;
//                 const ratio = g + b === 0 ? 0 : (g - b) / (g + b); // -1..1
//                 fill = colorForRatio(ratio);
//               }

//               return (
//                 <Geography
//                   key={geo.rsmKey}
//                   geography={geo}
//                   fill={fill}
//                   stroke="#020617"
//                   onMouseEnter={() => {
//                     // optionally show tooltip via state (not implemented here)
//                   }}
//                   style={{
//                     hover: { fill: "#ffd166", transition: "all 150ms" },
//                     pressed: { outline: "none" },
//                   }}
//                 />
//               );
//             })
//           }
//         </Geographies>
//       </ComposableMap>

//       {/* Legend */}
//       <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-300">
//         <div className="flex items-center gap-2">
//           <div className="w-5 h-3 rounded" style={{ background: colorForRatio(1) }} />
//           Good
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-5 h-3 rounded" style={{ background: colorForRatio(0) }} />
//           Neutral
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-5 h-3 rounded" style={{ background: colorForRatio(-1) }} />
//           Bad
//         </div>
//       </div>
//     </div>
//   );
// }


// "use client";

// import { useEffect, useState } from "react";
// import {
//   ComposableMap,
//   Geographies,
//   Geography,
// } from "react-simple-maps";

// type Stat = { country: string; good: number; bad: number };

// const GEO_URL =
//   "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

// /** simple color interpolation between red (bad) and green (good) */
// function colorForRatio(ratio: number) {
//   const t = (ratio + 1) / 2; // 0..1
//   const r = Math.round(239 * (1 - t));   // red  -> 239
//   const g = Math.round(68 + (187 * t));  // 68→255
//   const b = Math.round(90 * (1 - t));    // keep low blue
//   return `rgb(${r},${g},${b})`;
// }

// export default function ChoroplethMap() {
//   const [stats, setStats] = useState<Record<string, Stat>>({});
//   const [loading, setLoading] = useState(true);
//   const [tooltip, setTooltip] = useState<{
//     x: number;
//     y: number;
//     name: string;
//     good: number;
//     bad: number;
//   } | null>(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch("/api/stats");
//         const data = await res.json();
//         if (data.success && Array.isArray(data.stats)) {
//           const map: Record<string, Stat> = {};
//           (data.stats as Stat[]).forEach((s: any) => {
//             if (s.country) {
//               map[(s.country as string).toUpperCase()] = s;
//             }
//           });
//           setStats(map);
//         }
//       } catch (err) {
//         console.error("Error loading stats for map:", err);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   if (loading) {
//     return (
//       <div className="w-full max-w-6xl mx-auto mt-6 rounded-xl border border-slate-700 bg-slate-900 p-6 text-sm text-slate-300">
//         Loading map…
//       </div>
//     );
//   }

//   return (
//     <div className="relative w-full max-w-6xl mx-auto mt-6 rounded-2xl border border-slate-600 bg-slate-800 p-6">
//       <ComposableMap
//         projectionConfig={{ scale: 220 }}
//         width={1000}
//         height={600}
//         style={{ width: "100%", height: "auto" }}
//       >
//         <Geographies geography={GEO_URL}>
//           {({ geographies }) =>
//             geographies.map((geo) => {
//               const props = geo.properties as any;

//               const code = (props["ISO3166-1-Alpha-2"] as string | undefined)?.toUpperCase();
//               const stat = code ? stats[code] : undefined;

//               let fill = "#0f172a"; // default (no data)
//               if (stat) {
//                 const g = stat.good || 0;
//                 const b = stat.bad || 0;
//                 const ratio = g + b === 0 ? 0 : (g - b) / (g + b); // -1..1
//                 fill = colorForRatio(ratio);
//               }

//               const name = (props.name as string) ?? code ?? "Unknown";
//               const good = stat?.good ?? 0;
//               const bad = stat?.bad ?? 0;

//               return (
//                 <Geography
//                   key={geo.rsmKey}
//                   geography={geo}
//                   fill={fill}
//                   stroke="#020617"
//                   onMouseEnter={(evt: any) => {
//                     setTooltip({
//                       x: evt.clientX,
//                       y: evt.clientY,
//                       name,
//                       good,
//                       bad,
//                     });
//                   }}
//                   onMouseMove={(evt: any) => {
//                     setTooltip((t) =>
//                       t
//                         ? {
//                             ...t,
//                             x: evt.clientX,
//                             y: evt.clientY,
//                           }
//                         : null
//                     );
//                   }}
//                   onMouseLeave={() => setTooltip(null)}
//                   style={{
//                     default: { outline: "none" },
//                     hover: {
//                       fill: "#ffd166",
//                       outline: "none",
//                       transition: "all 150ms",
//                     },
//                     pressed: { outline: "none" },
//                   }}
//                 />
//               );
//             })
//           }
//         </Geographies>
//       </ComposableMap>

//       {/* Tooltip */}
//       {tooltip && (
//         <div
//           className="pointer-events-none fixed z-50 px-3 py-2 rounded-md bg-slate-900/95 text-xs text-slate-50 shadow-xl border border-slate-700"
//           style={{
//             left: tooltip.x + 14,
//             top: tooltip.y + 14,
//           }}
//         >
//           <div className="font-semibold">{tooltip.name}</div>
//           <div className="mt-1 text-[11px]">
//             <span className="text-emerald-400">Good:</span> {tooltip.good}
//             <span className="mx-2 text-slate-500">•</span>
//             <span className="text-rose-400">Bad:</span> {tooltip.bad}
//           </div>
//         </div>
//       )}

//       {/* Legend */}
//       {/* <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-300">
//         <div className="flex items-center gap-2">
//           <div className="w-5 h-3 rounded" style={{ background: colorForRatio(1) }} />
//           Good
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-5 h-3 rounded" style={{ background: colorForRatio(0) }} />
//           Neutral
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-5 h-3 rounded" style={{ background: colorForRatio(-1) }} />
//           Bad
//         </div>
//       </div> */}
//       {/* Gradient Legend Bar */}
//       <div className="mt-6 flex flex-col items-center">
//         <div className="text-xs text-slate-300 mb-1">Mood Intensity</div>

//         <div className="w-64 h-3 rounded-full bg-gradient-to-r from-red-500 via-amber-300 to-green-500 shadow-md" />

//         <div className="w-64 flex justify-between text-[11px] text-slate-400 mt-1">
//           <span>Bad</span>
//           <span>Neutral</span>
//           <span>Good</span>
//         </div>
//       </div>

//     </div>
//   );
// }


"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import countryMap from "@/data/country-map.json"; // generated file -> { "834": { "iso2":"TZ","name":"Tanzania" }, ... }

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
  const t = (ratio + 1) / 2; // 0..1
  const r = Math.round(239 * (1 - t)); // red  -> 239
  const g = Math.round(68 + 187 * t); // 68→255
  const b = Math.round(90 * (1 - t)); // keep low blue
  return `rgb(${r},${g},${b})`;
}

export default function ChoroplethMap() {
  const [loading, setLoading] = useState(true);
  const [statsArr, setStatsArr] = useState<Stat[]>([]);
  const [tooltip, setTooltip] = useState<Tooltip>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (mounted && data?.success) {
          setStatsArr(data.stats || []);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

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

      <ComposableMap projectionConfig={{ scale: 220 }} width={1400} height={700} style={{ width: "100%", height: "auto" }}>
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
