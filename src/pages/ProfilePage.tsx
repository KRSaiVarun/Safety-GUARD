import { useAuthStore } from "@/stores/authStore";
import type { EmergencyContact } from "@/types";
import { Mail, Phone, Plus, Save, Shield, Trash2, User } from "lucide-react";
import { useState } from "react";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    user?.emergencyContacts ?? [],
  );
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  });
  const [saved, setSaved] = useState(false);

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setContacts((c) => [...c, newContact]);
    setNewContact({ name: "", phone: "", relationship: "" });
  };

  const removeContact = (i: number) =>
    setContacts((c) => c.filter((_, idx) => idx !== i));

  const saveProfile = () => {
    if (!user) return;
    setUser({ ...user, emergencyContacts: contacts });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>My Profile</h1>

        {/* User info card */}
        <div className="card card-lg">
          <div className={styles.userRow}>
            <div className={styles.avatar}>
              <User size={28} style={{ color: "var(--red)" }} />
            </div>
            <div>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
            <span className="badge badge-green" style={{ marginLeft: "auto" }}>
              <Shield size={11} /> Protected
            </span>
          </div>

          <div className={styles.divider} />

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <Mail size={14} style={{ color: "var(--text-3)" }} />
              <div>
                <div className={styles.infoLabel}>Email</div>
                <div className={styles.infoVal}>{user.email}</div>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Phone size={14} style={{ color: "var(--text-3)" }} />
              <div>
                <div className={styles.infoLabel}>Phone</div>
                <div className={styles.infoVal}>{user.phone || "Not set"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency contacts */}
        <div className="card card-lg">
          <div className={styles.sectionHeader}>
            <Phone size={16} style={{ color: "var(--red)" }} />
            <h2 className={styles.sectionTitle}>Emergency Contacts</h2>
            <span className={styles.contactCount}>{contacts.length} / 5</span>
          </div>
          <p className={styles.sectionDesc}>
            These people will be notified immediately when you trigger an SOS
            alert.
          </p>

          {/* Contacts list */}
          <div className={styles.contactList}>
            {contacts.length === 0 && (
              <div className={styles.noContacts}>
                No emergency contacts yet. Add at least one below.
              </div>
            )}
            {contacts.map((c, i) => (
              <div key={c.phone || i} className={styles.contactItem}>
                <div className={styles.contactIcon}>
                  <User size={14} style={{ color: "var(--blue)" }} />
                </div>
                <div className={styles.contactInfo}>
                  <span className={styles.contactName}>{c.name}</span>
                  <span className={styles.contactMeta}>
                    {c.phone} · {c.relationship}
                  </span>
                </div>
                <button
                  onClick={() => removeContact(i)}
                  className={styles.removeBtn}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add contact form */}
          {contacts.length < 5 && (
            <div className={styles.addForm}>
              <div className={styles.divider} />
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-3)",
                  marginBottom: 12,
                }}
              >
                Add new contact
              </p>
              <div className={styles.addGrid}>
                <div className="input-group">
                  <label htmlFor="contact-name" className="input-label">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    className="input"
                    placeholder="Contact name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact((c) => ({ ...c, name: e.target.value }))
                    }
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="contact-phone" className="input-label">
                    Phone
                  </label>
                  <input
                    id="contact-phone"
                    className="input"
                    placeholder="+91 XXXXX XXXXX"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact((c) => ({ ...c, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="contact-relationship" className="input-label">
                    Relationship
                  </label>
                  <input
                    id="contact-relationship"
                    className="input"
                    placeholder="e.g. Mother, Friend"
                    value={newContact.relationship}
                    onChange={(e) =>
                      setNewContact((c) => ({
                        ...c,
                        relationship: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <button
                onClick={addContact}
                className="btn btn-secondary"
                style={{ marginTop: 12 }}
              >
                <Plus size={15} /> Add Contact
              </button>
            </div>
          )}

          {/* Save */}
          <button
            onClick={saveProfile}
            className="btn btn-primary"
            style={{ marginTop: 20, width: "100%", justifyContent: "center" }}
          >
            <Save size={16} />
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
