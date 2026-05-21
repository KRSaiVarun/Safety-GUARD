import { useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";

export default function SOSPage() {
  const socketRef = useSocket();
  const [watchId, setWatchId] = useState(null);
  const [sessionId] = useState(
    () => "sess-" + Math.random().toString(36).slice(2, 9),
  );

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("SESSION_STARTED", {
      session_id: sessionId,
      user_id: "user123",
      timestamp: new Date().toISOString(),
    });
  }, [socketRef, sessionId]);

  const startWatch = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        socketRef.current?.emit("LOCATION_UPDATED", {
          session_id: sessionId,
          lat: latitude,
          lng: longitude,
          accuracy,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
    );
    setWatchId(id);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const triggerSOS = () => {
    // sample contacts - in production, fetch from user profile
    const contacts = ["+15551234567"];
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      socketRef.current?.emit("SOS_TRIGGERED", {
        session_id: sessionId,
        lat: latitude,
        lng: longitude,
        timestamp: new Date().toISOString(),
        contacts,
      });
      alert("SOS sent");
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>SOS Interface</h1>
      <button onClick={startWatch}>Start Live GPS</button>
      <button
        onClick={triggerSOS}
        style={{ marginLeft: 10, background: "red", color: "white" }}
      >
        Trigger SOS
      </button>
    </div>
  );
}
