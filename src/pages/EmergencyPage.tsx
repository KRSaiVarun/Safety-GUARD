import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Shield, Wifi, X, Phone, MapPin, Clock,
  Delete, CheckCircle, Loader2, XCircle, RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useEmergencySession } from '@/hooks/useEmergencySession'
import { useLocationStore } from '@/stores/locationStore'
import { useSessionStore } from '@/stores/sessionStore'
import { format } from 'date-fns'
import styles from './EmergencyPage.module.css'

const PIN_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

type Phase = 'standby' | 'countdown' | 'active'

function AlertStatusBadge({ status, error }: { status: string; error?: string }) {
  if (status === 'idle')    return null
  if (status === 'sending') return (
    <div className={styles.alertStatus} data-status="sending">
      <Loader2 size={14} className={styles.spin} />
      SENDING WHATSAPP ALERT…
    </div>
  )
  if (status === 'sent') return (
    <div className={styles.alertStatus} data-status="sent">
      <CheckCircle size={14} />
      ✅ WHATSAPP ALERT SENT
    </div>
  )
  return (
    <div className={styles.alertStatus} data-status="failed">
      <XCircle size={14} />
      ❌ ALERT DELIVERY FAILED — {error ?? 'check backend'}
    </div>
  )
}

export default function EmergencyPage() {
  const { user, verifyPasscode }  = useAuthStore()
  const { currentSession, triggerEmergency, resolveEmergency, getAlertCount } = useEmergencySession()
  const { current: loc }          = useLocationStore()
  const { alertDelivery }         = useSessionStore()
  const navigate                  = useNavigate()

  const [phase, setPhase]           = useState<Phase>('standby')
  const [countdown, setCountdown]   = useState(3)
  const [elapsed, setElapsed]       = useState(0)
  const [alertCount, setAlertCount] = useState(0)
  const [nextAlertIn, setNextAlertIn] = useState(30)

  // PIN state
  const [pin, setPin]           = useState('')
  const [pinError, setPinError] = useState('')
  const [pinShake, setPinShake] = useState(false)
  const [resolved, setResolved] = useState(false)

  const alertPollRef  = useRef<number | null>(null)
  const nextAlertRef  = useRef<number | null>(null)

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) { handleActivate(); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // Elapsed timer
  useEffect(() => {
    if (phase !== 'active') return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  // Alert count + next-alert countdown
  useEffect(() => {
    if (phase !== 'active') return
    alertPollRef.current = window.setInterval(() => {
      setAlertCount(getAlertCount())
    }, 500)
    setNextAlertIn(30)
    nextAlertRef.current = window.setInterval(() => {
      setNextAlertIn(n => n <= 1 ? 30 : n - 1)
    }, 1000)
    return () => {
      if (alertPollRef.current) clearInterval(alertPollRef.current)
      if (nextAlertRef.current) clearInterval(nextAlertRef.current)
    }
  }, [phase, getAlertCount])

  const handleSOS = () => { setPhase('countdown'); setCountdown(3) }

  const handleActivate = useCallback(async () => {
    if (!user) return
    setPhase('active')
    setPin('')
    setPinError('')
    setAlertCount(0)
    setNextAlertIn(30)
    await triggerEmergency(user.id, 'manual')
  }, [user, triggerEmergency])

  const cancelCountdown = () => { setPhase('standby'); setCountdown(3) }

  const handlePinKey = (key: string) => {
    if (resolved) return
    setPinError('')
    if (key === '⌫') { setPin(p => p.slice(0, -1)); return }
    if (pin.length >= 4) return
    const next = pin + key
    if (next.length === 4) {
      if (verifyPasscode(next)) {
        setResolved(true)
        if (alertPollRef.current)  clearInterval(alertPollRef.current)
        if (nextAlertRef.current)  clearInterval(nextAlertRef.current)
        resolveEmergency().then(() => setTimeout(() => navigate('/dashboard'), 1400))
      } else {
        setPinShake(true)
        setTimeout(() => setPinShake(false), 500)
        setPinError('Wrong passcode — alerts continue sending')
        setPin('')
      }
    } else {
      setPin(next)
    }
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className={`${styles.page} ${phase === 'active' ? styles.pageActive : ''}`}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <Shield size={20} style={{ color: phase === 'active' ? 'var(--red)' : 'var(--text-2)' }} />
          <span className={`${styles.status} ${phase === 'active' ? styles.statusActive : ''}`}>
            {phase === 'standby' ? 'SAFETY GUARD — STANDBY'
              : phase === 'countdown' ? 'ACTIVATING…'
              : '⚠ EMERGENCY ACTIVE'}
          </span>
        </div>
        {phase !== 'active' && (
          <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm">
            <X size={16} /> Exit
          </button>
        )}
      </div>

      <div className={styles.content}>

        {/* ── Standby ── */}
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

        {/* ── Countdown ── */}
        {phase === 'countdown' && (
          <>
            <p className={styles.instruction}>Activating emergency in…</p>
            <div className={styles.countdownNum}>{countdown}</div>
            <button className="btn btn-secondary" onClick={cancelCountdown}>
              <X size={16} /> Cancel
            </button>
            <p className={styles.hint}>Tap cancel if this was accidental</p>
          </>
        )}

        {/* ── Active ── */}
        {phase === 'active' && (
          <>
            {resolved ? (
              <div className={styles.resolvedBanner}>
                <CheckCircle size={20} />
                USER MARKED SAFE — Redirecting…
              </div>
            ) : (
              <div className={styles.alertBanner}>
                <AlertTriangle size={18} />
                EMERGENCY ALERT ACTIVE
              </div>
            )}

            {/* WhatsApp delivery badge */}
            <AlertStatusBadge status={alertDelivery.status} error={alertDelivery.error} />

            {/* Stats row */}
            <div className={styles.activeStats}>
              <div className={styles.activeStat}>
                <Clock size={16} style={{ color: 'var(--text-3)' }} />
                <span className={styles.activeStatVal}>{fmt(elapsed)}</span>
                <span className={styles.activeStatLabel}>ELAPSED</span>
              </div>
              <div className={styles.activeStat}>
                <Wifi size={16} style={{ color: 'var(--green)' }} />
                <span className={styles.activeStatVal} style={{ color: 'var(--green)' }}>LIVE</span>
                <span className={styles.activeStatLabel}>TRACKING</span>
              </div>
              <div className={styles.activeStat}>
                <Phone size={16} style={{ color: 'var(--yellow)' }} />
                <span className={styles.activeStatVal} style={{ color: 'var(--yellow)' }}>{alertCount}</span>
                <span className={styles.activeStatLabel}>ALERTS SENT</span>
              </div>
            </div>

            {/* Next alert countdown */}
            {!resolved && (
              <div className={styles.nextAlertRow}>
                <RefreshCw size={12} style={{ color: 'var(--text-3)' }} />
                <span className={styles.nextAlertLabel}>NEXT WHATSAPP ALERT IN</span>
                <span className={styles.nextAlertTimer}>{nextAlertIn}s</span>
              </div>
            )}

            {/* GPS */}
            {loc && (
              <div className={styles.gpsBox}>
                <MapPin size={14} style={{ color: 'var(--blue)' }} />
                <span className={styles.gpsCoords}>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
                <span className={styles.gpsAccuracy}>±{Math.round(loc.accuracy)}m</span>
              </div>
            )}

            {/* Timeline */}
            {currentSession && currentSession.timeline.length > 0 && (
              <div className={styles.timeline}>
                {currentSession.timeline.slice(-4).map(ev => (
                  <div key={ev.id} className={styles.timelineItem}>
                    <span className={`${styles.timelineDot} ${ev.eventType === 'ALERT_SENT' || ev.eventType === 'ALERT_REPEATED' ? styles.timelineDotGreen : ''}`} />
                    <span className={styles.timelineText}>{ev.eventType.replace(/_/g, ' ')}</span>
                    <span className={styles.timelineTime}>{format(new Date(ev.occurredAt), 'HH:mm:ss')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* PIN keypad to stop */}
            {!resolved && (
              <div className={styles.pinSection}>
                <p className={styles.pinLabel}>
                  <Shield size={13} style={{ color: 'var(--text-3)' }} />
                  Enter passcode to stop emergency
                </p>
                <div className={`${styles.pinRow} ${pinShake ? styles.pinShake : ''}`}>
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className={`${styles.pinDot} ${i < pin.length ? styles.pinDotFilled : ''}`} />
                  ))}
                </div>
                {pinError && (
                  <div className={styles.pinError}>
                    <AlertTriangle size={13} />
                    {pinError}
                  </div>
                )}
                <div className={styles.keypad}>
                  {PIN_KEYS.map((key, i) => (
                    key === '' ? <div key={i} /> : (
                      <button
                        key={i}
                        className={`${styles.pinKey} ${key === '⌫' ? styles.pinKeyDel : ''}`}
                        onClick={() => handlePinKey(key)}
                        disabled={key !== '⌫' && pin.length >= 4}
                      >
                        {key === '⌫' ? <Delete size={16} /> : key}
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {phase === 'standby' && (
        <div className={styles.bottomNote}>
          <MapPin size={13} style={{ color: 'var(--text-3)' }} />
          <span>GPS must be enabled for live tracking</span>
        </div>
      )}
    </div>
  )
}
