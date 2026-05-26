import React, { useState, useEffect } from 'react';
import { AGENTS } from './api/data';
import { Icon, LiveNumber, Clock } from './components/Widgets';
import { TweaksPanel, TweakSection, TweakColor, TweakRadio } from './components/TweaksPanel';
import ChatDrawer from './components/ChatDrawer';
import NotificationPopover from './components/NotificationPopover';
import SettingsModal from './components/SettingsModal';
import { ActivityView, AgentsView, VPSView, fmtK } from './pages/views-main';
import { ProjectsView, SpendView, BrainView } from './pages/views-aux';

const TWEAK_DEFAULTS = {
  "accent": "violet",
  "density": "regular",
  "sidebar": "expanded",
  "hero": "activity",
  "chatPos": "bottom"
};

const ACCENT_MAP = {
  violet: { l: 0.7, c: 0.19, h: 290 },
  cyan:   { l: 0.78, c: 0.13, h: 200 },
  green:  { l: 0.74, c: 0.16, h: 150 },
  amber:  { l: 0.82, c: 0.16, h: 78 },
  pink:   { l: 0.72, c: 0.19, h: 0 },
  steel:  { l: 0.78, c: 0.04, h: 250 },
};

export default function App() {
  const [t, setTweak] = useState(TWEAK_DEFAULTS);
  const [view, setView] = useState("activity");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAgent, setChatAgent] = useState("claude");
  const [unreadCount, setUnreadCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Custom hook-like updates in page scope
  const setSingleTweak = (key, val) => {
    setTweak(prev => ({ ...prev, [key]: val }));
  };

  useEffect(() => {
    const a = ACCENT_MAP[t.accent] || ACCENT_MAP.violet;
    const root = document.documentElement;
    root.style.setProperty("--accent",      `oklch(${a.l} ${a.c} ${a.h})`);
    root.style.setProperty("--accent-soft", `oklch(${a.l} ${a.c} ${a.h} / 0.16)`);
    root.style.setProperty("--accent-line", `oklch(${a.l} ${a.c} ${a.h} / 0.35)`);
    root.style.setProperty("--accent-fg", a.l > 0.75 ? "#0a0a0b" : "#0a0a0b");
    root.setAttribute("data-density", t.density);
  }, [t.accent, t.density]);

  const openChat = (id) => {
    setChatAgent(id || "claude");
    setChatOpen(true);
  };

  const sidebarMode = t.sidebar === "rail" ? "rail" : t.sidebar === "hidden" ? "hidden" : "expanded";

  const viewMap = {
    activity: <ActivityView hero={t.hero} onOpenChat={openChat} />,
    agents:   <AgentsView onOpenChat={openChat} />,
    projects: <ProjectsView onOpenChat={openChat} />,
    spend:    <SpendView />,
    brain:    <BrainView onOpenChat={openChat} />,
    vps:      <VPSView />,
  };

  return (
    <div className="app" data-sidebar={sidebarMode}>
      <Sidebar view={view} onView={setView} onOpenChat={openChat} onOpenSettings={() => setShowSettings(true)} />
      <div className="main">
        <Topbar 
          view={view} 
          onOpenChat={() => setChatOpen((v) => !v)} 
          chatOpen={chatOpen} 
          unreadCount={unreadCount}
          showNotifications={showNotifications}
          onToggleNotifications={(val) => setShowNotifications(val !== undefined ? val : !showNotifications)}
          onUnreadChange={setUnreadCount}
        />
        <div className="content">
          {viewMap[view]}
          {t.chatPos === "bottom" && <div style={{ height: chatOpen ? 480 : 56, flexShrink: 0, transition: "height 0.28s cubic-bezier(.4,.7,.3,1)" }} />}
        </div>
        <ChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          onOpen={() => setChatOpen(true)}
          agentId={chatAgent}
          onPickAgent={setChatAgent}
          position={t.chatPos}
        />
        {!chatOpen && t.chatPos !== "bottom" && (
          <ChatFab onClick={() => setChatOpen(true)} pos={t.chatPos} />
        )}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent}
          options={[
            { value: "violet", label: "Violet" },
            { value: "cyan",   label: "Cyan" },
            { value: "green",  label: "Green" },
            { value: "amber",  label: "Amber" },
            { value: "pink",   label: "Pink" },
            { value: "steel",  label: "Steel" },
          ]}
          onChange={(v) => setSingleTweak('accent', typeof v === 'object' ? v.value : v)} />

        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={["compact", "regular", "comfy"]}
          onChange={(v) => setSingleTweak("density", v)} />
        <TweakRadio label="Sidebar" value={t.sidebar}
          options={["expanded", "rail", "hidden"]}
          onChange={(v) => setSingleTweak("sidebar", v)} />

        <TweakSection label="Dashboard hero" />
        <TweakRadio label="Widget" value={t.hero}
          options={[
            { value: "activity", label: "Activity" },
            { value: "vps",      label: "VPS" },
            { value: "spend",    label: "Spend" },
          ]}
          onChange={(v) => setSingleTweak("hero", v)} />

        <TweakSection label="Chat" />
        <TweakRadio label="Position" value={t.chatPos}
          options={[
            { value: "bottom",   label: "Bottom" },
            { value: "right",    label: "Right" },
            { value: "floating", label: "Float" },
            { value: "full",     label: "Full" },
          ]}
          onChange={(v) => setSingleTweak("chatPos", v)} />
      </TweaksPanel>

      <SettingsModal 
        open={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSave={(conf) => {
          console.log("Settings applied:", conf);
        }} 
      />
    </div>
  );
}

