import { useNotificationStore } from "@/stores/notificationStore";
import { Bell, X } from "lucide-react";
import { useState } from "react";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const items = useNotificationStore((state) => state.list);
  const remove = useNotificationStore((state) => state.remove);

  const colorFor = (level: string | undefined) => {
    switch (level) {
      case "error":
        return "#ff3a3a";
      case "warning":
        return "#ffd60a";
      case "success":
        return "#30d158";
      default:
        return "#0a84ff";
    }
  };

  return (
    <div style={{ position: "fixed", right: 12, top: 84, zIndex: 80 }}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="btn btn-ghost"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          padding: 8,
          borderRadius: 10,
        }}
      >
        <Bell />
      </button>
      {open && (
        <div
          style={{
            width: 360,
            marginTop: 8,
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <strong>Notifications</strong>
            <button
              onClick={() => useNotificationStore.getState().clear()}
              className="btn btn-sm"
            >
              Clear
            </button>
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {items.length === 0 && (
              <div style={{ padding: 16, color: "var(--text-3)" }}>
                No notifications
              </div>
            )}
            {items.map((i) => (
              <div
                key={i.id}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 12,
                  borderBottom: "1px solid rgba(255,255,255,0.02)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: colorFor(i.level),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#001",
                  }}
                >
                  <Bell size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div style={{ fontWeight: 700 }}>{i.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                      {new Date(i.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                    {i.body}
                  </div>
                </div>
                <button onClick={() => remove(i.id)} className="btn btn-ghost">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
