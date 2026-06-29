import { useEffect, useRef, useState, Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MapPin, Radio, Clock, ChevronRight, Play } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useLocationStore } from '@/stores/locationStore'
import RiskMeter from '@/components/RiskMeter'
import LiveIncidentFeed from '@/components/LiveIncidentFeed'
import WhatsAppPanel from '@/components/WhatsAppPanel'
import EmergencyBanner from '@/components/EmergencyBanner'
import TopStatusBar from '@/components/TopStatusBar'
import FamilyResponsePanel from '@/components/FamilyResponsePanel'
import NotificationCenter from '@/components/NotificationCenter'
import AnalyticsPanel from '@/components/AnalyticsPanel'
import { format } from 'date-fns'
import styles from './DashboardPage.module.css'

const TacticalMap = lazy(() => import('@/components/TacticalMap'))

const STATE_COLORS: Record<string, string> = {
  IDLE:            '#444',
  MONITORING:      '#21D4FF',
  RISK_DETECTED:   '#FFD24A',
  ALERT_TRIGGERED: '#FF1F3A',
  LIVE_TRACKING:   '#FF1F3A',
  RESOLVED:        '#3CE07F',
}
const STATES = ['IDLE', 'MONITORING', 'RISK_DETECTED', 'ALERT_TRIGGERED', 'LIVE_TRACKING', 'RESOLVED']

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { currentSession, sessionHistory, alertDelivery, loadHistory } = useSessionStore()
  const { current: loc, trail, injectLocation } = useLocationStore()
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (user) loadHistory(user.id)
  }, [user, loadHistory])

  // Join Socket.IO dashboard room to receive GPS from user's device/tab
  useEffect(() => {
    let socket: import('socket.io-client').Socket | null = null

    import('@/lib/socket').then(mod => {
      socket = mod.default
      socket.emit('join-room', 'dashboard')
      console.log('[DASHBOARD] Joined dashboard room')

      socket.on('LOCATION_UPDATED', (data: {
        sessionId: string; lat: number; lng: number;
        accuracy: number; speed: number | null; heading: number | null; timestamp: string
      }) => {
        console.log('[DASHBOARD] GPS update → lat=%.5f lng=%.5f', data.lat, data.lng)
        injectLocation({
          id:        crypto.randomUUID(),
          sessionId: data.sessionId,
          lat:       data.lat,
          lng:       data.lng,
          accuracy:  data.accuracy ?? 0,
          speed:     data.speed ?? null,
          heading:   data.heading ?? null,
          timestamp: data.timestamp,
        })
      })
    })

    return () => { socket?.off('LOCATION_UPDATED') }
  }, [injectLocation])

  useEffect(() => {
    if (currentSession?.startedAt && currentSession.state !== 'RESOLVED') {
      const tick = () => setElapsed(Math.floor((Date.now() - new Date(currentSession.startedAt).getTime()) / 1000))
      tick()
      timerRef.current = window.setInterval(tick, 1000)
    } else {
      setElapsed(0)
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentSession?.startedAt, currentSession?.state])

  const riskScore = currentSession?.riskScore ?? 0
  const state     = currentSession?.state ?? 'IDLE'
  const events    = currentSession?.timeline ?? []
  const isActive  = !!currentSession && state !== 'RESOLVED'
  const isAlarm   = state === 'ALERT_TRIGGERED' || state === 'LIVE_TRACKING'

  const stateActiveIdx = STATES.indexOf(state)

  return (
    <div className={`${styles.page} ${isAlarm ? styles.pageAlarm : ''}`}>

      {/* Tactical grid overlay */}
      <div className={styles.gridOverlay} aria-hidden />

      {/* ── Top Status Command Bar ──────────────────────────────── */}
      <TopStatusBar />

      {/* ── Emergency Banner (alarm only) ──────────────────────── */}
      {isAlarm && (
        <EmergencyBanner
          userName={user?.name ?? 'User'}
          location={loc}
          elapsedSeconds={elapsed}
          alertCount={alertDelivery.count}
        />
      )}

      {/* ── State Pipeline ──────────────────────────────────────── */}
      <div className={styles.pipeline}>
        {STATES.map((s, i) => {
          const isActiveState = s === state
          const isPast        = i < stateActiveIdx
          const color         = STATE_COLORS[s]
          return (
            <div key={s} className={styles.pipeItem}>
              <div
                className={`${styles.pipeDot} ${isActiveState ? styles.pipeDotActive : ''}`}
                style={{
                  background:   isActiveState || isPast ? color : 'transparent',
                  borderColor:  color,
                  boxShadow:    isActiveState ? `0 0 16px ${color}` : 'none',
                }}
              />
              <span
                className={styles.pipeLabel}
                style={{ color: isActiveState ? color : isPast ? `${color}66` : '#2a2a3a' }}
              >
                {s.replace(/_/g, ' ')}
              </span>
              {i < STATES.length - 1 && (
                <div
                  className={styles.pipeConnector}
                  style={{ background: isPast ? `${color}55` : 'rgba(255,255,255,0.05)' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Main 3-column grid ─────────────────────────────────── */}
      <div className={styles.mainGrid}>

        {/* ═══ LEFT COLUMN ═══════════════════════════════════════ */}
        <div className={styles.leftCol}>

          {/* Active session card */}
          <div className={styles.sessionCard}>
            <div className={styles.cardHdr}>
              <span className={`${styles.hdrDot} ${isActive ? styles.hdrDotRed : styles.hdrDotGrey}`} />
              <span className={styles.cardHdrTitle}>SESSION STATUS</span>
              <Link to="/emergency" className={styles.sosSmall}>
                <AlertTriangle size={11} />
                SOS
              </Link>
            </div>
            <div className={styles.sessionBody}>
              <div className={styles.sessionState}>
                <div
                  className={styles.sessionStateBubble}
                  style={{ background: `${STATE_COLORS[state]}18`, border: `1px solid ${STATE_COLORS[state]}44`, color: STATE_COLORS[state] }}
                >
                  {state.replace(/_/g, ' ')}
                </div>
              </div>
              <div className={styles.sessionMeta}>
                <div className={styles.sMeta}>
                  <span className={styles.sMetaLabel}>USER</span>
                  <span className={styles.sMetaVal}>{user?.name ?? '—'}</span>
                </div>
                <div className={styles.sMeta}>
                  <span className={styles.sMetaLabel}>ELAPSED</span>
                  <span className={styles.sMetaVal} style={{ color: isActive ? '#FF1F3A' : undefined }}>
                    {isActive
                      ? `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
                      : '—'}
                  </span>
                </div>
                <div className={styles.sMeta}>
                  <span className={styles.sMetaLabel}>GPS PTS</span>
                  <span className={styles.sMetaVal}>{trail.length}</span>
                </div>
                <div className={styles.sMeta}>
                  <span className={styles.sMetaLabel}>ALERTS</span>
                  <span className={styles.sMetaVal} style={{ color: alertDelivery.count > 0 ? '#FFD24A' : undefined }}>
                    {alertDelivery.count}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Incident Feed */}
          <LiveIncidentFeed events={events} maxHeight={280} />

          {/* Analytics */}
          <AnalyticsPanel />

          {/* History */}
          <div className={styles.histCard}>
            <div className={styles.cardHdr}>
              <Clock size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className={styles.cardHdrTitle}>INCIDENT HISTORY</span>
              <span className={styles.histCount}>{sessionHistory.length}</span>
            </div>
            {sessionHistory.length === 0 ? (
              <div className={styles.histEmpty}>No past incidents</div>
            ) : (
              <div className={styles.histList}>
                {sessionHistory.slice(0, 6).map(s => (
                  <Link to={`/replay/${s.id}`} key={s.id} className={styles.histItem}>
                    <div className={styles.histDot} style={{ background: STATE_COLORS[s.state] ?? '#555' }} />
                    <div className={styles.histInfo}>
                      <span className={styles.histMethod}>{s.triggerMethod.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className={styles.histDate}>{format(new Date(s.startedAt), 'dd MMM · HH:mm')}</span>
                    </div>
                    <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ CENTER COLUMN ═════════════════════════════════════ */}
        <div className={styles.centerCol}>

          {/* GPS Map */}
          <div className={`${styles.mapPanel} ${isAlarm ? styles.mapPanelAlarm : ''}`}>
            <div className={styles.mapHdr}>
              <MapPin size={13} style={{ color: '#21D4FF' }} />
              <span>LIVE GPS INTELLIGENCE</span>
              {loc && (
                <span className={styles.coordBadge}>
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </span>
              )}
              <span
                className={styles.trackBadge}
                style={{
                  color:       isActive ? '#FF1F3A' : '#21D4FF',
                  borderColor: isActive ? '#FF1F3A44' : '#21D4FF44',
                  background:  isActive ? '#FF1F3A12' : '#21D4FF12',
                }}
              >
                {isActive ? '● TRACKING' : '○ STANDBY'}
              </span>
            </div>

            <Suspense fallback={
              <div className={styles.mapFallback}>
                <Radio size={28} style={{ color: 'rgba(255,255,255,0.15)' }} />
                <span>Acquiring GPS signal...</span>
              </div>
            }>
              <TacticalMap locations={trail} current={loc} height={420} showPulse={isActive} />
            </Suspense>

            <div className={styles.gpsStrip}>
              {[
                { label: 'LATITUDE',  val: loc ? loc.lat.toFixed(6) : '—' },
                { label: 'LONGITUDE', val: loc ? loc.lng.toFixed(6) : '—' },
                { label: 'ACCURACY',  val: loc ? `±${Math.round(loc.accuracy)}m` : '—' },
                { label: 'SPEED',     val: loc?.speed ? `${(loc.speed * 3.6).toFixed(1)} km/h` : '—' },
                { label: 'HEADING',   val: loc?.heading ? `${Math.round(loc.heading)}°` : '—' },
                { label: 'TRAIL',     val: String(trail.length) },
              ].map(c => (
                <div key={c.label} className={styles.gpsCell}>
                  <span className={styles.gpsCellL}>{c.label}</span>
                  <span className={styles.gpsCellV}>{c.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Command Center */}
          <WhatsAppPanel />
        </div>

        {/* ═══ RIGHT COLUMN ══════════════════════════════════════ */}
        <div className={styles.rightCol}>

          {/* AI Risk Intelligence */}
          <div className={styles.riskPanel}>
            <div className={styles.cardHdr}>
              <span style={{ fontSize: 14 }}>🤖</span>
              <span className={styles.cardHdrTitle}>AI THREAT INTELLIGENCE</span>
              {riskScore > 0 && (
                <span
                  className={styles.riskChip}
                  style={{
                    color: riskScore >= 75 ? '#FF1F3A' : riskScore >= 50 ? '#FFD24A' : '#3CE07F',
                    borderColor: riskScore >= 75 ? '#FF1F3A44' : riskScore >= 50 ? '#FFD24A44' : '#3CE07F44',
                    background:  riskScore >= 75 ? '#FF1F3A18' : riskScore >= 50 ? '#FFD24A18' : '#3CE07F18',
                  }}
                >
                  {riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW'}
                </span>
              )}
            </div>
            <div className={styles.riskBody}>
              <RiskMeter score={riskScore} />

              {/* Threat factors */}
              <div className={styles.threatFactors}>
                {[
                  { name: 'Night Travel',    risk: (new Date().getHours() >= 22 || new Date().getHours() <= 5) ? 85 : 12, color: '#FF1F3A' },
                  { name: 'User Inactivity', risk: isActive ? Math.min(elapsed * 0.5, 100) : 0,                           color: '#FFD24A' },
                  { name: 'GPS Accuracy',    risk: loc ? Math.min((loc.accuracy / 100) * 60, 100) : 0,                    color: '#bf5af2' },
                  { name: 'Route Deviation', risk: trail.length > 10 ? 35 : 8,                                            color: '#FF6B35' },
                  { name: 'Network Quality', risk: 15,                                                                    color: '#21D4FF' },
                ].map(f => (
                  <div key={f.name} className={styles.threatRow}>
                    <span className={styles.threatName}>{f.name}</span>
                    <div className={styles.threatBar}>
                      <div className={styles.threatFill} style={{ width: `${f.risk}%`, background: f.color }} />
                    </div>
                    <span className={styles.threatPct} style={{ color: f.color }}>{Math.round(f.risk)}%</span>
                  </div>
                ))}
              </div>

              {/* AI recommendation */}
              {isActive && (
                <div className={styles.aiRec}>
                  <div className={styles.aiRecTitle}>🧠 AI RECOMMENDATION</div>
                  <div className={styles.aiRecText}>
                    {riskScore >= 75
                      ? 'CRITICAL: User is at high risk. Immediate family notification recommended. Alert authorities.'
                      : riskScore >= 50
                        ? 'User deviation detected. Risk increased. Recommend notifying nearby contacts.'
                        : 'Monitoring active. All parameters within normal range. Continue tracking.'}
                  </div>
                </div>
              )}

              {!isActive && (
                <div className={styles.aiIdle}>
                  <span>Activate SOS to begin AI threat analysis</span>
                </div>
              )}
            </div>
          </div>

          {/* Family Response Center */}
          <FamilyResponsePanel />

          {/* Notification Center */}
          <NotificationCenter />

          {/* Replay link */}
          {sessionHistory.length > 0 && (
            <Link to={`/replay/${sessionHistory[0].id}`} className={styles.replayCard}>
              <Play size={14} style={{ color: '#21D4FF' }} />
              <div className={styles.replayInfo}>
                <span className={styles.replayTitle}>LAST INCIDENT REPLAY</span>
                <span className={styles.replayDate}>{format(new Date(sessionHistory[0].startedAt), 'dd MMM yyyy · HH:mm')}</span>
              </div>
              <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
