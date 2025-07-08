// src/hooks/useSocketIO.js
import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const socket = io("https://mar-trio-urban-appendix.trycloudflare.com", {
  transports: ["websocket"],
  withCredentials: true,
  timeout: 10000,
});

export const useSocketIO = () => {
  const [connected, setConnected] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [videoUpdates, setVideoUpdates] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("pingServer", "Video template client connected");
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("pongClient", (msg) => setServerMessage(msg));
    socket.on("connect_error", (err) => console.error("Socket error:", err));
    socket.on("videoUpdate", setVideoUpdates);

    return () => {
      socket.disconnect();
    };
  }, []);

  const emitEvent = useCallback((event, data) => {
    if (connected) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }, [connected]);

  return {
    connected,
    serverMessage,
    videoUpdates,
    emitEvent,
  };
};
