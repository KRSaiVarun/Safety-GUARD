// ─── Emergency State Machine ──────────────────────────────────────────────────
export type EmergencyState =
  | "IDLE"
  | "MONITORING"
  | "RISK_DETECTED"
  | "ALERT_TRIGGERED"
  | "LIVE_TRACKING"
  | "RESOLVED";

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  emergencyContacts: EmergencyContact[];
  createdAt: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// ─── Location ─────────────────────────────────────────────────────────────────
export interface LocationPoint {
  id?: string;
  sessionId: string;
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

// ─── Emergency Session ────────────────────────────────────────────────────────
export interface EmergencySession {
  id: string;
  userId: string;
  state: EmergencyState;
  triggerMethod: "manual" | "auto_inactivity" | "auto_speed" | "voice";
  startedAt: string;
  endedAt: string | null;
  locations: LocationPoint[];
  riskScore: number;
  alertsSent: Alert[];
  timeline: TimelineEvent[];
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  sessionId: string;
  type: "sms" | "push" | "email" | "whatsapp";
  status: "pending" | "sent" | "delivered" | "failed";
  recipient: string;
  sentAt: string;
}

// ─── Timeline Event ───────────────────────────────────────────────────────────
export interface TimelineEvent {
  id: string;
  sessionId: string;
  eventType:
    | "SESSION_STARTED"
    | "LOCATION_UPDATED"
    | "RISK_SCORED"
    | "ALERT_SENT"
    | "ALERT_REPEATED"
    | "STATE_CHANGED"
    | "SESSION_ENDED"
    | "CONTACT_NOTIFIED"
    | "PASSCODE_WRONG"
    | "PASSCODE_VERIFIED"
    | "GEOFENCE_ENTER"
    | "GEOFENCE_EXIT"
    | "GEOFENCE_BREACH"
    | "RISK_CHANGED";
  data: Record<string, unknown>;
  occurredAt: string;
}

// ─── Risk ─────────────────────────────────────────────────────────────────────
export interface RiskScore {
  score: number; // 0–100
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: RiskFactor[];
  computedAt: string;
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
}

export interface RiskDetails {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: {
    time_of_day: number;
    unsafe_area: number;
    inactivity: number;
    emergency_frequency: number;
    battery_level: number;
    network_status: number;
  };
  recommendation: string;
}

// ─── Geofence ─────────────────────────────────────────────────────────────────
export interface Geofence {
  id: string;
  name: string;
  type: "safe" | "unsafe";
  polygon_coordinates: GeoJSONPolygon;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][]; // [[[lon, lat], ...]]
}

export interface GeofenceEvent {
  id: string;
  session_id: string;
  geofence_id: string;
  event_type: "ENTER" | "EXIT" | "BREACH";
  geofence_name: string;
  geofence_type: "safe" | "unsafe";
  latitude: number;
  longitude: number;
  risk_score_at_event?: number;
  created_at: string;
}

// ─── Socket Events ────────────────────────────────────────────────────────────
export const EVENTS = {
  EMERGENCY_TRIGGERED: "EMERGENCY_TRIGGERED",
  LOCATION_UPDATED: "LOCATION_UPDATED",
  ALERT_SENT: "ALERT_SENT",
  SESSION_ENDED: "SESSION_ENDED",
  RISK_SCORED: "RISK_SCORED",
  STATE_CHANGED: "STATE_CHANGED",
  DASHBOARD_SYNC: "DASHBOARD_SYNC",
  GEOFENCE_ENTER: "GEOFENCE_ENTER",
  GEOFENCE_EXIT: "GEOFENCE_EXIT",
  GEOFENCE_BREACH: "GEOFENCE_BREACH",
  RISK_SCORE_CHANGED: "RISK_SCORE_CHANGED",
} as const;

export type EventName = keyof typeof EVENTS;
