import { create } from "zustand";

type SocketStatus = "connected" | "disconnected" | "reconnecting" | "unknown";

interface SocketStore {
  status: SocketStatus;
  setStatus: (s: SocketStatus) => void;
  activeUsers: Record<string, { lastSeen: string }>;
  setUserOnline: (id: string) => void;
  setUserOffline: (id: string) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  status: "unknown",
  setStatus: (s) => set({ status: s }),
  activeUsers: {},
  setUserOnline: (id) =>
    set((s) => ({
      activeUsers: {
        ...s.activeUsers,
        [id]: { lastSeen: new Date().toISOString() },
      },
    })),
  setUserOffline: (id) =>
    set((s) => {
      const next = { ...s.activeUsers };
      delete next[id];
      return { activeUsers: next };
    }),
}));

export default useSocketStore;
