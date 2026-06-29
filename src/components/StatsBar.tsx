import { useEffect, useState } from 'react'
import { Shield, Zap, Activity, Users } from 'lucide-react'
import styles from './StatsBar.module.css'

interface Stat {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  glow: string
  suffix?: string
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    const start = performance.now()
    const frame = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target, duration])
  return <>{val}</>
}

interface Props {
  sessions: number
  alertCount: number
  riskScore: number
  gpsPoints: number
  isActive: boolean
}

export default function StatsBar({ sessions, alertCount, riskScore, gpsPoints, isActive }: Props) {
  const stats: Stat[] = [
    {
      label: 'ACTIVE SESSIONS',
      value: isActive ? 1 : 0,
      icon: <Users size={18} />,
      color: isActive ? '#FF1F3A' : '#3CE07F',
      glow: isActive ? 'rgba(255,31,58,0.4)' : 'rgba(60,224,127,0.4)',
      suffix: isActive ? ' LIVE' : '',
    },
    {
      label: 'ALERTS SENT',
      value: alertCount,
      icon: <Zap size={18} />,
      color: '#FFD24A',
      glow: 'rgba(255,210,74,0.4)',
    },
    {
      label: 'TOTAL SESSIONS',
      value: sessions,
      icon: <Shield size={18} />,
      color: '#21D4FF',
      glow: 'rgba(33,212,255,0.4)',
    },
    {
      label: 'GPS POINTS',
      value: gpsPoints,
      icon: <Activity size={18} />,
      color: '#bf5af2',
      glow: 'rgba(191,90,242,0.4)',
    },
  ]

  return (
    <div className={styles.bar}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={styles.card}
          style={{ '--glow': stat.glow } as React.CSSProperties}
        >
          <div className={styles.iconWrap} style={{ color: stat.color, background: `${stat.glow}`, border: `1px solid ${stat.color}44` }}>
            {stat.icon}
          </div>
          <div className={styles.info}>
            <div className={styles.value} style={{ color: stat.color, textShadow: `0 0 20px ${stat.glow}` }}>
              <CountUp target={stat.value} />
              {stat.suffix && <span className={styles.suffix}>{stat.suffix}</span>}
            </div>
            <div className={styles.label}>{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
