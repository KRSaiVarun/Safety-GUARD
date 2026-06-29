import { useState } from 'react'
import { Users, Search, Shield, UserCheck, Clock } from 'lucide-react'
import styles from './AdminUsersPage.module.css'

const MOCK_USERS = [
  { id: '1', name: 'Demo User',   email: 'test@gmail.com',   role: 'user',  status: 'active',   joined: '2024-01-15', sessions: 3, lastSeen: '2 mins ago' },
  { id: '2', name: 'Priya Sharma',email: 'priya@example.com',role: 'user',  status: 'active',   joined: '2024-01-20', sessions: 1, lastSeen: '1 hr ago'   },
  { id: '3', name: 'Anjali Singh', email: 'anjali@example.com',role: 'user', status: 'offline',  joined: '2024-02-03', sessions: 0, lastSeen: '2 days ago' },
  { id: '4', name: 'Meena Patel', email: 'meena@example.com', role: 'user', status: 'emergency', joined: '2024-01-28', sessions: 5, lastSeen: 'Active now' },
  { id: '5', name: 'Admin',       email: 'kr@gmail.com',     role: 'admin', status: 'active',   joined: '2024-01-01', sessions: 0, lastSeen: 'Active now' },
]

const STATUS_COLORS: Record<string, string> = {
  active:    'var(--green)',
  offline:   '#555',
  emergency: 'var(--red)',
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')

  const filtered = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const active    = MOCK_USERS.filter(u => u.status === 'active').length
  const emergency = MOCK_USERS.filter(u => u.status === 'emergency').length
  const total     = MOCK_USERS.length

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Users size={20} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <h1 className={styles.title}>User Management</h1>
              <p className={styles.subtitle}>Monitor and manage all registered users</p>
            </div>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{total}</span>
            <span className={styles.statLabel}>Total Users</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum} style={{ color: 'var(--green)' }}>{active}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum} style={{ color: emergency > 0 ? 'var(--red)' : 'var(--text-3)' }}>
              {emergency}
            </span>
            <span className={styles.statLabel}>Emergency</span>
          </div>
        </div>

        <div className={styles.searchBar}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Sessions</th>
                <th>Joined</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.userName}>{u.name}</div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleBadgeAdmin : ''}`}>
                      {u.role === 'admin' ? <Shield size={10} /> : <UserCheck size={10} />}
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={styles.statusBadge} style={{ color: STATUS_COLORS[u.status] }}>
                      <span className={styles.statusDot} style={{ background: STATUS_COLORS[u.status] }} />
                      {u.status}
                    </span>
                  </td>
                  <td className={styles.numCell}>{u.sessions}</td>
                  <td className={styles.dateCell}>{u.joined}</td>
                  <td>
                    <span className={styles.lastSeen}>
                      <Clock size={11} />
                      {u.lastSeen}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className={styles.empty}>No users matching "{search}"</div>
          )}
        </div>

        <div className={styles.note}>
          Showing demo data. Connect Supabase to display real registered users.
        </div>

      </div>
    </div>
  )
}
