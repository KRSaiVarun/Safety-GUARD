import type { LocationPoint } from "@/types";
import { create } from "zustand";

export type UserStatus = "ONLINE" | "OFFLINE" | "EMERGENCY" | "SAFE";

export interface TrackedUser {
  userId: string;
  name?: string;
  photoUrl?: string | null;
  status: UserStatus;
  battery?: number | null;
  lastUpdated?: string | null;
  current?: { lat: number; lng: number };
  trail: LocationPoint[];
}

interface UsersStore {
  users: Record<string, TrackedUser>;
  selectedUser?: string | null;
  upsertUser: (u: Partial<TrackedUser> & { userId: string }) => void;
  addLocation: (userId: string, loc: LocationPoint) => void;
  setStatus: (userId: string, status: UserStatus) => void;
  selectUser: (userId?: string | null) => void;
  removeUser: (userId: string) => void;
}

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: {},
  selectedUser: null,
  upsertUser: (u) =>
    set((s) => ({
      users: {
        ...s.users,
        [u.userId]: {
          ...(s.users[u.userId] ?? {
            userId: u.userId,
            trail: [],
            status: "OFFLINE",
          }),
          ...u,
        },
      },
    })),
  addLocation: (userId, loc) =>
    set((s) => {
      const prev = s.users[userId] ?? { userId, trail: [], status: "OFFLINE" };
      const trail = [...(prev.trail || []).slice(-199), loc];
      const updated = {
        ...prev,
        current: { lat: loc.lat, lng: loc.lng },
        lastUpdated: loc.timestamp,
        trail,
      };
      return { users: { ...s.users, [userId]: updated } };
    }),
  setStatus: (userId, status) =>
    set((s) => ({
      users: {
        ...s.users,
        [userId]: {
          ...(s.users[userId] ?? { userId, trail: [], status: "OFFLINE" }),
          status,
        },
      },
    })),
  selectUser: (userId = null) => set({ selectedUser: userId }),
  removeUser: (userId) =>
    set((s) => {
      const next = { ...s.users };
      delete next[userId];
      return { users: next };
    }),
}));

export default useUsersStore;
