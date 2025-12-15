///////////////////////them 2 ----------------------------------
"use client";

import { useEffect, useState, useRef } from "react";
import anime from "animejs";
import { motion, AnimatePresence } from "framer-motion";
import ChoroplethMap from "@/components/ChoroplethMap";
import { io, Socket } from "socket.io-client";
import countryMap from "@/lib/countyname-code.json";
import LiveVoteToast from '@/components/LiveVoteToast';
import confetti from "canvas-confetti";

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
  // celebration state removed in favor of canvas-confetti
  const [activeVote, setActiveVote] = useState<{ country: string, mood: "good" | "bad" } | null>(null);

  // Refs for animations
  const headerRef = useRef<HTMLElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
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

      // Trigger celebration for good votes
      // if (mood === "good") {
      //   setCelebrating(true);
      //   setTimeout(() => setCelebrating(false), 2000);
      // }

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
        if (mood === "good") {
          // Trigger Confetti Celebration for Good Votes
          const duration = 3000;
          const end = Date.now() + duration;

          const frame = () => {
            confetti({
              particleCount: 2,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#34d399', '#10b981', '#fbbf24'] // Emerald & Amber
            });
            confetti({
              particleCount: 2,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#34d399', '#10b981', '#fbbf24']
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          };
          frame();
        }
        // Trigger map flash effect
        setActiveVote({ country: countryCode, mood });
        setTimeout(() => setActiveVote(null), 3000);

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

  // Global Mouse Tracking for Spotlight
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      document.body.style.setProperty("--cursor-x", `${e.clientX}px`);
      document.body.style.setProperty("--cursor-y", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  const { good, bad } = totals();
  const grandTotal = good + bad || 0;
  const goodPct = grandTotal ? Math.round((good / grandTotal) * 100) : 0;
  const badPct = grandTotal ? 100 - goodPct : 0;

  return (
    <div className="min-h-screen bg-sky-200 text-slate-900 overflow-x-hidden">
      <LiveVoteToast />

      {/* Celebration Overlay Removed */}


      {/* subtle responsive glow blobs (Warm/Sunny Theme) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-70">
        <div ref={blob1Ref} className="absolute -top-32 -left-10 sm:left-10 h-48 sm:h-72 w-48 sm:w-72 rounded-full bg-orange-200/40 blur-3xl mix-blend-multiply" />
        <div ref={blob2Ref} className="absolute top-20 sm:top-40 -right-20 sm:-right-10 h-56 sm:h-80 w-56 sm:w-80 rounded-full bg-amber-200/40 blur-3xl mix-blend-multiply" />
        <div ref={blob3Ref} className="absolute bottom-0 left-1/4 sm:left-1/3 h-32 sm:h-48 w-56 sm:w-72 rounded-full bg-rose-200/40 blur-3xl mix-blend-multiply" />
      </div>

      {/* GLOBAL SPOTLIGHT (Orange/Amber) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300 mix-blend-screen"
        style={{
          // background: `radial-gradient(800px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(248, 158, 56, 0.29), transparent 5%)`
        }}
      />

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8 flex flex-col gap-10">
        {/* Top: Title */}
        <header className="text-center" ref={headerRef}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600 mb-4 shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live • MoodMap
          </motion.div>
          {/* Colorblind mode removed */}
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 text-center text-slate-900">
            {["Read", "the", "mood", "of", "the", "planet"].map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.0, delay: 0.1 + i * 0.1, ease: "easeOut" }}
                className={`inline-block mr-2 sm:mr-3 last:mr-0 ${word === "mood" ? "text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 animate-gradient-x" : ""}`}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.6 }}
            className="hidden sm:block mt-3 text-slate-500 max-w-xl mx-auto text-sm sm:text-base"
          >
            Cast your vote and watch the world glow between good days and bad days.
            Every click shifts the colors.
          </motion.p>
        </header>

        {/* Main Layout: 2 columns on large screens */}
        <main className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] items-start">

          {/* Poll Card */}
          <div className="relative">
            {/* toast with animation and color-coded styling */}


            {loading && !toastMsg && (
              <div className="mx-auto max-w-2xl mb-4 flex justify-center">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-white border border-slate-200 text-slate-600 text-sm shadow-sm" role="status" aria-live="polite">
                  <svg className="h-4 w-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" /><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                  <div>Sending vote…</div>
                </div>
              </div>
            )}

            <section
              onMouseMove={handleMouseMove}
              className="group/card relative w-full bg-sky-800 border border-sky-700/50 rounded-3xl p-4 sm:p-5 lg:p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] overflow-hidden isolate"
            >
              {/* Spotlight for First Box */}
              <div className="absolute inset-0 -z-10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"
                style={{ background: `radial-gradient(800px circle at var(--x) var(--y), rgba(16, 185, 129, 0.05), transparent 40%)` }}
              />

              {!lastVote ? (
                <div className="space-y-3 relative">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                        How&apos;s your day?
                      </h2>
                      <p className="text-sky-200 text-xs mt-0.5">
                        Answer once, change anytime.
                      </p>
                    </div>
                    {grandTotal > 0 && (
                      <div className="hidden sm:flex flex-col items-end text-xs text-sky-300">
                        <span>Responses</span>
                        <span className="font-semibold text-sky-50 text-sm">
                          {grandTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Buttons row - Highly Visible Animated Gradient Cards */}
                  <div className="flex flex-col gap-4">
                    {/* GOOD VOTE BUTTON */}
                    <button
                      onClick={() => sendVote("good")}
                      onMouseMove={handleMouseMove}
                      disabled={loading}
                      className="group relative w-full text-left transition-transform active:scale-[0.98]"
                    >
                      {/* Animated Gradient Border Layer */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-70 blur-sm transition-all duration-500 group-hover:opacity-100 group-hover:blur-md animate-pulse" />

                      {/* Main Card Content: CLEAN SINGLE BORDER */}
                      <div className="relative rounded-2xl bg-sky-200 border border-slate-100 shadow-sm overflow-hidden h-20 sm:h-24 transition-all duration-300 group-hover:shadow-md">

                        {/* 🌊 LIQUID LAYER (Background) */}
                        <div className="absolute inset-x-0 bottom-0 top-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
                          <div
                            className="absolute bottom-0 w-full transition-all duration-700 ease-in-out"
                            style={{ height: `${Math.max(30, goodPct)}%` }}
                          >
                            {/* Back Wave (More Visible) */}
                            <motion.div
                              animate={{ x: ["-50%", "0%"] }}
                              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                              className="absolute -top-3 left-0 w-[200%] h-6 bg-repeat-x bg-cover opacity-60 mix-blend-multiply"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%2310b981'/%3E%3C/svg%3E")` }}
                            />

                            {/* Front Wave (More Visible) */}
                            <motion.div
                              animate={{ x: ["-50%", "0%"] }}
                              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                              className="absolute -top-4 left-0 w-[200%] h-6 bg-repeat-x bg-cover z-10 opacity-100"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%236ee7b7'/%3E%3C/svg%3E")` }}
                            />

                            {/* Liquid Body */}
                            <div className="relative h-full w-full bg-emerald-400 opacity-90 z-0" />
                          </div>
                        </div>

                        {/* LIGHT REFLECTION (Overlay) */}
                        <div className="absolute inset-0 z-[5] bg-gradient-to-b from-white/60 to-transparent opacity-80 pointer-events-none rounded-2xl" />

                        {/* Content Container (Foreground) */}
                        <div className="relative z-10 h-full px-3 sm:px-4 flex items-center gap-3 sm:gap-4 ">
                          {/* Compact Floating Icon */}
                          <div
                            className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center text-xl sm:text-2xl bg-white/90 rounded-xl shadow-sm border border-emerald-100 text-emerald-600 backdrop-blur-sm"
                          >
                            😊
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-base sm:text-lg group-hover:text-emerald-900 transition-colors drop-shadow-sm">
                                Feeling Good
                              </span>
                              <span className="shrink-0 inline-flex items-center text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-emerald-900 bg-white/50 px-1.5 py-0.5 rounded-md backdrop-blur-md border border-white/20 shadow-sm">
                                Thriving
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-700 font-medium leading-snug mt-0.5 line-clamp-1 mix-blend-hard-light">
                              Productive, happy, or at peace.
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* BAD VOTE BUTTON */}
                    <button
                      onClick={() => sendVote("bad")}
                      onMouseMove={handleMouseMove}
                      disabled={loading}
                      className="group relative w-full text-left transition-transform active:scale-[0.98]"
                    >
                      {/* Animated Gradient Border Layer */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-400 opacity-70 blur-sm transition-all duration-500 group-hover:opacity-100 group-hover:blur-md animate-pulse" />

                      {/* Main Card Content: CLEAN SINGLE BORDER */}
                      <div className="relative rounded-2xl bg-sky-200 border border-slate-100 shadow-sm overflow-hidden h-20 sm:h-24 transition-all duration-300 group-hover:shadow-md">

                        {/* 🌊 LIQUID LAYER (Background) */}
                        <div className="absolute inset-x-0 bottom-0 top-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
                          <div
                            className="absolute bottom-0 w-full transition-all duration-700 ease-in-out"
                            style={{ height: `${Math.max(30, badPct)}%` }}
                          >
                            {/* Back Wave (More Visible) */}
                            <motion.div
                              animate={{ x: ["-50%", "0%"] }}
                              transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
                              className="absolute -top-3 left-0 w-[200%] h-6 bg-repeat-x bg-cover opacity-60 mix-blend-multiply"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23e11d48'/%3E%3C/svg%3E")` }}
                            />

                            {/* Front Wave (More Visible) */}
                            <motion.div
                              animate={{ x: ["-50%", "0%"] }}
                              transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
                              className="absolute -top-4 left-0 w-[200%] h-6 bg-repeat-x bg-cover z-10 opacity-100"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23fb7185'/%3E%3C/svg%3E")` }}
                            />

                            {/* Liquid Body */}
                            <div className="relative h-full w-full bg-rose-400 opacity-90 z-0" />
                          </div>
                        </div>

                        {/* LIGHT REFLECTION (Overlay) */}
                        <div className="absolute inset-0 z-[5] bg-gradient-to-b from-white/60 to-transparent opacity-80 pointer-events-none rounded-2xl" />

                        {/* Content Container (Foreground) */}
                        <div className="relative z-10 h-full px-3 sm:px-4 flex items-center gap-3 sm:gap-4">
                          {/* Compact Floating Icon */}
                          <div
                            className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center text-xl sm:text-2xl bg-white/90 rounded-xl shadow-sm border border-rose-100 text-rose-600 backdrop-blur-sm"
                          >
                            😞
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-base sm:text-lg group-hover:text-rose-900 transition-colors drop-shadow-sm">
                                Having a Hard Time
                              </span>
                              <span className="shrink-0 inline-flex items-center text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-rose-900 bg-white/50 px-1.5 py-0.5 rounded-md backdrop-blur-md border border-white/20 shadow-sm">
                                Human
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-700 font-medium leading-snug mt-0.5 line-clamp-1 mix-blend-hard-light">
                              Anxious, tired, or need a reset.
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Global mood bar (Pre-Vote) */}
                  {grandTotal > 0 && (
                    <div className="mt-4 space-y-2 bg-sky-950/50 p-4 rounded-xl border border-sky-800/50">
                      <div className="flex justify-between text-[11px] text-sky-300 font-medium uppercase tracking-wider">
                        <span>Global Mood Balance</span>
                        <span className="text-sky-400 normal-case tracking-normal">
                          Good {goodPct}% • Bad {badPct}%
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-sky-900/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goodPct}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
                        />
                      </div>

                    </div>
                  )}
                </div>
              ) : (
                // After vote state
                <div className="space-y-5" ref={resultsRef}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-white">
                        Thanks for sharing
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${lastVote === "good"
                            ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-900/30 border-rose-500/30 text-rose-300"
                            }`}
                        >
                          <span className="hidden sm:inline">You picked {lastVote === "good" ? "Good" : "Bad"}</span>
                        </span>
                      </h2>
                      <p className="text-sky-200 text-xs sm:text-sm mt-1">
                        Here&apos;s how your vote blends into the global mood.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setLastVote(null);
                        setToastMsg(null);
                        setToastVoteType(null);
                      }}
                      className="group flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-sky-200 border border-sky-300 text-sky-900 hover:bg-sky-300 hover:border-sky-400 hover:shadow-sm transition-all"
                    >
                      <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500 text-sky-700 group-hover:text-sky-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 12V4H12" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.25022 4 6.82447 5.40704 5.38451 7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Change vote
                    </button>
                  </div>

                  {grandTotal > 0 && (
                    <div className="space-y-4">
                      {/* Good bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center gap-1 text-sky-100">
                            😊 <span className="font-medium">Good</span>
                          </span>
                          <span className="text-sky-300">
                            {good.toLocaleString()} • {goodPct}%
                          </span>
                        </div>
                        <div className="w-full h-4 bg-sky-950/50 rounded-full overflow-hidden">
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
                          <span className="flex items-center gap-1 text-sky-100">
                            😞 <span className="font-medium">Bad</span>
                          </span>
                          <span className="text-sky-300">
                            {bad.toLocaleString()} • {badPct}%
                          </span>
                        </div>
                        <div className="w-full h-4 bg-sky-950/50 rounded-full overflow-hidden">
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
                  className={`mt-4 w-full flex items-center justify-between px-5 py-4 rounded-xl border shadow-lg backdrop-blur-xl ${toastVoteType === "good"
                    ? "bg-emerald-50 border-emerald-100 shadow-emerald-100/50"
                    : "bg-rose-50 border-rose-100 shadow-rose-100/50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${toastVoteType === "good" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className={`text-sm font-semibold ${toastVoteType === "good" ? "text-emerald-800" : "text-rose-800"}`}>
                      {toastMsg}
                    </span>
                  </div>
                  <button
                    onClick={() => { setToastMsg(null); setToastVoteType(null); }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${toastVoteType === "good"
                      ? "text-emerald-600 hover:bg-emerald-100"
                      : "text-rose-600 hover:bg-rose-100"
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


            <ChoroplethMap stats={stats} activeVote={activeVote} />
          </section>
        </main>
      </div >
    </div >
  );
}


function LinkText({ good, bad }: { good: number, bad: number }) {
  return (
    <div className='flex justify-between text-[10px] text-slate-500 mt-1'>
      <span>More solid green = better days.</span>
      <span>More solid red = tough days.</span>
    </div>
  );
}

