import { useEffect, Suspense, lazy } from 'react'
import { MapPin, Activity, Wifi, WifiOff, Navigation } from 'lucide-react'
import { useSessionStore } from '@/stores/sessionStore'
import { useLocationStore } from '@/stores/locationStore'
import type { LocationPoint } from '@/types'
import styles from './AdminLiveTrackingPage.module.css'

const TacticalMap = lazy(() => import('@/components/TacticalMap'))

export default function AdminLiveTrackingPage() {
  const { currentSession } = useSessionStore()
  const { current: loc, trail, injectLocation } = useLocationStore()
  const isActive = !!currentSession && currentSession.state !== 'RESOLVED'

  // Subscribe to socket GPS updates from the user's device/tab
  useEffect(() => {
    let socket: import('socket.io-client').Socket | null = null

    import('@/lib/socket').then(mod => {
      socket = mod.default

      // Join the admin dashboard room to receive GPS broadcasts
      socket.emit('join-room', 'dashboard')
      console.log('[ADMIN] Joined dashboard room')

      socket.on('LOCATION_UPDATED', (data: {
        sessionId: string; lat: number; lng: number;
        accuracy: number; speed: number | null; heading: number | null; timestamp: string
      }) => {
        console.log('[ADMIN] Received LOCATION_UPDATED → lat=%.5f lng=%.5f', data.lat, data.lng)

        const point: LocationPoint = {
          id:        crypto.randomUUID(),
          sessionId: data.sessionId,
          lat:       data.lat,
          lng:       data.lng,
          accuracy:  data.accuracy ?? 0,
          speed:     data.speed ?? null,
          heading:   data.heading ?? null,
          timestamp: data.timestamp,
        }
        injectLocation(point)
      })
    })

    return () => {
      socket?.off('LOCATION_UPDATED')
    }
  }, [injectLocation])

  const elapsed = currentSession?.startedAt
    ? Math.floor((Date.now() - new Date(currentSession.startedAt).getTime()) / 1000)
    : 0
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <MapPin size={18} style={{ color: 'var(--green)' }} />
          </div>
          <div>
            <h1 className={styles.title}>Live Tracking</h1>
            <p className={styles.subtitle}>Real-time user location monitoring</p>
          </div>
        </div>
        <div className={`${styles.statusPill} ${isActive ? styles.statusActive : styles.statusIdle}`}>
          <span className={styles.statusDot} />
          {isActive ? 'Emergency Active' : 'Monitoring Idle'}
        </div>
      </div>

      {/* GPS coordinates bar */}
      {loc ? (
        <div className={styles.coordsBar}>
          <Wifi size={13} style={{ color: 'var(--green)' }} />
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>LIVE</span>
          <span>·</span>
          <Navigation size={12} />
          <span>{loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}</span>
          {loc.speed !== null && loc.speed !== undefined && (
            <span>· {(loc.speed * 3.6).toFixed(1)} km/h</span>
          )}
          {loc.accuracy ? <span>· ±{Math.round(loc.accuracy)}m</span> : null}
          {isActive && <span>· {fmt(elapsed)} elapsed</span>}
        </div>
      ) : (
        <div className={styles.coordsBar} style={{ color: 'rgba(255,255,255,0.35)' }}>
          <WifiOff size={13} />
          <span>Waiting for GPS signal — user must activate SOS</span>
        </div>
      )}

      {/* Stats strip */}
      <div className={styles.statsStrip}>
        {[
          { label: 'LATITUDE',  value: loc ? loc.lat.toFixed(6) : '—' },
          { label: 'LONGITUDE', value: loc ? loc.lng.toFixed(6) : '—' },
          { label: 'ACCURACY',  value: loc ? `±${Math.round(loc.accuracy)}m` : '—' },
          { label: 'SPEED',     value: loc?.speed != null ? `${(loc.speed * 3.6).toFixed(1)} km/h` : '—' },
          { label: 'HEADING',   value: loc?.heading != null ? `${Math.round(loc.heading)}°` : '—' },
          { label: 'TRAIL PTS', value: String(trail.length) },
        ].map(s => (
          <div key={s.label} className={styles.statCell}>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className={styles.mapWrap}>
        <Suspense fallback={
          <div className={styles.mapLoader}>
            <Activity size={24} className={styles.spin} />
            <span>Loading map…</span>
          </div>
        }>
          <TacticalMap locations={trail} current={loc} height={480} showPulse={isActive} />
        </Suspense>
      </div>

      {/* Session info */}
      {currentSession && (
        <div className={styles.sessionCard}>
          <div className={styles.sessionRow}>
            <span className={styles.sessionLabel}>Session ID</span>
            <span className={styles.sessionValue}>{currentSession.id.slice(0, 8)}…</span>
          </div>
          <div className={styles.sessionRow}>
            <span className={styles.sessionLabel}>State</span>
            <span className={styles.sessionValue} style={{ color: 'var(--red)' }}>{currentSession.state}</span>
          </div>
          <div className={styles.sessionRow}>
            <span className={styles.sessionLabel}>Started</span>
            <span className={styles.sessionValue}>
              {new Date(currentSession.startedAt).toLocaleTimeString()}
            </span>
          </div>
          <div className={styles.sessionRow}>
            <span className={styles.sessionLabel}>GPS Points</span>
            <span className={styles.sessionValue}>{trail.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
