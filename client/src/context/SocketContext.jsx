// ─── Socket Context ───────────────────────────────────────────────────────────
// Socket.io connection poori app mein share karne ke liye
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // online users ki list

  useEffect(() => {
    if (user) {
      // ── Socket connect karo ─────────────────────────────────────────────
      const token = localStorage.getItem("token");
      const newSocket = io("https://chatapp-815o.onrender.com", {
        auth: { token }, // JWT token bhejo
      });

      newSocket.on("connect", () => {
        console.log("Socket connected!");
      });

      // ── Online users track karo ─────────────────────────────────────────
      newSocket.on("user:online", ({ userId }) => {
        setOnlineUsers((prev) => [...new Set([...prev, userId])]);
      });

      newSocket.on("user:offline", ({ userId }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket error:", err.message);
      });

      setSocket(newSocket);

      // ── Cleanup - logout pe disconnect karo ─────────────────────────────
      return () => {
        newSocket.disconnect();
      };
    } else {
      // User logout hua toh socket band karo
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
