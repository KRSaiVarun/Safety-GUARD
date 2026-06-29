import { useNavigate } from 'react-router-dom'
import { Shield, Users, AlertTriangle, Activity, MapPin, Brain, BarChart2, Settings, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './AdminHomePage.module.css'

const QUICK_LINKS = [
  { to: '/admin/dashboard', icon: Activity,      label: 'Live Dashboard',    color: 'red',   desc: 'Real-time emergency command center' },
  { to: '/admin/users',     icon: Users,          label: 'User Management',   color: 'blue',  desc: 'View and manage registered users' },
  { to: '/admin/analytics', icon: BarChart2,      label: 'Analytics',         color: 'cyan',  desc: 'Incident reports and statistics' },
  { to: '/admin/live',      icon: MapPin,         label: 'Live Tracking',     color: 'green', desc: 'Real-time user location map' },
  { to: '/admin/sessions',  icon: AlertTriangle,  label: 'Emergency Sessions', color: 'red',  desc: 'All past and active emergencies' },
  { to: '/admin/ai',        icon: Brain,          label: 'AI Monitoring',     color: 'purple', desc: 'Risk scores and threat analysis' },
  { to: '/admin/settings',  icon: Settings,       label: 'Settings',          color: 'grey',  desc: 'System configuration' },
]

export default function AdminHomePage() {
  const { user } = useAuthStore()
  const { sessionHistory, currentSession } = useSessionStore()
  const navigate = useNavigate()

  const totalSessions   = sessionHistory.length
  const resolvedSessions = sessionHistory.filter(s => s.state === 'RESOLVED').length
  const activeSessions  = currentSession && currentSession.state !== 'RESOLVED' ? 1 : 0
  const avgRisk = sessionHistory.length > 0
    ? Math.round(sessionHistory.reduce((a, s) => a + s.riskScore, 0) / sessionHistory.length)
    : 0

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.welcome}>
          <div className={styles.welcomeLeft}>
            <div className={styles.welcomeIcon}>
              <Shield size={28} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <p className={styles.welcomeSub}>Welcome back,</p>
              <h1 className={styles.welcomeName}>{user?.name ?? 'Admin'}</h1>
              <p className={styles.welcomeRole}>Safety-GUARD Administrator</p>
            </div>
          </div>
          <div className={styles.statusPill}>
            <span className={styles.statusDot} />
            All Systems Operational
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: 'var(--cyan)' }}>{totalSessions}</span>
            <span className={styles.statLabel}>Total Sessions</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: activeSessions > 0 ? 'var(--red)' : 'var(--green)' }}>
              {activeSessions}
            </span>
            <span className={styles.statLabel}>Active Now</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: 'var(--green)' }}>{resolvedSessions}</span>
            <span className={styles.statLabel}>Resolved</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: avgRisk > 50 ? 'var(--red)' : '#FFD24A' }}>
              {avgRisk}%
            </span>
            <span className={styles.statLabel}>Avg Risk</span>
          </div>
        </div>

        {currentSession && currentSession.state !== 'RESOLVED' && (
          <div className={styles.alertBanner} onClick={() => navigate('/admin/dashboard')}>
            <AlertTriangle size={18} className={styles.alertIcon} />
            <div className={styles.alertText}>
              <strong>Active Emergency</strong>
              <span>User in distress — click to open live dashboard</span>
            </div>
            <span className={styles.alertArrow}>→</span>
          </div>
        )}

        <div className={styles.quickGrid}>
          {QUICK_LINKS.map(link => (
            <button
              key={link.to}
              className={`${styles.quickCard} ${styles[`color_${link.color}`]}`}
              onClick={() => navigate(link.to)}
            >
              <div className={styles.quickIcon}>
                <link.icon size={22} />
              </div>
              <div className={styles.quickText}>
                <span className={styles.quickLabel}>{link.label}</span>
                <span className={styles.quickDesc}>{link.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {sessionHistory.length > 0 && (
          <div className={styles.recentCard}>
            <div className={styles.recentHeader}>
              <Clock size={14} style={{ color: 'var(--text-3)' }} />
              <span className={styles.recentTitle}>Recent Activity</span>
            </div>
            <div className={styles.recentList}>
              {sessionHistory.slice(0, 5).map(s => (
                <div key={s.id} className={styles.recentItem}>
                  <div
                    className={styles.recentDot}
                    style={{ background: s.state === 'RESOLVED' ? 'var(--green)' : 'var(--red)' }}
                  />
                  <span className={styles.recentState}>{s.state.replace(/_/g, ' ')}</span>
                  <span className={styles.recentDate}>
                    {new Date(s.startedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className={styles.recentRisk}>Risk {Math.round(s.riskScore)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
