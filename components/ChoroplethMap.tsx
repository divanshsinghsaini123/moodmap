// "use client";
// import React, { useEffect, useMemo, useState , useRef } from "react";
// import { ComposableMap, Geographies, Geography } from "react-simple-maps";
// import countryMap from "@/lib/country-map.json";
// import { STATES } from "mongoose";

// /** Stat type for vote counts per country */
// type Stat = { country: string; good: number; bad: number };

// /** Country info from country map JSON */
// interface CountryInfo {
//   iso2?: string;
//   name?: string;
// }

// /** GeoFeature type for TopoJSON geography objects */
// interface GeoFeature {
//   rsmKey: string;
//   id?: string | number;
//   properties?: {
//     name?: string;
//   };
// }

// /** Tooltip state */
// type Tooltip = {
//   name: string;
//   iso?: string;
//   good: number;
//   bad: number;
//   x: number;
//   y: number;
// } | null;

// const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// /** color interpolation between red (bad) and yellow (good) */


// export default function ChoroplethMap({ stats }: { stats: Stat[] }) {
//   const [loading, setLoading] = useState(true);
//   const [statsArr, setStatsArr] = useState<Stat[]>([]);
//   const [tooltip, setTooltip] = useState<Tooltip>(null);
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const [liveText, setLiveText] = useState<string | null>(null);
//   const [focusedCountry, setFocusedCountry] = useState<string | null>(null);

//   useEffect(() => {
//     let mounted = true;

//       try {
//         if (mounted) {
//           setStatsArr(stats || []);
//         }
//       } catch (err) {
//         console.error("Error loading stats:", err);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     return () => {
//       mounted = false;
//     };
//   }, [stats]);

//   // announce tooltip changes for screen readers
//   useEffect(() => {
//     if (tooltip) {
//       const mood = tooltip.good > tooltip.bad ? "more positive" : tooltip.bad > tooltip.good ? "more negative" : "neutral";
//       setLiveText(`${tooltip.name}. Mood: ${mood}. Good: ${tooltip.good}. Bad: ${tooltip.bad}.`);
//     }
//   }, [tooltip]);

//   // build iso -> stat map once (O(n) on updates)
//   const statsByIso = useMemo(() => {
//     const m: Record<string, Stat> = {};
//     for (const s of statsArr) {
//       if (s && s.country) m[s.country.toUpperCase()] = s;
//     }
//     return m;
//   }, [statsArr]);

//   if (loading) return <div className="p-6">Loading map…</div>;

//   // helper to clamp tooltip to viewport
//   function clamp(v: number, a: number, b: number) {
//     return Math.max(a, Math.min(b, v));
//   }

//   return (
//     <div ref={containerRef} className="relative w-full max-w-6xl mx-auto rounded-2xl border border-slate-600 bg-slate-800 p-6" role="region" aria-label="Global Mood Map. Use Tab to navigate countries, Enter or Space to view details.">
//       {/* Tooltip */}
//       {tooltip && (() => {
//         // ensure numbers and clamp to viewport with safe fallbacks
//         const rawX = Number(tooltip.x);
//         const rawY = Number(tooltip.y);
//         // default offsets
//         const offsetX = 12;
//         const offsetY = 12;
//         const widthEstimate = 260; // tooltip width estimate for clamping
//         const left = Number.isFinite(rawX) && typeof window !== "undefined"
//           ? clamp(rawX + offsetX, 8, window.innerWidth - widthEstimate - 8)
//           : 12;
//         const top = Number.isFinite(rawY) && typeof window !== "undefined"
//           ? clamp(rawY + offsetY, 8, window.innerHeight - 80)
//           : 12;

//         return (
//           <div
//             style={{ position: "fixed", left, top, zIndex: 60 }}
//             className="pointer-events-none bg-slate-900/90 border border-slate-700 text-sm text-slate-100 px-3 py-2 rounded-md shadow-lg"
//             role="tooltip"
//             aria-live="assertive"
//           >
//             <div className="font-semibold">
//               {tooltip.name} {tooltip.iso ? `(${tooltip.iso})` : ""}
//             </div>
//             <div className="text-xs text-slate-300 mt-1">
//               <div>Good: {tooltip.good}</div>
//               <div>Bad: {tooltip.bad}</div>
//               <div className="mt-1 text-xs text-slate-400">
//                 {tooltip.good > tooltip.bad
//                   ? "↑ Positive vibes"
//                   : tooltip.bad > tooltip.good
//                   ? "↓ Challenging vibes"
//                   : "→ Neutral mood"}
//               </div>
//             </div>
//           </div>
//         );
//       })()}

