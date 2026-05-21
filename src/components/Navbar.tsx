import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shield, LayoutDashboard, AlertTriangle, User, LogOut, Activity } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { currentSession } = useSessionStore()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (location.pathname === '/emergency') return null

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <Shield size={22} className={styles.logoIcon} />
          <span>Safety<span className={styles.logoAccent}>GUARD</span></span>
        </Link>

        {/* Live indicator */}
        {currentSession && (
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span>LIVE EMERGENCY</span>
          </div>
        )}

        {/* Nav Links */}
        {user && (
          <div className={styles.links}>
            <Link to="/dashboard" className={`${styles.link} ${isActive('/dashboard') ? styles.active : ''}`}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>
            <Link to="/emergency" className={`${styles.link} ${styles.linkEmergency}`}>
              <AlertTriangle size={16} />
              <span>SOS</span>
            </Link>
            <Link to="/profile" className={`${styles.link} ${isActive('/profile') ? styles.active : ''}`}>
              <User size={16} />
              <span>Profile</span>
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut size={16} />
            </button>
          </div>
        )}

        {!user && location.pathname !== '/login' && (
          <Link to="/login" className="btn btn-primary btn-sm">
            <Activity size={14} />
            Get Protected
          </Link>
        )}
      </div>
    </nav>
  )
}
