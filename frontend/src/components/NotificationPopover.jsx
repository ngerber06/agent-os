import React, { useState } from 'react';
import { Icon } from './Widgets';

const INITIAL_NOTIFS = [
  {
    id: "n1",
    level: "bad",
    title: "VPS Probe Timeout",
    desc: "Fail2ban triggered on port 22. SSH connections from 198.51.100.42 blocked.",
    time: "2m ago",
    read: false,
    category: "Ops",
  },
  {
    id: "n2",
    level: "ok",
    title: "FastAPI Build Passed",
    desc: "Claude successfully merged origin/feat/router-v3 to main. All tests passed.",
    time: "15m ago",
    read: false,
    category: "Dev",
  },
  {
    id: "n3",
    level: "warn",
    title: "Spend Limit Threshold",
    desc: "MTD spend reached $1,006.80 (67% of monthly budget limit $1,500).",
    time: "1h ago",
    read: false,
    category: "Spend",
  },
  {
    id: "n4",
    level: "info",
    title: "Weekly Cohort Report",
    desc: "Gemini completed retention.pdf export (2.3MB). Saved in Vault/Data.",
    time: "5h ago",
    read: true,
    category: "Data",
  },
  {
    id: "n5",
    level: "ok",
    title: "Agent Auto-Recovery",
    desc: "Hermes restarted Codex process code-davinci to clear socket leaks.",
    time: "1d ago",
    read: true,
    category: "Systems",
  }
];

export default function NotificationPopover({ open, onClose, onUnreadChange }) {
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);

  const unreadCount = notifs.filter(n => !n.read).length;
  
  React.useEffect(() => {
    onUnreadChange && onUnreadChange(unreadCount);
  }, [unreadCount, onUnreadChange]);

  if (!open) return null;

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...prev, ...n, read: true })));
  };

  const clearAll = () => {
    setNotifs([]);
  };

  const toggleRead = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const deleteNotif = (id, e) => {
    e.stopPropagation();
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const toneMap = {
    ok: "var(--ok)",
    warn: "var(--warn)",
    bad: "var(--bad)",
    info: "var(--info)"
  };

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 4px)", right: 16, zIndex: 100,
      width: 360, background: "var(--bg-1)", border: "1px solid var(--line-strong)",
      borderRadius: 10, boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "var(--font-sans)", color: "var(--fg-1)"
    }} onMouseLeave={onClose}>
      
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <b style={{ fontSize: 13, color: "var(--fg-0)" }}>Notifications</b>
          {unreadCount > 0 && (
            <span style={{
              background: "var(--accent)", color: "var(--accent-fg)", fontSize: 10,
              fontWeight: 600, padding: "1px 6px", borderRadius: 4, fontFamily: "var(--font-mono)"
            }}>{unreadCount} new</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ border: 0, background: "transparent", fontSize: 11, color: "var(--accent)", cursor: "default", padding: 0 }}>
              Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button onClick={clearAll} style={{ border: 0, background: "transparent", fontSize: 11, color: "var(--fg-3)", cursor: "default", padding: 0 }}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {notifs.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-3)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 12 }}>All caught up! No notifications.</div>
          </div>
        ) : (
          notifs.map(n => (
            <div key={n.id} onClick={() => toggleRead(n.id)} style={{
              display: "flex", gap: 12, padding: "12px 14px", borderBottom: "1px solid var(--line)",
              background: n.read ? "transparent" : "rgba(255, 255, 255, 0.02)", cursor: "default",
              transition: "background 0.15s"
            }} className="notif-row">
              {/* Status Indicator */}
              <div style={{ marginTop: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span className="dot" style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: toneMap[n.level] || "var(--fg-3)",
                  boxShadow: `0 0 6px ${toneMap[n.level] || "transparent"}`
                }} />
              </div>

              {/* Text Meta */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <b style={{ fontSize: 12, color: n.read ? "var(--fg-2)" : "var(--fg-0)", fontWeight: n.read ? 500 : 600 }}>
                    {n.title}
                  </b>
                  <span style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 11.5, color: n.read ? "var(--fg-3)" : "var(--fg-2)", lineHeight: 1.4 }}>
                  {n.desc}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--fg-3)",
                    padding: "1px 5px", background: "var(--bg-2)", borderRadius: 3, border: "1px solid var(--line)"
                  }}>{n.category}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <button onClick={(e) => deleteNotif(n.id, e)} style={{
                  appearance: "none", border: 0, background: "transparent", color: "var(--fg-4)",
                  fontSize: 12, cursor: "default", padding: 4, borderRadius: 4
                }} className="notif-del">✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
