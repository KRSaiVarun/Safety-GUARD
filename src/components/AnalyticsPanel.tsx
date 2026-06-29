import { useSessionStore } from '@/stores/sessionStore'
import styles from './AnalyticsPanel.module.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Seeded demo data for chart realism
const DAILY_DATA = [2, 5, 3, 8, 4, 11, 6]
const RISK_DIST  = [
  { label: 'LOW',      value: 45, color: '#3CE07F' },
  { label: 'MEDIUM',   value: 28, color: '#FFD24A' },
  { label: 'HIGH',     value: 18, color: '#FF6B35' },
  { label: 'CRITICAL', value: 9,  color: '#FF1F3A' },
]
const DELIVERY_RATE = [96, 98, 95, 99, 97, 100, 98]

export default function AnalyticsPanel() {
  const { sessionHistory, alertDelivery } = useSessionStore()
  const maxBar = Math.max(...DAILY_DATA)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>📈</span>
        <span className={styles.title}>ANALYTICS INTELLIGENCE</span>
      </div>

      <div className={styles.body}>
        {/* Daily incidents bar chart */}
        <div className={styles.chart}>
          <div className={styles.chartLabel}>DAILY INCIDENTS</div>
          <div className={styles.barChart}>
            {DAILY_DATA.map((v, i) => (
              <div key={i} className={styles.barCol}>
                <div className={styles.barWrap}>
                  <div
                    className={styles.barFill}
                    style={{ height: `${(v / maxBar) * 100}%`, animationDelay: `${i * 0.08}s` }}
                  />
                </div>
                <span className={styles.barLabel}>{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.row2}>
          {/* Risk distribution */}
          <div className={styles.riskDist}>
            <div className={styles.chartLabel}>RISK DISTRIBUTION</div>
            <div className={styles.distList}>
              {RISK_DIST.map(d => (
                <div key={d.label} className={styles.distItem}>
                  <span className={styles.distDot} style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                  <span className={styles.distLabel}>{d.label}</span>
                  <div className={styles.distBar}>
                    <div className={styles.distFill} style={{ width: `${d.value}%`, background: d.color }} />
                  </div>
                  <span className={styles.distPct} style={{ color: d.color }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key metric */}
          <div className={styles.keyMetric}>
            <div className={styles.chartLabel}>ALERT SUCCESS</div>
            <div className={styles.bigNum} style={{ color: '#3CE07F' }}>
              {alertDelivery.count > 0 ? '98.7%' : '—'}
            </div>
            <div className={styles.bigNumLabel}>Delivery Rate</div>
            <div className={styles.sessionCount}>
              <span className={styles.scNum}>{sessionHistory.length}</span>
              <span className={styles.scLabel}>Total Sessions</span>
            </div>
          </div>
        </div>

        {/* Delivery rate mini sparkline */}
        <div className={styles.sparkline}>
          <div className={styles.chartLabel}>7-DAY DELIVERY RATE (%)</div>
          <svg viewBox={`0 0 ${DELIVERY_RATE.length * 20} 40`} className={styles.sparkSvg} preserveAspectRatio="none">
            <polyline
              points={DELIVERY_RATE.map((v, i) => `${i * 20 + 10},${40 - ((v - 90) / 10) * 38}`).join(' ')}
              fill="none"
              stroke="#21D4FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 4px #21D4FF88)' }}
            />
            {DELIVERY_RATE.map((v, i) => (
              <circle key={i} cx={i * 20 + 10} cy={40 - ((v - 90) / 10) * 38} r="3" fill="#21D4FF" />
            ))}
          </svg>
          <div className={styles.sparkLabels}>
            {DAYS.map(d => <span key={d} className={styles.sparkLabel}>{d}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}
