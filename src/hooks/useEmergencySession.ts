import { useCallback, useEffect, useRef } from 'react'
import { useSessionStore } from '@/stores/sessionStore'
import { useLocationStore } from '@/stores/locationStore'
import type { EmergencySession, RiskScore } from '@/types'

// ─── AI Risk Scorer (client-side) ─────────────────────────────────────────────
export function computeRiskScore(session: EmergencySession): RiskScore {
  const factors = []
  let total = 0

  const locations = session.locations
  const now = new Date()
  const hour = now.getHours()

  // Factor 1: Time of day (night = higher risk)
  const timeRisk = (hour >= 22 || hour <= 5) ? 30 : (hour >= 20 || hour <= 7) ? 15 : 0
  factors.push({ name: 'Time of Day', weight: 30, value: timeRisk })
  total += timeRisk

  // Factor 2: Inactivity (no location update in 2+ minutes)
  if (locations.length > 0) {
    const last = new Date(locations[locations.length - 1].timestamp)
    const minutesInactive = (now.getTime() - last.getTime()) / 60000
    const inactivityRisk = Math.min(minutesInactive * 10, 40)
    factors.push({ name: 'Inactivity', weight: 40, value: inactivityRisk })
    total += inactivityRisk
  }

  // Factor 3: Speed anomaly (sudden stop or very high speed)
  if (locations.length >= 2) {
    const last = locations[locations.length - 1]
    if (last.speed !== null) {
      const speedRisk = last.speed > 25 ? 20 : 0  // > 25 m/s ≈ 90 km/h
      factors.push({ name: 'Speed Anomaly', weight: 20, value: speedRisk })
      total += speedRisk
    }
  }

  // Factor 4: Low GPS accuracy
  if (locations.length > 0) {
    const last = locations[locations.length - 1]
    const accuracyRisk = last.accuracy > 50 ? 10 : 0
    factors.push({ name: 'GPS Accuracy', weight: 10, value: accuracyRisk })
    total += accuracyRisk
  }

  const score = Math.min(Math.round(total), 100)
  const level = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW'

  return { score, level, factors, computedAt: now.toISOString() }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useEmergencySession() {
  const { currentSession, startSession, endSession, updateState, addTimelineEvent, updateRiskScore } = useSessionStore()
  const { startTracking, stopTracking, current: currentLocation } = useLocationStore()
  const riskIntervalRef = useRef<number | null>(null)
  const inactivityTimerRef = useRef<number | null>(null)

  // Start risk scoring loop
  const startRiskScoring = useCallback((session: EmergencySession) => {
    riskIntervalRef.current = window.setInterval(() => {
      const s = useSessionStore.getState().currentSession
      if (!s) return
      const risk = computeRiskScore(s)
      updateRiskScore(risk)

      if (risk.score >= 75 && s.state !== 'ALERT_TRIGGERED' && s.state !== 'RESOLVED') {
        updateState('RISK_DETECTED')
        addTimelineEvent({
          sessionId: s.id,
          eventType: 'RISK_SCORED',
          data: { score: risk.score, level: risk.level },
          occurredAt: new Date().toISOString(),
        })
      }
    }, 15000) // every 15s
  }, [updateRiskScore, updateState, addTimelineEvent])

  const triggerEmergency = useCallback(async (userId: string, method: EmergencySession['triggerMethod'] = 'manual') => {
    const session = await startSession(userId, method)
    startTracking(session.id)
    startRiskScoring(session)
    updateState('ALERT_TRIGGERED')
    addTimelineEvent({
      sessionId: session.id,
      eventType: 'STATE_CHANGED',
      data: { from: 'MONITORING', to: 'ALERT_TRIGGERED' },
      occurredAt: new Date().toISOString(),
    })
    return session
  }, [startSession, startTracking, startRiskScoring, updateState, addTimelineEvent])

  const resolveEmergency = useCallback(async () => {
    if (!currentSession) return
    if (riskIntervalRef.current) clearInterval(riskIntervalRef.current)
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    stopTracking()
    await endSession(currentSession.id)
  }, [currentSession, stopTracking, endSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (riskIntervalRef.current) clearInterval(riskIntervalRef.current)
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    }
  }, [])

  return { currentSession, currentLocation, triggerEmergency, resolveEmergency, updateState }
}
