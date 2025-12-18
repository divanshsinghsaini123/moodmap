

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const SERVER_URL = "https://moodmap-socket-server.onrender.com";
const socket: Socket = io(SERVER_URL);

// Time each message is displayed
const DISPLAY_DURATION_MS = 4000;
const MESSAGE_EVENT_NAME = "VoteMessage";

interface QueuedMessage {
  id: number;
  text: string;
}

const LiveVoteToast: React.FC = () => {
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<QueuedMessage | null>(null);
  const [isMobile, setIsMobile] = useState(false); // Track screen size

  // Determine mood for styling based on the string content
  const isGood = currentMessage?.text.toLowerCase().includes('good') ?? false;

  // Check for mobile device on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      // 768px is standard tablet/mobile breakpoint
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const processNextMessage = useCallback(() => {
    if (currentMessage || messageQueue.length === 0) {
      return;
    }

    const [nextMessage, ...rest] = messageQueue;

    setCurrentMessage(nextMessage);
    setMessageQueue(rest);

    setTimeout(() => {
      setCurrentMessage(null);
    }, DISPLAY_DURATION_MS);

  }, [currentMessage, messageQueue]);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (typeof data !== 'string') return;

      const newMessage: QueuedMessage = {
        id: Date.now(),
        text: data,
      };

      setMessageQueue(prevQueue => [...prevQueue, newMessage]);
    };

    socket.on(MESSAGE_EVENT_NAME, handleNewMessage);

    return () => {
      socket.off(MESSAGE_EVENT_NAME, handleNewMessage);
    };
  }, []);

  useEffect(() => {
    if (!currentMessage && messageQueue.length > 0) {
      const timer = setTimeout(processNextMessage, 50);
      return () => clearTimeout(timer);
    }
  }, [messageQueue, currentMessage, processNextMessage]);

  // --- Text Animation Variants (Desktop Only) ---
  const sentenceVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.08,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 5,
      filter: "blur(2px)"
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.3 }
    },
  };

  return (
    <AnimatePresence mode="wait">
      {currentMessage && (
        <motion.div
          key={currentMessage.id}
          // Toast Entry/Exit Animation
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}

          // RESPONSIVE POSITIONING:
          // Default (Mobile): Centered horizontally (left-1/2 -translate-x-1/2)
          // Width: w-auto to fit content, max-w-[95%] to almost fill screen if needed
          // Desktop (md:): Top right (md:right-6 md:left-auto md:translate-x-0)
          className="fixed top-24 z-[9999] left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 w-auto max-w-[95%] md:max-w-none"
        >
          <div className="flex items-center gap-4 px-5 py-3 rounded-xl border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
            {/* Pulsing Dot */}
            <span className="relative flex h-3 w-3 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGood ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isGood ? 'bg-emerald-500' : 'bg-rose-500'} border border-black`}></span>
            </span>

            <div className="flex flex-col text-sm truncate">
              <span className="uppercase text-[10px] font-black tracking-widest text-gray-500 leading-none mb-1">
                Live Vote
              </span>

              {/* Animated Text Container */}
              {isMobile ? (
                // PERFORMANCE OPTIMIZATION:
                // On mobile, render plain text to avoid the heavy CPU load of animating
                // individual words with spring physics and blur filters.
                <div className="font-semibold leading-none whitespace-nowrap">
                  {currentMessage.text}
                </div>
              ) : (
                // On desktop, use the fancy word-by-word typewriter effect
                <motion.div
                  className="font-semibold leading-none whitespace-nowrap flex flex-nowrap gap-1"
                  variants={sentenceVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {currentMessage.text.split(" ").map((word, index) => (
                    <motion.span key={index} variants={wordVariants}>
                      {word}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LiveVoteToast;