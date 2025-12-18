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
    <div className="min-h-screen bg-[#8e9099] text-black font-sans p-1 sm:p-1 flex items-center justify-center font-bold">
      <LiveVoteToast />

      {/* MAIN DEVICE CONTAINER */}
      <div className="w-full max-w-7xl bg-white rounded-[1rem] border-[5px] border-black shadow-2xl overflow-hidden relative min-h-[580px] flex flex-col">

        {/* TOP BAR (Pills)
        <div className="flex justify-between items-center p-6 border-b-[3px] border-black">
          <div className="flex items-center gap-2">
            <button className="px-6 py-2 rounded-full border-[3px] border-black font-black text-sm bg-white hover:bg-zinc-100 uppercase tracking-wide flex items-center gap-2 transition-transform active:scale-95">
              🔊 Sound
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center font-black bg-white hover:bg-zinc-100 transition-transform active:scale-95">
              ✕
            </button>
            <button className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center font-black bg-white hover:bg-zinc-100 transition-transform active:scale-95">
              ↗
            </button>
            <button className="px-6 py-2 rounded-full border-[3px] border-black font-black text-sm bg-white hover:bg-zinc-100 uppercase tracking-wide transition-transform active:scale-95">
              Menu ≡
            </button>
          </div>
        </div> */}

        {/* BLUE TICKER BANNER */}
        <div className="relative w-full bg-[#4F46E5] border-b-[4px] border-black py-4 overflow-hidden shadow-sm z-10">
          <div className="whitespace-nowrap font-black text-white text-xl md:text-2xl tracking-widest uppercase animate-marquee">
            MOODMAP: THE WORLD HAS LOGGED {grandTotal.toLocaleString()} MOODS • KEEP VOTING • TRACK THE VIBE •
            MOODMAP: THE WORLD HAS LOGGED {grandTotal.toLocaleString()} MOODS • KEEP VOTING • TRACK THE VIBE •
          </div>
        </div>

        <div className="flex-1 p-6 sm:p-3 flex flex-col items-center bg-white relative">

          {/* GIANT TITLE */}
          <div className="text-center mb-2 relative z-10">
            <h1 className="text-6xl sm:text-7xl font-black tracking-tighter leading-none mb-1 uppercase drop-shadow-sm whitespace-nowrap">
              MOOD MAP
            </h1>
            <p className="font-black uppercase tracking-[0.2em] text-sm sm:text-lg mt-1">
              Global Sentiment Tracker
            </p>
          </div>

          {/* Main Layout Grid */}
          <main className="w-full grid gap-12 lg:grid-cols-[1fr_1.4fr] items-start max-w-6xl mx-auto relative z-10">

            {/* POLL COLUMN */}
            <div className="flex flex-col gap-6">

              {/* Loading Indicator */}
              {loading && !toastMsg && (
                <div className="w-full flex justify-center">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border-[3px] border-black bg-white font-bold text-sm">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" /><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    SENDING VOTE...
                  </div>
                </div>
              )}

              {!lastVote ? (
                <div className="space-y-6">
                  <div className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-3xl font-black uppercase mb-6 transform -skew-x-3">How's your day?</h2>

                    <div className="grid gap-4">
                      {/* GOOD VOTE BUTTON (Brutalist Wrapper around Liquid) */}
                      <button
                        onClick={() => sendVote("good")}
                        disabled={loading}
                        className="group relative w-full h-20 sm:h-24 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all overflow-hidden bg-white active:scale-[0.98]"
                      >
                        {/* LIQUID INTERNALS PRESERVED */}
                        <div className="absolute inset-x-0 bottom-0 top-0 z-0 overflow-hidden pointer-events-none">
                          <div className="absolute bottom-0 w-full transition-all duration-700 ease-in-out" style={{ height: `${Math.max(30, goodPct)}%` }}>
                            <motion.div animate={{ x: ["-50%", "0%"] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute -top-3 left-0 w-[200%] h-6 bg-repeat-x bg-cover opacity-60 mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%2310b981'/%3E%3C/svg%3E")` }} />
                            <motion.div animate={{ x: ["-50%", "0%"] }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }} className="absolute -top-4 left-0 w-[200%] h-6 bg-repeat-x bg-cover z-10 opacity-100" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%236ee7b7'/%3E%3C/svg%3E")` }} />
                            <div className="relative h-full w-full bg-emerald-400 opacity-90 z-0" />
                          </div>
                        </div>

                        <div className="relative z-10 h-full flex items-center justify-between px-6">
                          <span className="text-2xl sm:text-3xl font-black uppercase text-black bg-white/80 px-2 py-1 backdrop-blur-sm border-2 border-black rounded-lg transform -rotate-2">
                            FEELING GOOD
                          </span>
                          <span className="text-4xl transform group-hover:scale-125 transition-transform duration-300">😊</span>
                        </div>
                      </button>

                      {/* BAD VOTE BUTTON */}
                      <button
                        onClick={() => sendVote("bad")}
                        disabled={loading}
                        className="group relative w-full h-20 sm:h-24 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all overflow-hidden bg-white active:scale-[0.98]"
                      >
                        <div className="absolute inset-x-0 bottom-0 top-0 z-0 overflow-hidden pointer-events-none">
                          <div className="absolute bottom-0 w-full transition-all duration-700 ease-in-out" style={{ height: `${Math.max(30, badPct)}%` }}>
                            <motion.div animate={{ x: ["-50%", "0%"] }} transition={{ repeat: Infinity, duration: 9, ease: "linear" }} className="absolute -top-3 left-0 w-[200%] h-6 bg-repeat-x bg-cover opacity-60 mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23e11d48'/%3E%3C/svg%3E")` }} />
                            <motion.div animate={{ x: ["-50%", "0%"] }} transition={{ repeat: Infinity, duration: 7, ease: "linear" }} className="absolute -top-4 left-0 w-[200%] h-6 bg-repeat-x bg-cover z-10 opacity-100" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23fb7185'/%3E%3C/svg%3E")` }} />
                            <div className="relative h-full w-full bg-rose-400 opacity-90 z-0" />
                          </div>
                        </div>

                        <div className="relative z-10 h-full flex items-center justify-between px-6">
                          <span className="text-2xl sm:text-3xl font-black uppercase text-black bg-white/80 px-2 py-1 backdrop-blur-sm border-2 border-black rounded-lg transform rotate-1">
                            HARD TIME
                          </span>
                          <span className="text-4xl transform group-hover:scale-125 transition-transform duration-300">😞</span>
                        </div>
                      </button>
                    </div>

                    {grandTotal > 0 && (
                      <div className="mt-8 pt-6 border-t-[3px] border-black border-dashed">
                        <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-2">
                          <span>Global Mood</span>
                          <span>Good {goodPct}% • Bad {badPct}%</span>
                        </div>
                        <div className="w-full h-6 rounded-full border-[3px] border-black bg-white overflow-hidden p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goodPct}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-[#4F46E5] rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border-[3px] border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
                  <h2 className="text-4xl font-black uppercase mb-4">You Voted!</h2>
                  <div className="inline-block px-6 py-2 bg-[#4F46E5] text-white font-black text-xl transform -rotate-2 border-[3px] border-black rounded-lg mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {lastVote === "good" ? "GOOD VIBES" : "BAD VIBES"}
                  </div>
                  <p className="font-bold text-gray-500 mb-8 uppercase tracking-wide">Thanks for contributing to the map.</p>

                  <button
                    onClick={() => { setLastVote(null); setToastMsg(null); setToastVoteType(null); }}
                    className="px-6 py-3 rounded-xl border-[3px] border-black font-black uppercase hover:bg-zinc-100 transition-all flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12V4H12" /><path d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.25022 4 6.82447 5.40704 5.38451 7.5" /></svg>
                    Change Vote
                  </button>
                </div>
              )}
            </div>

            {/* MAP COLUMN */}
            <div className="relative">
              <div className="bg-white border-[3px] border-black rounded-[2rem] p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#f8f9fa]">
                <div className="absolute -top-6 -right-6 hidden lg:block">
                  <div className="bg-[#4F46E5] text-white font-black px-4 py-2 border-[3px] border-black rounded-lg transform rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    LIVE DATA
                  </div>
                </div>
                <ChoroplethMap stats={stats} activeVote={activeVote} />
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* TOAST OVERLAY */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
          >
            <div className="bg-white border-[3px] border-black rounded-xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg border-[3px] border-black flex items-center justify-center text-xl ${toastVoteType === 'good' ? 'bg-emerald-400' : 'bg-rose-400'}`}>
                {toastVoteType === 'good' ? '😊' : '😞'}
              </div>
              <div className="flex-1 font-black uppercase text-sm leading-tight">
                {toastMsg}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
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

