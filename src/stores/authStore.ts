import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types'
import { supabase, signIn, signUp, signOut } from '@/lib/supabase'
import { hashPin, verifyPin } from '@/lib/alerts'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_PASSCODE_HASH = hashPin('1234')

const ADMIN_EMAIL = 'kr@gmail.com'

const DEMO_ACCOUNTS: Array<{ email: string; password: string; user: User }> = [
  {
    email: 'kr@gmail.com',
    password: 'admin123',
    user: {
      id: 'demo-admin-001',
      email: 'kr@gmail.com',
      name: 'Admin',
      phone: '+91 99999 00001',
      role: 'admin',
      emergencyContacts: [],
      createdAt: new Date().toISOString(),
    },
  },
  {
    email: 'test@gmail.com',
    password: '123456',
    user: {
      id: 'demo-user-001',
      email: 'test@gmail.com',
      name: 'Demo User',
      phone: '+91 99999 00002',
      role: 'user',
      emergencyContacts: [
        { name: 'Emergency Contact', phone: '+91 99999 00003', relationship: 'Family' },
      ],
      createdAt: new Date().toISOString(),
    },
  },
]

interface AuthStore {
  user: User | null
  passcodeHash: string | null
  emailPending: boolean
  isLoading: boolean
  error: string | null
  isDemoSession: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, phone: string) => Promise<boolean>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setPasscodeHash: (hash: string) => void
  clearError: () => void
  setPasscode: (pin: string) => void
  verifyPasscode: (pin: string) => boolean
  hasPasscode: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      passcodeHash: null,
      emailPending: false,
      isLoading: false,
      error: null,
      isDemoSession: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null })

        if (DEMO_MODE) {
          const demo = DEMO_ACCOUNTS.find(
            d => d.email === email.toLowerCase().trim() && d.password === password
          )
          if (demo) {
            set({
              user: demo.user,
              passcodeHash: DEMO_PASSCODE_HASH,
              isLoading: false,
              emailPending: false,
              isDemoSession: true,
              error: null,
            })
            return true
          }
        }

        try {
          const { data, error } = await signIn(email, password)

          if (error) {
            if (error.message?.toLowerCase().includes('invalid login')) {
              throw new Error('Invalid email or password.')
            }
            if (error.message?.toLowerCase().includes('email not confirmed')) {
              throw new Error('Please confirm your email before signing in.')
            }
            throw error
          }

          if (data.user) {
            const emailLower = (data.user.email ?? '').toLowerCase()
            const role: UserRole = emailLower === ADMIN_EMAIL
              ? 'admin'
              : ((data.user.user_metadata?.role as UserRole) ?? 'user')

            const u: User = {
              id: data.user.id,
              email: data.user.email ?? '',
              name: (data.user.user_metadata?.name as string) ?? 'User',
              phone: (data.user.user_metadata?.phone as string) ?? '',
              role,
              emergencyContacts:
                (data.user.user_metadata?.emergencyContacts as User['emergencyContacts']) ?? [],
              createdAt: data.user.created_at,
            }
            set({ user: u, isLoading: false, emailPending: false, isDemoSession: false })

            const metaHash = data.user.user_metadata?.passcodeHash as string | undefined
            if (metaHash && !get().passcodeHash) set({ passcodeHash: metaHash })

            return true
          }
          throw new Error('Login failed. Please try again.')
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Login failed. Please try again.'
          set({ error: msg, isLoading: false })
          return false
        }
      },

      register: async (name, email, password, phone) => {
        set({ isLoading: true, error: null, emailPending: false })
        try {
          const { data, error } = await signUp(email, password, {
            name,
            phone,
            role: 'user',
            emergencyContacts: [],
          })

          if (error) {
            const msg = error.message?.toLowerCase() ?? ''
            if (msg.includes('already registered') || msg.includes('user already registered')) {
              throw new Error('An account with this email already exists. Please sign in instead.')
            }
            if (
              msg.includes('email rate limit') ||
              msg.includes('over_email_send_rate_limit') ||
              msg.includes('rate limit') ||
              msg.includes('for security purposes')
            ) {
              throw new Error(
                'Email rate limit reached — please wait a few minutes then try again.'
              )
            }
            throw error
          }

          if (data.user) {
            if (!data.session) {
              set({ emailPending: true, isLoading: false })
              return true
            }

            const u: User = {
              id: data.user.id,
              email,
              name,
              phone,
              role: 'user',
              emergencyContacts: [],
              createdAt: data.user.created_at,
            }
            set({ user: u, isLoading: false, emailPending: false })
            return true
          }
          throw new Error('Registration failed. Please try again.')
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Registration failed. Please try again.'
          set({ error: msg, isLoading: false })
          return false
        }
      },

      logout: async () => {
        const { isDemoSession } = get()
        if (!isDemoSession) await signOut()
        set({
          user: null,
          passcodeHash: null,
          emailPending: false,
          isDemoSession: false,
          error: null,
        })
        localStorage.removeItem('sg-session')
      },

      setUser: (user) => set({ user }),
      setPasscodeHash: (hash) => set({ passcodeHash: hash }),
      clearError: () => set({ error: null }),

      setPasscode: (pin) => {
        const hash = hashPin(pin)
        set({ passcodeHash: hash })
        if (!get().isDemoSession) {
          supabase.auth.updateUser({ data: { passcodeHash: hash } }).catch(() => {})
        }
      },

      verifyPasscode: (pin) => {
        const hash = get().passcodeHash
        if (!hash) return false
        return verifyPin(pin, hash)
      },

      hasPasscode: () => !!get().passcodeHash,

      isAdmin: () => {
        const { user } = get()
        if (!user) return false
        return (
          user.email === ADMIN_EMAIL ||
          user.role === 'admin' ||
          user.role === 'supervisor' ||
          user.role === 'operator'
        )
      },
    }),
    {
      name: 'sg-auth',
      partialize: s => ({
        user: s.user,
        passcodeHash: s.passcodeHash,
        isDemoSession: s.isDemoSession,
      }),
    }
  )
)

export { DEMO_MODE, DEMO_ACCOUNTS }
