import { useEffect, useRef, useState } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import type { TimelineEvent } from '@/types'
import styles from './NotificationCenter.module.css'

interface Toast {
  id: string
  type: TimelineEvent['eventType']
  message: string
  icon: string
  color: string
  time: string
}

const EVENT_CONFIG: Partial<Record<TimelineEvent['eventType'], { icon: string; color: string; msg: string }>> = {
  SESSION_STARTED:   { icon: '🛡️', color: '#3CE07F', msg: 'Emergency session activated' },
  ALERT_SENT:        { icon: '🚨', color: '#FF1F3A', msg: 'WhatsApp alert dispatched' },
  ALERT_REPEATED:    { icon: '🔁', color: '#FFD24A', msg: 'Repeat alert sent' },
  LOCATION_UPDATED:  { icon: '📍', color: '#21D4FF', msg: 'GPS location updated' },
  RISK_SCORED:       { icon: '🤖', color: '#bf5af2', msg: 'AI risk score recalculated' },
  STATE_CHANGED:     { icon: '⚡', color: '#FFD24A', msg: 'Emergency state changed' },
  PASSCODE_VERIFIED: { icon: '✅', color: '#3CE07F', msg: 'User verified safe' },
  PASSCODE_WRONG:    { icon: '⚠️', color: '#FF1F3A', msg: 'Wrong passcode attempt' },
  SESSION_ENDED:     { icon: '🏁', color: '#3CE07F', msg: 'Emergency session closed' },
  CONTACT_NOTIFIED:  { icon: '👥', color: '#21D4FF', msg: 'Emergency contact notified' },
}

const MAX_TOASTS = 5

export default function NotificationCenter() {
  const { currentSession } = useSessionStore()
  const events = currentSession?.timeline ?? []
  const prevLen = useRef(events.length)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (events.length > prevLen.current) {
      const newEvents = events.slice(prevLen.current)
      newEvents.forEach(ev => {
        const cfg = EVENT_CONFIG[ev.eventType]
        if (!cfg) return
        const toast: Toast = {
          id: ev.id || crypto.randomUUID(),
          type: ev.eventType,
          message: cfg.msg,
          icon: cfg.icon,
          color: cfg.color,
          time: new Date(ev.occurredAt).toLocaleTimeString(),
        }
        setToasts(prev => [toast, ...prev].slice(0, MAX_TOASTS))
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id))
        }, 6000)
      })
    }
    prevLen.current = events.length
  }, [events])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>🔔</span>
        <span className={styles.title}>NOTIFICATION CENTER</span>
        {toasts.length > 0 && (
          <span className={styles.countBadge}>{toasts.length}</span>
        )}
      </div>

      <div className={styles.feed}>
        {toasts.length === 0 && events.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔕</div>
            <div>No notifications</div>
            <div className={styles.emptyHint}>Events will appear here in real-time</div>
          </div>
        )}

        {toasts.map(toast => (
          <div
            key={toast.id}
            className={styles.toast}
            style={{ borderLeftColor: toast.color, background: `${toast.color}08` }}
          >
            <span className={styles.toastIcon}>{toast.icon}</span>
            <div className={styles.toastBody}>
              <div className={styles.toastMsg}>{toast.message}</div>
              <div className={styles.toastTime}>{toast.time}</div>
            </div>
            <div className={styles.toastGlow} style={{ background: toast.color }} />
          </div>
        ))}

        {/* Recent event log */}
        {toasts.length === 0 && events.length > 0 && (
          <div className={styles.recentLog}>
            {events.slice(-5).reverse().map((ev, i) => {
              const cfg = EVENT_CONFIG[ev.eventType]
              return (
                <div key={ev.id || i} className={styles.logItem}>
                  <span className={styles.logIcon}>{cfg?.icon ?? '◈'}</span>
                  <div className={styles.logBody}>
                    <span className={styles.logMsg}>{cfg?.msg ?? ev.eventType.replace(/_/g, ' ')}</span>
                    <span className={styles.logTime}>{new Date(ev.occurredAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
