"use client";
import {mood} from 
import { useState, useEffect } from "react";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [stats, setStats] = useState([]);

  // 1) Fetch ALL countries on page load
  async function loadStats() {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  // 2) Vote request
  async function sendVote(mood) {
    try {
      setLoading(true);

      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });

      const data = await res.json();
      setResponse(data);

      // reload list after voting
      loadStats();
    } catch (err) {
      console.error("Vote error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 mt-20">

      {/* Title */}
      <h1 className="text-3xl font-bold">How's your day?</h1>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => sendVote("good")}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50"
        >
          Have a Good Day
        </button>

        <button
          onClick={() => sendVote("bad")}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50"
        >
          Have a Bad Day
        </button>
      </div>

      {/* Response (optional) */}
      {response && (
        <div className="bg-slate-900 p-4 rounded-lg text-sm text-slate-300 max-w-md">
          <strong>Updated:</strong>
          <pre className="mt-2 text-xs">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* --- List Section --- */}
      <div className="w-full max-w-lg mt-10">
        <h2 className="text-xl font-semibold mb-3">Country Stats</h2>

        {stats.length === 0 ? (
          <p className="text-slate-400">No votes yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.map((item) => (
              <div
                key={item._id}
                className="flex justify-between items-center p-3 rounded-lg bg-slate-800"
              >
                <span className="font-medium">{item.country}</span>
                <span className="text-sm text-slate-300">
                  Good: {item.good} • Bad: {item.bad}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
