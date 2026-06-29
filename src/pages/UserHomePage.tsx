import { useNavigate, Link } from 'react-router-dom'
import { AlertTriangle, Users, Clock, Shield, ChevronRight, Activity } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './UserHomePage.module.css'

function SafetyRing({ score }: { score: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 75 ? 'var(--green)' : score >= 45 ? 'var(--yellow)' : 'var(--red)'
  const label = score >= 75 ? 'Safe' : score >= 45 ? 'Caution' : 'At Risk'

  return (
    <div className={styles.ring}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className={styles.ringInner}>
        <span className={styles.ringScore} style={{ color }}>{score}</span>
        <span className={styles.ringLabel} style={{ color }}>{label}</span>
      </div>
    </div>
  )
}

export default function UserHomePage() {
  const { user } = useAuthStore()
  const { currentSession, sessionHistory } = useSessionStore()
  const navigate = useNavigate()

  const safetyScore = currentSession ? Math.round(100 - currentSession.riskScore) : 92
  const recentSessions = sessionHistory.slice(0, 3)

  return (
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.container}>

        {/* Welcome header */}
        <div className={styles.welcomeRow}>
          <div>
            <p className={styles.greeting}>Good day,</p>
            <h1 className={styles.name}>{user?.name ?? 'User'}</h1>
          </div>
          <div className={styles.statusPill}>
            <span className={currentSession ? styles.dotRed : styles.dotGreen} />
            <span>{currentSession ? 'Emergency Active' : 'Protected'}</span>
          </div>
        </div>

        {/* Safety score + quick actions */}
        <div className={styles.topRow}>
          <div className={styles.scoreCard}>
            <p className={styles.cardLabel}>AI Safety Score</p>
            <SafetyRing score={safetyScore} />
            <p className={styles.scoreHint}>Updated in real time</p>
          </div>

          <div className={styles.actionsCol}>
            <button
              className={styles.sosBtn}
              onClick={() => navigate('/emergency')}
            >
              <AlertTriangle size={22} />
              SOS Emergency
            </button>

            <Link to="/profile" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.2)' }}>
                <Users size={18} style={{ color: 'var(--blue)' }} />
              </div>
              <div>
                <p className={styles.actionTitle}>Emergency Contacts</p>
                <p className={styles.actionSub}>{user?.emergencyContacts?.length ?? 0} contacts saved</p>
              </div>
              <ChevronRight size={16} className={styles.chevron} />
            </Link>

            <Link to="/profile" className={styles.actionCard}>
              <div className={styles.actionIcon} style={{ background: 'rgba(48,209,88,0.10)', border: '1px solid rgba(48,209,88,0.18)' }}>
                <Shield size={18} style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <p className={styles.actionTitle}>My Profile</p>
                <p className={styles.actionSub}>Settings &amp; passcode</p>
              </div>
              <ChevronRight size={16} className={styles.chevron} />
            </Link>
          </div>
        </div>

        {/* Recent history */}
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <div className={styles.historyTitle}>
              <Clock size={15} />
              Recent Incidents
            </div>
            {recentSessions.length > 0 && (
              <span className={styles.historyCount}>{sessionHistory.length} total</span>
            )}
          </div>

          {recentSessions.length === 0 ? (
            <div className={styles.emptyState}>
              <Activity size={28} style={{ color: 'var(--text-3)' }} />
              <p>No incidents recorded — stay safe!</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {recentSessions.map(s => (
                <Link key={s.id} to={`/replay/${s.id}`} className={styles.historyItem}>
                  <div
                    className={styles.historyDot}
                    style={{ background: s.state === 'RESOLVED' ? 'var(--green)' : 'var(--red)' }}
                  />
                  <div className={styles.historyMeta}>
                    <span className={styles.historyState}>{s.state}</span>
                    <span className={styles.historyDate}>
                      {new Date(s.startedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className={styles.historyRisk}>Risk {Math.round(s.riskScore)}%</span>
                  <ChevronRight size={14} className={styles.chevron} />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