//       <ComposableMap projectionConfig={{ scale: 265 }} width={1300} height={700} style={{ width: "100%", height: "auto" }}>
//         <Geographies geography={GEO_URL}>
//           {({ geographies }) =>
//             geographies.map((g) => {
//               // type the geography object as GeoFeature
//               const geo = g as unknown as GeoFeature;

//               const idKey = String(geo.id ?? "");
//               // try exact id; many topojsons use numeric ids possibly without zero padding
//               const info = (countryMap as Record<string, CountryInfo>)[idKey]
//                 || (countryMap as Record<string, CountryInfo>)[String(Number(idKey))];

//               const iso = info?.iso2 ?? undefined;
//               const name = info?.name ?? geo.properties?.name ?? "Unknown";

//               const stat = iso ? statsByIso[iso.toUpperCase()] : undefined;

//               let fill = "#0f172a"; // default background for no-data
//               let isNegative = false;
//               let ratio = 0;
//               if (stat) {
//                 const good = stat.good || 0;
//                 const bad = stat.bad || 0;
//                 ratio = good + bad === 0 ? 0 : (good - bad) / (good + bad); // -1..1
//                 fill = colorForRatio(ratio);
//                 isNegative = ratio < 0;
//               }

//               return (  
//                 <Geography
//                   key={geo.rsmKey}
//                   geography={g}
//                   fill={fill}
//                   stroke="#020617"
//                   strokeWidth={0.4}
//                   strokeDasharray={undefined}
//                   tabIndex={0}
//                   role="button"
//                   aria-label={`${name}. ${stat ? (stat.good > stat.bad ? "Positive mood" : stat.bad > stat.good ? "Challenging mood" : "Neutral mood") : "No data"}. Good votes: ${stat?.good ?? 0}. Bad votes: ${stat?.bad ?? 0}.`}
//                   aria-pressed={focusedCountry === name}
//                   onFocus={(evt: React.FocusEvent<SVGPathElement>) => {
//                     // focus events don't provide clientX/clientY reliably; fall back to container center
//                     const native = evt.nativeEvent as any;
//                     let x = typeof native?.clientX === "number" ? native.clientX : NaN;
//                     let y = typeof native?.clientY === "number" ? native.clientY : NaN;
//                     if (!Number.isFinite(x) || !Number.isFinite(y)) {
//                       const rect = containerRef.current?.getBoundingClientRect();
//                       if (rect) {
//                         x = rect.left + rect.width / 2;
//                         y = rect.top + rect.height / 2 - 40; // lift tooltip a bit
//                       } else {
//                         x = 12;
//                         y = 12;
//                       }
//                     }
//                     setFocusedCountry(name);
//                     setTooltip({ name, iso, good: stat?.good ?? 0, bad: stat?.bad ?? 0, x, y });
//                   }}
//                   onKeyDown={(evt: React.KeyboardEvent<SVGPathElement>) => {
//                     if (evt.key === "Enter" || evt.key === " ") {
//                       evt.preventDefault();
//                       // announce and show tooltip
//                       setTooltip({ name, iso, good: stat?.good ?? 0, bad: stat?.bad ?? 0, x: 20, y: 20 });
//                     }
//                   }}
//                   onMouseEnter={(evt: React.MouseEvent<SVGPathElement>) => {
//                     setTooltip({
//                       name,
//                       iso,
//                       good: stat?.good ?? 0,
//                       bad: stat?.bad ?? 0,
//                       x: evt.clientX,
//                       y: evt.clientY,
//                     });
//                   }}
//                   onMouseMove={(evt: React.MouseEvent<SVGPathElement>) => setTooltip((t) => (t ? { ...t, x: evt.clientX, y: evt.clientY } : t))}
//                   onMouseLeave={() => setTooltip(null)}
//                   onClick={(evt: React.MouseEvent<SVGPathElement>) => {
//                     // show tooltip at exact click position
//                     setTooltip({
//                       name,
//                       iso,
//                       good: stat?.good ?? 0,
//                       bad: stat?.bad ?? 0,
//                       x: evt.clientX,
//                       y: evt.clientY,
//                     });
//                   }}
//                   onBlur={() => {
//                     setFocusedCountry(null);
//                     setTooltip(null);
//                   }}
//                   style={{
//                     default: { outline: "none" },
//                     hover: { fill: "#ffd166", transition: "all 150ms" },
//                     pressed: { outline: "none" },
//                   }}
//                 />
//               );
//             })
//           }
//         </Geographies>
//       </ComposableMap>

//       {/* aria-live region for screen readers */}
//       <div aria-live="polite" className="sr-only">{liveText}</div>

