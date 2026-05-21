import { create } from 'zustand'
import type { LocationPoint } from '@/types'
import { supabase } from '@/lib/supabase'

interface LocationStore {
  current: LocationPoint | null
  trail: LocationPoint[]
  isTracking: boolean
  watchId: number | null
  // Actions
  startTracking: (sessionId: string) => void
  stopTracking: () => void
  addLocation: (point: LocationPoint) => void
  clearTrail: () => void
}

export const useLocationStore = create<LocationStore>()((set, get) => ({
  current: null,
  trail: [],
  isTracking: false,
  watchId: null,

  startTracking: (sessionId) => {
    if (get().watchId !== null) return

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point: LocationPoint = {
          id: crypto.randomUUID(),
          sessionId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: new Date(pos.timestamp).toISOString(),
        }
        get().addLocation(point)
      },
      (err) => console.warn('[GPS]', err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )

    set({ isTracking: true, watchId: id })
  },

  stopTracking: () => {
    const id = get().watchId
    if (id !== null) {
      navigator.geolocation.clearWatch(id)
      set({ isTracking: false, watchId: null })
    }
  },

  addLocation: async (point) => {
    set(s => ({
      current: point,
      trail: [...s.trail.slice(-199), point], // keep last 200
    }))

    // Stream to Supabase
    try {
      await supabase.from('live_locations').insert({
        id: point.id,
        session_id: point.sessionId,
        lat: point.lat,
        lng: point.lng,
        accuracy: point.accuracy,
        speed: point.speed,
        heading: point.heading,
        recorded_at: point.timestamp,
      })
    } catch (e) {
      // offline — stored locally only
    }
  },

  clearTrail: () => set({ current: null, trail: [] }),
}))
