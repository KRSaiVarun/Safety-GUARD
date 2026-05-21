import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Zap, MapPin, Bell, ArrowRight, Activity, Lock } from 'lucide-react'
import RadarScan from '@/components/RadarScan'
import styles from './LandingPage.module.css'

const BOOT_LINES = [
  '> SAFETY-GUARD SYSTEM v2.0 INITIALIZING...',
  '> AI THREAT ENGINE.............. ONLINE',
  '> GPS SATELLITE LINK............ CONNECTED',
  '> REAL-TIME SYNC................ ACTIVE',
  '> EMERGENCY NETWORK............. STANDBY',
  '> ALL SYSTEMS OPERATIONAL ✓',
]

const FEATURES = [
  { icon: Zap,     color: '#ff2d55', title: 'AI Risk Scoring',       desc: 'Real-time threat analysis using location, time, speed, and behavioral patterns' },
  { icon: MapPin,  color: '#0a84ff', title: 'Live GPS Tracking',     desc: 'Continuous location streaming with tactical map, route trail, and danger zones' },
  { icon: Bell,    color: '#ffd60a', title: 'Instant SOS Alerts',    desc: 'One-tap emergency triggers with automatic contact notification' },
  { icon: Activity,color: '#30d158', title: 'Tactical Dashboard',    desc: 'Mission-control interface with real-time incident feed and state machine visualizer' },
  { icon: Shield,  color: '#bf5af2', title: 'Inactivity Detection',  desc: 'Auto-triggers alert if no activity detected for configurable time period' },
  { icon: Lock,    color: '#32ade6', title: 'Secure & Private',      desc: 'End-to-end encryption, zero-knowledge architecture, data under your control' },
]

export default function LandingPage() {
  const [bootIdx, setBootIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const intervalRef = useRef<number | null>(null)

  // Terminal boot sequence animation
  useEffect(() => {
    if (bootIdx >= BOOT_LINES.length) return
    const line = BOOT_LINES[bootIdx]
    let charIdx = 0
    setTyped('')
    intervalRef.current = window.setInterval(() => {
      charIdx++
      setTyped(line.slice(0, charIdx))
      if (charIdx >= line.length) {
        clearInterval(intervalRef.current!)
        setTimeout(() => setBootIdx(i => i + 1), 400)
      }
    }, 22)
    return () => clearInterval(intervalRef.current!)
  }, [bootIdx])

  return (
    <div className={styles.page}>
      {/* Grid background */}
      <div className={styles.gridBg} />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.statusBadge}>
            <span className={styles.liveDot} />
            <span>SYSTEM ONLINE</span>
          </div>

          <h1 className={styles.heroTitle}>
            AI-Powered<br />
            <span className="gradient-text">Women's Safety</span><br />
            Emergency System
          </h1>

          <p className={styles.heroSubtitle}>
            Real-time GPS tracking, AI threat detection, and instant emergency response. 
            Safety-GUARD keeps you protected 24/7 with military-grade monitoring.
          </p>

          <div className={styles.heroCtas}>
            <Link to="/login" className="btn btn-primary btn-lg">
              <Shield size={18} />
              Activate Protection
              <ArrowRight size={16} />
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              <Activity size={18} />
              View Dashboard
            </Link>
          </div>

          {/* Terminal */}
          <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
              <span className={styles.termDot} style={{ background: '#ff5f56' }} />
              <span className={styles.termDot} style={{ background: '#ffbd2e' }} />
              <span className={styles.termDot} style={{ background: '#27c93f' }} />
              <span className={styles.termTitle}>safety-guard ~ system</span>
            </div>
            <div className={styles.terminalBody}>
              {BOOT_LINES.slice(0, bootIdx).map((line, i) => (
                <div key={i} className={styles.termLine} style={{ color: line.includes('✓') ? '#30d158' : '#a0ffb0' }}>{line}</div>
              ))}
              {bootIdx < BOOT_LINES.length && (
                <div className={styles.termLine}>{typed}<span className={styles.cursor}>█</span></div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.radarWrapper}>
            <RadarScan size={380} color="#ff2d55" label="THREAT DETECTION ACTIVE" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        {[
          { value: '<2s',  label: 'Alert Response Time' },
          { value: '99.9%',label: 'Uptime Guarantee' },
          { value: 'AI',   label: 'Powered Risk Engine' },
          { value: '24/7', label: 'Live Monitoring' },
        ].map(s => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresHeader}>
          <h2>Built for Real Emergencies</h2>
          <p>Not a simulation. A production-grade safety system.</p>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon} style={{ background: `${f.color}18`, border: `1px solid ${f.color}33` }}>
                <f.icon size={22} style={{ color: f.color }} />
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <Shield size={40} style={{ color: 'var(--red)' }} />
          <h2>Stay Protected. Always.</h2>
          <p>Join thousands of users who trust Safety-GUARD with their lives.</p>
          <Link to="/login" className="btn btn-primary btn-xl">
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <Shield size={16} style={{ color: 'var(--red)' }} />
        <span>Safety<span style={{ color: 'var(--red)' }}>GUARD</span> · Built for competition · 2025</span>
      </footer>
    </div>
  )
}
