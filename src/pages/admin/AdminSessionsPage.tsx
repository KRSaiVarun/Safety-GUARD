import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, ChevronRight, MapPin, Activity } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './AdminSessionsPage.module.css'

const STATE_COLORS: Record<string, string> = {
  RESOLVED:        'var(--green)',
  ALERT_TRIGGERED: 'var(--red)',
  LIVE_TRACKING:   'var(--red)',
  MONITORING:      'var(--cyan)',
  RISK_DETECTED:   '#FFD24A',
  IDLE:            '#555',
}

export default function AdminSessionsPage() {
  const { user } = useAuthStore()
  const { sessionHistory, currentSession, loadHistory, isLoading } = useSessionStore()

  useEffect(() => {
    if (user) loadHistory(user.id)
  }, [user, loadHistory])

  const allSessions = currentSession
    ? [currentSession, ...sessionHistory.filter(s => s.id !== currentSession.id)]
    : sessionHistory

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <h1 className={styles.title}>Emergency Sessions</h1>
              <p className={styles.subtitle}>All active and historical emergency events</p>
            </div>
          </div>
          <span className={styles.countBadge}>{allSessions.length} total</span>
        </div>

        {currentSession && currentSession.state !== 'RESOLVED' && (
          <div className={styles.activeBanner}>
            <span className={styles.activeDot} />
            <strong>LIVE EMERGENCY IN PROGRESS</strong>
            <span>State: {currentSession.state.replace(/_/g, ' ')}</span>
            <Link to="/admin/dashboard" className={styles.viewLive}>
              View Live Dashboard →
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>
            <Activity size={22} className={styles.spin} />
            Loading sessions…
          </div>
        ) : allSessions.length === 0 ? (
          <div className={styles.empty}>
            <CheckCircle size={40} style={{ color: 'var(--green)' }} />
            <h3>No emergency sessions</h3>
            <p>Sessions will appear here when users trigger SOS alerts.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {allSessions.map(s => {
              const color  = STATE_COLORS[s.state] ?? '#555'
              const active = s.state !== 'RESOLVED' && s.state !== 'IDLE'
              const lastLoc = s.locations?.length
                ? s.locations[s.locations.length - 1]
                : null

              return (
                <Link
                  key={s.id}
                  to={`/replay/${s.id}`}
                  className={`${styles.item} ${active ? styles.itemActive : ''}`}
                >
                  <div className={styles.itemLeft}>
                    <div
                      className={styles.dot}
                      style={{
                        background: color,
                        boxShadow: active ? `0 0 10px ${color}66` : 'none',
                        animation: active ? 'blink 1.2s ease-in-out infinite' : 'none',
                      }}
                    />
                  </div>

                  <div className={styles.body}>
                    <div className={styles.bodyTop}>
                      <span className={styles.state} style={{ color }}>{s.state.replace(/_/g, ' ')}</span>
                      <span className={styles.method}>{s.triggerMethod.replace(/_/g, ' ')}</span>
                      {active && <span className={styles.liveBadge}>LIVE</span>}
                    </div>
                    <div className={styles.meta}>
                      <span>
                        <Clock size={11} />
                        {new Date(s.startedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      {lastLoc && (
                        <span>
                          <MapPin size={11} />
                          {lastLoc.lat.toFixed(4)}, {lastLoc.lng.toFixed(4)}
                        </span>
                      )}
                      <span>Risk: <strong style={{ color }}>{Math.round(s.riskScore)}%</strong></span>
                      <span>{s.locations?.length ?? 0} GPS pts</span>
                    </div>
                  </div>

                  <ChevronRight size={15} className={styles.chevron} />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}
