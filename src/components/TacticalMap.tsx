import { useEffect, useRef } from 'react'
import type { LocationPoint } from '@/types'

// Dynamically import Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null
import('leaflet').then(m => { L = m.default ?? m })

interface Props {
  locations: LocationPoint[]
  current: LocationPoint | null
  height?: number
  showPulse?: boolean
}

export default function TacticalMap({ locations, current, height = 400, showPulse = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)
  const polylineRef = useRef<import('leaflet').Polyline | null>(null)
  const pulseRef = useRef<import('leaflet').Circle | null>(null)

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const init = async () => {
      const Lm = await import('leaflet')
      const Leaflet = Lm.default ?? Lm

      const map = Leaflet.map(mapRef.current!, {
        center: [20.5937, 78.9629], // India center fallback
        zoom: 5,
        zoomControl: true,
        attributionControl: false,
      })

      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    }

    init()

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update marker + trail when locations change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !L) return
    if (!current) return

    const pos: [number, number] = [current.lat, current.lng]

    // Marker
    if (markerRef.current) {
      markerRef.current.setLatLng(pos)
    } else {
      const icon = L.divIcon({
        html: `
          <div style="
            width:20px;height:20px;border-radius:50%;
            background:#ff2d55;
            border:3px solid #fff;
            box-shadow:0 0 20px rgba(255,45,85,0.8);
            position:relative;
          ">
            ${showPulse ? `
              <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid #ff2d55;animation:pulse-ring 1.5s ease-out infinite;"></div>
              <div style="position:absolute;inset:-12px;border-radius:50%;border:1px solid rgba(255,45,85,0.4);animation:pulse-ring 1.5s ease-out infinite;animation-delay:0.5s;"></div>
            ` : ''}
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: '',
      })
      markerRef.current = L.marker(pos, { icon }).addTo(map)
    }

    // Pulse circle
    if (showPulse) {
      if (pulseRef.current) {
        pulseRef.current.setLatLng(pos)
      } else {
        pulseRef.current = L.circle(pos, {
          radius: 80,
          color: '#ff2d55',
          fillColor: '#ff2d55',
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map)
      }
    }

    // Route trail
    if (locations.length > 1) {
      const points = locations.map(p => [p.lat, p.lng] as [number, number])
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(points)
      } else {
        polylineRef.current = L.polyline(points, {
          color: '#ff2d55',
          weight: 3,
          opacity: 0.7,
          dashArray: '6, 4',
        }).addTo(map)
      }
    }

    map.flyTo(pos, Math.max(map.getZoom(), 15), { animate: true, duration: 1 })
  }, [current, locations, showPulse])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
    />
  )
}
