import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { supabase, signIn, signUp, signOut } from '@/lib/supabase'

interface AuthStore {
  user: User | null
  isLoading: boolean
  error: string | null
  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, phone: string) => Promise<boolean>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await signIn(email, password)
          if (error) throw error
          if (data.user) {
            const u: User = {
              id: data.user.id,
              email: data.user.email ?? '',
              name: data.user.user_metadata?.name ?? 'User',
              phone: data.user.user_metadata?.phone ?? '',
              emergencyContacts: data.user.user_metadata?.emergencyContacts ?? [],
              createdAt: data.user.created_at,
            }
            set({ user: u, isLoading: false })
            return true
          }
          throw new Error('Login failed')
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Login failed'
          set({ error: msg, isLoading: false })
          return false
        }
      },

      register: async (name, email, password, phone) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await signUp(email, password, { name, phone, emergencyContacts: [] })
          if (error) throw error
          if (data.user) {
            const u: User = {
              id: data.user.id,
              email,
              name,
              phone,
              emergencyContacts: [],
              createdAt: data.user.created_at,
            }
            set({ user: u, isLoading: false })
            return true
          }
          throw new Error('Registration failed')
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Registration failed'
          set({ error: msg, isLoading: false })
          return false
        }
      },

      logout: async () => {
        await signOut()
        set({ user: null })
      },

      setUser: (user) => set({ user }),
      clearError: () => set({ error: null }),
    }),
    { name: 'sg-auth', partialize: s => ({ user: s.user }) }
  )
)
