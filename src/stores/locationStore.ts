import { create } from 'zustand'
import type { LocationPoint } from '@/types'
import { supabase } from '@/lib/supabase'

interface LocationStore {
  current: LocationPoint | null
  trail: LocationPoint[]
  isTracking: boolean
  watchId: number | null
  startTracking: (sessionId: string) => void
  stopTracking: () => void
  addLocation: (point: LocationPoint) => void
  injectLocation: (point: LocationPoint) => void
  clearTrail: () => void
}

// Lazy-import socket to break potential circular deps
let _socket: import('socket.io-client').Socket | null = null
async function getSocket() {
  if (_socket) return _socket
  const mod = await import('@/lib/socket')
  _socket = mod.default
  return _socket
}

export const useLocationStore = create<LocationStore>()((set, get) => ({
  current:    null,
  trail:      [],
  isTracking: false,
  watchId:    null,

  startTracking: (sessionId) => {
    if (get().watchId !== null) return

    if (!navigator.geolocation) {
      console.error('[GPS] Geolocation not supported')
      return
    }

    console.log('[GPS] Starting watchPosition for session:', sessionId)

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords
        console.log('[GPS] Update →', latitude.toFixed(5), longitude.toFixed(5), '±' + Math.round(accuracy) + 'm')

        const point: LocationPoint = {
          id:        crypto.randomUUID(),
          sessionId,
          lat:       latitude,
          lng:       longitude,
          accuracy:  accuracy ?? 0,
          speed:     speed,
          heading:   heading,
          timestamp: new Date(pos.timestamp).toISOString(),
        }
        get().addLocation(point)
      },
      (err) => {
        if (err.code === 1) console.error('[GPS] Permission DENIED — allow location in browser settings')
        else if (err.code === 2) console.warn('[GPS] Position UNAVAILABLE')
        else console.warn('[GPS] Error:', err.message)
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    )

    set({ isTracking: true, watchId: id })
    console.log('[GPS] watchPosition started, id:', id)
  },

  stopTracking: () => {
    const id = get().watchId
    if (id !== null) {
      navigator.geolocation.clearWatch(id)
      set({ isTracking: false, watchId: null })
      console.log('[GPS] Tracking stopped')

      getSocket().then(s => {
        s.emit('SESSION_ENDED', { sessionId: get().current?.sessionId })
        console.log('[SOCKET] Emitted SESSION_ENDED')
      })
    }
  },

  addLocation: async (point) => {
    set(s => ({
      current: point,
      trail:   [...s.trail.slice(-199), point],
    }))

    // Emit to Socket.IO → broadcast to admin dashboards
    getSocket().then(s => {
      s.emit('LOCATION_UPDATED', {
        sessionId: point.sessionId,
        lat:       point.lat,
        lng:       point.lng,
        accuracy:  point.accuracy,
        speed:     point.speed,
        heading:   point.heading,
        timestamp: point.timestamp,
      })
      console.log('[SOCKET] LOCATION_UPDATED emitted')
    })

    // Persist to Supabase (offline-safe)
    try {
      await supabase.from('live_locations').insert({
        id:          point.id,
        session_id:  point.sessionId,
        lat:         point.lat,
        lng:         point.lng,
        accuracy:    point.accuracy,
        speed:       point.speed,
        heading:     point.heading,
        recorded_at: point.timestamp,
      })
    } catch {
      // offline — stored locally only
    }
  },

  // Called on admin side when socket delivers GPS from another tab/device
  injectLocation: (point) => {
    set(s => ({
      current: point,
      trail:   [...s.trail.slice(-199), point],
    }))
    console.log('[STORE] Injected socket GPS →', point.lat.toFixed(5), point.lng.toFixed(5))
  },

  clearTrail: () => set({ current: null, trail: [] }),
}))
