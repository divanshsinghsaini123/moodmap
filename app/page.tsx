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
  

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats as MoodDoc[]);
        const total = (data.stats as MoodDoc[]).reduce((s, d) => s + (d.good || 0) + (d.bad || 0), 0);
        
      }
    } catch (err) {
      console.error("loadStats:", err);
    }
  }

  // Helper: compute global totals (across all countries)
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
      // optimistic local mark
      setLastVote(mood);

      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });
      await res.json();
      // refresh stats after vote
      await loadStats();
    } catch (err) {
      console.error("vote error:", err);
      // rollback optimistic if needed
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
    <div className="min-h-screen bg-slate-800 text-white flex items-start justify-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">How&apos;s your day going?</h1>
          <p className="text-slate-400 mt-2">Tap an option to share — results show instantly.</p>
        </header>

        {/* Poll Card */}
        <section className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          {/* Before vote: show buttons. After vote: show results */}
          {!lastVote ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => sendVote("good")}
                  disabled={loading}
                  className="group relative rounded-xl p-6 bg-gradient-to-tr from-emerald-600/80 to-emerald-500/70 hover:scale-[1.01] transform transition duration-150 focus:outline-none"
                >
                  <div className="text-lg font-semibold">Have a Good Day</div>
                  <div className="text-sm text-emerald-100/80 mt-1">Spread the positivity</div>
                </button>

                <button
                  onClick={() => sendVote("bad")}
                  disabled={loading}
                  className="group relative rounded-xl p-6 bg-gradient-to-tr from-rose-600/80 to-rose-500/70 hover:scale-[1.01] transform transition duration-150 focus:outline-none"
                >
                  <div className="text-lg font-semibold">Have a Bad Day</div>
                  <div className="text-sm text-rose-100/80 mt-1">Be honest — It&apos;s okay</div>
                </button>
              </div>

              <div className="text-sm text-slate-400 mt-2">
                Total responses: <span className="text-slate-200 font-medium">{grandTotal}</span>
              </div>
            </div>
          ) : (
            // Results view
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">Results</h3>
                    <span className="text-sm text-slate-400">Total: {grandTotal}</span>
                  </div>
                  <button
                    onClick={() => {
                      // allow revote: clear lastVote
                      setLastVote(null);
                    }}
                    className="text-sm text-slate-300 underline"
                  >
                    Vote again
                  </button>
                </div>

                {/* Good bar */}
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Good</span>
                    <span className="text-sm text-slate-300">{good} • {goodPct}%</span>
                  </div>
                  <div className="w-full h-9 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${lastVote === "good" ? "bg-emerald-500" : "bg-emerald-400/80"}`}
                      style={{ width: `${goodPct}%` }}
                    />
                  </div>
                </div>

                {/* Bad bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Bad</span>
                    <span className="text-sm text-slate-300">{bad} • {badPct}%</span>
                  </div>
                  <div className="w-full h-9 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${lastVote === "bad" ? "bg-rose-500" : "bg-rose-400/80"}`}
                      style={{ width: `${badPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* optionally show country breakdown preview */}
              <div>
                <h4 className="text-sm text-slate-400 mb-2">Top countries (by total votes)</h4>
                {/* <div className="flex flex-col gap-2">
                  {stats.slice(0, 5).map((c) => {
                    const t = (c.good || 0) + (c.bad || 0);
                    return (
                      <div key={c._id ?? c.country} className="flex justify-between items-center text-sm">
                        <div className="text-slate-200 font-medium">{c.country}</div>
                        <div className="text-slate-400">{t} ({c.good} / {c.bad})</div>
                      </div>
                    );
                  })}
                  {stats.length === 0 && <div className="text-slate-500">No country data yet.</div>}
                </div> */}

              </div>
            </div>
          )}
          <ChoroplethMap />
        </section>
      </div>
    </div>
  );
}
