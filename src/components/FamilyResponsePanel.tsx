import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './FamilyResponsePanel.module.css'

type ResponseStatus = 'PENDING' | 'DELIVERED' | 'READ' | 'ACKNOWLEDGED' | 'DECLINED'

const STATUS_CONFIG: Record<ResponseStatus, { color: string; label: string; icon: string }> = {
  PENDING:      { color: '#FFD24A', label: 'PENDING',      icon: '⏳' },
  DELIVERED:    { color: '#21D4FF', label: 'DELIVERED',    icon: '✓✓' },
  READ:         { color: '#3CE07F', label: 'READ',         icon: '👁' },
  ACKNOWLEDGED: { color: '#3CE07F', label: 'ACKNOWLEDGED', icon: '✅' },
  DECLINED:     { color: '#FF1F3A', label: 'FALSE ALARM',  icon: '✗' },
}

const DEMO_CONTACTS = [
  { name: 'Mother',   phone: '+91 85488 78488', relationship: 'Mother'   },
  { name: 'Father',   phone: '+91 86182 66736', relationship: 'Father'   },
  { name: 'Guardian', phone: '+91 99999 00000', relationship: 'Guardian' },
]

export default function FamilyResponsePanel() {
  const { user } = useAuthStore()
  const { currentSession, alertDelivery } = useSessionStore()
  const isActive = !!currentSession && currentSession.state !== 'RESOLVED'

  const contacts = user?.emergencyContacts?.length
    ? user.emergencyContacts
    : DEMO_CONTACTS

  // Simulate delivery statuses based on alert count
  const getStatus = (idx: number): ResponseStatus => {
    if (!isActive || alertDelivery.count === 0) return 'PENDING'
    if (idx === 0) return alertDelivery.count >= 2 ? 'READ' : 'DELIVERED'
    if (idx === 1) return 'DELIVERED'
    return 'PENDING'
  }

  const [responses, setResponses] = useState<Partial<Record<number, 'ACKNOWLEDGED' | 'DECLINED'>>>({})

  const respond = (idx: number, type: 'ACKNOWLEDGED' | 'DECLINED') => {
    setResponses(r => ({ ...r, [idx]: type }))
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>👨‍👩‍👧</span>
        <span className={styles.title}>FAMILY RESPONSE CENTER</span>
        <span className={styles.badge} style={{ color: isActive ? '#FF1F3A' : 'rgba(255,255,255,0.3)', borderColor: isActive ? '#FF1F3A44' : 'rgba(255,255,255,0.1)', background: isActive ? '#FF1F3A12' : 'transparent' }}>
          {isActive ? 'MONITORING' : 'STANDBY'}
        </span>
      </div>

      <div className={styles.contacts}>
        {contacts.slice(0, 3).map((c, i) => {
          const override = responses[i]
          const status: ResponseStatus = override ?? getStatus(i)
          const cfg = STATUS_CONFIG[status]

          return (
            <div key={i} className={`${styles.contactCard} ${override ? styles.contactCardResponded : ''}`}>
              <div className={styles.avatar} style={{ background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}11)`, borderColor: `${cfg.color}44` }}>
                <span className={styles.avatarText}>{c.name[0]}</span>
              </div>
              <div className={styles.contactInfo}>
                <div className={styles.contactName}>{c.name}</div>
                <div className={styles.contactPhone}>{c.phone || c.relationship}</div>
              </div>
              <div className={styles.contactStatus}>
                <span className={styles.statusIcon}>{cfg.icon}</span>
                <span className={styles.statusLabel} style={{ color: cfg.color }}>{cfg.label}</span>
              </div>

              {/* Response buttons */}
              {isActive && !override && (status === 'READ' || status === 'DELIVERED') && (
                <div className={styles.responseButtons}>
                  <button
                    className={`${styles.responseBtn} ${styles.responseBtnYes}`}
                    onClick={() => respond(i, 'ACKNOWLEDGED')}
                  >
                    ✓ RECEIVED
                  </button>
                  <button
                    className={`${styles.responseBtn} ${styles.responseBtnNo}`}
                    onClick={() => respond(i, 'DECLINED')}
                  >
                    FALSE ALARM
                  </button>
                </div>
              )}

              {override === 'ACKNOWLEDGED' && (
                <div className={styles.ackBanner}>
                  <span>✅ Family acknowledged emergency</span>
                  <span className={styles.ackTime}>{new Date().toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!isActive && (
        <div className={styles.idle}>
          <div className={styles.idleIcon}>🔔</div>
          <div className={styles.idleText}>Waiting for emergency activation</div>
          <div className={styles.idleHint}>Family will be notified via WhatsApp</div>
        </div>
      )}
    </div>
  )
}
