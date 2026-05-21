import { useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";

export default function Dashboard() {
  const socketRef = useSocket();
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("SESSION_STARTED", (data) =>
      setFeed((f) => [
        ...f,
        `[${new Date().toLocaleTimeString()}] 🟢 SESSION STARTED - ${data.session_id}`,
      ]),
    );
    socket.on("SOS_TRIGGERED", (data) =>
      setFeed((f) => [
        ...f,
        `[${new Date().toLocaleTimeString()}] 🚨 SOS TRIGGERED - ${data.session_id} - ${data.lat},${data.lng}`,
      ]),
    );
    socket.on("LOCATION_UPDATED", (data) =>
      setFeed((f) => [
        ...f,
        `[${new Date().toLocaleTimeString()}] 📍 LOCATION UPDATED - ${data.session_id} - ${data.lat},${data.lng}`,
      ]),
    );
    socket.on("ALERT_SENT", (data) =>
      setFeed((f) => [
        ...f,
        `[${new Date().toLocaleTimeString()}] 📤 ALERT_SENT - ${data.session_id} - ${data.recipient_count} recipients`,
      ]),
    );

    return () => {
      socket.off("SESSION_STARTED");
      socket.off("SOS_TRIGGERED");
      socket.off("LOCATION_UPDATED");
      socket.off("ALERT_SENT");
    };
  }, [socketRef]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Tactical Dashboard</h1>
      <div>
        {feed
          .slice()
          .reverse()
          .map((line, idx) => (
            <div
              key={idx}
              style={{ padding: 6, borderBottom: "1px solid #eee" }}
            >
              {line}
            </div>
          ))}
      </div>
    </div>
  );
}
