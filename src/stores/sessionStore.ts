import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EmergencySession, EmergencyState, TimelineEvent, RiskScore } from '@/types'
import { supabase } from '@/lib/supabase'

interface SessionStore {
  currentSession: EmergencySession | null
  sessionHistory: EmergencySession[]
  isLoading: boolean
  // Actions
  startSession: (userId: string, method: EmergencySession['triggerMethod']) => Promise<EmergencySession>
  endSession: (sessionId: string) => Promise<void>
  updateState: (state: EmergencyState) => void
  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => void
  updateRiskScore: (risk: RiskScore) => void
  loadHistory: (userId: string) => Promise<void>
  clearSession: () => void
}

const makeSession = (userId: string, method: EmergencySession['triggerMethod']): EmergencySession => ({
  id: crypto.randomUUID(),
  userId,
  state: 'MONITORING',
  triggerMethod: method,
  startedAt: new Date().toISOString(),
  endedAt: null,
  locations: [],
  riskScore: 0,
  alertsSent: [],
  timeline: [{
    id: crypto.randomUUID(),
    sessionId: '',
    eventType: 'SESSION_STARTED',
    data: { method },
    occurredAt: new Date().toISOString(),
  }],
})

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessionHistory: [],
      isLoading: false,

      startSession: async (userId, method) => {
        const session = makeSession(userId, method)
        session.timeline[0].sessionId = session.id
        set({ currentSession: session })

        // Persist to Supabase
        try {
          await supabase.from('emergency_sessions').insert({
            id: session.id,
            user_id: userId,
            state: session.state,
            trigger_method: method,
            started_at: session.startedAt,
          })
        } catch (e) {
          console.warn('[Session] Supabase unavailable, running locally', e)
        }

        return session
      },

      endSession: async (sessionId) => {
        const endedAt = new Date().toISOString()
        set(s => ({
          currentSession: s.currentSession
            ? { ...s.currentSession, state: 'RESOLVED', endedAt }
            : null,
        }))

        try {
          await supabase
            .from('emergency_sessions')
            .update({ state: 'RESOLVED', ended_at: endedAt })
            .eq('id', sessionId)
        } catch (e) {
          console.warn('[Session] Could not persist end', e)
        }

        const current = get().currentSession
        if (current) {
          set(s => ({
            sessionHistory: [{ ...current, state: 'RESOLVED', endedAt }, ...s.sessionHistory],
            currentSession: null,
          }))
        }
      },

      updateState: (state) => {
        set(s => ({
          currentSession: s.currentSession ? { ...s.currentSession, state } : null,
        }))
      },

      addTimelineEvent: (event) => {
        const full: TimelineEvent = { ...event, id: crypto.randomUUID() }
        set(s => ({
          currentSession: s.currentSession
            ? { ...s.currentSession, timeline: [...s.currentSession.timeline, full] }
            : null,
        }))
      },

      updateRiskScore: (risk) => {
        set(s => ({
          currentSession: s.currentSession
            ? { ...s.currentSession, riskScore: risk.score }
            : null,
        }))
      },

      loadHistory: async (userId) => {
        set({ isLoading: true })
        try {
          const { data } = await supabase
            .from('emergency_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('started_at', { ascending: false })
            .limit(20)
          if (data) set({ sessionHistory: data as EmergencySession[] })
        } catch (e) {
          console.warn('[Session] Could not load history', e)
        } finally {
          set({ isLoading: false })
        }
      },

      clearSession: () => set({ currentSession: null }),
    }),
    { name: 'sg-session', partialize: s => ({ sessionHistory: s.sessionHistory }) }
  )
)
