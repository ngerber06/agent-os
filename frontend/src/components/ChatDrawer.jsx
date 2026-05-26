import React, { useState, useRef, useEffect } from 'react';
import { HISTORY } from '../api/data';
import { Icon } from './Widgets';

export default function ChatDrawer({ open, onClose, onOpen, agentId, onPickAgent, position, agents = [] }) {
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState([]);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  const agent = agents.find(a => a.id === agentId) || agents[0] || { id: "hermes", name: "Hermes", model: "hermes-agent", color: "#f472b6", status: "active" };
  const effectivePos = position === "full" ? "full" : (fullscreen ? "full" : position);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread, typing, open]);

  useEffect(() => {
    if (open && taRef.current) setTimeout(() => taRef.current?.focus(), 300);
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

  // Clear thread when switching agents
  useEffect(() => {
    setThread([]);
  }, [agentId]);

  const send = async () => {
    const t = draft.trim();
    if (!t || sending) return;
    setSending(true);
    setDraft("");

    // Build API messages from current thread + new user message
    const apiMessages = [
      ...thread
        .filter(m => m.text)
        .map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        })),
      { role: "user", content: t },
    ];

    setThread(prev => [...prev, { role: "user", text: t }]);
    setTyping(true);

    try {
      const resp = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentId, messages: apiMessages }),
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let started = false;
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            if (!delta) continue;
            accumulated += delta;
            if (!started) {
              started = true;
              setTyping(false);
              setThread(prev => [...prev, { role: agentId, text: accumulated }]);
            } else {
              setThread(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...copy[copy.length - 1], text: accumulated };
                return copy;
              });
            }
          } catch { /* partial json or keepalive */ }
        }
      }
      if (!started) setTyping(false);
    } catch (err) {
      console.error("Chat stream error:", err);
      setTyping(false);
      setThread(prev => [...prev, {
        role: agentId,
        text: "Connection error — Hermes may be busy. Try again.",
        error: true,
      }]);
    }
    setSending(false);
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
      <ChatHandle
        agent={agent}
        agents={agents}
        onPick={onPickAgent}
        onClose={onClose}
        position={effectivePos}
        fullscreen={fullscreen}
        open={open}
        onOpen={onOpen}
        onToggleFullscreen={() => setFullscreen(v => !v)}
      />
      <div className="chat-body">
        <ChatHistory agent={agent} history={history} activeId={activeConv} onPick={setActiveConv} onNew={() => setThread([])} />
        <div className="chat-thread">
          <div className="chat-msgs" ref={scrollRef}>
            {thread.length === 0 && !typing && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>
                  <span style={{ display: "inline-flex", width: 48, height: 48, borderRadius: 10, background: agent.color, alignItems: "center", justifyContent: "center", color: "#0a0a0b", fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700 }}>{agent.name[0]}</span>
                </div>
                <div style={{ color: "var(--fg-1)", fontWeight: 500, marginBottom: 4 }}>{agent.name}</div>
                <div>{agent.model} · live connection</div>
                <div style={{ marginTop: 16, color: "var(--fg-4)", fontSize: 12 }}>Start typing to chat</div>
              </div>
            )}
            {thread.map((m, i) => <Message key={i} m={m} agent={agent} />)}
            {typing && (
              <div className="msg">
                <div className="av" style={{ background: agent.color, color: "#0a0a0b" }}>{agent.name[0]}</div>
                <div className="body">
                  <div className="who"><b>{agent.name}</b> <span style={{ color: "var(--fg-4)" }}>·</span> {agent.model}</div>
                  <div className="text" style={{ color: "var(--fg-3)" }}>
                    <span className="typing"><i /><i /><i /></span>
                    <span style={{ marginLeft: 8, fontSize: 11 }}>thinking…</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <ChatInput value={draft} onChange={setDraft} onKey={onKey} onSend={send} agent={agent} textareaRef={taRef} sending={sending} />
        </div>
      </div>
    </div>
  );
}

