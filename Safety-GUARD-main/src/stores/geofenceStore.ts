import { Geofence, GeofenceEvent } from "@/types";
import { create } from "zustand";

interface GeofenceState {
  geofences: Geofence[];
  currentBreaches: GeofenceEvent[];
  eventHistory: GeofenceEvent[];

  // Actions
  setGeofences: (geofences: Geofence[]) => void;
  addGeofence: (geofence: Geofence) => void;
  removeGeofence: (geofenceId: string) => void;

  recordGeofenceEvent: (event: GeofenceEvent) => void;
  clearHistory: () => void;

  // Getters
  getSafeZones: () => Geofence[];
  getUnsafeZones: () => Geofence[];
}

export const useGeofenceStore = create<GeofenceState>((set, get) => ({
  geofences: [],
  currentBreaches: [],
  eventHistory: [],

  setGeofences: (geofences: Geofence[]) => set({ geofences }),

  addGeofence: (geofence: Geofence) =>
    set((state) => ({
      geofences: [...state.geofences, geofence],
    })),

  removeGeofence: (geofenceId: string) =>
    set((state) => ({
      geofences: state.geofences.filter((g) => g.id !== geofenceId),
    })),

  recordGeofenceEvent: (event: GeofenceEvent) =>
    set((state) => {
      let updatedBreaches = state.currentBreaches;

      if (event.event_type === "ENTER") {
        // Add to current breaches
        updatedBreaches = [
          ...state.currentBreaches.filter(
            (e) => e.geofence_id !== event.geofence_id,
          ),
          event,
        ];
      } else if (event.event_type === "EXIT") {
        // Remove from current breaches
        updatedBreaches = state.currentBreaches.filter(
          (e) => e.geofence_id !== event.geofence_id,
        );
      }

      return {
        currentBreaches: updatedBreaches,
        eventHistory: [event, ...state.eventHistory].slice(0, 500), // Keep last 500 events
      };
    }),

  clearHistory: () =>
    set({
      eventHistory: [],
      currentBreaches: [],
    }),

  getSafeZones: () => get().geofences.filter((g) => g.type === "safe"),

  getUnsafeZones: () => get().geofences.filter((g) => g.type === "unsafe"),
}));
