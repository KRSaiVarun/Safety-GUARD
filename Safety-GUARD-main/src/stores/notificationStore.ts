import { create } from "zustand";

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  level?: "info" | "success" | "warning" | "error";
  createdAt: string;
  meta?: Record<string, any>;
};

interface NotificationStore {
  list: NotificationItem[];
  push: (n: Omit<NotificationItem, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  list: [],
  push: (n) =>
    set((s) => ({
      list: [
        { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...n },
        ...s.list,
      ].slice(0, 50),
    })),
  remove: (id) => set((s) => ({ list: s.list.filter((x) => x.id !== id) })),
  clear: () => set({ list: [] }),
}));

export default useNotificationStore;
