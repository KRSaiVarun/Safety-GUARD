import { useNotificationStore } from "@/stores/notificationStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useMemo } from "react";

export default function IncidentTimeline() {
  const notes = useNotificationStore((state) => state.list);
  const sessions = useSessionStore((state) => state.sessionHistory);

  const items = useMemo(() => {
    const fromNotes = notes.map((n) => ({
      id: n.id,
      ts: n.createdAt,
      type: "note",
      title: n.title,
      body: n.body,
    }));
    const fromSessions = sessions.flatMap((s) =>
      s.timeline.map((t) => ({
        id: t.id,
        ts: t.occurredAt,
        type: "event",
        title: t.eventType,
        body: JSON.stringify(t.data),
      })),
    );
    return [...fromNotes, ...fromSessions].sort((a, b) =>
      (b.ts || "").localeCompare(a.ts || ""),
    );
  }, [notes, sessions]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 8,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Incident Timeline</div>
      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {items.length === 0 && (
          <div style={{ color: "var(--text-3)" }}>No incidents</div>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              padding: 8,
              borderRadius: 8,
              background: "rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700 }}>
                {it.title.replace(/_/g, " ")}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                {it.ts ? new Date(it.ts).toLocaleTimeString() : ""}
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>
              {it.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
