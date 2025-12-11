// src/components/LiveVoteToast.tsx

import React, { useState, useEffect, useCallback } from 'react';

import { io, Socket } from "socket.io-client";


const SERVER_URL =  "https://moodmap-socket-server.onrender.com"
 const socket =  io(SERVER_URL);
 console.log("fddddddddddddddddddddddddddddddddddddddd" +socket);
 // Import the singleton socket instance

// Time each message is displayed
const DISPLAY_DURATION_MS = 4000; 
const MESSAGE_EVENT_NAME = "VoteMessage"; // Must match your server's broadcast event

// Interface for messages stored in the queue (we only need the string and a unique ID)
interface QueuedMessage {
  id: number;
  text: string;
}

const LiveVoteToast: React.FC = () => {
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<QueuedMessage | null>(null);

  // Determine mood for styling based on the string content
  const isGood = currentMessage?.text.includes('feeling good') ?? false;

  // --- Queue Processor Function ---
  const processNextMessage = useCallback(() => {
    // Stop if a message is visible OR the queue is empty
    if (currentMessage || messageQueue.length === 0) {
      return;
    }

    const [nextMessage, ...rest] = messageQueue;

    // 1. Set the message for display
    setCurrentMessage(nextMessage);
    // 2. Remove it from the queue
    setMessageQueue(rest);

    // 3. Set a timer to clear the message and trigger the next one
    setTimeout(() => {
      setCurrentMessage(null);
    }, DISPLAY_DURATION_MS);
    
  }, [currentMessage, messageQueue]);

  // --- EFFECT 1: Socket Listener (Receives broadcasts and ADDS to queue) ---
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (typeof data !== 'string') return; // Safety check
      
      const newMessage: QueuedMessage = { 
          id: Date.now(), // Unique ID for queue/keying
          text: data, 
      };
      
      // Use the functional update to safely add to the queue state
      setMessageQueue(prevQueue => [...prevQueue, newMessage]);
    };

    socket.on(MESSAGE_EVENT_NAME, handleNewMessage);

    return () => {
      socket.off(MESSAGE_EVENT_NAME, handleNewMessage);
    };
  }, []);

  // --- EFFECT 2: Queue Driver (Runs processNextMessage when state changes) ---
  useEffect(() => {
    // If the queue has items AND nothing is currently being displayed, start the process
    if (!currentMessage && messageQueue.length > 0) {
      // Small delay prevents rapid rendering issues
      const timer = setTimeout(processNextMessage, 50);
      return () => clearTimeout(timer);
    }
  }, [messageQueue, currentMessage, processNextMessage]);


  // --- Render Logic (The Toast Bar) ---
  if (!currentMessage) {
    return null; 
  }
  
  return (
    <div 
      key={currentMessage.id}
      // Tailwind classes for positioning and styling
      className={`fixed top-4 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-xl z-[9999] transition-opacity duration-500 
                  animate-in fade-in slide-in-from-top-1 ${
                    isGood 
                      ? 'bg-emerald-600/95 border border-emerald-400 text-white' 
                      : 'bg-rose-600/95 border border-rose-400 text-white'
                  }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span>{isGood ? '😊' : '😞'} LIVE VOTE</span>
        <span className="font-normal">|</span>
        <span className="font-normal">{currentMessage.text}</span>
      </div>
    </div>
  );
};

export default LiveVoteToast;