import { Server } from "socket.io";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: true, // Accept any origin temporarily (can restrict later)
      credentials: true,
    },
    allowEIO3: true // 🔁 Compatibility with older Socket.IO clients
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.onAny((event, ...args) => {
      console.log(`[${socket.id}] Event: ${event}`, ...args);
    });

    socket.emit("pongClient", "Server connected");

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  console.log("🚀 Socket.IO initialized");
};