//       {/* Legend */}
//       <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-300">
//         <div className="flex items-center gap-2">
//           <div className="w-5 h-3 rounded" style={{ background: colorForRatio(1) }} />
//           Good
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="w-5 h-3 rounded" style={{ background: colorForRatio(-1) }} />
//           Bad
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import countryMap from "@/lib/country-map.json";

/** Stat type for vote counts per country */
type Stat = { country: string; good: number; bad: number };

/** Country info from country map JSON */
interface CountryInfo {
  iso2?: string;
  name?: string;
}

/** GeoFeature type for TopoJSON geography objects */
interface GeoFeature {
  rsmKey: string;
  id?: string | number;
  properties?: {
    name?: string;
  };
}

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

/** * NEW COLOR LOGIC: "Night Lights" Theme
 * Base: Dark Land (#1e293b)
 * Good: Glowing Gold/Yellow (City lights)
 * Bad: Glowing Red
 */
function colorForRatio(ratio: number) {
  // If no data or neutral, return the base dark land color
  if (ratio === 0) return "#1e293b";

  if (ratio > 0) {
    // GOOD MOOD -> GREEN/EMERALD LIGHTS
    // Mapping 0..1 to intensity
    if (ratio < 0.2) return "#064e3b"; // faint green
    if (ratio < 0.5) return "#15803d"; // dim green
    if (ratio < 0.8) return "#22c55e"; // bright green
    return "#4ade80"; // blazing light green
  } else {
    // BAD MOOD -> RED LIGHTS
    // Mapping -1..0 to intensity
    const abs = Math.abs(ratio);
    if (abs < 0.2) return "#450a0a"; // faint red
    if (abs < 0.5) return "#991b1b"; // dim red
    if (abs < 0.8) return "#dc2626"; // bright red
    return "#f87171"; // blazing bright red
  }
}

