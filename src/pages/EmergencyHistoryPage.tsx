import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, AlertTriangle, CheckCircle, ChevronRight, Activity, MapPin } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './EmergencyHistoryPage.module.css'

const STATE_LABELS: Record<string, string> = {
  RESOLVED:        'Resolved',
  ALERT_TRIGGERED: 'Alert Triggered',
  LIVE_TRACKING:   'Live Tracking',
  MONITORING:      'Monitoring',
  RISK_DETECTED:   'Risk Detected',
  IDLE:            'Idle',
}

const STATE_COLORS: Record<string, string> = {
  RESOLVED:        'var(--green)',
  ALERT_TRIGGERED: 'var(--red)',
  LIVE_TRACKING:   'var(--red)',
  MONITORING:      'var(--cyan)',
  RISK_DETECTED:   '#FFD24A',
  IDLE:            '#555',
}

const METHOD_LABELS: Record<string, string> = {
  manual:          'Panic Button',
  auto_inactivity: 'Auto — Inactivity',
  auto_speed:      'Auto — Speed',
  voice:           'Voice Trigger',
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt).getTime()
  const end   = endedAt ? new Date(endedAt).getTime() : Date.now()
  const secs  = Math.floor((end - start) / 1000)
  const m     = Math.floor(secs / 60)
  const s     = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function EmergencyHistoryPage() {
  const { user } = useAuthStore()
  const { sessionHistory, loadHistory, isLoading } = useSessionStore()

  useEffect(() => {
    if (user) loadHistory(user.id)
  }, [user, loadHistory])

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Clock size={20} style={{ color: 'var(--cyan)' }} />
            </div>
            <div>
              <h1 className={styles.title}>Emergency History</h1>
              <p className={styles.subtitle}>All past emergency sessions</p>
            </div>
          </div>
          <div className={styles.countBadge}>
            {sessionHistory.length} session{sessionHistory.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <Activity size={24} className={styles.spinner} />
            <span>Loading history…</span>
          </div>
        ) : sessionHistory.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <CheckCircle size={40} style={{ color: 'var(--green)' }} />
            </div>
            <h3 className={styles.emptyTitle}>No incidents recorded</h3>
            <p className={styles.emptySub}>Stay safe! Your emergency history will appear here.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {sessionHistory.map(session => {
              const color = STATE_COLORS[session.state] ?? '#555'
              const hasLocation = session.locations && session.locations.length > 0
              const lastLoc = hasLocation ? session.locations[session.locations.length - 1] : null

              return (
                <Link
                  key={session.id}
                  to={`/replay/${session.id}`}
                  className={styles.item}
                >
                  <div className={styles.itemLeft}>
                    <div
                      className={styles.stateDot}
                      style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
                    />
                    <div className={styles.stateIcon}>
                      {session.state === 'RESOLVED'
                        ? <CheckCircle size={16} style={{ color: 'var(--green)' }} />
                        : <AlertTriangle size={16} style={{ color: 'var(--red)' }} />
                      }
                    </div>
                  </div>

                  <div className={styles.itemBody}>
                    <div className={styles.itemTop}>
                      <span className={styles.itemState} style={{ color }}>
                        {STATE_LABELS[session.state] ?? session.state}
                      </span>
                      <span className={styles.itemMethod}>
                        {METHOD_LABELS[session.triggerMethod] ?? session.triggerMethod}
                      </span>
                    </div>
                    <div className={styles.itemMeta}>
                      <span className={styles.metaItem}>
                        <Clock size={11} />
                        {new Date(session.startedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span className={styles.metaSep}>·</span>
                      <span className={styles.metaItem}>
                        Duration: {formatDuration(session.startedAt, session.endedAt)}
                      </span>
                      {lastLoc && (
                        <>
                          <span className={styles.metaSep}>·</span>
                          <span className={styles.metaItem}>
                            <MapPin size={11} />
                            {lastLoc.lat.toFixed(4)}, {lastLoc.lng.toFixed(4)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className={styles.itemStats}>
                      <span className={styles.statChip}>
                        Risk: {Math.round(session.riskScore)}%
                      </span>
                      <span className={styles.statChip}>
                        Alerts: {session.alertsSent?.length ?? 0}
                      </span>
                      <span className={styles.statChip}>
                        GPS pts: {session.locations?.length ?? 0}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} className={styles.chevron} />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
