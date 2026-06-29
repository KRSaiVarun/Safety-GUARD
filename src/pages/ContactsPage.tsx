import { useState } from 'react'
import { Users, Plus, Trash2, Phone, UserCircle, Heart, Save, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import type { EmergencyContact } from '@/types'
import styles from './ContactsPage.module.css'

const RELATIONSHIPS = ['Family', 'Friend', 'Partner', 'Colleague', 'Neighbour', 'Other']

function ContactCard({
  contact,
  onDelete,
}: {
  contact: EmergencyContact
  onDelete: () => void
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardAvatar}>
        <UserCircle size={28} style={{ color: 'var(--cyan)' }} />
      </div>
      <div className={styles.cardInfo}>
        <span className={styles.cardName}>{contact.name}</span>
        <span className={styles.cardPhone}>
          <Phone size={11} />
          {contact.phone}
        </span>
        <span className={styles.cardRelTag}>{contact.relationship}</span>
      </div>
      <button
        className={styles.deleteBtn}
        onClick={onDelete}
        title="Remove contact"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function ContactsPage() {
  const { user, setUser } = useAuthStore()
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    user?.emergencyContacts ?? []
  )
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<EmergencyContact>({
    name: '', phone: '', relationship: 'Family',
  })
  const [formErr, setFormErr] = useState('')

  const validateForm = () => {
    if (!form.name.trim()) return 'Name is required'
    if (!form.phone.trim()) return 'Phone number is required'
    return ''
  }

  const handleAdd = () => {
    const err = validateForm()
    if (err) { setFormErr(err); return }
    const next = [...contacts, { ...form }]
    setContacts(next)
    setForm({ name: '', phone: '', relationship: 'Family' })
    setFormErr('')
    setShowForm(false)
    saveContacts(next)
  }

  const handleDelete = (idx: number) => {
    const next = contacts.filter((_, i) => i !== idx)
    setContacts(next)
    saveContacts(next)
  }

  const saveContacts = async (list: EmergencyContact[]) => {
    setSaving(true)
    setSaved(false)
    try {
      await supabase.auth.updateUser({ data: { emergencyContacts: list } })
      if (user) {
        setUser({ ...user, emergencyContacts: list })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // offline — contacts saved in local state
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Heart size={20} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <h1 className={styles.title}>Emergency Contacts</h1>
              <p className={styles.subtitle}>People who will be notified during an emergency</p>
            </div>
          </div>
          <button
            className={styles.addBtn}
            onClick={() => { setShowForm(true); setFormErr('') }}
          >
            <Plus size={16} />
            Add Contact
          </button>
        </div>

        {saved && (
          <div className={styles.savedBanner}>
            ✅ Contacts saved successfully
          </div>
        )}
        {saving && (
          <div className={styles.savingBanner}>
            Saving…
          </div>
        )}

        {showForm && (
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <span className={styles.formTitle}>New Emergency Contact</span>
              <button
                className={styles.closeBtn}
                onClick={() => { setShowForm(false); setFormErr('') }}
              >
                <X size={16} />
              </button>
            </div>

            {formErr && <div className={styles.formErr}>{formErr}</div>}

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name *</label>
                <input
                  className={styles.input}
                  placeholder="Contact name"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErr('') }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number *</label>
                <input
                  className={styles.input}
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setFormErr('') }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Relationship</label>
                <select
                  className={styles.select}
                  value={form.relationship}
                  onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
                >
                  {RELATIONSHIPS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleAdd}>
                <Save size={14} />
                Add Contact
              </button>
            </div>
          </div>
        )}

        {contacts.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Users size={36} style={{ color: 'var(--text-3)' }} />
            </div>
            <h3 className={styles.emptyTitle}>No emergency contacts</h3>
            <p className={styles.emptySub}>
              Add contacts who will receive WhatsApp alerts when you trigger SOS.
            </p>
            <button className={styles.addBtnLg} onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Add Your First Contact
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {contacts.map((c, i) => (
              <ContactCard
                key={i}
                contact={c}
                onDelete={() => handleDelete(i)}
              />
            ))}
          </div>
        )}

        <div className={styles.infoBox}>
          <span>⚠️</span>
          <p>
            Emergency contacts receive WhatsApp alerts from the Twilio sandbox.
            They must first join the sandbox by sending{' '}
            <strong>join trunk-whispered</strong> to <strong>+14155238886</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