export default function ChoroplethMap({ stats, activeVote }: { stats: Stat[], activeVote?: { country: string, mood: "good" | "bad" } | null }) {
  const [loading, setLoading] = useState(true);
  const [statsArr, setStatsArr] = useState<Stat[]>([]);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [liveText, setLiveText] = useState<string | null>(null);
  const [focusedCountry, setFocusedCountry] = useState<string | null>(null);

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

  // announce tooltip changes for screen readers
  useEffect(() => {
    if (tooltip) {
      const mood = tooltip.good > tooltip.bad ? "more positive" : tooltip.bad > tooltip.good ? "more negative" : "neutral";
      setLiveText(`${tooltip.name}. Mood: ${mood}. Good: ${tooltip.good}. Bad: ${tooltip.bad}.`);
    }
  }, [tooltip]);

  // build iso -> stat map once (O(n) on updates)
  const statsByIso = useMemo(() => {
    const m: Record<string, Stat> = {};
    for (const s of statsArr) {
      if (s && s.country) m[s.country.toUpperCase()] = s;
    }
    return m;
  }, [statsArr]);

  if (loading) return <div className="p-6 text-slate-400">Loading map…</div>;

  // helper to clamp tooltip to viewport
  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
  }

  return (
    <div
      ref={containerRef}
      // DARK OCEAN BACKGROUND
      className="relative w-full max-w-6xl mx-auto rounded-2xl border border-slate-800 bg-[#020617] p-6 shadow-2xl overflow-hidden"
      role="region"
      aria-label="Global Mood Map. Use Tab to navigate countries, Enter or Space to view details."
    >
      {/* Tooltip */}
      {tooltip && (() => {
        const rawX = Number(tooltip.x);
        const rawY = Number(tooltip.y);
        const offsetX = 12;
        const offsetY = 12;
        const widthEstimate = 260;
        const left = Number.isFinite(rawX) && typeof window !== "undefined"
          ? clamp(rawX + offsetX, 8, window.innerWidth - widthEstimate - 8)
          : 12;
        const top = Number.isFinite(rawY) && typeof window !== "undefined"
          ? clamp(rawY + offsetY, 8, window.innerHeight - 80)
          : 12;

        return (
          <div
            style={{ position: "fixed", left, top, zIndex: 60 }}
            className="pointer-events-none bg-black/90 border border-slate-700 text-sm text-slate-100 px-3 py-2 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-sm"
            role="tooltip"
            aria-live="assertive"
          >
            <div className="font-semibold text-cyan-400">
              {tooltip.name} {tooltip.iso ? `(${tooltip.iso})` : ""}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                Good: {tooltip.good}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Bad: {tooltip.bad}
              </div>
              <div className="mt-1 text-xs text-slate-500 italic">
                {tooltip.good > tooltip.bad
                  ? "↑ Positive energy"
                  : tooltip.bad > tooltip.good
                    ? "↓ Tough times"
                    : "→ Neutral"}
              </div>
            </div>
          </div>
        );
      })()}

      <ComposableMap
        projectionConfig={{ scale: 200 }}
        width={980}
        height={551}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((g) => {
              const geo = g as unknown as GeoFeature;
              const idKey = String(geo.id ?? "");
              const info = (countryMap as Record<string, CountryInfo>)[idKey]
                || (countryMap as Record<string, CountryInfo>)[String(Number(idKey))];

              const iso = info?.iso2 ?? undefined;
              const name = info?.name ?? geo.properties?.name ?? "Unknown";
              const stat = iso ? statsByIso[iso.toUpperCase()] : undefined;

              // Default "Dark Land" fill
              let fill = "#0f172a";
              let ratio = 0;

              if (stat) {
                const good = stat.good || 0;
                const bad = stat.bad || 0;
                ratio = good + bad === 0 ? 0 : (good - bad) / (good + bad); // -1..1
                fill = colorForRatio(ratio);
              }

              // Check for active vote glow
              const isActive = activeVote && iso && activeVote.country === iso;
              if (isActive) {
                // Flash effect color
                fill = activeVote.mood === "good" ? "#ffffff" : "#ffffff"; // Flash white for impact
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={g}
                  fill={fill}
                  // Dark borders
                  stroke="#1e293b"
                  strokeWidth={0.5}
                  tabIndex={0}
                  role="button"
                  aria-label={`${name}. ${stat ? (stat.good > stat.bad ? "Positive mood" : stat.bad > stat.good ? "Challenging mood" : "Neutral mood") : "No data"}. Good votes: ${stat?.good ?? 0}. Bad votes: ${stat?.bad ?? 0}.`}
                  aria-pressed={focusedCountry === name}

                  // STYLING: Transitions and Hover Glow
                  style={{
                    default: isActive ? {
                      outline: "none",
                      animation: activeVote.mood === "good"
                        ? "map-flash-good 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                        : "map-flash-bad 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      transformBox: "fill-box",
                      transformOrigin: "center",
                      zIndex: 100
                    } : { outline: "none", transition: "fill 0.5s ease" },
                    hover: {
                      fill: "#ffffff",
                      stroke: "#ffffff",
                      strokeWidth: 1,
                      outline: "none",
                      cursor: "pointer",
                      filter: "drop-shadow(0 0 8px rgba(255,255,255,0.6))" // The light glow effect
                    },
                    pressed: { outline: "none", fill: "#94a3b8" },
                  }}

                  onFocus={(evt: React.FocusEvent<SVGPathElement>) => {
                    const native = evt.nativeEvent as any;
                    let x = typeof native?.clientX === "number" ? native.clientX : NaN;
                    let y = typeof native?.clientY === "number" ? native.clientY : NaN;
                    if (!Number.isFinite(x) || !Number.isFinite(y)) {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        x = rect.left + rect.width / 2;
                        y = rect.top + rect.height / 2 - 40;
                      } else {
                        x = 12;
                        y = 12;
                      }
                    }
                    setFocusedCountry(name);
                    setTooltip({ name, iso, good: stat?.good ?? 0, bad: stat?.bad ?? 0, x, y });
                  }}
                  onKeyDown={(evt: React.KeyboardEvent<SVGPathElement>) => {
                    if (evt.key === "Enter" || evt.key === " ") {
                      evt.preventDefault();
                      setTooltip({ name, iso, good: stat?.good ?? 0, bad: stat?.bad ?? 0, x: 20, y: 20 });
                    }
                  }}
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
                  onMouseMove={(evt: React.MouseEvent<SVGPathElement>) => setTooltip((t) => (t ? { ...t, x: evt.clientX, y: evt.clientY } : t))}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={(evt: React.MouseEvent<SVGPathElement>) => {
                    setTooltip({
                      name,
                      iso,
                      good: stat?.good ?? 0,
                      bad: stat?.bad ?? 0,
                      x: evt.clientX,
                      y: evt.clientY,
                    });
                  }}
                  onBlur={() => {
                    setFocusedCountry(null);
                    setTooltip(null);
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* aria-live region for screen readers */}
      <div aria-live="polite" className="sr-only">{liveText}</div>

      {/* Updated Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" />
          Good Vibes (Lights)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f87171] shadow-[0_0_8px_#f87171]" />
          Bad Vibes (Heat)
        </div>
      </div>
    </div>
  );
}