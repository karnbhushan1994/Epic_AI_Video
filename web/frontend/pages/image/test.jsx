// Test.jsx
import React, { useEffect, useState } from 'react';
import { useSocketIO } from '../../hooks/useSocketIO';

function Test() {
  const { connected } = useSocketIO();
  const [data, setData] = useState(null);

  useEffect(() => {
    const socket = window.socket;
    if (!socket) return;

    // Server se data receive karna (subscribe)
    socket.on("api-data-update", (newData) => {
      console.log("📥 Server pushed data:", newData);
      setData(newData);
    });

    return () => {
      socket.off("api-data-update");
    };
  }, []);

  return (
    <div>
      <h2>Server Push Demo (Pub/Sub)</h2>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>
      {data ? (
        <pre style={{ background: "#eee", padding: "10px" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p>Waiting for data from server...</p>
      )}
    </div>
  );
}

export default Test;
