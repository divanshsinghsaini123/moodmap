// src/socket.ts

import { io, Socket } from "socket.io-client";

// Ensure this URL matches your Node.js server
const SERVER_URL = process.env.SOCKET_SERVER_URL || "http://localhost:3000";

// Export the singleton socket instance
export const socket: Socket = io(SERVER_URL);

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});