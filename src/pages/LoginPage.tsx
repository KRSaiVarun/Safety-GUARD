import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Shield, Eye, EyeOff, AlertCircle, Mail, Check, Zap,
  MapPin, Activity, Bell, Lock, User,
} from 'lucide-react'
import { useAuthStore, DEMO_MODE, DEMO_ACCOUNTS } from '@/stores/authStore'
import styles from './LoginPage.module.css'

const REMEMBER_KEY = 'sg-remembered-email'

function validateEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

const FEATURES = [
  { icon: '📍', color: 'red',    title: 'Real-Time GPS Tracking',    desc: 'Military-grade location monitoring' },
  { icon: '🤖', color: 'blue',   title: 'AI Threat Detection',       desc: 'Dynamic risk scoring engine' },
  { icon: '📲', color: 'green',  title: 'Instant WhatsApp Alerts',   desc: 'Automated emergency notifications' },
  { icon: '🛡️', color: 'purple', title: 'Tactical Command Center',   desc: 'Live incident management dashboard' },
]

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [show, setShow] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const {
    login, register, hasPasscode,
    isLoading, error, emailPending,
    clearError,
  } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setForm(f => ({ ...f, email: saved }))
      setRememberMe(true)
    }
  }, [])

  const handleField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setFieldErrors(fe => { const next = { ...fe }; delete next[k]; return next })
    clearError()
  }

  const switchMode = (m: typeof mode) => {
    setMode(m)
    setFieldErrors({})
    clearError()
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!validateEmail(form.email)) errs.email = 'Enter a valid email address'
    if (form.password.length < 6) errs.password = 'Minimum 6 characters'
    if (mode === 'register') {
      if (!form.name.trim()) errs.name = 'Full name is required'
      if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (mode === 'login') {
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, form.email)
      else localStorage.removeItem(REMEMBER_KEY)

      const ok = await login(form.email, form.password)
      if (ok) {
        const { user } = useAuthStore.getState()
        if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'operator') {
          navigate('/admin/dashboard')
        } else {
          navigate(hasPasscode() ? '/dashboard' : '/passcode-setup')
        }
      }
    } else {
      const ok = await register(form.name, form.email, form.password, form.phone)
      if (ok && !useAuthStore.getState().emailPending) navigate('/passcode-setup')
    }
  }

  const fillDemo = (email: string, password: string) => {
    switchMode('login')
    setForm(f => ({ ...f, email, password }))
    clearError()
  }

  if (emailPending) {
    return (
      <div className={styles.page}>
        <div className={styles.left}>
          <div className={styles.grid} />
          <div className={styles.glow} />
          <div className={styles.glow2} />
        </div>
        <div className={styles.right}>
          <div className={styles.wrap}>
            <div className={styles.confirmBox}>
              <div className={styles.confirmIcon}>
                <Mail size={32} style={{ color: 'var(--cyan)' }} />
              </div>
              <h2 className={styles.confirmTitle}>Check Your Email</h2>
              <p className={styles.confirmText}>
                A confirmation link was sent to <strong>{form.email}</strong>.<br />
                Click it, then sign in below.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => { useAuthStore.getState().clearError(); switchMode('login') }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* ── Left branding panel ───────────────────────────────────────────── */}
      <div className={styles.left}>
        <div className={styles.grid} />
        <div className={styles.glow} />
        <div className={styles.glow2} />

        <div className={styles.leftContent}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <Shield size={22} style={{ color: 'var(--red)' }} />
            </div>
            <span className={styles.brandName}>
              Safety<span>GUARD</span>
            </span>
          </div>

          <h1 className={styles.headline}>
            Protect Lives with<br />
            <span className={styles.headlineAccent}>AI-Powered</span><br />
            Emergency Response
          </h1>

          <p className={styles.subline}>
            Real-time GPS tracking, intelligent threat detection, and
            automated emergency alerts — keeping women safe 24/7.
          </p>

          <div className={styles.features}>
            {FEATURES.map(f => (
              <div key={f.title} className={styles.feature}>
                <div className={`${styles.featureIcon} ${styles[f.color]}`}>
                  {f.icon}
                </div>
                <span className={styles.featureText}>
                  <strong>{f.title}</strong> — {f.desc}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.statusBar}>
            <div className={styles.statusDot} />
            System Online · All Services Operational
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className={styles.right}>
        <div className={styles.wrap}>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className={styles.formSubtitle}>
              {mode === 'login'
                ? 'Sign in to access your safety dashboard'
                : 'Register to activate your protection shield'}
            </p>
          </div>

          {/* tabs */}
          <div className={styles.tabs}>
            <button
              onClick={() => switchMode('login')}
              className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
            >
              Register
            </button>
            <div className={`${styles.tabSlider} ${mode === 'register' ? styles.tabSliderRight : ''}`} />
          </div>

          {/* error */}
          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div className={styles.errorContent}>
                <span>{error}</span>
                {(error.includes('rate limit') || error.includes('already exists')) && mode === 'register' && (
                  <button type="button" className={styles.errorAction} onClick={() => switchMode('login')}>
                    Switch to Sign In →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* form */}
          <form key={mode} onSubmit={handleSubmit} className={styles.form} noValidate>

            {mode === 'register' && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Full Name</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}><User size={14} /></span>
                  <input
                    className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleField('name')}
                    autoComplete="name"
                  />
                </div>
                {fieldErrors.name && <span className={styles.fieldErr}>{fieldErrors.name}</span>}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Mail size={14} /></span>
                <input
                  className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleField('email')}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && <span className={styles.fieldErr}>{fieldErrors.email}</span>}
            </div>

            {mode === 'register' && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Phone Number</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}><Activity size={14} /></span>
                  <input
                    className={styles.input}
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.phone}
                    onChange={handleField('phone')}
                    autoComplete="tel"
                  />
                </div>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.passwordWrap}>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}><Lock size={14} /></span>
                  <input
                    className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
                    type={show ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleField('password')}
                    style={{ paddingRight: 44 }}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
                <button type="button" className={styles.eyeBtn} onClick={() => setShow(s => !s)}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && <span className={styles.fieldErr}>{fieldErrors.password}</span>}
            </div>

            {mode === 'register' && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.passwordWrap}>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}><Lock size={14} /></span>
                    <input
                      className={`${styles.input} ${fieldErrors.confirm ? styles.inputError : ''}`}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={handleField('confirm')}
                      style={{ paddingRight: 44 }}
                      autoComplete="new-password"
                    />
                  </div>
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(s => !s)}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.confirm && <span className={styles.fieldErr}>{fieldErrors.confirm}</span>}
              </div>
            )}

            {mode === 'login' && (
              <label className={styles.rememberRow}>
                <span
                  className={`${styles.checkbox} ${rememberMe ? styles.checkboxChecked : ''}`}
                  onClick={() => setRememberMe(r => !r)}
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                  onKeyDown={e => e.key === ' ' && setRememberMe(r => !r)}
                >
                  {rememberMe && <Check size={11} strokeWidth={3} />}
                </span>
                <span className={styles.rememberLabel}>Remember me</span>
              </label>
            )}

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  <Shield size={16} />
                  {mode === 'login' ? 'Sign In Securely' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <Link to="/" className={styles.backLink}>← Back to Home</Link>
            <Link to="/admin/login" className={styles.adminLink}>Admin Portal</Link>
          </div>

          {/* Demo accounts — only when VITE_DEMO_MODE=true */}
          {DEMO_MODE && (
            <>
              <div className={styles.divider}>Demo Accounts</div>
              <div className={styles.demoPanel}>
                <div className={styles.demoBadge}>
                  <Zap size={11} />
                  Quick access — development only
                </div>
                <div className={styles.demoCards}>
                  {DEMO_ACCOUNTS.map(d => (
                    <div key={d.email} className={styles.demoCard}>
                      <div className={styles.demoRole} data-role={d.user.role}>
                        {d.user.role.toUpperCase()}
                      </div>
                      <div className={styles.demoInfo}>
                        <span className={styles.demoEmail}>{d.email}</span>
                        <span className={styles.demoPass}>
                          Password: <code>{d.password}</code>
                        </span>
                      </div>
                      <button
                        className={styles.demoUseBtn}
                        onClick={() => fillDemo(d.email, d.password)}
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
                <p className={styles.demoNote}>
                  Default passcode for both accounts: <code>1234</code>
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
