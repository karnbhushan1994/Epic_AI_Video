import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Your current Cloudflare tunnel URL
const socket = io("https://brandon-lightbox-concert-targets.trycloudflare.com", {
  transports: ["websocket"], // Only use WebSocket, no polling
  withCredentials: true,
  timeout: 10000,
});

function SocketTest() {
  const [connected, setConnected] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  useEffect(() => {
    // Event: connected
    socket.on("connect", () => {
      console.log("✅ Socket connected");
      setConnected(true);
      socket.emit("pingServer", "Client connected");
    });

    // Event: disconnected
    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setConnected(false);
    });

    // Event: pongClient (reply from server)
    const handlePong = (msg) => {
      console.log("✅ Server says:", msg);
      setServerMessage(msg);
    };

    // Event: connect_error
    const handleError = (err) => {
      console.error("❌ Connect error:", err.message);
    };

    // Optional: handle custom events from backend
    const handleShopifyEvent = (data) => {
      console.log("🛍️ Shopify event:", data);
    };

    const handleDbUpdate = (data) => {
      console.log("📦 DB update:", data);
    };

    // Attach listeners
    socket.on("pongClient", handlePong);
    socket.on("connect_error", handleError);
    socket.on("shopifyEvent", handleShopifyEvent);
    socket.on("dbUpdate", handleDbUpdate);

    // Cleanup on unmount
    return () => {
      socket.off("pongClient", handlePong);
      socket.off("connect_error", handleError);
      socket.off("shopifyEvent", handleShopifyEvent);
      socket.off("dbUpdate", handleDbUpdate);
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>🔌 Socket.IO Test</h2>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>
      {serverMessage && <p>Server says: {serverMessage}</p>}
    </div>
  );
}

export default SocketTest;
