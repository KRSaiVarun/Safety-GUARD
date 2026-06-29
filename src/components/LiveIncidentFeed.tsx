import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, MapPin, Zap, Shield, Radio, User } from 'lucide-react'
import type { TimelineEvent } from '@/types'
import styles from './LiveIncidentFeed.module.css'

const EVENT_ICONS = {
  SESSION_STARTED:    { Icon: Shield,        color: '#30d158' },
  LOCATION_UPDATED:   { Icon: MapPin,        color: '#0a84ff' },
  RISK_SCORED:        { Icon: Zap,           color: '#ffd60a' },
  ALERT_SENT:         { Icon: AlertTriangle, color: '#ff2d55' },
  ALERT_REPEATED:     { Icon: AlertTriangle, color: '#ff6b35' },
  STATE_CHANGED:      { Icon: Radio,         color: '#bf5af2' },
  SESSION_ENDED:      { Icon: Shield,        color: '#ff6b35' },
  CONTACT_NOTIFIED:   { Icon: User,          color: '#32ade6' },
  PASSCODE_WRONG:     { Icon: Shield,        color: '#ff2d55' },
  PASSCODE_VERIFIED:  { Icon: Shield,        color: '#30d158' },
}

interface Props {
  events: TimelineEvent[]
  maxHeight?: number
}

export default function LiveIncidentFeed({ events, maxHeight = 320 }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.dot} />
        <span className={styles.title}>LIVE INCIDENT FEED</span>
        <span className={styles.count}>{events.length} events</span>
      </div>

      <div className={styles.feed} style={{ maxHeight }}>
        {events.length === 0 && (
          <div className={styles.empty}>Monitoring... no events yet</div>
        )}
        {events.map((event, i) => {
          const conf = EVENT_ICONS[event.eventType] ?? EVENT_ICONS.STATE_CHANGED
          const { Icon, color } = conf
          return (
            <div
              key={event.id || i}
              className={styles.event}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={styles.iconWrap} style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                <Icon size={12} style={{ color }} />
              </div>
              <div className={styles.eventBody}>
                <span className={styles.eventType}>{event.eventType.replace(/_/g, ' ')}</span>
                {event.data && Object.keys(event.data).length > 0 && (
                  <span className={styles.eventData}>
                    {Object.entries(event.data).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </span>
                )}
              </div>
              <span className={styles.time}>
                {format(new Date(event.occurredAt), 'HH:mm:ss')}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
