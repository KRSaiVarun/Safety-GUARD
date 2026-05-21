import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Shield, Wifi, X, Phone, MapPin, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useEmergencySession } from '@/hooks/useEmergencySession'
import { useLocationStore } from '@/stores/locationStore'
import { format } from 'date-fns'
import styles from './EmergencyPage.module.css'

type Phase = 'standby' | 'countdown' | 'active'

export default function EmergencyPage() {
  const { user } = useAuthStore()
  const { currentSession, triggerEmergency, resolveEmergency } = useEmergencySession()
  const { current: loc } = useLocationStore()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('standby')
  const [countdown, setCountdown] = useState(3)
  const [elapsed, setElapsed] = useState(0)

  // Countdown logic
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      handleActivate()
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // Elapsed timer when active
  useEffect(() => {
    if (phase !== 'active') return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const handleSOS = () => {
    setPhase('countdown')
    setCountdown(3)
  }

  const handleActivate = useCallback(async () => {
    if (!user) return
    setPhase('active')
    await triggerEmergency(user.id, 'manual')
  }, [user, triggerEmergency])

  const cancelCountdown = () => {
    setPhase('standby')
    setCountdown(3)
  }

  const handleResolve = async () => {
    await resolveEmergency()
    setPhase('standby')
    setElapsed(0)
    navigate('/dashboard')
  }

  const fmtElapsed = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className={`${styles.page} ${phase === 'active' ? styles.pageActive : ''}`}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <Shield size={20} style={{ color: phase === 'active' ? 'var(--red)' : 'var(--text-2)' }} />
          <span className={`${styles.status} ${phase === 'active' ? styles.statusActive : ''}`}>
            {phase === 'standby' ? 'SAFETY GUARD — STANDBY' : phase === 'countdown' ? 'ACTIVATING...' : '⚠ EMERGENCY ACTIVE'}
          </span>
        </div>
        {phase !== 'active' && (
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm">
            <X size={16} /> Exit
          </button>
        )}
      </div>

      {/* Main content */}
      <div className={styles.content}>

        {/* Standby */}
        {phase === 'standby' && (
          <>
            <p className={styles.instruction}>Hold the button to send emergency alert to your contacts</p>
            <div className={styles.sosContainer}>
              <div className={styles.pulseRing1} />
              <div className={styles.pulseRing2} />
              <div className={styles.pulseRing3} />
              <button id="sos-button" className={styles.sosBtn} onClick={handleSOS}>
                <AlertTriangle size={48} />
                <span>SOS</span>
              </button>
            </div>
            <p className={styles.hint}>Tap to begin 3-second countdown</p>
          </>
        )}

        {/* Countdown */}
        {phase === 'countdown' && (
          <>
            <p className={styles.instruction}>Activating emergency in...</p>
            <div className={styles.countdownNum}>{countdown}</div>
            <button className="btn btn-secondary" onClick={cancelCountdown}>
              <X size={16} /> Cancel
            </button>
            <p className={styles.hint}>Tap cancel if this was accidental</p>
          </>
        )}

        {/* Active */}
        {phase === 'active' && (
          <>
            <div className={styles.alertBanner}>
              <AlertTriangle size={18} />
              EMERGENCY ALERT SENT
            </div>

            <div className={styles.activeStats}>
              <div className={styles.activeStat}>
                <Clock size={16} style={{ color: 'var(--text-3)' }} />
                <span className={styles.activeStatVal}>{fmtElapsed(elapsed)}</span>
                <span className={styles.activeStatLabel}>ELAPSED</span>
              </div>
              <div className={styles.activeStat}>
                <Wifi size={16} style={{ color: 'var(--green)' }} />
                <span className={styles.activeStatVal} style={{ color: 'var(--green)' }}>LIVE</span>
                <span className={styles.activeStatLabel}>TRACKING</span>
              </div>
              <div className={styles.activeStat}>
                <Phone size={16} style={{ color: 'var(--yellow)' }} />
                <span className={styles.activeStatVal} style={{ color: 'var(--yellow)' }}>
                  {user?.emergencyContacts?.length ?? 0}
                </span>
                <span className={styles.activeStatLabel}>NOTIFIED</span>
              </div>
            </div>

            {/* GPS info */}
            {loc && (
              <div className={styles.gpsBox}>
                <MapPin size={14} style={{ color: 'var(--blue)' }} />
                <span className={styles.gpsCoords}>
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </span>
                <span className={styles.gpsAccuracy}>±{Math.round(loc.accuracy)}m</span>
              </div>
            )}

            {/* Timeline */}
            {currentSession && currentSession.timeline.length > 0 && (
              <div className={styles.timeline}>
                {currentSession.timeline.slice(-5).map(ev => (
                  <div key={ev.id} className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <span className={styles.timelineText}>{ev.eventType.replace(/_/g, ' ')}</span>
                    <span className={styles.timelineTime}>{format(new Date(ev.occurredAt), 'HH:mm:ss')}</span>
                  </div>
                ))}
              </div>
            )}

            <button className={styles.resolveBtn} onClick={handleResolve}>
              <Shield size={18} />
              Mark Safe — End Emergency
            </button>
          </>
        )}
      </div>

      {/* Location permission note */}
      {phase === 'standby' && (
        <div className={styles.bottomNote}>
          <MapPin size={13} style={{ color: 'var(--text-3)' }} />
          <span>GPS must be enabled for live tracking</span>
        </div>
      )}
    </div>
  )
}
