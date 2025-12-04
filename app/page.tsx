///////////////////////them 2 ----------------------------------
"use client";

import { useEffect, useState } from "react";
import ChoroplethMap from "@/components/ChoroplethMap";


type MoodDoc = {
  _id?: string;
  country: string;
  good: number;
  bad: number;
};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MoodDoc[]>([]);
  const [lastVote, setLastVote] = useState<"good" | "bad" | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [animateMsg, setAnimateMsg] = useState(false);

  const goodReactions = [
    "Love that energy! 🌟",
    "Your positivity is contagious ✨",
    "Keep shining today ✨",
    "You’re on fire today 🔥",
    "Enjoy the sunshine inside you ☀️"
  ];

  const badReactions = [
    "It's okay to slow down 💛",
    "Sending good vibes your way ✨",
    "Tomorrow will be better 🌤️",
    "You’re stronger than you feel 🖤",
    "Bad days don’t define you 💫"
  ];

  function triggerReaction(type: "good" | "bad") {
    const list = type === "good" ? goodReactions : badReactions;
    const message = list[Math.floor(Math.random() * list.length)];
    setReaction(message);

    setAnimateMsg(true);
    setTimeout(() => setAnimateMsg(false), 4000);
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats as MoodDoc[]);
      }
    } catch (err) {
      console.error("loadStats:", err);
    }
  }

  function totals() {
    return stats.reduce(
      (acc, s) => {
        acc.good += s.good || 0;
        acc.bad += s.bad || 0;
        return acc;
      },
      { good: 0, bad: 0 }
    );
  }

  async function sendVote(mood: "good" | "bad") {
    try {
      setLoading(true);
      setLastVote(mood);
      triggerReaction(mood); 
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });

      await res.json();
      await loadStats();
    } catch (err) {
      console.error("vote error:", err);
      setLastVote(null);
    } finally {
      setLoading(false);
    }
  }

  const { good, bad } = totals();
  const grandTotal = good + bad || 0;
  const goodPct = grandTotal ? Math.round((good / grandTotal) * 100) : 0;
  const badPct = grandTotal ? 100 - goodPct : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* subtle glow blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-10 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute top-40 -right-10 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-10">
        {/* Top: Title */}
        <header className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-cyan-400/40 text-[11px] text-cyan-100 mb-4">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live • MoodMap
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Read the <span className="text-cyan-400">mood</span> of the planet
          </h1>
          <p className="mt-3 text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            Cast your vote and watch the world glow between good days and bad days.  
            Every click shifts the colors.
          </p>
        </header>

        {/* Main Layout: 2 columns on large screens */}
        <main className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] items-start">
          
          {/* Poll Card */}
          <section className="w-full bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(8,47,73,0.75)] backdrop-blur-sm">
            {reaction && (
  <div
    className={`
      mb-4 px-4 py-3 rounded-xl text-sm font-medium
      bg-white/10 border border-white/20 backdrop-blur-xl shadow-lg
      text-slate-100 w-fit
      transform transition-all duration-700
      ${animateMsg ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}
    `}
  >
    {reaction}
  </div>
)}

            {!lastVote ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                      How&apos;s your day going?
                      
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      Answer once, change it anytime.
                    </p>
                  </div>
                  {grandTotal > 0 && (
                    <div className="hidden sm:flex flex-col items-end text-xs text-slate-400">
                      <span>Global responses</span>
                      <span className="font-semibold text-cyan-300 text-base">
                        {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Buttons row */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => sendVote("good")}
                    disabled={loading}
                    className="group relative rounded-2xl px-5 py-4 bg-gradient-to-r from-emerald-500 via-cyan-400 to-sky-400
                               text-left hover:shadow-[0_0_35px_rgba(34,211,238,0.65)]
                               hover:-translate-y-[1px] active:translate-y-[1px]
                               transform transition duration-150 focus:outline-none disabled:opacity-70"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base sm:text-lg font-semibold flex items-center gap-2">
                          😊 Good day
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-200/60">
                            Positive
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-emerald-50/95 mt-1">
                          Chill, productive or just quietly happy.
                        </div>
                      </div>
                      <div className="hidden sm:block text-emerald-50/80 text-xs text-right">
                        Tap to nudge the map<br />towards green.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => sendVote("bad")}
                    disabled={loading}
                    className="group relative rounded-2xl px-5 py-4 bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500
                               text-left hover:shadow-[0_0_35px_rgba(244,114,182,0.65)]
                               hover:-translate-y-[1px] active:translate-y-[1px]
                               transform transition duration-150 focus:outline-none disabled:opacity-70"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base sm:text-lg font-semibold flex items-center gap-2">
                          😞 Bad day
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900/50 border border-rose-200/60">
                            It&apos;s okay
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-rose-50/95 mt-1">
                          Overwhelmed, tired or just not feeling it.
                        </div>
                      </div>
                      <div className="hidden sm:block text-rose-50/80 text-xs text-right">
                        Your honesty shapes<br />the red side.
                      </div>
                    </div>
                  </button>
                </div>

                {/* Global mood bar */}
                {grandTotal > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>Live global mood balance</span>
                      <span className="text-slate-400">
                        Good {goodPct}% • Bad {badPct}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 transition-all duration-500"
                        style={{ width: `${goodPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>More red on the map = more rough days.</span>
                      <span>More green = better vibes.</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // After vote state
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                      Thanks for sharing
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          lastVote === "good"
                            ? "bg-emerald-900/50 border-emerald-300/60 text-emerald-100"
                            : "bg-rose-900/50 border-rose-300/60 text-rose-100"
                        }`}
                      >
                        You picked {lastVote === "good" ? "Good" : "Bad"}
                      </span>
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      Here&apos;s how your vote blends into the global mood.
                    </p>
                  </div>
                  <button
                    onClick={() => setLastVote(null)}
                    className="text-[11px] text-slate-300 hover:text-cyan-300 underline underline-offset-4"
                  >
                    Change my vote
                  </button>
                </div>

                {grandTotal > 0 && (
                  <div className="space-y-4">
                    {/* Good bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1">
                          😊 <span className="font-medium">Good</span>
                        </span>
                        <span className="text-slate-300">
                          {good.toLocaleString()} • {goodPct}%
                        </span>
                      </div>
                      <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            lastVote === "good"
                              ? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400"
                              : "bg-emerald-400/90"
                          }`}
                          style={{ width: `${goodPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Bad bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1">
                          😞 <span className="font-medium">Bad</span>
                        </span>
                        <span className="text-slate-300">
                          {bad.toLocaleString()} • {badPct}%
                        </span>
                      </div>
                      <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            lastVote === "bad"
                              ? "bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-400"
                              : "bg-rose-400/90"
                          }`}
                          style={{ width: `${badPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Map Card */}
          <section className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                🌍 Global Mood Map
              </h2>
              {grandTotal > 0 && (
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Total votes:{" "}
                  <span className="font-semibold text-cyan-300">
                    {grandTotal.toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            <ChoroplethMap stats={stats}/>
          </section>
        </main>
      </div>
    </div>
  );
}

