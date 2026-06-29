import { create } from "zustand";

interface EmergencySummary {
  sessionId: string;
  userId: string;
  state: string;
  location?: { lat: number; lng: number };
  startedAt: string;
}

interface EmergencyStore {
  active: Record<string, EmergencySummary>;
  addEmergency: (e: EmergencySummary) => void;
  resolveEmergency: (sessionId: string) => void;
  clearAll: () => void;
}

export const useEmergencyStore = create<EmergencyStore>((set, get) => ({
  active: {},
  addEmergency: (e) =>
    set((s) => ({ active: { ...s.active, [e.sessionId]: e } })),
  resolveEmergency: (sessionId) =>
    set((s) => {
      const next = { ...s.active };
      delete next[sessionId];
      return { active: next };
    }),
  clearAll: () => set({ active: {} }),
}));

export default useEmergencyStore;
