// ─── Emergency State Machine ──────────────────────────────────────────────────
export type EmergencyState =
  | 'IDLE'
  | 'MONITORING'
  | 'RISK_DETECTED'
  | 'ALERT_TRIGGERED'
  | 'LIVE_TRACKING'
  | 'RESOLVED'

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  phone: string
  emergencyContacts: EmergencyContact[]
  createdAt: string
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

// ─── Location ─────────────────────────────────────────────────────────────────
export interface LocationPoint {
  id?: string
  sessionId: string
  lat: number
  lng: number
  accuracy: number
  speed: number | null
  heading: number | null
  timestamp: string
}

// ─── Emergency Session ────────────────────────────────────────────────────────
export interface EmergencySession {
  id: string
  userId: string
  state: EmergencyState
  triggerMethod: 'manual' | 'auto_inactivity' | 'auto_speed' | 'voice'
  startedAt: string
  endedAt: string | null
  locations: LocationPoint[]
  riskScore: number
  alertsSent: Alert[]
  timeline: TimelineEvent[]
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export interface Alert {
  id: string
  sessionId: string
  type: 'sms' | 'push' | 'email' | 'whatsapp'
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  recipient: string
  sentAt: string
}

// ─── Timeline Event ───────────────────────────────────────────────────────────
export interface TimelineEvent {
  id: string
  sessionId: string
  eventType:
    | 'SESSION_STARTED'
    | 'LOCATION_UPDATED'
    | 'RISK_SCORED'
    | 'ALERT_SENT'
    | 'STATE_CHANGED'
    | 'SESSION_ENDED'
    | 'CONTACT_NOTIFIED'
  data: Record<string, unknown>
  occurredAt: string
}

// ─── Risk ─────────────────────────────────────────────────────────────────────
export interface RiskScore {
  score: number          // 0–100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  factors: RiskFactor[]
  computedAt: string
}

export interface RiskFactor {
  name: string
  weight: number
  value: number
}

// ─── Socket Events ────────────────────────────────────────────────────────────
export const EVENTS = {
  EMERGENCY_TRIGGERED:  'EMERGENCY_TRIGGERED',
  LOCATION_UPDATED:     'LOCATION_UPDATED',
  ALERT_SENT:           'ALERT_SENT',
  SESSION_ENDED:        'SESSION_ENDED',
  RISK_SCORED:          'RISK_SCORED',
  STATE_CHANGED:        'STATE_CHANGED',
  DASHBOARD_SYNC:       'DASHBOARD_SYNC',
} as const

export type EventName = keyof typeof EVENTS
