import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Widgets';

// ── Model catalogue (matches backend /api/chat/models) ─────────────────────
const AGENT_MODELS = {
  hermes: [{ id: "hermes-agent", label: "Hermes Agent", desc: "Local · VPS context" }],
  claude: [
    { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", desc: "Fast · 1M ctx" },
    { id: "anthropic/claude-opus-4-7", label: "Claude Opus 4.7", desc: "Most capable · 1M ctx" },
    { id: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5", desc: "Fastest · 200K ctx" },
  ],
  codex: [
    { id: "openai/gpt-4o", label: "GPT-4o", desc: "OpenAI flagship · 128K" },
    { id: "openai/o4-mini", label: "o4-mini", desc: "Fast reasoning · 200K" },
  ],
  gemini: [
    { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Google flagship · 1M ctx" },
    { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Fast · 1M ctx" },
  ],
};

const DEFAULT_MODEL = {
  hermes: "hermes-agent",
  claude: "anthropic/claude-sonnet-4-6",
  codex: "openai/gpt-4o",
  gemini: "google/gemini-2.5-pro",
};

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

export default function ChatDrawer({ open, onClose, onOpen, agentId, onPickAgent, position, agents = [] }) {
  const agent = agents.find(a => a.id === agentId) || agents[0] || {
    id: "hermes", name: "Hermes", model: "hermes-agent", color: "#f472b6", status: "active", dbId: null,
  };

  const [model, setModel] = useState(DEFAULT_MODEL[agent.id] || "hermes-agent");
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);

  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const effectivePos = position === "full" ? "full" : (fullscreen ? "full" : position);

  // ── Reset on agent switch ──────────────────────────────────────────────
  useEffect(() => {
    setModel(DEFAULT_MODEL[agent.id] || "hermes-agent");
    setActiveConvId(null);
    setMessages([]);
    loadConversations(agent.dbId);
  }, [agentId, agent.dbId]);

  // ── Scroll to bottom on new messages ─────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  // ── Focus input when opening ──────────────────────────────────────────
  useEffect(() => {
    if (open && taRef.current) setTimeout(() => taRef.current?.focus(), 300);
  }, [open]);

  // ── ESC closes ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === "Escape") fullscreen ? setFullscreen(false) : onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, fullscreen, onClose]);

  // ── Load conversation list for current agent ──────────────────────────
  const loadConversations = useCallback(async (agentDbId) => {
    try {
      const url = agentDbId ? `/api/conversations?agent_id=${agentDbId}` : "/api/conversations";
      const res = await fetch(url);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch { setConversations([]); }
  }, []);

  // ── Load messages for a conversation ─────────────────────────────────
  const selectConversation = async (convId) => {
    setActiveConvId(convId);
    setLoadingConv(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data.map(m => ({
        role: m.role,
        text: m.content,
        inputTokens: m.input_tokens,
        outputTokens: m.output_tokens,
        cost: m.cost,
      })) : []);
    } catch { setMessages([]); }
    setLoadingConv(false);
  };

  // ── Delete conversation ───────────────────────────────────────────────
  const deleteConversation = async (e, convId) => {
    e.stopPropagation();
    await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]); }
    await loadConversations(agent.dbId);
  };

  // ── Send message ─────────────────────────────────────────────────────
  const send = async () => {
    const t = draft.trim();
    if (!t || sending) return;
    setSending(true);
    setDraft("");

    setMessages(prev => [...prev, { role: "user", text: t }]);

    try {
      const resp = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_type: agent.id,
          agent_id: agent.dbId || null,
          model,
          conversation_id: activeConvId,
          content: t,
        }),
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
          // Handle metadata event (new conversation_id from server)
          if (line.startsWith("event: metadata")) continue;
          if (line.startsWith("data: ") && line.includes('"conversation_id"')) {
            try {
              const meta = JSON.parse(line.slice(6));
              if (meta.conversation_id && !activeConvId) {
                setActiveConvId(meta.conversation_id);
                // Refresh sidebar list
                loadConversations(agent.dbId);
              }
            } catch {}
            continue;
          }

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
              setMessages(prev => [...prev, { role: agent.id, text: accumulated }]);
            } else {
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...copy[copy.length - 1], text: accumulated };
                return copy;
              });
            }
          } catch { /* keepalive / tool events */ }
        }
      }
      if (!started) {
        setMessages(prev => [...prev, { role: agent.id, text: "(no response)" }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: agent.id, text: "Connection error — please try again.", error: true }]);
    }
    setSending(false);
  };

  const onKey = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const startNewChat = () => { setActiveConvId(null); setMessages([]); };

  // Group conversations by date
  const grouped = conversations.reduce((acc, c) => {
    const label = formatDate(c.updated_at || c.created_at);
    (acc[label] = acc[label] || []).push(c);
    return acc;
  }, {});

  return (
    <div className="chat-drawer" data-open={open ? "1" : "0"} data-pos={effectivePos}>
      <ChatHandle
        agent={agent} agents={agents} model={model}
        agentModels={AGENT_MODELS[agent.id] || []}
        onPickAgent={id => { onPickAgent(id); }}
        onPickModel={setModel}
        onClose={onClose} onOpen={onOpen} open={open}
        position={effectivePos} fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen(v => !v)}
      />
      <div className="chat-body">
        {/* ── Sidebar ── */}
        <ConvSidebar
          grouped={grouped}
          activeConvId={activeConvId}
          agent={agent}
          onSelect={selectConversation}
          onDelete={deleteConversation}
          onNew={startNewChat}
        />

        {/* ── Thread ── */}
        <div className="chat-thread">
          <div className="chat-msgs" ref={scrollRef}>
            {loadingConv && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>Loading…</div>
            )}
            {!loadingConv && messages.length === 0 && (
              <EmptyState agent={agent} model={model} />
            )}
            {!loadingConv && messages.map((m, i) => (
              <Message key={i} m={m} agent={agent} />
            ))}
            {sending && messages[messages.length - 1]?.role !== "user" && false && (
              <TypingIndicator agent={agent} />
            )}
          </div>
          <ChatInput
            value={draft} onChange={setDraft} onKey={onKey} onSend={send}
            agent={agent} textareaRef={taRef} sending={sending}
          />
        </div>
      </div>
    </div>
  );
}

