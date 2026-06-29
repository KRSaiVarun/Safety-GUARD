import styles from './RadarScan.module.css'

interface Props {
  size?: number
  color?: string
  label?: string
}

export default function RadarScan({ size = 300, color = '#ff2d55', label }: Props) {
  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      {/* Rings */}
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={styles.ring}
          style={{
            width:  `${25 * i}%`,
            height: `${25 * i}%`,
            borderColor: color,
            opacity: 0.15 + 0.05 * (4 - i),
          }}
        />
      ))}

      {/* Cross hairs */}
      <div className={styles.crossH} style={{ borderColor: color }} />
      <div className={styles.crossV} style={{ borderColor: color }} />

      {/* Sweep */}
      <div className={styles.sweep} style={{ '--color': color } as React.CSSProperties} />

      {/* Centre dot */}
      <div className={styles.centre} style={{ background: color, boxShadow: `0 0 12px ${color}` }} />

      {/* Blips */}
      <div className={styles.blip} style={{ top: '30%', left: '65%', background: color }} />
      <div className={styles.blip} style={{ top: '60%', left: '40%', background: color, animationDelay: '0.7s' }} />
      <div className={styles.blip} style={{ top: '45%', left: '20%', background: color, animationDelay: '1.2s' }} />

      {label && <div className={styles.label} style={{ color }}>{label}</div>}
    </div>
  )
}
