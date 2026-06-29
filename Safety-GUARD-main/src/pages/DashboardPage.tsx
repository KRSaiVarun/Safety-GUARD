import ActiveUsersPanel from "@/components/ActiveUsersPanel";
import IncidentTimeline from "@/components/IncidentTimeline";
import LiveIncidentFeed from "@/components/LiveIncidentFeed";
import NotificationCenter from "@/components/NotificationCenter";
import RiskMeter from "@/components/RiskMeter";
import { useAuthStore } from "@/stores/authStore";
import { useLocationStore } from "@/stores/locationStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUsersStore } from "@/stores/usersStore";
import { format } from "date-fns";
import {
    Activity,
    AlertTriangle,
    Clock,
    MapPin,
    Radio,
    Shield,
    Zap,
} from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./DashboardPage.module.css";

const TacticalMap = lazy(() => import("@/components/TacticalMap"));

const STATE_COLORS: Record<string, string> = {
  IDLE: "#555",
  MONITORING: "#0a84ff",
  RISK_DETECTED: "#ffd60a",
  ALERT_TRIGGERED: "#ff2d55",
  LIVE_TRACKING: "#ff2d55",
  RESOLVED: "#30d158",
};

const STATES = [
  "IDLE",
  "MONITORING",
  "RISK_DETECTED",
  "ALERT_TRIGGERED",
  "LIVE_TRACKING",
  "RESOLVED",
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { currentSession, sessionHistory, loadHistory } = useSessionStore();
  const { current: loc, trail } = useLocationStore();
  const users = useUsersStore((state) => state.users);
  const selectedUser = useUsersStore((state) => state.selectedUser);
  const selectUser = useUsersStore((state) => state.selectUser);
  const [localSelected, setLocalSelected] = useState<string | undefined>();

  useEffect(() => {
    if (user) loadHistory(user.id);
  }, [user, loadHistory]);

  const riskScore = currentSession?.riskScore ?? 0;
  const state = currentSession?.state ?? "IDLE";
  const events = currentSession?.timeline ?? [];
  const sosActive = state === "ALERT_TRIGGERED" || state === "LIVE_TRACKING";

  useEffect(() => {
    if (sosActive) {
      document.body.classList.add("sg-emergency-flash");
    } else {
      document.body.classList.remove("sg-emergency-flash");
    }
    return () => document.body.classList.remove("sg-emergency-flash");
  }, [sosActive]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tactical Command Center</h1>
          <p className={styles.subtitle}>
            {user?.name
              ? `Welcome back, ${user.name}`
              : "Real-time safety monitoring"}
            {currentSession && (
              <span className={styles.liveTag}> · EMERGENCY ACTIVE</span>
            )}
          </p>
        </div>
        {sosActive && (
          <div className={styles.emergencyBanner} role="alert">
            <strong>⚠ EMERGENCY ALERT DETECTED</strong>
            <span className={styles.bannerMeta}>
              Zooming to victim • Showing nearby response units
            </span>
          </div>
        )}
        <Link
          to="/emergency"
          id="sos-dashboard-btn"
          className={`btn btn-primary ${styles.sosQuickBtn}`}
        >
          <AlertTriangle size={16} />
          SOS Emergency
        </Link>
      </div>

      {/* State Machine Row */}
      <div className={styles.stateMachine}>
        {STATES.map((s, i) => (
          <div key={s} className={styles.stateItem}>
            <div
              className={`${styles.stateDot} ${s === state ? styles.stateDotActive : ""}`}
              style={{
                background: s === state ? STATE_COLORS[s] : "transparent",
                borderColor: STATE_COLORS[s] ?? "#555",
                boxShadow:
                  s === state ? `0 0 12px ${STATE_COLORS[s]}88` : "none",
              }}
            />
            <span
              className={styles.stateLabel}
              style={{ color: s === state ? STATE_COLORS[s] : "var(--text-3)" }}
            >
              {s.replace(/_/g, " ")}
            </span>
            {i < STATES.length - 1 && (
              <div
                className={styles.stateArrow}
                style={{
                  background:
                    i < STATES.indexOf(state)
                      ? STATE_COLORS[state]
                      : "var(--border)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className={styles.grid}>
        {/* Map - large left */}
        <div className={styles.mapCard}>
          <div className={styles.cardHeader}>
            <MapPin size={14} style={{ color: "var(--blue)" }} />
            <span>GPS INTELLIGENCE</span>
            {loc && (
              <span className={styles.coordsTag}>
                {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
              </span>
            )}
            {!currentSession && (
              <span className="badge badge-blue">STANDBY</span>
            )}
            {currentSession && (
              <span className="badge badge-red">TRACKING</span>
            )}
          </div>
          <Suspense
            fallback={
              <div className={styles.mapFallback}>
                <Radio size={24} style={{ color: "var(--text-3)" }} />
                <span>Loading map...</span>
              </div>
            }
          >
            <TacticalMap
              locations={trail}
              current={loc}
              height={340}
              showPulse={!!currentSession}
              sosActive={sosActive}
              profileUrl={user?.photoUrl ?? null}
              users={Object.values(users)}
              selectedUserId={selectedUser ?? localSelected ?? null}
            />
          </Suspense>
          {loc && (
            <div className={styles.gpsStats}>
              <div className={styles.gpsStat}>
                <span className={styles.gpsLabel}>ACCURACY</span>
                <span className={styles.gpsVal}>
                  ±{Math.round(loc.accuracy)}m
                </span>
              </div>
              <div className={styles.gpsStat}>
                <span className={styles.gpsLabel}>SPEED</span>
                <span className={styles.gpsVal}>
                  {loc.speed ? `${(loc.speed * 3.6).toFixed(1)} km/h` : "N/A"}
                </span>
              </div>
              <div className={styles.gpsStat}>
                <span className={styles.gpsLabel}>HEADING</span>
                <span className={styles.gpsVal}>
                  {loc.heading ? `${Math.round(loc.heading)}°` : "N/A"}
                </span>
              </div>
              <div className={styles.gpsStat}>
                <span className={styles.gpsLabel}>POINTS</span>
                <span className={styles.gpsVal}>{trail.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            <ActiveUsersPanel
              onSelect={(id) => {
                selectUser(id);
                setLocalSelected(id);
              }}
            />
            <div style={{ flex: 1 }}>
              <NotificationCenter />
              <IncidentTimeline />
            </div>
          </div>
          {/* Risk meter */}
          <div className="card">
            <RiskMeter score={riskScore} />
          </div>

          {/* Quick stats */}
          <div className={styles.statsRow}>
            <div className={`card card-sm ${styles.statCard}`}>
              <Shield size={16} style={{ color: "var(--green)" }} />
              <span className={styles.statNum}>{sessionHistory.length}</span>
              <span className={styles.statLabel}>Sessions</span>
            </div>
            <div className={`card card-sm ${styles.statCard}`}>
              <Zap size={16} style={{ color: "var(--yellow)" }} />
              <span className={styles.statNum}>{events.length}</span>
              <span className={styles.statLabel}>Events</span>
            </div>
            <div className={`card card-sm ${styles.statCard}`}>
              <Activity size={16} style={{ color: "var(--blue)" }} />
              <span className={styles.statNum}>{trail.length}</span>
              <span className={styles.statLabel}>GPS Pts</span>
            </div>
          </div>

          {/* Incident feed */}
          <LiveIncidentFeed events={events} maxHeight={260} />
        </div>
      </div>

      {/* Session history */}
      <div className={styles.historySection}>
        <div className={styles.histHeader}>
          <Clock size={14} style={{ color: "var(--text-3)" }} />
          <span>INCIDENT HISTORY</span>
          <span className={styles.histCount}>
            {sessionHistory.length} sessions
          </span>
        </div>
        {sessionHistory.length === 0 ? (
          <div className={styles.histEmpty}>No past incidents on record</div>
        ) : (
          <div className={styles.histList}>
            {sessionHistory.slice(0, 8).map((s) => (
              <Link
                to={`/replay/${s.id}`}
                key={s.id}
                className={`${styles.histItem} card card-sm`}
              >
                <div
                  className={styles.histDot}
                  style={{ background: STATE_COLORS[s.state] }}
                />
                <div className={styles.histInfo}>
                  <span className={styles.histMethod}>
                    {s.triggerMethod.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className={styles.histDate}>
                    {format(new Date(s.startedAt), "dd MMM yyyy · HH:mm")}
                  </span>
                </div>
                <span
                  className="badge"
                  style={{
                    color: STATE_COLORS[s.state],
                    borderColor: `${STATE_COLORS[s.state]}44`,
                    background: `${STATE_COLORS[s.state]}18`,
                  }}
                >
                  {s.state}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