// ── Chat handle with agent + model pickers ─────────────────────────────────
function ChatHandle({ agent, agents, model, agentModels, onPickAgent, onPickModel, onClose, onOpen, open, position, fullscreen, onToggleFullscreen }) {
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const handleClick = !open && position === "bottom" ? () => onOpen?.() : undefined;

  const modelLabel = agentModels.find(m => m.id === model)?.label || model.split("/").pop();

  return (
    <div className="chat-handle" onClick={handleClick} style={handleClick ? { cursor: "default" } : null}>
      <span className="grip" />

      {/* Agent picker */}
      <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
        <button className="btn" data-variant="ghost" onClick={() => { setShowAgentPicker(v => !v); setShowModelPicker(false); }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: agent.color, color: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700 }}>{agent.name[0]}</div>
          <span style={{ fontWeight: 500, color: "var(--fg-0)" }}>{agent.name}</span>
          <Icon.chevron style={{ opacity: 0.4 }} />
        </button>
        {showAgentPicker && (
          <Dropdown onClose={() => setShowAgentPicker(false)}>
            {agents.map(a => (
              <DropdownItem key={a.id} active={a.id === agent.id} onClick={() => { onPickAgent(a.id); setShowAgentPicker(false); }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: a.color, color: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{a.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "var(--fg-0)", fontSize: 12 }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{a.model}</div>
                </div>
                {a.status === "active" && <span className="live-dot" />}
              </DropdownItem>
            ))}
          </Dropdown>
        )}
      </div>

      {/* Model picker */}
      <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
        <button className="btn" data-variant="ghost" onClick={() => { setShowModelPicker(v => !v); setShowAgentPicker(false); }}
          style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)", padding: "4px 7px", gap: 4 }}>
          {modelLabel}
          <Icon.chevron style={{ opacity: 0.4, width: 10, height: 10 }} />
        </button>
        {showModelPicker && (
          <Dropdown onClose={() => setShowModelPicker(false)}>
            {agentModels.map(m => (
              <DropdownItem key={m.id} active={m.id === model} onClick={() => { onPickModel(m.id); setShowModelPicker(false); }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "var(--fg-0)", fontSize: 12 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{m.desc}</div>
                </div>
              </DropdownItem>
            ))}
          </Dropdown>
        )}
      </div>

      <span className="pill" data-tone={agent.status === "active" ? "ok" : "muted"}>
        <i className="dot" />{agent.status}
      </span>

      <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }} onClick={e => e.stopPropagation()}>
        <button className="icon-btn" onClick={onToggleFullscreen} title={fullscreen ? "Restore" : "Expand"}>
          {fullscreen ? <Icon.collapse /> : <Icon.expand />}
        </button>
        <button className="icon-btn" onClick={onClose}><Icon.close /></button>
      </div>
    </div>
  );
}

