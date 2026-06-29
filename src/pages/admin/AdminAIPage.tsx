import { Brain, Activity, TrendingUp, Zap, Shield, Battery } from 'lucide-react'
import { useSessionStore } from '@/stores/sessionStore'
import { useLocationStore } from '@/stores/locationStore'
import RiskMeter from '@/components/RiskMeter'
import AnalyticsPanel from '@/components/AnalyticsPanel'
import styles from './AdminAIPage.module.css'

function MetricCard({ icon, label, value, sub, color = 'var(--cyan)' }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricIcon} style={{ color }}>{icon}</div>
      <div className={styles.metricText}>
        <span className={styles.metricValue} style={{ color }}>{value}</span>
        <span className={styles.metricLabel}>{label}</span>
        {sub && <span className={styles.metricSub}>{sub}</span>}
      </div>
    </div>
  )
}

export default function AdminAIPage() {
  const { currentSession } = useSessionStore()
  const { current: loc } = useLocationStore()

  const riskScore  = currentSession?.riskScore ?? 0
  const state      = currentSession?.state ?? 'IDLE'
  const isActive   = !!currentSession && state !== 'RESOLVED'

  const riskLevel  = riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW'
  const riskColor  = riskScore >= 75 ? 'var(--red)' : riskScore >= 50 ? 'orange' : riskScore >= 25 ? '#FFD24A' : 'var(--green)'

  const speedKmh   = loc?.speed != null ? (loc.speed * 3.6).toFixed(1) : '—'
  const accuracy   = loc?.accuracy != null ? `±${Math.round(loc.accuracy)}m` : '—'

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Brain size={20} style={{ color: '#bf5af2' }} />
            </div>
            <div>
              <h1 className={styles.title}>AI Monitoring</h1>
              <p className={styles.subtitle}>Threat prediction and risk analysis engine</p>
            </div>
          </div>
          <div className={`${styles.aiStatus} ${isActive ? styles.aiStatusActive : ''}`}>
            <span className={styles.aiDot} />
            {isActive ? 'AI Analysing' : 'AI Standby'}
          </div>
        </div>

        <div className={styles.metricsRow}>
          <MetricCard
            icon={<TrendingUp size={18} />}
            label="Live Risk Score"
            value={`${riskScore}%`}
            sub={riskLevel}
            color={riskColor}
          />
          <MetricCard
            icon={<Activity size={18} />}
            label="Speed"
            value={`${speedKmh}${speedKmh !== '—' ? ' km/h' : ''}`}
            sub="From GPS"
            color="var(--cyan)"
          />
          <MetricCard
            icon={<Zap size={18} />}
            label="GPS Accuracy"
            value={accuracy}
            sub="Horizontal error"
            color="var(--green)"
          />
          <MetricCard
            icon={<Shield size={18} />}
            label="Session State"
            value={state.replace(/_/g, ' ')}
            sub={isActive ? 'Emergency active' : 'No active session'}
            color={isActive ? 'var(--red)' : 'var(--text-2)'}
          />
        </div>

        <div className={styles.panels}>
          <div className={styles.riskPanel}>
            <div className={styles.panelTitle}>Risk Assessment</div>
            <RiskMeter score={riskScore} />
            <div className={styles.factors}>
              <div className={styles.factorsTitle}>Risk Factors</div>
              <div className={styles.factorRow}>
                <span>Time of day</span>
                <div className={styles.factorBar}>
                  <div className={styles.factorFill} style={{ width: '30%', background: '#FFD24A' }} />
                </div>
                <span className={styles.factorPct}>30%</span>
              </div>
              <div className={styles.factorRow}>
                <span>Inactivity</span>
                <div className={styles.factorBar}>
                  <div className={styles.factorFill} style={{ width: `${Math.min(riskScore, 40)}%`, background: 'var(--red)' }} />
                </div>
                <span className={styles.factorPct}>40%</span>
              </div>
              <div className={styles.factorRow}>
                <span>Speed anomaly</span>
                <div className={styles.factorBar}>
                  <div className={styles.factorFill} style={{ width: '20%', background: 'var(--cyan)' }} />
                </div>
                <span className={styles.factorPct}>20%</span>
              </div>
              <div className={styles.factorRow}>
                <span>GPS accuracy</span>
                <div className={styles.factorBar}>
                  <div className={styles.factorFill} style={{ width: '10%', background: 'var(--green)' }} />
                </div>
                <span className={styles.factorPct}>10%</span>
              </div>
            </div>
          </div>

          <div className={styles.analyticsPanel}>
            <div className={styles.panelTitle}>Live Analytics</div>
            <AnalyticsPanel />
          </div>
        </div>

        {!isActive && (
          <div className={styles.idleNote}>
            <Brain size={16} />
            AI risk scoring activates automatically when a user triggers an SOS emergency.
          </div>
        )}

      </div>
    </div>
  )
}
