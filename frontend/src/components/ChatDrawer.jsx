import React, { useState, useEffect, useRef } from 'react';
import { HISTORY, THREAD, AGENTS } from '../api/data';
import { Icon } from './Widgets';

export default function ChatDrawer({ open, onClose, onOpen, agentId, onPickAgent, position }) {
  const [activeConv, setActiveConv] = useState(null);
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState(THREAD);
  const [typing, setTyping] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const agent = AGENTS.find((a) => a.id === agentId) || AGENTS[0];

  const effectivePos = position === "full" ? "full" : (fullscreen ? "full" : position);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread, typing, open]);

  useEffect(() => {
    if (open && taRef.current) setTimeout(() => taRef.current.focus(), 300);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, fullscreen, onClose]);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    setThread((prev) => [...prev, { role: "user", text: t }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setThread((prev) => [...prev, {
        role: agent.id,
        tool: "vault.read · context.md (1.2KB)",
        ok: true,
        text: "Acknowledged. Routing to context. I'll pull the relevant section from the Vault and your last mem0 entry on the topic, then come back with a draft. Want me to keep the same structure as last time?"
      }]);
    }, 1100);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const history = HISTORY[agent.id] || [];

  return (
    <div className="chat-drawer" data-open={open ? "1" : "0"} data-pos={effectivePos}>
      <ChatHandle agent={agent} onPick={onPickAgent} onClose={onClose}
                  position={effectivePos} fullscreen={fullscreen}
                  open={open} onOpen={onOpen}
                  onToggleFullscreen={() => setFullscreen((v) => !v)} />
      <div className="chat-body">
        <ChatHistory agent={agent} history={history} activeId={activeConv} onPick={setActiveConv} />
        <div className="chat-thread">
          <div className="chat-msgs" ref={scrollRef}>
            {thread.map((m, i) => <Message key={i} m={m} agent={agent} />)}
            {typing && (
              <div className="msg">
                <div className="av" style={{ background: agent.color, color: "#0a0a0b" }}>{agent.name[0]}</div>
                <div className="body">
                  <div className="who"><b>{agent.name}</b> <span style={{ color: "var(--fg-4)" }}>·</span> {agent.model}</div>
                  <div className="text" style={{ color: "var(--fg-3)" }}>
                    <span className="typing"><i /><i /><i /></span>
                    <span style={{ marginLeft: 8, fontSize: 11 }}>thinking · tool_use · vault.search</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <ChatInput value={draft} onChange={setDraft} onKey={onKey} onSend={send} agent={agent} textareaRef={taRef} />
        </div>
      </div>
    </div>
  );
}

function ChatHandle({ agent, onPick, onClose, position, fullscreen, onToggleFullscreen, open, onOpen }) {
  const [openPick, setOpenPick] = useState(false);
  const handleClick = !open && position === "bottom" ? () => onOpen && onOpen() : undefined;
  const stop = (e) => e.stopPropagation();
  return (
    <div className="chat-handle" onClick={handleClick}
         style={handleClick ? { cursor: "default" } : null}>
      <span className="grip" />
      <div style={{ position: "relative" }} onClick={stop}>
        <button className="btn" data-variant="ghost" onClick={() => setOpenPick((v) => !v)}>
          <div className="av" style={{ background: agent.color, color: "#0a0a0b", width: 18, height: 18, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 }}>{agent.name[0]}</div>
          <span style={{ fontWeight: 500, color: "var(--fg-0)" }}>{agent.name}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{agent.model}</span>
          <Icon.chevron style={{ opacity: 0.5 }} />
        </button>
        {openPick && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 60,
            background: "var(--bg-2)", border: "1px solid var(--line-strong)", borderRadius: 8,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)", padding: 4, minWidth: 220,
          }} onMouseLeave={() => setOpenPick(false)}>
            {AGENTS.map((a) => (
              <button key={a.id} onClick={() => { onPick(a.id); setOpenPick(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                  padding: "6px 8px", border: 0, borderRadius: 5, background: agent.id === a.id ? "var(--bg-3)" : "transparent",
                  cursor: "default", fontSize: 12,
                }}>
                <div className="av" style={{ background: a.color, color: "#0a0a0b", width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 }}>{a.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "var(--fg-0)" }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{a.model}</div>
                </div>
                {a.status === "active" && <span className="live-dot" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="pill" data-tone={agent.status === "active" ? "ok" : agent.status === "error" ? "bad" : "muted"}>
        <i className="dot" />{agent.status}
      </span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }} onClick={stop}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
          {(HISTORY[agent.id] || []).length} convs · ctx 142K/200K
        </span>
        <button className="icon-btn" onClick={onToggleFullscreen} title={position === "full" ? "Restore" : "Expand to fullscreen"}>
          {position === "full" ? <Icon.collapse /> : <Icon.expand />}
        </button>
        <button className="icon-btn" onClick={onClose}><Icon.close /></button>
      </div>
    </div>
  );
}

function ChatHistory({ agent, history, activeId, onPick }) {
  const byProject = history.reduce((acc, h) => {
    (acc[h.project] = acc[h.project] || []).push(h);
    return acc;
  }, {});
  const projectOrder = [];
  history.forEach((h) => { if (!projectOrder.includes(h.project)) projectOrder.push(h.project); });
  const timeColor = { today: "var(--ok)", yest: "var(--info)", earlier: "var(--fg-4)" };

  return (
    <div className="chat-history">
      <div style={{ padding: 8 }}>
        <button className="btn" data-variant="primary" style={{ width: "100%", justifyContent: "center" }}>
          <Icon.plus />New chat with {agent.name}
        </button>
      </div>

      <div style={{ padding: "4px 9px 6px", fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 500, display: "flex", justifyContent: "space-between" }}>
        <span>Projects</span>
        <span className="mono" style={{ letterSpacing: 0, color: "var(--fg-4)", textTransform: "none" }}>{projectOrder.length}</span>
      </div>

      {projectOrder.map((proj) => {
        const list = byProject[proj];
        return (
          <ProjectGroup key={proj} project={proj} chats={list} activeId={activeId} onPick={onPick} timeColor={timeColor} agent={agent} />
        );
      })}

      <div style={{ padding: 8, marginTop: 4 }}>
        <button className="btn" data-variant="ghost" style={{ width: "100%", justifyContent: "center", color: "var(--fg-3)" }}>
          <Icon.search />Search all
        </button>
      </div>
    </div>
  );
}

function ProjectGroup({ project, chats, activeId, onPick, timeColor, agent }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="proj-group">
      <button className="proj-h" onClick={() => setOpen((v) => !v)}>
        <Icon.chevron style={{
          width: 10, height: 10,
          transform: open ? "rotate(0)" : "rotate(-90deg)",
          transition: "transform .15s",
          color: "var(--fg-3)",
        }} />
        <span className="swatch" style={{ background: agent.color }} />
        <span className="lbl">{project}</span>
        <span className="ct">{chats.length}</span>
      </button>
      {open && chats.map((h) => (
        <div key={h.id} className="ch-item proj-item"
          data-active={activeId === h.id ? "1" : "0"}
          onClick={() => onPick(h.id)}>
          <i className="t-dot" style={{ background: timeColor[h.t] }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <b>{h.title}</b>
          </div>
          <span>{h.when}</span>
        </div>
      ))}
    </div>
  );
}

function Message({ m, agent }) {
  const isUser = m.role === "user";
  const a = isUser ? { name: "You", color: "#525252" } : agent;
  return (
    <div className={isUser ? "msg user" : "msg"}>
      <div className="av" style={{ background: isUser ? "linear-gradient(135deg,#525252,#2a2a2a)" : a.color, color: isUser ? "#fff" : "#0a0a0b" }}>{isUser ? "Y" : a.name[0]}</div>
      <div className="body">
        <div className="who"><b>{isUser ? "You" : a.name}</b>{!isUser && <> <span style={{ color: "var(--fg-4)" }}>·</span> {agent.model}</>}</div>
        <div className="text">
          {m.text.split("\n").map((ln, i) => <div key={i} style={{ minHeight: ln === "" ? "0.5em" : undefined }}>{renderInline(ln)}</div>)}
        </div>
        {m.tool && (
          <div className="tool-call">
            <Icon.terminal /><span>{m.tool}</span>
            {m.ok && <span className="ok">✓</span>}
          </div>
        )}
        {m.code && (
          <pre>{m.code}</pre>
        )}
      </div>
    </div>
  );
}

function renderInline(s) {
  const parts = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[1]) parts.push(<code key={parts.length}>{m[1].slice(1, -1)}</code>);
    else if (m[2]) parts.push(<b key={parts.length} style={{ color: "var(--fg-0)" }}>{m[2].slice(2, -2)}</b>);
    last = re.lastIndex;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

function ChatInput({ value, onChange, onKey, onSend, agent, textareaRef }) {
  return (
    <div className="chat-input">
      <textarea
        ref={textareaRef}
        placeholder={`Message ${agent.name}…  (Enter to send, ⇧Enter for newline)`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        rows={2}
      />
      <div className="ci-tools">
        <button className="btn" data-variant="ghost"><Icon.attach />Attach</button>
        <button className="btn" data-variant="ghost"><Icon.terminal />Tool</button>
        <button className="btn" data-variant="ghost"><Icon.brain />mem0</button>
        <button className="btn" data-variant="ghost"><Icon.vault />Vault</button>
        <span className="hint" style={{ marginLeft: "auto" }}>ctx <b style={{ color: "var(--fg-1)" }}>142,408</b> / 200K</span>
        <button className="btn" data-variant="primary" onClick={onSend}>
          <Icon.send />Send
        </button>
      </div>
    </div>
  );
}
