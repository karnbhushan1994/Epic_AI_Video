import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://brandon-lightbox-concert-targets.trycloudflare.com", {
  transports: ["websocket"],
  withCredentials: true,
});

function SocketTest() {
  useEffect(() => {
    socket.emit("pingServer", "Client connected");

    socket.on("pongClient", (msg) => {
      console.log("✅ Server says:", msg);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connect error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <div>Socket.IO running. Open console.</div>;
}

export default SocketTest;
