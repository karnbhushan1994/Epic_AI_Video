import { Server } from "socket.io";
import { generateVideo, checkStatus } from "./controllers/app/freepikController.js";

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

    socket.on("subscribe_creation", async ({ creationId, taskId }) => {
      console.log(`⚡️ Subscribing to creation: ${creationId} with task: ${taskId}`);
      // Logic to initiate video generation and status polling
    });

    socket.on("unsubscribe_creation", ({ creationId, taskId }) => {
      console.log(`🔌 Unsubscribing from creation: ${creationId} with task: ${taskId}`);
      // Logic to stop polling or clean up
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
  });

  console.log("🚀 Socket.IO ready");
};
