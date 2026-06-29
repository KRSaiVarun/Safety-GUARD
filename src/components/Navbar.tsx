import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Shield, Home, AlertTriangle, Clock, Users, User,
  Settings, LogOut, LayoutDashboard, MapPin, Activity,
  Brain, Menu, X, ShieldAlert,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import styles from './Navbar.module.css'

const USER_NAV = [
  { to: '/dashboard',  icon: Home,          label: 'Home' },
  { to: '/emergency',  icon: AlertTriangle,  label: 'SOS',      sos: true },
  { to: '/history',    icon: Clock,          label: 'History' },
  { to: '/contacts',   icon: Users,          label: 'Contacts' },
  { to: '/profile',    icon: User,           label: 'Profile' },
  { to: '/settings',   icon: Settings,       label: 'Settings' },
]

const ADMIN_NAV = [
  { to: '/admin/home',      icon: Home,           label: 'Home' },
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',     icon: Users,          label: 'Users' },
  { to: '/admin/analytics', icon: Activity,       label: 'Analytics' },
  { to: '/admin/live',      icon: MapPin,         label: 'Live' },
  { to: '/admin/sessions',  icon: AlertTriangle,  label: 'Sessions' },
  { to: '/admin/ai',        icon: Brain,          label: 'AI Monitor' },
  { to: '/admin/settings',  icon: Settings,       label: 'Settings' },
]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuthStore()
  const { currentSession } = useSessionStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (location.pathname === '/emergency') return null

  const admin = user && isAdmin()
  const navItems = admin ? ADMIN_NAV : USER_NAV

  const handleLogout = async () => {
    setMobileOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <>
      <nav className={`${styles.nav} ${admin ? styles.navAdmin : ''}`}>
        <div className={styles.inner}>

          <NavLink
            to={admin ? '/admin/home' : user ? '/dashboard' : '/'}
            className={styles.logo}
          >
            <Shield size={20} className={styles.logoIcon} />
            <span>Safety<span className={styles.logoAccent}>GUARD</span></span>
            {admin && (
              <span className={styles.adminBadge}>
                <ShieldAlert size={10} />
                ADMIN
              </span>
            )}
          </NavLink>

          {currentSession && !admin && (
            <div className={styles.liveChip}>
              <span className={styles.liveDot} />
              LIVE
            </div>
          )}

          {user && (
            <>
              <div className={styles.links}>
                {navItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        styles.link,
                        (item as { sos?: boolean }).sos ? styles.linkSos : '',
                        isActive ? styles.linkActive : '',
                      ].filter(Boolean).join(' ')
                    }
                  >
                    <item.icon size={14} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <button onClick={handleLogout} className={styles.logoutBtn} title="Sign out">
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>

              <button
                className={styles.hamburger}
                onClick={() => setMobileOpen(o => !o)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          )}

          {!user && location.pathname !== '/login' && (
            <button onClick={() => navigate('/login')} className={styles.authBtn}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {mobileOpen && user && (
        <div className={styles.mobileMenu}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  styles.mobileLink,
                  (item as { sos?: boolean }).sos ? styles.mobileLinkSos : '',
                  isActive ? styles.mobileLinkActive : '',
                ].filter(Boolean).join(' ')
              }
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button onClick={handleLogout} className={styles.mobileLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </>
  )
}
