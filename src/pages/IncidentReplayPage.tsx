import { useParams, Link } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'
import { format } from 'date-fns'
import { ArrowLeft, Shield, MapPin, AlertTriangle, Zap, Radio, User } from 'lucide-react'
import styles from './IncidentReplayPage.module.css'

const EVENT_ICONS = {
  SESSION_STARTED:    { Icon: Shield,        color: '#30d158' },
  LOCATION_UPDATED:   { Icon: MapPin,        color: '#0a84ff' },
  RISK_SCORED:        { Icon: Zap,           color: '#ffd60a' },
  ALERT_SENT:         { Icon: AlertTriangle, color: '#ff2d55' },
  STATE_CHANGED:      { Icon: Radio,         color: '#bf5af2' },
  SESSION_ENDED:      { Icon: Shield,        color: '#ff6b35' },
  CONTACT_NOTIFIED:   { Icon: User,          color: '#32ade6' },
}

export default function IncidentReplayPage() {
  const { id } = useParams<{ id: string }>()
  const { sessionHistory, currentSession } = useSessionStore()

  const session = [...sessionHistory, ...(currentSession ? [currentSession] : [])].find(s => s.id === id)

  if (!session) return (
    <div className={styles.notFound}>
      <Shield size={48} style={{ color: 'var(--text-3)' }} />
      <h2>Session not found</h2>
      <Link to="/dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
    </div>
  )

  const duration = session.endedAt
    ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : null

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Back */}
        <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ width: 'fit-content' }}>
          <ArrowLeft size={15} /> Dashboard
        </Link>

        {/* Header */}
        <div className="card card-lg">
          <div className={styles.replayHeader}>
            <div className={styles.replayIcon}>
              <AlertTriangle size={24} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <h1 className={styles.replayTitle}>Incident Replay</h1>
              <div className={styles.replaySub}>{session.id.slice(0, 8).toUpperCase()}</div>
            </div>
            <span className="badge badge-red" style={{ marginLeft: 'auto' }}>
              {session.triggerMethod.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>STARTED</span>
              <span className={styles.metaVal}>{format(new Date(session.startedAt), 'dd MMM yyyy · HH:mm:ss')}</span>
            </div>
            {session.endedAt && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>ENDED</span>
                <span className={styles.metaVal}>{format(new Date(session.endedAt), 'dd MMM yyyy · HH:mm:ss')}</span>
              </div>
            )}
            {duration !== null && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>DURATION</span>
                <span className={styles.metaVal}>{Math.floor(duration / 60)}m {duration % 60}s</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>GPS POINTS</span>
              <span className={styles.metaVal}>{session.locations.length}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card card-lg">
          <h2 className={styles.tlTitle}>Emergency Timeline</h2>
          <div className={styles.timeline}>
            {session.timeline.length === 0 && (
              <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 24 }}>No timeline events recorded</div>
            )}
            {session.timeline.map((ev, i) => {
              const conf = EVENT_ICONS[ev.eventType] ?? EVENT_ICONS.STATE_CHANGED
              const { Icon, color } = conf
              return (
                <div key={ev.id || i} className={styles.tlItem} style={{ animationDelay: `${i * 0.05}s` }}>
                  {/* Line */}
                  {i < session.timeline.length - 1 && <div className={styles.tlLine} />}
                  {/* Icon */}
                  <div className={styles.tlIcon} style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  {/* Content */}
                  <div className={styles.tlContent}>
                    <div className={styles.tlType} style={{ color }}>{ev.eventType.replace(/_/g, ' ')}</div>
                    {Object.keys(ev.data).length > 0 && (
                      <div className={styles.tlData}>
                        {Object.entries(ev.data).map(([k, v]) => (
                          <span key={k} className={styles.tlDataChip}>
                            <span className={styles.tlDataKey}>{k}</span>
                            <span className={styles.tlDataVal}>{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={styles.tlTime}>{format(new Date(ev.occurredAt), 'HH:mm:ss')}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
