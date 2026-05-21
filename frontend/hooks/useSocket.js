import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(path = "/") {
  const socketRef = useRef(null);

  useEffect(() => {
    const url = process.env.REACT_APP_SOCKET_URL || "http://localhost:8000";
    const socket = io(url, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => console.log("socket connected", socket.id));
    socket.on("disconnect", () => console.log("socket disconnected"));

    return () => {
      socket.disconnect();
    };
  }, [path]);

  return socketRef;
}
