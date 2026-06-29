import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Lock, User, Bell, Shield, ChevronRight, LogOut, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import styles from './SettingsPage.module.css'

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

interface RowProps {
  icon: React.ReactNode
  label: string
  sublabel?: string
  action?: React.ReactNode
  onClick?: () => void
  danger?: boolean
}

function Row({ icon, label, sublabel, action, onClick, danger }: RowProps) {
  return (
    <div
      className={`${styles.row} ${onClick ? styles.rowClickable : ''} ${danger ? styles.rowDanger : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className={styles.rowIcon}>{icon}</div>
      <div className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {sublabel && <span className={styles.rowSub}>{sublabel}</span>}
      </div>
      {action ?? (onClick && <ChevronRight size={15} className={styles.rowChevron} />)}
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout, hasPasscode } = useAuthStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(true)
  const [gpsHighAcc, setGpsHighAcc] = useState(true)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Settings size={20} style={{ color: 'var(--text-2)' }} />
          </div>
          <div>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Manage your account and preferences</p>
          </div>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.profileAvatar}>
            <User size={28} style={{ color: 'var(--cyan)' }} />
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{user?.name ?? 'User'}</span>
            <span className={styles.profileEmail}>{user?.email ?? ''}</span>
            {user?.phone && <span className={styles.profilePhone}>{user.phone}</span>}
          </div>
          <button
            className={styles.editProfileBtn}
            onClick={() => navigate('/profile')}
          >
            Edit Profile
          </button>
        </div>

        <Section title="Security">
          <Row
            icon={<Lock size={16} style={{ color: 'var(--cyan)' }} />}
            label={hasPasscode() ? 'Change Emergency Passcode' : 'Set Emergency Passcode'}
            sublabel={hasPasscode() ? '4-digit PIN protecting your emergency sessions' : 'Required to stop emergency alerts'}
            onClick={() => navigate('/passcode-setup')}
          />
          <Row
            icon={<Shield size={16} style={{ color: 'var(--green)' }} />}
            label="Emergency Contacts"
            sublabel={`${user?.emergencyContacts?.length ?? 0} contacts configured`}
            onClick={() => navigate('/contacts')}
          />
        </Section>

        <Section title="Preferences">
          <Row
            icon={<Bell size={16} style={{ color: '#FFD24A' }} />}
            label="Push Notifications"
            sublabel="Receive alerts and status updates"
            action={
              <button
                className={`${styles.toggle} ${notifications ? styles.toggleOn : ''}`}
                onClick={() => setNotifications(n => !n)}
              >
                <span className={styles.toggleThumb} />
              </button>
            }
          />
          <Row
            icon={<RefreshCw size={16} style={{ color: 'var(--cyan)' }} />}
            label="High-Accuracy GPS"
            sublabel="More precise but uses more battery"
            action={
              <button
                className={`${styles.toggle} ${gpsHighAcc ? styles.toggleOn : ''}`}
                onClick={() => setGpsHighAcc(g => !g)}
              >
                <span className={styles.toggleThumb} />
              </button>
            }
          />
        </Section>

        <Section title="Account">
          <Row
            icon={<LogOut size={16} style={{ color: 'var(--red)' }} />}
            label="Sign Out"
            sublabel="Clear session and return to login"
            onClick={handleLogout}
            danger
          />
        </Section>

        <div className={styles.versionNote}>
          Safety<strong>GUARD</strong> · Version 1.0 · All Rights Reserved
        </div>

      </div>
    </div>
  )
}
