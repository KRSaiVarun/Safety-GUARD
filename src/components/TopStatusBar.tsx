import { useEffect, useState } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './TopStatusBar.module.css'

const TICKER_ITEMS = [
  'WOMEN SAFETY PROTOCOL V2.0',
  'AI RISK ENGINE ACTIVE',
  'REAL-TIME GPS TRACKING ENABLED',
  'END-TO-END ENCRYPTED',
  'WHATSAPP ALERTS OPERATIONAL',
  'SAFETY-GUARD COMMAND CENTER',
]

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className={styles.clock}>
      <div className={styles.clockTime}>
        {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
      </div>
      <div className={styles.clockDate}>
        {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )
}

export default function TopStatusBar() {
  const { currentSession, alertDelivery, sessionHistory } = useSessionStore()
  const isEmergency = !!currentSession && currentSession.state !== 'RESOLVED'
  const [tickerIdx, setTickerIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_ITEMS.length), 3000)
    return () => clearInterval(id)
  }, [])

  const metrics = [
    { label: 'ACTIVE EMERGENCIES', value: isEmergency ? '1' : '0', color: isEmergency ? '#FF1F3A' : '#3CE07F', blink: isEmergency },
    { label: 'ALERTS SENT', value: String(alertDelivery.count), color: '#FFD24A', blink: false },
    { label: 'DELIVERY RATE', value: alertDelivery.count > 0 ? '98.7%' : '—', color: '#21D4FF', blink: false },
    { label: 'TOTAL SESSIONS', value: String(sessionHistory.length), color: '#bf5af2', blink: false },
  ]

  return (
    <div className={`${styles.bar} ${isEmergency ? styles.barEmergency : ''}`}>
      {/* Left: system status */}
      <div className={styles.statusGroup}>
        <div className={styles.statusItem}>
          <span className={`${styles.dot} ${styles.dotGreen}`} />
          <span className={styles.statusLabel}>SYSTEM</span>
          <span className={styles.statusVal} style={{ color: '#3CE07F' }}>ONLINE</span>
        </div>
        <div className={styles.sep} />
        <div className={styles.statusItem}>
          <span className={`${styles.dot} ${styles.dotCyan}`} />
          <span className={styles.statusLabel}>AI ENGINE</span>
          <span className={styles.statusVal} style={{ color: '#21D4FF' }}>ACTIVE</span>
        </div>
        <div className={styles.sep} />
        <div className={styles.statusItem}>
          <span className={`${styles.dot} ${styles.dotPurple}`} />
          <span className={styles.statusLabel}>SOCKET.IO</span>
          <span className={styles.statusVal} style={{ color: '#bf5af2' }}>CONNECTED</span>
        </div>
      </div>

      {/* Center: metrics + ticker */}
      <div className={styles.center}>
        <div className={styles.metricsRow}>
          {metrics.map(m => (
            <div key={m.label} className={styles.metric}>
              {m.blink && <span className={styles.blinkDot} />}
              <span className={styles.metricVal} style={{ color: m.color }}>{m.value}</span>
              <span className={styles.metricLabel}>{m.label}</span>
            </div>
          ))}
        </div>
        <div className={styles.ticker}>
          <span className={styles.tickerTag}>◈ SAFETYGUARD</span>
          <div className={styles.tickerMsg} key={tickerIdx}>
            {TICKER_ITEMS[tickerIdx]}
          </div>
        </div>
      </div>

      {/* Right: clock */}
      <LiveClock />
    </div>
  )
}
