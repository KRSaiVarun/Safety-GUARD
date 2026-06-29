import {
    getFreshLocation,
    sendEmergencyAlert,
    sendSafeNotification,
} from "@/lib/alerts";
import { useLocationStore } from "@/stores/locationStore";
import { useSessionStore } from "@/stores/sessionStore";
import type { EmergencySession, RiskScore } from "@/types";
import { useCallback, useEffect, useRef } from "react";

// ─── AI Risk Scorer (client-side) ─────────────────────────────────────────────
export function computeRiskScore(session: EmergencySession): RiskScore {
  const factors = [];
  let total = 0;
  const locations = session.locations;
  const now = new Date();
  const hour = now.getHours();

  const timeRisk =
    hour >= 22 || hour <= 5 ? 30 : hour >= 20 || hour <= 7 ? 15 : 0;
  factors.push({ name: "Time of Day", weight: 30, value: timeRisk });
  total += timeRisk;

  if (locations.length > 0) {
    const last = new Date(locations[locations.length - 1].timestamp);
    const minutesInactive = (now.getTime() - last.getTime()) / 60000;
    const inactivityRisk = Math.min(minutesInactive * 10, 40);
    factors.push({ name: "Inactivity", weight: 40, value: inactivityRisk });
    total += inactivityRisk;
  }

  if (locations.length >= 2) {
    const last = locations[locations.length - 1];
    if (last.speed !== null) {
      const speedRisk = last.speed > 25 ? 20 : 0;
      factors.push({ name: "Speed Anomaly", weight: 20, value: speedRisk });
      total += speedRisk;
    }
  }

  if (locations.length > 0) {
    const last = locations[locations.length - 1];
    const accuracyRisk = last.accuracy > 50 ? 10 : 0;
    factors.push({ name: "GPS Accuracy", weight: 10, value: accuracyRisk });
    total += accuracyRisk;
  }

  const score = Math.min(Math.round(total), 100);
  const level =
    score >= 75
      ? "CRITICAL"
      : score >= 50
        ? "HIGH"
        : score >= 25
          ? "MEDIUM"
          : "LOW";
  return { score, level, factors, computedAt: now.toISOString() };
}

