import { useState } from 'react'
import { Settings, Bell, Shield, Database, Activity, Save, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import styles from './AdminSettingsPage.module.css'

interface ToggleRowProps {
  label: string; sub: string;
  value: boolean; onChange: (v: boolean) => void;
}

function ToggleRow({ label, sub, value, onChange }: ToggleRowProps) {
  return (
    <div className={styles.settingRow}>
      <div className={styles.settingText}>
        <span className={styles.settingLabel}>{label}</span>
        <span className={styles.settingSub}>{sub}</span>
      </div>
      <button
        className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className={styles.thumb} />
      </button>
    </div>
  )
}

export default function AdminSettingsPage() {
  const { user } = useAuthStore()
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState({
    alertRepeat:       true,
    whatsappEnabled:   true,
    gpsHighAccuracy:   true,
    riskAutoEscalate:  true,
    sessionPersist:    true,
    devMode:           import.meta.env.VITE_DEMO_MODE === 'true',
  })

  const toggle = (key: keyof typeof settings) => {
    setSettings(s => ({ ...s, [key]: !s[key] }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Settings size={20} style={{ color: 'var(--text-2)' }} />
            </div>
            <div>
              <h1 className={styles.title}>Admin Settings</h1>
              <p className={styles.subtitle}>System configuration and preferences</p>
            </div>
          </div>
        </div>

        <div className={styles.adminCard}>
          <div className={styles.adminAvatar}>
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className={styles.adminInfo}>
            <span className={styles.adminName}>{user?.name ?? 'Admin'}</span>
            <span className={styles.adminEmail}>{user?.email ?? ''}</span>
          </div>
          <span className={styles.adminBadge}>SYSTEM ADMIN</span>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Bell size={14} style={{ color: 'var(--text-3)' }} />
            <span className={styles.sectionTitle}>Alert Settings</span>
          </div>
          <div className={styles.sectionBody}>
            <ToggleRow
              label="Repeat Alerts"
              sub="Send WhatsApp alerts every 30s during active emergency"
              value={settings.alertRepeat}
              onChange={() => toggle('alertRepeat')}
            />
            <ToggleRow
              label="WhatsApp Notifications"
              sub="Send emergency alerts via Twilio WhatsApp"
              value={settings.whatsappEnabled}
              onChange={() => toggle('whatsappEnabled')}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Shield size={14} style={{ color: 'var(--text-3)' }} />
            <span className={styles.sectionTitle}>AI & Risk Engine</span>
          </div>
          <div className={styles.sectionBody}>
            <ToggleRow
              label="High-Accuracy GPS"
              sub="Use precision GPS tracking (higher battery usage)"
              value={settings.gpsHighAccuracy}
              onChange={() => toggle('gpsHighAccuracy')}
            />
            <ToggleRow
              label="Auto-Escalate Risk"
              sub="Automatically escalate when risk score exceeds 75%"
              value={settings.riskAutoEscalate}
              onChange={() => toggle('riskAutoEscalate')}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Database size={14} style={{ color: 'var(--text-3)' }} />
            <span className={styles.sectionTitle}>Data & Storage</span>
          </div>
          <div className={styles.sectionBody}>
            <ToggleRow
              label="Persist Sessions"
              sub="Store emergency sessions in database after resolution"
              value={settings.sessionPersist}
              onChange={() => toggle('sessionPersist')}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Activity size={14} style={{ color: 'var(--text-3)' }} />
            <span className={styles.sectionTitle}>System Info</span>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.infoRow}>
              <span>Version</span><span>1.0.0</span>
            </div>
            <div className={styles.infoRow}>
              <span>Backend</span>
              <span>FastAPI + Twilio</span>
            </div>
            <div className={styles.infoRow}>
              <span>Auth</span>
              <span>Supabase</span>
            </div>
            <div className={styles.infoRow}>
              <span>Demo Mode</span>
              <span style={{ color: settings.devMode ? 'var(--red)' : 'var(--green)' }}>
                {settings.devMode ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {saved && (
            <span className={styles.savedMsg}>✅ Settings saved</span>
          )}
          <button className={styles.resetBtn}>
            <RefreshCw size={14} />
            Reset Defaults
          </button>
          <button className={styles.saveBtn} onClick={handleSave}>
            <Save size={14} />
            Save Settings
          </button>
        </div>

      </div>
    </div>
  )
}
