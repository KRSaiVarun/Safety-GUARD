import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldAlert, Eye, EyeOff, AlertCircle, Lock, Mail } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import styles from './AdminLoginPage.module.css'

export default function AdminLoginPage() {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const { login, logout, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await login(form.email, form.password)
    if (!ok) return

    const { user, hasPasscode } = useAuthStore.getState()

    if (!user || !['admin', 'supervisor', 'operator', 'viewer'].includes(user.role)) {
      await logout()
      useAuthStore.setState({
        error: 'Access denied — this account does not have admin privileges.',
        isLoading: false,
      })
      return
    }

    navigate(hasPasscode() ? '/admin/dashboard' : '/passcode-setup')
  }

  return (
    <div className={styles.page}>
      <div className={styles.blob} />

      <div className={styles.card}>
        <div className={styles.restrictedBanner}>
          <Lock size={11} />
          <span>RESTRICTED ACCESS — Authorized Personnel Only</span>
        </div>

        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <ShieldAlert size={26} style={{ color: 'var(--red)' }} />
          </div>
          <h1 className={styles.title}>Admin Portal</h1>
          <p className={styles.subtitle}>
            Safety<span className={styles.accent}>GUARD</span> Command Center
          </p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Admin Email</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}><Mail size={14} /></span>
              <input
                className={styles.input}
                type="email"
                placeholder="admin@safeguard.io"
                value={form.email}
                onChange={handleField('email')}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrap}>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Lock size={14} /></span>
                <input
                  className={styles.input}
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleField('password')}
                  style={{ paddingRight: 44 }}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="button" className={styles.eyeBtn} onClick={() => setShow(s => !s)}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? <span className={styles.spinner} /> : 'Access Admin Portal'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link to="/login" className={styles.backLink}>← User Login</Link>
          <Link to="/" className={styles.backLink}>Home</Link>
        </div>
      </div>
    </div>
  )
}