// ── Get best available coordinates ────────────────────────────────────────────
async function getBestCoords(): Promise<{ lat: number; lng: number } | null> {
  // 1. Try live store first (already tracking)
  const stored = useLocationStore.getState().current;
  if (stored) {
    return { lat: stored.lat, lng: stored.lng };
  }
  // 2. Fall back to fresh one-shot fix from device
  const fresh = await getFreshLocation();
  if (fresh) {
    return { lat: fresh.latitude, lng: fresh.longitude };
  }
  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useEmergencySession() {
  const {
    currentSession,
    startSession,
    endSession,
    updateState,
    addTimelineEvent,
    updateRiskScore,
    setAlertDelivery,
    resetAlertDelivery,
  } = useSessionStore();
  const { startTracking, stopTracking } = useLocationStore();

  const riskIntervalRef = useRef<number | null>(null);
  const alertIntervalRef = useRef<number | null>(null);
  const alertCountRef = useRef(0);

  // ── Fire one alert ────────────────────────────────────────────────────────
  const fireAlert = useCallback(
    async (sessionId: string, isRepeat = false) => {
      setAlertDelivery({ status: "sending" });

      // Get freshest GPS available at fire time
      const coords = await getBestCoords();
      const lat = coords?.lat ?? null;
      const lng = coords?.lng ?? null;

      console.info(
        "[EMERGENCY] %s  lat=%s  lng=%s",
        isRepeat ? "REPEAT ALERT" : "FIRST ALERT",
        lat ?? "null",
        lng ?? "null",
      );

      const result = await sendEmergencyAlert(lat, lng, "PANIC BUTTON");

      alertCountRef.current += 1;
      const count = alertCountRef.current;

      setAlertDelivery({
        status: result.ok ? "sent" : "failed",
        count,
        lastSentAt: new Date().toISOString(),
        lastAttempt: 0,
        error: result.error,
      });

      addTimelineEvent({
        sessionId,
        eventType: isRepeat ? "ALERT_REPEATED" : "ALERT_SENT",
        data: {
          count,
          ok: result.ok,
          sid: result.sid,
          lat,
          lng,
          maps_link:
            result.maps_link ??
            (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null),
          error: result.error,
        },
        occurredAt: new Date().toISOString(),
      });

      return result;
    },
    [setAlertDelivery, addTimelineEvent],
  );

  // ── Risk scoring loop (every 15s) ─────────────────────────────────────────
  const startRiskScoring = useCallback(
    (session: EmergencySession) => {
      riskIntervalRef.current = globalThis.setInterval(() => {
        const s = useSessionStore.getState().currentSession;
        if (!s) return;
        const risk = computeRiskScore(s);
        updateRiskScore(risk);
        if (
          risk.score >= 75 &&
          s.state !== "ALERT_TRIGGERED" &&
          s.state !== "RESOLVED"
        ) {
          updateState("RISK_DETECTED");
          addTimelineEvent({
            sessionId: s.id,
            eventType: "RISK_SCORED",
            data: { score: risk.score, level: risk.level },
            occurredAt: new Date().toISOString(),
          });
        }
      }, 15_000);
    },
    [updateRiskScore, updateState, addTimelineEvent],
  );

  // ── Repeated alert loop (every 30s) ───────────────────────────────────────
  const startRepeatedAlerts = useCallback(
    (sessionId: string) => {
      alertIntervalRef.current = globalThis.setInterval(() => {
        const s = useSessionStore.getState().currentSession;
        if (!s || s.state === "RESOLVED") {
          if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
          return;
        }
        fireAlert(sessionId, true);
      }, 30_000);
    },
    [fireAlert],
  );

  // ── Trigger emergency ─────────────────────────────────────────────────────
  const triggerEmergency = useCallback(
    async (
      userId: string,
      method: EmergencySession["triggerMethod"] = "manual",
    ) => {
      const session = await startSession(userId, method);
      alertCountRef.current = 0;
      resetAlertDelivery();

      // Start GPS tracking first so coords are available ASAP
      startTracking(session.id);
      startRiskScoring(session);

      updateState("ALERT_TRIGGERED");
      addTimelineEvent({
        sessionId: session.id,
        eventType: "STATE_CHANGED",
        data: { from: "MONITORING", to: "ALERT_TRIGGERED" },
        occurredAt: new Date().toISOString(),
      });

      // Fire first alert immediately (will grab GPS internally)
      await fireAlert(session.id, false);

      // Then repeat every 30s with fresh GPS each time
      startRepeatedAlerts(session.id);

      return session;
    },
    [
      startSession,
      resetAlertDelivery,
      startTracking,
      startRiskScoring,
      updateState,
      addTimelineEvent,
      fireAlert,
      startRepeatedAlerts,
    ],
  );

  // ── Resolve emergency ─────────────────────────────────────────────────────
  const resolveEmergency = useCallback(async () => {
    if (!currentSession) return;
    if (riskIntervalRef.current) clearInterval(riskIntervalRef.current);
    if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
    stopTracking();
    alertCountRef.current = 0;
    setAlertDelivery({ status: "sending" });
    const result = await sendSafeNotification();
    setAlertDelivery({
      status: result.ok ? "sent" : "failed",
      error: result.error,
    });
    addTimelineEvent({
      sessionId: currentSession.id,
      eventType: "PASSCODE_VERIFIED",
      data: { resolvedAt: new Date().toISOString(), safeAlertOk: result.ok },
      occurredAt: new Date().toISOString(),
    });
    await endSession(currentSession.id);
  }, [
    currentSession,
    stopTracking,
    endSession,
    setAlertDelivery,
    addTimelineEvent,
  ]);

  const getAlertCount = useCallback(() => alertCountRef.current, []);

  useEffect(() => {
    return () => {
      if (riskIntervalRef.current) clearInterval(riskIntervalRef.current);
      if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
    };
  }, []);

  return { currentSession, triggerEmergency, resolveEmergency, getAlertCount };
}
