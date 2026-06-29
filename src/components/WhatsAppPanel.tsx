import { useEffect, useState } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './WhatsAppPanel.module.css'

const ALERT_REPEAT_INTERVAL = 30

const ALERT_FLOW = [
  { key: 'idle',    label: 'STANDBY',    color: '#555' },
  { key: 'sending', label: 'PROCESSING', color: '#FFD24A' },
  { key: 'sent',    label: 'SENT',       color: '#21D4FF' },
  { key: 'failed',  label: 'FAILED',     color: '#FF1F3A' },
]

export default function WhatsAppPanel() {
  const { alertDelivery, currentSession } = useSessionStore()
  const [countdown, setCountdown] = useState(ALERT_REPEAT_INTERVAL)

  useEffect(() => {
    if (!currentSession || currentSession.state === 'RESOLVED') {
      setCountdown(ALERT_REPEAT_INTERVAL)
      return
    }
    if (alertDelivery.status !== 'sent') return

    setCountdown(ALERT_REPEAT_INTERVAL)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return ALERT_REPEAT_INTERVAL
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [alertDelivery.lastSentAt, currentSession])

  const isActive = !!currentSession && currentSession.state !== 'RESOLVED'
  const isSent   = alertDelivery.status === 'sent'
  const isFailed = alertDelivery.status === 'failed'

  const progressPct = ((ALERT_REPEAT_INTERVAL - countdown) / ALERT_REPEAT_INTERVAL) * 100
  const circumference = 2 * Math.PI * 20

  return (
    <div className={`${styles.panel} ${isActive ? styles.panelActive : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={`${styles.waDot} ${isActive ? styles.waDotActive : ''}`} />
          <span className={styles.title}>WHATSAPP ALERT MONITOR</span>
        </div>
        <span className={styles.count}>
          {alertDelivery.count > 0 ? `${alertDelivery.count} sent` : 'No alerts'}
        </span>
      </div>

      {/* Alert flow pipeline */}
      <div className={styles.pipeline}>
        {ALERT_FLOW.map((step, i) => {
          const isCurrentStep = alertDelivery.status === step.key
          const isPast = ALERT_FLOW.findIndex(s => s.key === alertDelivery.status) > i
          return (
            <div key={step.key} className={styles.pipelineItem}>
              <div
                className={`${styles.pipelineDot} ${isCurrentStep ? styles.pipelineDotActive : ''}`}
                style={{
                  background: isCurrentStep || isPast ? step.color : 'transparent',
                  borderColor: step.color,
                  boxShadow: isCurrentStep ? `0 0 10px ${step.color}88` : 'none',
                }}
              />
              <span className={styles.pipelineLabel} style={{ color: isCurrentStep ? step.color : 'rgba(255,255,255,0.25)' }}>
                {step.label}
              </span>
              {i < ALERT_FLOW.length - 1 && (
                <div className={styles.pipelineArrow} style={{ background: isPast ? step.color : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Status display */}
      {!isActive && (
        <div className={styles.standby}>
          <div className={styles.standbyIcon}>📲</div>
          <div className={styles.standbyText}>Monitoring inactive</div>
          <div className={styles.standbyHint}>Activate SOS to send WhatsApp alerts</div>
        </div>
      )}

      {isActive && (
        <>
          {/* Next alert countdown */}
          {isSent && (
            <div className={styles.countdownRow}>
              <div className={styles.countdownRing}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                  <circle
                    cx="28" cy="28" r="20" fill="none"
                    stroke="#21D4FF" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(progressPct / 100) * circumference} ${circumference}`}
                    strokeDashoffset={circumference * 0.25}
                    style={{ filter: 'drop-shadow(0 0 6px #21D4FF88)', transition: 'stroke-dasharray 1s linear' }}
                  />
                  <text x="28" y="33" textAnchor="middle" fill="#21D4FF" fontSize="12" fontFamily="monospace" fontWeight="700">
                    {countdown}s
                  </text>
                </svg>
              </div>
              <div className={styles.countdownInfo}>
                <div className={styles.countdownLabel}>NEXT ALERT IN</div>
                <div className={styles.countdownSub}>Auto-repeating every 30s</div>
              </div>
            </div>
          )}

          {/* Alert sent status */}
          {isSent && (
            <div className={styles.alertSent}>
              <div className={styles.alertSentRow}>
                <span className={styles.alertSentIcon}>✅</span>
                <div>
                  <div className={styles.alertSentTitle}>WhatsApp Alert Delivered</div>
                  <div className={styles.alertSentTime}>
                    {alertDelivery.lastSentAt
                      ? `Last sent: ${new Date(alertDelivery.lastSentAt).toLocaleTimeString()}`
                      : 'Sending...'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isFailed && (
            <div className={styles.alertFailed}>
              <span>⚠️</span>
              <div>
                <div className={styles.alertFailedTitle}>Alert Failed</div>
                <div className={styles.alertFailedErr}>{alertDelivery.error ?? 'Check Twilio config'}</div>
              </div>
            </div>
          )}

          {/* Message preview */}
          <div className={styles.messagePreview}>
            <div className={styles.messageHeader}>
              <span className={styles.waIcon}>💬</span>
              <span>WhatsApp Message Preview</span>
            </div>
            <div className={styles.messageBubble}>
              <div>🚨 WOMEN SAFETY PROTOCOL ACTIVATED 🚨</div>
              <br />
              <div>🚨 Emergency triggered via: PANIC BUTTON</div>
              <br />
              <div>📍 LIVE LOCATION:</div>
              <div className={styles.messageLink}>https://www.google.com/maps?q=...</div>
              <br />
              <div>📡 Real-time GPS tracking enabled.</div>
              <div>Please respond immediately or contact authorities.</div>
              <br />
              <div>— Women Safety Protocol</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
