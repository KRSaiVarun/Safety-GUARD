import { useUsersStore } from "@/stores/usersStore";
import { useMemo } from "react";

type Props = Readonly<{
  onSelect?: (userId: string) => void;
}>;

export default function ActiveUsersPanel({ onSelect }: Props) {
  const users = useUsersStore((state) => state.users);
  const list = useMemo(
    () =>
      Object.values(users).sort((a, b) =>
        (b.lastUpdated || "").localeCompare(a.lastUpdated || ""),
      ),
    [users],
  );

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 8,
        width: 300,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Active Users</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.length === 0 && (
          <div style={{ color: "var(--text-3)" }}>No users tracked</div>
        )}
        {list.map((u) => (
          <button
            key={u.userId}
            type="button"
            onClick={() => onSelect?.(u.userId)}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: 8,
              borderRadius: 8,
              cursor: "pointer",
              border: "none",
              background:
                u.status === "EMERGENCY"
                  ? "rgba(255,45,85,0.06)"
                  : "transparent",
              textAlign: "left",
            }}
          >
            <img
              src={u.photoUrl ?? "/avatar.png"}
              alt={`${u.name ?? u.userId} profile photo`}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                objectFit: "cover",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{u.name ?? u.userId}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                {u.status} ·{" "}
                {u.lastUpdated
                  ? new Date(u.lastUpdated).toLocaleTimeString()
                  : "—"}
              </div>
            </div>
            <div style={{ fontWeight: 800 }}>
              {u.battery ? `${u.battery}%` : "—"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
