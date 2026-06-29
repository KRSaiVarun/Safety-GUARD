import { useMemo } from 'react'
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './AdminAnalyticsPage.module.css'

function StatCard({ label, value, sub, color = 'var(--text-0)' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue} style={{ color }}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { sessionHistory } = useSessionStore()

  const stats = useMemo(() => {
    const total     = sessionHistory.length
    const resolved  = sessionHistory.filter(s => s.state === 'RESOLVED').length
    const triggered = sessionHistory.filter(s => s.state === 'ALERT_TRIGGERED' || s.state === 'LIVE_TRACKING').length
    const avgRisk   = total > 0
      ? Math.round(sessionHistory.reduce((a, s) => a + s.riskScore, 0) / total)
      : 0

    const byMethod: Record<string, number> = {}
    sessionHistory.forEach(s => {
      byMethod[s.triggerMethod] = (byMethod[s.triggerMethod] ?? 0) + 1
    })

    const riskBuckets = { low: 0, medium: 0, high: 0, critical: 0 }
    sessionHistory.forEach(s => {
      if      (s.riskScore < 25)  riskBuckets.low++
      else if (s.riskScore < 50)  riskBuckets.medium++
      else if (s.riskScore < 75)  riskBuckets.high++
      else                        riskBuckets.critical++
    })

    return { total, resolved, triggered, avgRisk, byMethod, riskBuckets }
  }, [sessionHistory])

  const maxBucket = Math.max(...Object.values(stats.riskBuckets), 1)

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <BarChart2 size={20} style={{ color: 'var(--cyan)' }} />
            </div>
            <div>
              <h1 className={styles.title}>Analytics</h1>
              <p className={styles.subtitle}>Emergency incident statistics and trends</p>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard label="Total Sessions"  value={stats.total}    color="var(--cyan)" />
          <StatCard label="Resolved"        value={stats.resolved}  color="var(--green)" />
          <StatCard label="Alerts Triggered" value={stats.triggered} color="var(--red)" />
          <StatCard label="Avg Risk Score"  value={`${stats.avgRisk}%`}
            color={stats.avgRisk > 50 ? 'var(--red)' : '#FFD24A'} />
        </div>

        <div className={styles.row2}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <Activity size={14} style={{ color: 'var(--text-3)' }} />
              <span className={styles.cardTitle}>Risk Distribution</span>
            </div>
            <div className={styles.barChart}>
              {[
                { label: 'Low (0-24)',     value: stats.riskBuckets.low,      color: 'var(--green)' },
                { label: 'Medium (25-49)', value: stats.riskBuckets.medium,   color: '#FFD24A'      },
                { label: 'High (50-74)',   value: stats.riskBuckets.high,     color: 'orange'       },
                { label: 'Critical (75+)', value: stats.riskBuckets.critical, color: 'var(--red)'   },
              ].map(b => (
                <div key={b.label} className={styles.barRow}>
                  <span className={styles.barLabel}>{b.label}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width:      `${(b.value / maxBucket) * 100}%`,
                        background: b.color,
                        minWidth:   b.value > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                  <span className={styles.barCount} style={{ color: b.color }}>{b.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <TrendingUp size={14} style={{ color: 'var(--text-3)' }} />
              <span className={styles.cardTitle}>Trigger Methods</span>
            </div>
            {Object.keys(stats.byMethod).length === 0 ? (
              <div className={styles.empty}>No session data yet</div>
            ) : (
              <div className={styles.pieList}>
                {Object.entries(stats.byMethod).map(([method, count]) => {
                  const pct = Math.round((count / stats.total) * 100)
                  return (
                    <div key={method} className={styles.pieRow}>
                      <div className={styles.pieDot} />
                      <span className={styles.pieMethod}>
                        {method.replace(/_/g, ' ')}
                      </span>
                      <div className={styles.pieTrack}>
                        <div className={styles.pieFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.pieCount}>{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.sessionList}>
          <div className={styles.cardHeader}>
            <Clock size={14} style={{ color: 'var(--text-3)' }} />
            <span className={styles.cardTitle}>Session History</span>
            <span className={styles.cardCount}>{sessionHistory.length}</span>
          </div>
          {sessionHistory.length === 0 ? (
            <div className={styles.empty}>No sessions recorded yet</div>
          ) : (
            sessionHistory.slice(0, 10).map(s => (
              <div key={s.id} className={styles.sessionRow}>
                <div className={styles.sessionLeft}>
                  {s.state === 'RESOLVED'
                    ? <CheckCircle size={14} style={{ color: 'var(--green)' }} />
                    : <AlertTriangle size={14} style={{ color: 'var(--red)' }} />
                  }
                  <span className={styles.sessionState}>{s.state.replace(/_/g, ' ')}</span>
                </div>
                <span className={styles.sessionDate}>
                  {new Date(s.startedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <span className={styles.sessionRisk}>Risk {Math.round(s.riskScore)}%</span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