// ── Conversation sidebar ───────────────────────────────────────────────────
function ConvSidebar({ grouped, activeConvId, agent, onSelect, onDelete, onNew }) {
  return (
    <div className="chat-history">
      <div style={{ padding: 8 }}>
        <button className="btn" data-variant="primary" style={{ width: "100%", justifyContent: "center" }} onClick={onNew}>
          <Icon.plus />New chat
        </button>
      </div>
      {Object.entries(grouped).map(([label, convs]) => (
        <div key={label}>
          <div style={{ padding: "6px 10px 4px", fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 500 }}>{label}</div>
          {convs.map(c => (
            <div key={c.id} className="ch-item" data-active={activeConvId === c.id ? "1" : "0"}
              onClick={() => onSelect(c.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", cursor: "default", position: "relative" }}>
              <span className="swatch" style={{ background: agent.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.title}
              </div>
              <button onClick={e => onDelete(e, c.id)} style={{
                border: "none", background: "transparent", color: "var(--fg-4)", fontSize: 13,
                padding: "0 2px", cursor: "default", lineHeight: 1, flexShrink: 0,
                opacity: 0, transition: "opacity .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}>×</button>
            </div>
          ))}
        </div>
      ))}
      {Object.keys(grouped).length === 0 && (
        <div style={{ padding: "20px 10px", textAlign: "center", fontSize: 12, color: "var(--fg-4)" }}>
          No conversations yet
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ agent, model }) {
  const modelLabel = Object.values(AGENT_MODELS).flat().find(m => m.id === model)?.label || model.split("/").pop();
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "inline-flex", width: 52, height: 52, borderRadius: 12, background: agent.color, alignItems: "center", justifyContent: "center", color: "#0a0a0b", fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700 }}>
          {agent.name[0]}
        </div>
      </div>
      <div style={{ color: "var(--fg-1)", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{agent.name}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", marginBottom: 16 }}>{modelLabel}</div>
      <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Start a conversation — live connection to the VPS</div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────
function Message({ m, agent }) {
  const isUser = m.role === "user";
  return (
    <div className={isUser ? "msg user" : "msg"} style={m.error ? { opacity: 0.6 } : undefined}>
      <div className="av" style={{
        background: isUser ? "linear-gradient(135deg,#525252,#2a2a2a)" : agent.color,
        color: isUser ? "#fff" : "#0a0a0b",
      }}>
        {isUser ? "Y" : agent.name[0]}
      </div>
      <div className="body">
        <div className="who">
          <b>{isUser ? "You" : agent.name}</b>
          {!isUser && m.outputTokens > 0 && (
            <span style={{ marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)" }}>
              {m.inputTokens}↑ {m.outputTokens}↓ {m.cost > 0 ? `$${m.cost.toFixed(5)}` : ""}
            </span>
          )}
        </div>
        <div className="text">
          {renderContent(m.text || "")}
        </div>
        {m.tool && (
          <div className="tool-call"><Icon.terminal /><span>{m.tool}</span>{m.ok && <span className="ok">✓</span>}</div>
        )}
      </div>
    </div>
  );
}

// ── Content renderer (markdown-lite) ─────────────────────────────────────
function renderContent(text) {
  const lines = text.split("\n");
  const elements = [];
  let inCode = false;
  let codeLines = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        elements.push(<pre key={i} style={{ background: "var(--bg-3)", borderRadius: 6, padding: "8px 10px", fontSize: 11, fontFamily: "var(--font-mono)", overflowX: "auto", margin: "6px 0" }}><code>{codeLines.join("\n")}</code></pre>);
        inCode = false; codeLines = []; codeLang = "";
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (line === "") { elements.push(<div key={i} style={{ height: "0.5em" }} />); continue; }
    elements.push(<div key={i}>{renderInline(line)}</div>);
  }
  if (inCode && codeLines.length > 0) {
    elements.push(<pre key="code-final" style={{ background: "var(--bg-3)", borderRadius: 6, padding: "8px 10px", fontSize: 11, fontFamily: "var(--font-mono)", overflowX: "auto", margin: "6px 0" }}><code>{codeLines.join("\n")}</code></pre>);
  }
  return elements;
}

function renderInline(s) {
  const parts = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[1]) parts.push(<code key={parts.length} style={{ background: "var(--bg-3)", borderRadius: 3, padding: "1px 4px", fontSize: "0.9em", fontFamily: "var(--font-mono)" }}>{m[1].slice(1, -1)}</code>);
    else if (m[2]) parts.push(<strong key={parts.length}>{m[2].slice(2, -2)}</strong>);
    else if (m[3]) parts.push(<em key={parts.length}>{m[3].slice(1, -1)}</em>);
    last = re.lastIndex;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

// ── Typing indicator ──────────────────────────────────────────────────────
function TypingIndicator({ agent }) {
  return (
    <div className="msg">
      <div className="av" style={{ background: agent.color, color: "#0a0a0b" }}>{agent.name[0]}</div>
      <div className="body">
        <div className="who"><b>{agent.name}</b></div>
        <div className="text" style={{ color: "var(--fg-3)" }}>
          <span className="typing"><i /><i /><i /></span>
        </div>
      </div>
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────
function ChatInput({ value, onChange, onKey, onSend, agent, textareaRef, sending }) {
  return (
    <div className="chat-input">
      <textarea
        ref={textareaRef}
        placeholder={`Message ${agent.name}… (Enter to send, ⇧Enter for newline)`}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKey}
        rows={2}
        disabled={sending}
        style={sending ? { opacity: 0.6 } : undefined}
      />
      <div className="ci-tools">
        <button className="btn" data-variant="ghost"><Icon.attach />Attach</button>
        <button className="btn" data-variant="ghost"><Icon.brain />mem0</button>
        <button className="btn" data-variant="ghost"><Icon.vault />Vault</button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: sending ? "var(--ok)" : "var(--fg-4)", display: "flex", alignItems: "center", gap: 5 }}>
          {sending && <span className="live-dot" style={{ display: "inline-block" }} />}
          {sending ? "streaming" : "live"}
        </span>
        <button className="btn" data-variant="primary" onClick={onSend} disabled={sending}>
          <Icon.send />{sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

// ── Generic dropdown ──────────────────────────────────────────────────────
function Dropdown({ children, onClose }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 80,
      background: "var(--bg-2)", border: "1px solid var(--line-strong)", borderRadius: 8,
      boxShadow: "0 8px 30px rgba(0,0,0,0.5)", padding: 4, minWidth: 220,
    }} onMouseLeave={onClose}>
      {children}
    </div>
  );
}

function DropdownItem({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
      padding: "6px 8px", border: 0, borderRadius: 5, cursor: "default",
      background: active ? "var(--bg-3)" : "transparent", fontSize: 12,
    }}>
      {children}
    </button>
  );
}