// ─── Sidebar ───
function Sidebar({ view, onView, onOpenChat, onOpenSettings }) {
  const items = [
    { id: "activity", label: "Activity",  icon: Icon.activity, badge: "14" },
    { id: "agents",   label: "Agents",    icon: Icon.agents,   badge: AGENTS.length },
    { id: "projects", label: "Projects",  icon: Icon.projects, badge: "12" },
    { id: "spend",    label: "Spend",     icon: Icon.spend },
    { id: "brain",    label: "AI Brain",  icon: Icon.brain },
    { id: "vps",      label: "VPS",       icon: Icon.vps },
  ];
  return (
    <div className="sidebar">
      <div className="sb-head">
        <div className="sb-logo" />
        <div className="sb-title">
          agent · OS
          <small>prod · v3.2.1</small>
        </div>
        <span className="sb-kbd">⌘K</span>
      </div>

      <div className="sb-section"><span>Workspace</span></div>
      <div className="sb-nav">
        {items.map((it) => {
          const I = it.icon;
          return (
            <button key={it.id} className="sb-item" data-active={view === it.id ? "1" : "0"} onClick={() => onView(it.id)}>
              <I />
              <span className="lbl">{it.label}</span>
              {it.badge && <span className="badge">{it.badge}</span>}
            </button>
          );
        })}
      </div>

      <div className="sb-section">
        <span>Agents</span>
        <span className="ct">{AGENTS.filter(a => a.status === "active").length}/{AGENTS.length}</span>
      </div>
      <div className="sb-nav">
        {AGENTS.map((a) => (
          <button key={a.id} className="sb-item" onClick={() => onOpenChat(a.id)}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: a.color, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#0a0a0b", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700 }}>{a.name[0]}</span>
            <span className="lbl">{a.name}</span>
            {a.status === "active" && <span className="dot" />}
            {a.status === "error" && <span className="dot" style={{ background: "var(--bad)", color: "var(--bad)" }} />}
          </button>
        ))}
      </div>

      <div className="sb-foot">
        <div className="sb-user">
          <div className="sb-avatar">FC</div>
          <div className="meta">
            <b>Felix C.</b>
            <span>owner · sso</span>
          </div>
          <button className="icon-btn" style={{ width: 24, height: 24, border: 0, background: "transparent" }} onClick={onOpenSettings}><Icon.cog /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Topbar ───
function Topbar({ view, onOpenChat, chatOpen, unreadCount, showNotifications, onToggleNotifications, onUnreadChange }) {
  const titles = {
    activity: "Activity",
    agents:   "Agents",
    projects: "Projects",
    spend:    "Spend",
    brain:    "AI Brain",
    vps:      "VPS",
  };
  return (
    <div className="topbar">
      <div className="crumbs">
        <span>agent-os</span>
        <span className="sep">/</span>
        <b>{titles[view]}</b>
        <span className="env">prod</span>
      </div>
      <div className="tb-stat">
        <span className="label">MTD</span>
        <b>$1,192.86</b>
        <span style={{ color: "var(--ok)" }}>▴</span>
      </div>
      <div className="tb-stat">
        <span className="label">tokens / 24h</span>
        <b><LiveNumber value={2_412_088} interval={1200} vary={250} format={fmtK} /></b>
      </div>
      <div className="tb-search">
        <Icon.search />
        <input placeholder="Search agents, projects, mem0…" />
        <span className="sb-kbd" style={{ marginLeft: "auto" }}>⌘K</span>
      </div>
      <div style={{ position: "relative" }}>
        <button className="icon-btn" onClick={() => onToggleNotifications()} style={showNotifications ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent-line)" } : null}>
          <Icon.bell />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: -2, right: -2, width: 8, height: 8,
              borderRadius: "50%", background: "var(--bad)", boxShadow: "0 0 4px var(--bad)"
            }} />
          )}
        </button>
        <NotificationPopover open={showNotifications} onClose={() => onToggleNotifications(false)} onUnreadChange={onUnreadChange} />
      </div>
      <button className="icon-btn" onClick={onOpenChat} style={chatOpen ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent-line)" } : null}>
        <Icon.chat />
      </button>
    </div>
  );
}

// ─── Floating chat FAB ───
function ChatFab({ onClick, pos }) {
  if (pos === "bottom") {
    return (
      <button onClick={onClick}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 44, padding: "0 16px",
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--bg-1)", border: 0, borderTop: "1px solid var(--line-strong)",
          color: "var(--fg-2)", cursor: "default", fontSize: 13,
          zIndex: 49,
        }}>
        <span style={{ width: 32, height: 3, background: "var(--fg-4)", borderRadius: 999, position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)" }} />
        <Icon.chat style={{ color: "var(--accent)", width: 16, height: 16 }} />
        <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>Open chat</span>
        <span style={{ color: "var(--fg-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>· 6 agents online · ctx 142K/200K</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
          <span className="live-dot" style={{ display: "inline-block", marginRight: 6, verticalAlign: 1 }} />stream open
        </span>
        <span className="sb-kbd">⌘J</span>
      </button>
    );
  }
  return (
    <button onClick={onClick}
      style={{
        position: "absolute", bottom: 24, right: 24,
        width: 48, height: 48, borderRadius: 24,
        background: "var(--accent)", color: "var(--accent-fg)",
        border: 0, display: "flex", alignItems: "center", justifycontent: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        cursor: "default", zIndex: 49,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      <Icon.chat style={{ width: 20, height: 20 }} />
    </button>
  );
}
