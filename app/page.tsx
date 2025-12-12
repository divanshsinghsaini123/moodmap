///////////////////////them 2 ----------------------------------
"use client";

import { useEffect, useState, useRef } from "react";
import anime from "animejs";
import { motion, AnimatePresence } from "framer-motion";
import ChoroplethMap from "@/components/ChoroplethMap";
import { io, Socket } from "socket.io-client";
import countryMap from "@/lib/countyname-code.json";
import LiveVoteToast from '@/components/LiveVoteToast';

const SERVER_URL = "https://moodmap-socket-server.onrender.com"
const socket = io(SERVER_URL);

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastVoteType, setToastVoteType] = useState<"good" | "bad" | null>(null);

  // Refs for animations
  const headerRef = useRef<HTMLElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Animation Initialization
  useEffect(() => {
    // 1. Header Elements Staggered Entry
    if (headerRef.current) {
      const timeline = anime.timeline({
        easing: 'easeOutExpo',
      });

      timeline
        .add({
          targets: headerRef.current.querySelectorAll('.stagger-text'),
          translateY: ['100%', '0%'],
          duration: 1200,
          delay: anime.stagger(100),
        })
        .add({
          targets: headerRef.current.querySelectorAll('.header-item'),
          translateY: [20, 0],
          opacity: [0, 1],
          duration: 800,
          delay: anime.stagger(200),
        }, '-=800'); // Overlap with text reveal
    }

    // 2. Background Blobs Floating Effect (Randomized)
    const animateBlob = (el: HTMLElement | null) => {
      if (!el) return;
      anime({
        targets: el,
        translateX: () => anime.random(-30, 30),
        translateY: () => anime.random(-30, 30),
        scale: () => anime.random(0.9, 1.1),
        easing: 'easeInOutSine',
        duration: () => anime.random(3000, 6000),
        complete: () => animateBlob(el), // Loop
      });
    };

    animateBlob(blob1Ref.current);
    animateBlob(blob2Ref.current);
    animateBlob(blob3Ref.current);
  }, []);

  // Separate effect for results animation
  useEffect(() => {
    if (lastVote && resultsRef.current) {
      anime({
        targets: resultsRef.current.children,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 800,
        delay: anime.stagger(100),
        easing: 'easeOutExpo'
      });
    }
  }, [lastVote]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  };


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
    // show toast message above poll card
    setToastVoteType(type);
    setToastMsg(message);
    // auto-dismiss after 7s
    const t = setTimeout(() => {
      setToastMsg(null);
      setToastVoteType(null);
    }, 10000);
    return () => clearTimeout(t);
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

      let data = await res.json();
      let countryCode = data.country.country;
      if (data.success && countryCode) {
        // Use the code directly or a friendly name if needed
        const countryDisplay = countryCode === "UN" ? "an unknown location" : countryCode;
        const coutryname = (countryMap as Record<string, string>)[countryDisplay];

        if (coutryname) {
          console.log(coutryname, countryCode);
        }
        else {
          console.log("country hi nhi milil");
        }
        // 4. Construct the required toast string
        const toastString = `Someone from ${coutryname} is feeling ${mood} today`;

        // 5. Emit the string via Socket.IO
        socket.emit("VoteMessage", toastString);

        console.log("Emitting toast:", toastString);
      } else {
        console.error("API response missing success or country code:", data);
      }

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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      <LiveVoteToast />


      {/* subtle responsive glow blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div ref={blob1Ref} className="absolute -top-32 -left-10 sm:left-10 h-48 sm:h-72 w-48 sm:w-72 rounded-full bg-cyan-500/25 blur-3xl" />
        <div ref={blob2Ref} className="absolute top-20 sm:top-40 -right-20 sm:-right-10 h-56 sm:h-80 w-56 sm:w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div ref={blob3Ref} className="absolute bottom-0 left-1/4 sm:left-1/3 h-32 sm:h-48 w-56 sm:w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-10">
        {/* Top: Title */}
        <header className="text-center" ref={headerRef}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-cyan-400/40 text-[11px] text-cyan-100 mb-4 opacity-0 header-item">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live • MoodMap
          </div>
          {/* Colorblind mode removed */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight overflow-hidden">
            <span className="inline-block overflow-hidden align-bottom">
              <span className="stagger-text inline-block transform-gpu">Read</span>
            </span>{" "}
            <span className="inline-block overflow-hidden align-bottom">
              <span className="stagger-text inline-block transform-gpu">the</span>
            </span>{" "}
            <span className="text-cyan-400 inline-block overflow-hidden align-bottom">
              <span className="stagger-text inline-block transform-gpu">mood</span>
            </span>{" "}
            <span className="inline-block overflow-hidden align-bottom">
              <span className="stagger-text inline-block transform-gpu">of</span>
            </span>{" "}
            <span className="inline-block overflow-hidden align-bottom">
              <span className="stagger-text inline-block transform-gpu">the</span>
            </span>{" "}
            <span className="inline-block overflow-hidden align-bottom">
              <span className="stagger-text inline-block transform-gpu">planet</span>
            </span>
          </h1>
          <p className="mt-3 text-slate-300 max-w-xl mx-auto text-sm sm:text-base opacity-0 header-item">
            Cast your vote and watch the world glow between good days and bad days.
            Every click shifts the colors.
          </p>
        </header>

        {/* Main Layout: 2 columns on large screens */}
        <main className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] items-start">

          {/* Poll Card */}
          <div className="relative">
            {/* toast with animation and color-coded styling */}


            {loading && !toastMsg && (
              <div className="mx-auto max-w-2xl mb-4 flex justify-center">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-white/6 border border-white/10 text-slate-100 text-sm shadow" role="status" aria-live="polite">
                  <svg className="h-4 w-4 animate-spin text-cyan-300" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" /><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                  <div>Sending vote…</div>
                </div>
              </div>
            )}

            <section
              onMouseMove={handleMouseMove}
              className="group/card relative w-full bg-slate-900/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5 lg:p-6 shadow-[0_0_60px_rgba(8,47,73,0.75)] backdrop-blur-sm overflow-hidden isolate"
            >
              {/* Spotlight for First Box */}
              <div className="absolute inset-0 -z-10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"
                style={{ background: `radial-gradient(1000px circle at var(--x) var(--y), rgba(148, 163, 184, 0.1), transparent 40%)` }}
              />

              {!lastVote ? (
                <div className="space-y-5 relative">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
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
                      onMouseMove={handleMouseMove}
                      disabled={loading}
                      className="group relative rounded-2xl px-4 py-3.5 bg-gradient-to-br from-emerald-500/80 to-slate-900/90 border border-emerald-500/60
                               text-left hover:border-emerald-400 transition-colors duration-300
                               focus:ring-2 focus:ring-emerald-400 focus:outline-none disabled:opacity-70 overflow-hidden isolate"
                    >
                      {/* Fog Effect (Emerald Hover) */}
                      <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"
                        style={{ background: `radial-gradient(circle at var(--x) var(--y), rgba(16, 185, 129, 0.6), transparent 70%)` }}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-base sm:text-lg font-semibold flex items-center gap-2 text-slate-100">
                            😊 Good day
                            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-200">
                              Positive
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-400 group-hover:text-yellow-100/80 transition-colors mt-1">
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
                      onMouseMove={handleMouseMove}
                      disabled={loading}
                      className="group relative rounded-2xl px-4 py-3.5 bg-gradient-to-br from-rose-500/80 to-slate-900/90 border border-rose-500/60
                               text-left hover:border-rose-400 transition-colors duration-300
                               focus:ring-2 focus:ring-rose-400 focus:outline-none disabled:opacity-70 overflow-hidden isolate"
                    >
                      {/* Fog Effect (Orange Hover) */}
                      <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"
                        style={{ background: `radial-gradient(circle at var(--x) var(--y), rgba(249, 115, 22, 0.6), transparent 70%)` }}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-base sm:text-lg font-semibold flex items-center gap-2 text-slate-100">
                            😞 Bad day
                            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-200">
                              It&apos;s okay
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-400 group-hover:text-rose-100/80 transition-colors mt-1">
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
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>Live global mood balance</span>
                        <span className="text-slate-400">
                          Good {goodPct}% • Bad {badPct}%
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-500"
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
                <div className="space-y-5" ref={resultsRef}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                        Thanks for sharing
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${lastVote === "good"
                            ? "bg-emerald-900/50 border-emerald-300/60 text-emerald-100"
                            : "bg-rose-900/50 border-rose-300/60 text-rose-100"
                            }`}
                        >
                          <span className="hidden sm:inline">You picked {lastVote === "good" ? "Good" : "Bad"}</span>
                        </span>
                      </h2>
                      <p className="text-slate-400 text-xs sm:text-sm mt-1">
                        Here&apos;s how your vote blends into the global mood.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setLastVote(null);
                        setToastMsg(null);
                        setToastVoteType(null);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-cyan-400 transition-all shadow-sm active:scale-95"
                    >
                      ↺ Change my vote
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
                            className={`h-full rounded-full transition-all duration-700 ${lastVote === "good"
                              ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
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
                            className={`h-full rounded-full transition-all duration-700 ${lastVote === "bad"
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

            {/* Toast Notification (Below the card) */}
            <AnimatePresence>
              {toastMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`mt-4 w-full flex items-center justify-between px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-xl ${toastVoteType === "good"
                    ? "bg-emerald-900/90 border-emerald-500/40 shadow-emerald-900/20"
                    : "bg-rose-900/90 border-rose-500/40 shadow-rose-900/20"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${toastVoteType === "good" ? "bg-emerald-400 text-slate-900" : "bg-rose-400 text-white"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className={`text-sm font-semibold ${toastVoteType === "good" ? "text-emerald-100" : "text-rose-100"}`}>
                      {toastMsg}
                    </span>
                  </div>
                  <button
                    onClick={() => { setToastMsg(null); setToastVoteType(null); }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${toastVoteType === "good"
                      ? "text-emerald-200 hover:bg-emerald-500/20"
                      : "text-rose-200 hover:bg-rose-500/20"
                      }`}
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Map Card */}
          <section className="w-full">


            <ChoroplethMap stats={stats} />
          </section>
        </main>
      </div>
    </div>
  );
}

