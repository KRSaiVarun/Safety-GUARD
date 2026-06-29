import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Delete, Lock, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import styles from './PasscodeSetupPage.module.css'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

type Step = 'enter' | 'confirm'

export default function PasscodeSetupPage() {
  const { setPasscode, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep]       = useState<Step>('enter')
  const [first, setFirst]     = useState('')
  const [current, setCurrent] = useState('')
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const [shake, setShake]     = useState(false)

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleKey = (key: string) => {
    if (done) return
    setError('')

    if (key === '⌫') {
      setCurrent(c => c.slice(0, -1))
      return
    }
    if (current.length >= 4) return

    const next = current + key

    if (next.length === 4) {
      if (step === 'enter') {
        setFirst(next)
        setCurrent('')
        setTimeout(() => setStep('confirm'), 300)
      } else {
        if (next === first) {
          setPasscode(next)
          setDone(true)
          const dest = isAdmin() ? '/admin/dashboard' : '/dashboard'
          setTimeout(() => navigate(dest), 1200)
        } else {
          setError('Passcodes do not match. Try again.')
          triggerShake()
          setCurrent('')
          setTimeout(() => {
            setStep('enter')
            setFirst('')
          }, 400)
        }
      }
      return
    }

    setCurrent(next)
  }

  const dots = Array.from({ length: 4 }, (_, i) => ({
    filled: i < current.length,
  }))

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.bg} />
        <div className={styles.card}>
          <div className={styles.successIcon}>
            <CheckCircle size={48} style={{ color: 'var(--green)' }} />
          </div>
          <h2 className={styles.title} style={{ color: 'var(--green)' }}>Passcode Set!</h2>
          <p className={styles.subtitle}>Your emergency passcode is secured.<br />Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.card}>

        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Lock size={28} style={{ color: 'var(--red)' }} />
          </div>
          <h1 className={styles.title}>
            {step === 'enter' ? 'Set Emergency Passcode' : 'Confirm Passcode'}
          </h1>
          <p className={styles.subtitle}>
            {step === 'enter'
              ? 'Choose a secure 4-digit PIN. You will need this to stop any emergency alert.'
              : 'Enter the same PIN again to confirm.'}
          </p>
          <div className={styles.stepRow}>
            <div className={`${styles.stepDot} ${step === 'enter' ? styles.stepDotActive : styles.stepDotDone}`} />
            <div className={styles.stepLine} />
            <div className={`${styles.stepDot} ${step === 'confirm' ? styles.stepDotActive : ''}`} />
          </div>
        </div>

        <div className={`${styles.pinRow} ${shake ? styles.shake : ''}`}>
          {dots.map((d, i) => (
            <div key={i} className={`${styles.pinDot} ${d.filled ? styles.pinDotFilled : ''}`} />
          ))}
        </div>

        {error && (
          <div className={styles.errorBox}>
            <Shield size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.keypad}>
          {KEYS.map((key, i) => (
            key === '' ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                className={`${styles.key} ${key === '⌫' ? styles.keyDel : ''}`}
                onClick={() => handleKey(key)}
                disabled={key !== '⌫' && current.length >= 4}
              >
                {key === '⌫' ? <Delete size={20} /> : key}
              </button>
            )
          ))}
        </div>

        <p className={styles.hint}>
          This passcode encrypts your emergency session.<br />
          <strong>Do not forget it</strong> — you'll need it to mark yourself safe.
        </p>
      </div>
    </div>
  )
}
