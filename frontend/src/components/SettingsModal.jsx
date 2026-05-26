import React, { useState } from 'react';
import { Icon } from './Widgets';
import { AGENTS as DEFAULT_AGENTS } from '../api/data';

export default function SettingsModal({ open, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState("general");
  const [profile, setProfile] = useState({
    name: "Felix C.",
    email: "felix.c@agentos.dev",
    role: "owner",
    sshKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPU4Lp+FpYwD... felix@macbook"
  });

  const [agents, setAgents] = useState(DEFAULT_AGENTS);

  const [keys, setKeys] = useState({
    openai: "sk-proj-••••••••••••••••••••••••",
    anthropic: "sk-ant-••••••••••••••••••••••••",
    gemini: "AIzaSy••••••••••••••••••••••••",
    localCli: "os-token-4f92-acc4-46e9-9ccd"
  });

  const [budget, setBudget] = useState({
    monthlyCeiling: 1500,
    warnPercent: 67,
    slackWebhook: ""
  });

  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave && onSave({ profile, agents, keys, budget });
      onClose();
    }, 800);
  };

  const handleAgentChange = (id, field, val) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
  };

  const tabs = [
    { id: "general", label: "General", icon: Icon.cog },
    { id: "agents", label: "Agent Configs", icon: Icon.agents },
    { id: "keys", label: "API Credentials", icon: Icon.key || Icon.vault },
    { id: "budget", label: "Alerts & Budgets", icon: Icon.spend },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(8, 8, 10, 0.78)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center"
    }} onClick={onClose}>
      
      {/* Container */}
      <div style={{
        width: 680, height: 480, background: "var(--bg-1)", border: "1px solid var(--line-strong)",
        borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        display: "flex", overflow: "hidden", fontFamily: "var(--font-sans)", color: "var(--fg-1)"
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Sidebar */}
        <div style={{
          width: 180, background: "var(--bg-2)", borderRight: "1px solid var(--line)",
          display: "flex", flexDirection: "column", padding: "12px 8px"
        }}>
          <div style={{ padding: "8px 12px 14px", fontSize: 13, fontWeight: 600, color: "var(--fg-0)" }}>
            System Settings
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            {tabs.map(t => {
              const TabIcon = t.icon || Icon.cog;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "7px 12px",
                  borderRadius: 6, border: 0, background: activeTab === t.id ? "var(--bg-3)" : "transparent",
                  color: activeTab === t.id ? "var(--fg-0)" : "var(--fg-2)", fontSize: 12,
                  textAlign: "left", cursor: "default"
                }}>
                  <TabIcon style={{ color: activeTab === t.id ? "var(--accent)" : "inherit" }} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "var(--fg-4)", padding: "12px", fontFamily: "var(--font-mono)" }}>
            agentOS · v3.2.1
          </div>
        </div>

        {/* Content Panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Body */}
          <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
            
            {/* General Tab */}
            {activeTab === "general" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <b style={{ fontSize: 14, color: "var(--fg-0)" }}>User Profile & SSH Keys</b>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "var(--fg-3)" }}>Full Name</label>
                  <input style={{
                    background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                    padding: "6px 10px", borderRadius: 6, fontSize: 12.5, outline: 0
                  }} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "var(--fg-3)" }}>Email Address</label>
                  <input style={{
                    background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                    padding: "6px 10px", borderRadius: 6, fontSize: 12.5, outline: 0
                  }} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "var(--fg-3)" }}>Authorized SSH Public Key (Deployments)</label>
                  <textarea rows={3} style={{
                    background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                    padding: "8px 10px", borderRadius: 6, fontSize: 11, outline: 0,
                    resize: "none", fontFamily: "var(--font-mono)", lineHeight: 1.4
                  }} value={profile.sshKey} onChange={(e) => setProfile({ ...profile, sshKey: e.target.value })} />
                </div>
              </div>
            )}

            {/* Agent Settings Tab */}
            {activeTab === "agents" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <b style={{ fontSize: 14, color: "var(--fg-0)" }}>Model Routers Configuration</b>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {agents.map(a => (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "8px 10px",
                      background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8
                    }}>
                      <div className="av" style={{
                        background: a.color, color: "#0a0a0b", width: 24, height: 24, borderRadius: 5,
                        display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700
                      }}>{a.name[0]}</div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-0)" }}>{a.name}</div>
                        <input style={{
                          background: "transparent", border: 0, padding: 0, color: "var(--fg-3)", fontSize: 11,
                          width: "100%", outline: 0
                        }} value={a.role} onChange={(e) => handleAgentChange(a.id, "role", e.target.value)} />
                      </div>

                      <select style={{
                        background: "var(--bg-3)", border: "1px solid var(--line-strong)",
                        borderRadius: 5, padding: "3px 6px", fontSize: 11.5, color: "var(--fg-1)", outline: 0
                      }} value={a.model} onChange={(e) => handleAgentChange(a.id, "model", e.target.value)}>
                        <option value="claude-sonnet-4.5">claude-sonnet-4.5</option>
                        <option value="claude-opus-4">claude-opus-4</option>
                        <option value="hermes-3-llama-3.1">hermes-3-llama-3.1</option>
                        <option value="code-davinci-002">code-davinci-002</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Credentials Tab */}
            {activeTab === "keys" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <b style={{ fontSize: 14, color: "var(--fg-0)" }}>External API Credentials</b>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>ANTHROPIC_API_KEY</label>
                    <input type="password" style={{
                      background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                      padding: "6px 10px", borderRadius: 6, fontSize: 12, outline: 0, fontFamily: "var(--font-mono)"
                    }} value={keys.anthropic} onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>GEMINI_API_KEY</label>
                    <input type="password" style={{
                      background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                      padding: "6px 10px", borderRadius: 6, fontSize: 12, outline: 0, fontFamily: "var(--font-mono)"
                    }} value={keys.gemini} onChange={(e) => setKeys({ ...keys, gemini: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>OPENAI_API_KEY</label>
                    <input type="password" style={{
                      background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                      padding: "6px 10px", borderRadius: 6, fontSize: 12, outline: 0, fontFamily: "var(--font-mono)"
                    }} value={keys.openai} onChange={(e) => setKeys({ ...keys, openai: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>AGENTOS_CLI_TOKEN (Local Auth)</label>
                    <input type="text" style={{
                      background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                      padding: "6px 10px", borderRadius: 6, fontSize: 12, outline: 0, fontFamily: "var(--font-mono)",
                      color: "var(--accent)"
                    }} value={keys.localCli} readOnly />
                  </div>
                </div>
              </div>
            )}

            {/* Budget & Alerts Tab */}
            {activeTab === "budget" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <b style={{ fontSize: 14, color: "var(--fg-0)" }}>Token Budgets & Escalation</b>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 11, color: "var(--fg-3)" }}>Monthly Spend Ceiling ($)</label>
                    <input type="number" style={{
                      background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                      padding: "6px 10px", borderRadius: 6, fontSize: 12.5, outline: 0
                    }} value={budget.monthlyCeiling} onChange={(e) => setBudget({ ...budget, monthlyCeiling: Number(e.target.value) })} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 11, color: "var(--fg-3)" }}>Alert Threshold (%)</label>
                    <input type="number" style={{
                      background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                      padding: "6px 10px", borderRadius: 6, fontSize: 12.5, outline: 0
                    }} value={budget.warnPercent} onChange={(e) => setBudget({ ...budget, warnPercent: Number(e.target.value) })} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, color: "var(--fg-3)" }}>Slack Alert Webhook Integration</label>
                  <input style={{
                    background: "var(--bg-2)", border: "1px solid var(--line-strong)",
                    padding: "6px 10px", borderRadius: 6, fontSize: 11.5, outline: 0, fontFamily: "var(--font-mono)"
                  }} value={budget.slackWebhook} onChange={(e) => setBudget({ ...budget, slackWebhook: e.target.value })} />
                </div>
              </div>
            )}

          </div>

          {/* Footer actions */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
            padding: "12px 20px", borderTop: "1px solid var(--line)", background: "var(--bg-2)"
          }}>
            <button className="btn" data-variant="ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn" data-variant="primary" onClick={handleSave} disabled={saving} style={{ minWidth: 100, justifyContent: "center" }}>
              {saving ? "Saving..." : "Apply Config"}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