function ChatHandle({ agent, agents, onPick, onClose, position, fullscreen, onToggleFullscreen, open, onOpen }) {
  const [openPick, setOpenPick] = useState(false);
  const handleClick = !open && position === "bottom" ? () => onOpen?.() : undefined;
  const stop = e => e.stopPropagation();

  return (
    <div className="chat-handle" onClick={handleClick} style={handleClick ? { cursor: "default" } : null}>
      <span className="grip" />
      <div style={{ position: "relative" }} onClick={stop}>
        <button className="btn" data-variant="ghost" onClick={() => setOpenPick(v => !v)}>
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
            {agents.map(a => (
              <button key={a.id} onClick={() => { onPick(a.id); setOpenPick(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                  padding: "6px 8px", border: 0, borderRadius: 5,
                  background: agent.id === a.id ? "var(--bg-3)" : "transparent",
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
          {(HISTORY[agent.id] || []).length} convs · live
        </span>
        <button className="icon-btn" onClick={onToggleFullscreen} title={fullscreen ? "Restore" : "Expand"}>
          {fullscreen ? <Icon.collapse /> : <Icon.expand />}
        </button>
        <button className="icon-btn" onClick={onClose}><Icon.close /></button>
      </div>
    </div>
  );
}

function ChatHistory({ agent, history, activeId, onPick, onNew }) {
  const byProject = history.reduce((acc, h) => {
    (acc[h.project] = acc[h.project] || []).push(h);
    return acc;
  }, {});
  const projectOrder = [];
  history.forEach(h => { if (!projectOrder.includes(h.project)) projectOrder.push(h.project); });
  const timeColor = { today: "var(--ok)", yest: "var(--info)", earlier: "var(--fg-4)" };

  return (
    <div className="chat-history">
      <div style={{ padding: 8 }}>
        <button className="btn" data-variant="primary" style={{ width: "100%", justifyContent: "center" }} onClick={onNew}>
          <Icon.plus />New chat with {agent.name}
        </button>
      </div>
      <div style={{ padding: "4px 9px 6px", fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 500, display: "flex", justifyContent: "space-between" }}>
        <span>Recent</span>
        <span className="mono" style={{ letterSpacing: 0, color: "var(--fg-4)", textTransform: "none" }}>{projectOrder.length}</span>
      </div>
      {projectOrder.map(proj => {
        const list = byProject[proj];
        return <ProjectGroup key={proj} project={proj} chats={list} activeId={activeId} onPick={onPick} timeColor={timeColor} agent={agent} />;
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
      <button className="proj-h" onClick={() => setOpen(v => !v)}>
        <Icon.chevron style={{ width: 10, height: 10, transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform .15s", color: "var(--fg-3)" }} />
        <span className="swatch" style={{ background: agent.color }} />
        <span className="lbl">{project}</span>
        <span className="ct">{chats.length}</span>
      </button>
      {open && chats.map(h => (
        <div key={h.id} className="ch-item proj-item" data-active={activeId === h.id ? "1" : "0"} onClick={() => onPick(h.id)}>
          <i className="t-dot" style={{ background: timeColor[h.t] }} />
          <div style={{ minWidth: 0, flex: 1 }}><b>{h.title}</b></div>
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
    <div className={isUser ? "msg user" : "msg"} style={m.error ? { opacity: 0.6 } : undefined}>
      <div className="av" style={{ background: isUser ? "linear-gradient(135deg,#525252,#2a2a2a)" : a.color, color: isUser ? "#fff" : "#0a0a0b" }}>
        {isUser ? "Y" : a.name[0]}
      </div>
      <div className="body">
        <div className="who">
          <b>{isUser ? "You" : a.name}</b>
          {!isUser && <> <span style={{ color: "var(--fg-4)" }}>·</span> {agent.model}</>}
        </div>
        <div className="text">
          {(m.text || "").split("\n").map((ln, i) => (
            <div key={i} style={{ minHeight: ln === "" ? "0.5em" : undefined }}>{renderInline(ln)}</div>
          ))}
        </div>
        {m.tool && (
          <div className="tool-call">
            <Icon.terminal /><span>{m.tool}</span>
            {m.ok && <span className="ok">✓</span>}
          </div>
        )}
        {m.code && <pre>{m.code}</pre>}
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

function ChatInput({ value, onChange, onKey, onSend, agent, textareaRef, sending }) {
  return (
    <div className="chat-input">
      <textarea
        ref={textareaRef}
        placeholder={`Message ${agent.name}…  (Enter to send, ⇧Enter for newline)`}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKey}
        rows={2}
        disabled={sending}
        style={sending ? { opacity: 0.6 } : undefined}
      />
      <div className="ci-tools">
        <button className="btn" data-variant="ghost"><Icon.attach />Attach</button>
        <button className="btn" data-variant="ghost"><Icon.terminal />Tool</button>
        <button className="btn" data-variant="ghost"><Icon.brain />mem0</button>
        <button className="btn" data-variant="ghost"><Icon.vault />Vault</button>
        <span className="hint" style={{ marginLeft: "auto" }}>
          {sending
            ? <span style={{ color: "var(--ok)", fontFamily: "var(--font-mono)", fontSize: 11 }}><span className="live-dot" style={{ display: "inline-block", marginRight: 6 }} />streaming</span>
            : <span>ctx <b style={{ color: "var(--fg-1)" }}>live</b></span>
          }
        </span>
        <button className="btn" data-variant="primary" onClick={onSend} disabled={sending}>
          <Icon.send />{sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
