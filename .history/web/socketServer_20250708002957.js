import { Server } from "socket.io";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Temporarily allow all origins
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket"],
    allowEIO3: true
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    socket.on("pingServer", (msg) => {
      console.log("📨 Received:", msg);
      socket.emit("pongClient", "Reply from server");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
  });

  console.log("🚀 Socket.IO ready");
};
