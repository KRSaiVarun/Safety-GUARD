import { useEffect, useRef } from 'react'
import type { LocationPoint } from '@/types'

interface Props {
  locations: LocationPoint[]
  current: LocationPoint | null
  height?: number
  showPulse?: boolean
}

export default function TacticalMap({ locations, current, height = 400, showPulse = false }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null)
  const mapInstRef = useRef<import('leaflet').Map | null>(null)
  const markerRef  = useRef<import('leaflet').Marker | null>(null)
  const polyRef    = useRef<import('leaflet').Polyline | null>(null)
  const pulseRef   = useRef<import('leaflet').Circle | null>(null)
  const initedRef  = useRef(false)

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || initedRef.current) return
    initedRef.current = true

    const init = async () => {
      const Lm      = await import('leaflet')
      const Leaflet = Lm.default ?? Lm

      // Fix default icon paths broken by bundlers
      // @ts-ignore
      delete Leaflet.Icon.Default.prototype._getIconUrl
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (!mapRef.current) return

      const map = Leaflet.map(mapRef.current, {
        center:             [20.5937, 78.9629], // India center until GPS arrives
        zoom:               5,
        zoomControl:        true,
        attributionControl: false,
      })

      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      mapInstRef.current = map
      console.log('[MAP] Initialized')
    }

    init()

    return () => {
      mapInstRef.current?.remove()
      mapInstRef.current = null
      initedRef.current  = false
    }
  }, [])

  // ── Update marker + trail whenever current/locations change ────────────────
  useEffect(() => {
    if (!current) return
    console.log('[MAP] GPS update → lat=%.5f lng=%.5f', current.lat, current.lng)

    const update = async () => {
      // Always re-import — eliminates L race condition
      const Lm      = await import('leaflet')
      const Leaflet = Lm.default ?? Lm

      // Wait up to 2 s for the map instance to be ready
      let map = mapInstRef.current
      if (!map) {
        await new Promise<void>(resolve => {
          let tries = 0
          const t = setInterval(() => {
            map = mapInstRef.current
            if (map || ++tries > 40) { clearInterval(t); resolve() }
          }, 50)
        })
        map = mapInstRef.current
        if (!map) {
          console.warn('[MAP] Map instance not ready — skipping update')
          return
        }
      }

      const pos: [number, number] = [current.lat, current.lng]
      console.log('[MAP] Flying to', pos)

      // ── Marker ──
      if (markerRef.current) {
        markerRef.current.setLatLng(pos)
      } else {
        const icon = Leaflet.divIcon({
          html: `
            <div style="
              width:22px;height:22px;border-radius:50%;
              background:#ff2d55;
              border:3px solid #fff;
              box-shadow:0 0 24px rgba(255,45,85,0.9);
              position:relative;
            ">
              ${showPulse ? `
                <div style="position:absolute;inset:-7px;border-radius:50%;border:2px solid #ff2d55;animation:sg-pulse 1.5s ease-out infinite;"></div>
                <div style="position:absolute;inset:-14px;border-radius:50%;border:1px solid rgba(255,45,85,0.4);animation:sg-pulse 1.5s ease-out 0.5s infinite;"></div>
              ` : ''}
            </div>
          `,
          iconSize:   [22, 22],
          iconAnchor: [11, 11],
          className:  '',
        })
        markerRef.current = Leaflet.marker(pos, { icon }).addTo(map)
        console.log('[MAP] Marker created at', pos)
      }

      // ── Pulse circle ──
      if (showPulse) {
        if (pulseRef.current) {
          pulseRef.current.setLatLng(pos)
        } else {
          pulseRef.current = Leaflet.circle(pos, {
            radius:      90,
            color:       '#ff2d55',
            fillColor:   '#ff2d55',
            fillOpacity: 0.07,
            weight:      1,
          }).addTo(map)
        }
      }

      // ── Polyline trail ──
      if (locations.length > 1) {
        const pts = locations.map(p => [p.lat, p.lng] as [number, number])
        if (polyRef.current) {
          polyRef.current.setLatLngs(pts)
        } else {
          polyRef.current = Leaflet.polyline(pts, {
            color:     '#ff2d55',
            weight:    3,
            opacity:   0.75,
            dashArray: '6, 4',
          }).addTo(map)
          console.log('[MAP] Polyline created (%d pts)', pts.length)
        }
      }

      // ── Fly to location ──
      map.flyTo(pos, Math.max(map.getZoom(), 15), { animate: true, duration: 1 })
    }

    update()
  }, [current, locations, showPulse])

  return (
    <>
      <style>{`
        @keyframes sg-pulse {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
      <div
        ref={mapRef}
        style={{ width: '100%', height, borderRadius: 'var(--radius-lg, 12px)', overflow: 'hidden' }}
      />
    </>
  )
}
