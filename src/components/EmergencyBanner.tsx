import { useEffect, useState } from 'react'
import type { LocationPoint } from '@/types'
import styles from './EmergencyBanner.module.css'

interface Props {
  userName: string
  location: LocationPoint | null
  elapsedSeconds: number
  alertCount: number
}

export default function EmergencyBanner({ userName, location, elapsedSeconds, alertCount }: Props) {
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 600)
    return () => clearInterval(id)
  }, [])

  const mins = Math.floor(elapsedSeconds / 60)
  const secs = elapsedSeconds % 60
  const elapsed = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div className={styles.banner}>
      <div className={styles.scanline} />

      <div className={styles.left}>
        <div className={`${styles.sosTag} ${blink ? styles.sosVisible : styles.sosHidden}`}>
          ⚠ SOS
        </div>
        <div>
          <div className={styles.title}>WOMEN SAFETY PROTOCOL ACTIVATED</div>
          <div className={styles.sub}>Emergency triggered via PANIC BUTTON · {userName}</div>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricVal}>{elapsed}</div>
          <div className={styles.metricLabel}>ELAPSED</div>
        </div>
        <div className={styles.divider} />
        <div className={styles.metric}>
          <div className={styles.metricVal}>{alertCount}</div>
          <div className={styles.metricLabel}>ALERTS SENT</div>
        </div>
        <div className={styles.divider} />
        <div className={styles.metric}>
          <div className={styles.metricVal} style={{ fontSize: '11px' }}>
            {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'LOCATING...'}
          </div>
          <div className={styles.metricLabel}>COORDINATES</div>
        </div>
      </div>
    </div>
  )
}
