import styles from './RiskMeter.module.css'

interface Props {
  score: number  // 0–100
}

const LEVELS = [
  { max: 25,  label: 'LOW',      color: '#30d158', glow: 'rgba(48,209,88,0.5)' },
  { max: 50,  label: 'MEDIUM',   color: '#ffd60a', glow: 'rgba(255,214,10,0.5)' },
  { max: 75,  label: 'HIGH',     color: '#ff9f0a', glow: 'rgba(255,159,10,0.5)' },
  { max: 100, label: 'CRITICAL', color: '#ff2d55', glow: 'rgba(255,45,85,0.5)' },
]

function getLevel(score: number) {
  return LEVELS.find(l => score <= l.max) ?? LEVELS[3]
}

export default function RiskMeter({ score }: Props) {
  const level = getLevel(score)
  const angle = -135 + (score / 100) * 270  // arc from -135deg to +135deg

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>AI RISK SCORE</div>

      {/* Arc meter */}
      <div className={styles.gauge}>
        <svg viewBox="0 0 200 120" className={styles.svg}>
          {/* Background arc */}
          <path
            d="M 20 105 A 80 80 0 0 1 180 105"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <path
            d="M 20 105 A 80 80 0 0 1 180 105"
            fill="none"
            stroke={level.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 251} 251`}
            style={{ filter: `drop-shadow(0 0 8px ${level.glow})`, transition: 'stroke-dasharray 0.8s ease, stroke 0.5s ease' }}
          />
          {/* Needle */}
          <line
            x1="100"
            y1="105"
            x2={100 + 65 * Math.cos((angle * Math.PI) / 180)}
            y2={105 + 65 * Math.sin((angle * Math.PI) / 180)}
            stroke={level.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transition: 'x2 0.8s ease, y2 0.8s ease', filter: `drop-shadow(0 0 4px ${level.glow})` }}
          />
          <circle cx="100" cy="105" r="5" fill={level.color} style={{ filter: `drop-shadow(0 0 6px ${level.glow})` }} />
        </svg>

        {/* Score number */}
        <div className={styles.scoreNum} style={{ color: level.color, textShadow: `0 0 20px ${level.glow}` }}>
          {score}
        </div>
      </div>

      {/* Level badge */}
      <div className={styles.levelBadge} style={{ color: level.color, borderColor: `${level.color}44`, background: `${level.color}18` }}>
        {level.label === 'CRITICAL' && <span className={styles.criticalPulse} style={{ background: level.color }} />}
        {level.label}
      </div>

      {/* Segment bars */}
      <div className={styles.bars}>
        {LEVELS.map(l => (
          <div key={l.label} className={styles.bar} style={{ background: score > (LEVELS.indexOf(l) * 25) ? l.color : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
    </div>
  )
}
