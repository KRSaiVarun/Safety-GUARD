import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const { login, register, hasPasscode, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'login') {
      const ok = await login(form.email, form.password)
      if (ok) {
        navigate(hasPasscode() ? '/dashboard' : '/passcode-setup')
      }
    } else {
      const ok = await register(form.name, form.email, form.password, form.phone)
      if (ok) navigate('/passcode-setup')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <Shield size={28} style={{ color: 'var(--red)' }} />
          </div>
          <h1 className={styles.title}>Safety<span style={{ color: 'var(--red)' }}>GUARD</span></h1>
          <p className={styles.subtitle}>
            {mode === 'login' ? 'Sign in to access your emergency dashboard' : 'Create your protected account'}
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button onClick={() => setMode('login')}    className={`${styles.tab} ${mode === 'login'    ? styles.tabActive : ''}`}>Sign In</button>
          <button onClick={() => setMode('register')} className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}>Register</button>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'register' && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" placeholder="Your full name" value={form.name} onChange={set('name')} required />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>

          {mode === 'register' && (
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input className="input" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className={styles.passwordWrap}>
              <input
                className="input"
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                style={{ paddingRight: 44 }}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShow(s => !s)}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
            {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className={styles.demo}>
          Demo: use any valid email + password (min 6 chars)
        </p>

        <div className={styles.back}>
          <Link to="/" className="btn btn-ghost btn-sm">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
