import React, { useState } from 'react';
import { Icon } from './Widgets';

const COLORS = ["#f472b6","#a78bfa","#34d399","#60a5fa","#fb923c","#facc15","#f87171","#4ade80"];

const AGENT_TYPES = [
  { id: "hermes", label: "Hermes", desc: "Local VPS agent" },
  { id: "claude", label: "Claude", desc: "Anthropic via OpenRouter" },
  { id: "codex", label: "Codex / GPT", desc: "OpenAI via OpenRouter" },
  { id: "gemini", label: "Gemini", desc: "Google via OpenRouter" },
];

const MODEL_OPTIONS = {
  hermes: [{ id: "hermes-agent", label: "Hermes Agent" }],
  claude: [
    { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "anthropic/claude-opus-4-7", label: "Claude Opus 4.7" },
    { id: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5" },
  ],
  codex: [
    { id: "openai/gpt-4o", label: "GPT-4o" },
    { id: "openai/o4-mini", label: "o4-mini" },
  ],
  gemini: [
    { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ],
};

export default function AgentCreatorModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [agentType, setAgentType] = useState("claude");
  const [model, setModel] = useState("anthropic/claude-sonnet-4-6");
  const [color, setColor] = useState("#a78bfa");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleTypeChange = (t) => {
    setAgentType(t);
    setModel(MODEL_OPTIONS[t]?.[0]?.id || "");
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const initials = name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
      const resp = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          initials,
          model,
          agent_type: agentType,
          color,
          system_prompt: systemPrompt || null,
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const agent = await resp.json();
      onCreated?.(agent);
      setName(""); setSystemPrompt(""); setError("");
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-1)", border: "1px solid var(--line-strong)", borderRadius: 12,
        width: 480, maxWidth: "calc(100vw - 32px)", padding: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-0)" }}>New Agent</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>Create a custom AI agent</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.close /></button>
        </div>

        {/* Name */}
        <Field label="Name">
          <input
            style={inputStyle}
            placeholder="My Research Agent"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </Field>

        {/* Color */}
        <Field label="Color">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: 6, background: c, border: "none",
                outline: color === c ? "2px solid white" : "2px solid transparent",
                outlineOffset: 2, cursor: "default",
              }} />
            ))}
          </div>
        </Field>

        {/* Agent type */}
        <Field label="Agent type">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {AGENT_TYPES.map(t => (
              <button key={t.id} onClick={() => handleTypeChange(t.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                padding: "8px 10px", borderRadius: 7, border: "1px solid",
                borderColor: agentType === t.id ? "var(--accent)" : "var(--line-soft)",
                background: agentType === t.id ? "var(--accent-soft)" : "var(--bg-2)",
                cursor: "default", textAlign: "left",
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-0)" }}>{t.label}</span>
                <span style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 1 }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </Field>

        {/* Model */}
        <Field label="Model">
          <select style={selectStyle} value={model} onChange={e => setModel(e.target.value)}>
            {(MODEL_OPTIONS[agentType] || []).map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </Field>

        {/* System prompt */}
        <Field label="System prompt (optional)">
          <textarea
            style={{ ...inputStyle, height: 80, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 11 }}
            placeholder="You are a helpful assistant specialized in..."
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
          />
        </Field>

        {error && <div style={{ color: "var(--bad)", fontSize: 12, marginBottom: 12 }}>{error}</div>}

        {/* Preview + Submit */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0a0a0b", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700,
          }}>
            {name ? name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-0)" }}>{name || "Agent name"}</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{model}</div>
          </div>
          <button className="btn" data-variant="ghost" onClick={onClose} style={{ minWidth: 70 }}>Cancel</button>
          <button className="btn" data-variant="primary" onClick={handleSubmit} disabled={saving} style={{ minWidth: 80 }}>
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "var(--bg-2)", border: "1px solid var(--line-soft)",
  borderRadius: 7, padding: "7px 10px", color: "var(--fg-0)", fontSize: 13,
  outline: "none", fontFamily: "inherit",
};

const selectStyle = {
  ...inputStyle,
  appearance: "none", cursor: "default",
};
