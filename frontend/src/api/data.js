// Mock data — Agent OS

export const AGENTS = [
  {
    id: "hermes",
    name: "Hermes",
    role: "Runner & Orchestration",
    model: "hermes-3-llama-3.1",
    color: "#f472b6", // pink
    status: "active",
    now: "Orchestrating agent runners and pipeline sync",
    tokensIn: 8_420_133,
    tokensOut: 2_226_017,
    spend: 14.27,
    msgs: 2_402,
    uptime: "31d 4h",
  },
  {
    id: "claude",
    name: "Claude",
    role: "Research & Coding",
    model: "claude-sonnet-4.5",
    color: "#a78bfa", // violet
    status: "active",
    now: "Running unit tests for router v3 in agentOS/api",
    tokensIn: 42_188_902,
    tokensOut: 9_447_211,
    spend: 612.44,
    msgs: 28_770,
    uptime: "12d 19h",
  },
  {
    id: "codex",
    name: "Codex",
    role: "System Admin & Scripts",
    model: "code-davinci-002",
    color: "#34d399", // emerald
    status: "idle",
    now: "Waiting on cron triggers and task queues",
    tokensIn: 6_011_488,
    tokensOut: 2_120_004,
    spend: 92.18,
    msgs: 4_812,
    uptime: "47d 2h",
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "Multimodal & Analytics",
    model: "gemini-2.5-pro",
    color: "#60a5fa", // sky
    status: "active",
    now: "Analyzing repository metrics and telemetry data",
    tokensIn: 31_004_771,
    tokensOut: 5_998_312,
    spend: 287.91,
    msgs: 9_233,
    uptime: "8d 11h",
  }
];

export const VPS = {
  name: "agent-os-prod-01",
  provider: "Hostinger",
  plan: "KVM 4",
  location: "Frankfurt · EU-DE-1",
  ip4: "82.180.146.114",
  ip6: "2a02:4780:11:1a3b::1",
  os: "Ubuntu 24.04 LTS",
  kernel: "6.8.0-45-generic",
  uptime: "31d 4h 22m",
  cpu: { cores: 4, model: "AMD EPYC 7763", usage: 38, load: [0.84, 0.71, 0.62] },
  ram: { total: 16, used: 9.4 },        // GB
  disk: { total: 200, used: 78.2 },      // GB
  swap: { total: 2, used: 0.1 },
  net: { in: 142.3, out: 88.6, conns: 213 }, // Mbps + active TCP
  region_temp: 22,
};

const seedSeries = (base, vary, len = 60) => {
  let v = base;
  const out = [];
  for (let i = 0; i < len; i++) {
    v += (Math.random() - 0.5) * vary;
    v = Math.max(0, Math.min(100, v));
    out.push(+v.toFixed(1));
  }
  return out;
};

export const CPU_SERIES = seedSeries(38, 8);
export const RAM_SERIES = seedSeries(58, 3);
export const NET_IN_SERIES = seedSeries(60, 25);
export const NET_OUT_SERIES = seedSeries(35, 18);

const now = Date.now();
const tsAgo = (sec) => {
  const d = new Date(now - sec * 1000);
  return d.toTimeString().slice(0, 8);
};

export const ACTIVITY = [
  { t: tsAgo(4),    agent: "claude", tone: "info",   what: "test(unit) · ▶︎ pnpm test — agent-os/web",         tokens: 1240 },
  { t: tsAgo(12),   agent: "gemini",  tone: "info",   what: "edit · partnerships/q2-brief.md L84-L112",          tokens: 3120 },
  { t: tsAgo(28),   agent: "hermes", tone: "ok",     what: "query · orchestrating running subagents", tokens: 880 },
  { t: tsAgo(34),   agent: "codex", tone: "ok",     what: "cron · embedder check running backups",         tokens: 4012 },
  { t: tsAgo(58),   agent: "codex",   tone: "bad",    what: "probe.ssh · 198.51.100.42 — refused (3/3)",         tokens: 14   },
  { t: tsAgo(72),   agent: "claude", tone: "ok",     what: "git · pushed 7 commits → origin/feat/router-v3",    tokens: 220  },
  { t: tsAgo(101),  agent: "hermes",   tone: "warn",   what: "runner.warn · agent code-davinci response latency", tokens: 18   },
  { t: tsAgo(124),  agent: "gemini",  tone: "info",   what: "search · obsidian://Vault/Competitors",       tokens: 612  },
  { t: tsAgo(168),  agent: "gemini", tone: "ok",     what: "report.gen · weekly-retention.pdf (2.3MB)",         tokens: 5208 },
  { t: tsAgo(212),  agent: "codex", tone: "info",   what: "watch · Vault/Daily/2026-05-26.md changed",         tokens: 90   },
  { t: tsAgo(280),  agent: "claude", tone: "info",   what: "shell · docker compose up -d (3 services)",         tokens: 64   },
  { t: tsAgo(341),  agent: "gemini",  tone: "ok",     what: "draft · partnerships/q2-brief.md saved (4.1KB)",    tokens: 1840 },
  { t: tsAgo(412),  agent: "codex",   tone: "ok",     what: "probe.http · agentos.dev/health 200 (84ms)",        tokens: 8    },
  { t: tsAgo(498),  agent: "gemini", tone: "warn",   what: "warehouse · query > 30s, escalating to bigquery",   tokens: 1100 },
  { t: tsAgo(580),  agent: "hermes",   tone: "ok",     what: "notify.slack · deploy success — 3 channels",    tokens: 488  },
  { t: tsAgo(648),  agent: "codex", tone: "ok",     what: "mem.consolidate · 142 fragments → 38 summaries",    tokens: 11400 },
];

export const PROJECTS = [
  { id: "p1", title: "Agent-OS router v3", owner: "claude", lane: "doing", color: "#a78bfa", tags: ["infra", "p0"],   updated: "12m" },
  { id: "p2", title: "Q2 brief validation",owner: "gemini",  lane: "doing", color: "#60a5fa", tags: ["writing"],       updated: "4m"  },
  { id: "p3", title: "Retention dashboard", owner: "gemini", lane: "review",color: "#60a5fa", tags: ["data", "p1"],    updated: "1h"  },
  { id: "p4", title: "Mem0 → Obsidian sync",owner: "codex", lane: "doing", color: "#34d399", tags: ["brain"],         updated: "8m"  },
  { id: "p5", title: "Hermes Multi-Agent",   owner: "hermes",   lane: "doing",color: "#f472b6", tags: ["ops"],          updated: "2h"  },
  { id: "p6", title: "SSH probe replacement", owner: "codex", lane: "blocked",color: "#34d399", tags: ["ops", "p0"],    updated: "30s" },
  { id: "p7", title: "Vault graph weekly digest", owner: "codex", lane: "todo", color: "#34d399", tags: ["brain"],     updated: "1d"  },
  { id: "p8", title: "Cost guardrails per agent", owner: "hermes",  lane: "todo", color: "#f472b6", tags: ["meta"],     updated: "3h"  },
  { id: "p9", title: "Multi-model orchestration",   owner: "hermes",   lane: "todo", color: "#f472b6", tags: ["ops"],       updated: "2h"  },
  { id: "p10",title: "Migrate test runner → vitest",owner: "claude", lane: "done", color: "#a78bfa", tags: ["infra"],  updated: "1d"  },
  { id: "p11",title: "Daily note template v2",   owner: "codex", lane: "done",color: "#34d399", tags: ["brain"],      updated: "3d"  },
  { id: "p12",title: "Weekly retention.pdf gen", owner: "gemini", lane: "done",color: "#60a5fa", tags: ["data"],       updated: "5h"  },
];

// Chat history and threads are now stored in the DB — no mock data here.

export const SPEND = {
  monthToDate: 1006.8,
  monthBudget: 1500.0,
  burn7d: [128.4, 142.0, 161.3, 154.9, 168.2, 198.7, 212.4],
  burn30d: Array.from({ length: 30 }, (_, i) => 40 + Math.random() * 70 + i * 0.6),
  byAgent: AGENTS.map((a) => ({ id: a.id, name: a.name, color: a.color, v: a.spend })),
  byModel: [
    { name: "claude-sonnet-4.5", v: 612.44, share: 60.8, color: "#a78bfa" },
    { name: "gemini-2.5-pro",     v: 287.91, share: 28.6, color: "#60a5fa" },
    { name: "code-davinci-002",   v:  92.18, share:  9.2, color: "#34d399" },
    { name: "hermes-3-llama-3.1",  v:  14.27, share:  1.4, color: "#f472b6" },
  ],
  byProject: PROJECTS.slice(0, 6).map((p) => ({ name: p.title, v: 30 + Math.random() * 180, color: p.color })),
};

export const MEM0 = [
  { tag: "pref", body: "Prefers terse comparison tables over prose summaries.", agent: "claude", age: "3w" },
  { tag: "fact", body: "FastAPI server integration testing is set to run via vitest.", agent: "claude", age: "1w" },
  { tag: "fact", body: "Hostinger VPS — root only via key, no password. Fail2ban on 22, 3 strikes.", agent: "codex", age: "2w" },
  { tag: "rule", body: "Never push to main without green CI; force-push forbidden on origin.", agent: "claude", age: "1mo" },
  { tag: "pref", body: "Daily note template uses `## Open loops` and `## Done` — keep it.", agent: "codex", age: "2d" },
  { tag: "task", body: "Renew Tessera contact list — Olivia changed roles, route to Ben.", agent: "hermes", age: "5d" },
  { tag: "fact", body: "BigQuery slot pool: 200 on-demand, escalate after 30s local timeout.", agent: "gemini", age: "1w" },
  { tag: "rule", body: "Cost guard: kill any single run > $5 and notify before retry.", agent: "hermes", age: "3d" },
];

export const VAULT_RECENT = [
  { path: "Daily/2026-05-26.md", size: "1.2K", edited: "12m", agent: "codex" },
  { path: "Partnerships/Q2 brief.md", size: "4.1K", edited: "4m", agent: "gemini" },
  { path: "Research/Agent platforms — competitive.md", size: "8.7K", edited: "2h", agent: "gemini" },
  { path: "Ops/Hostinger runbook.md", size: "3.4K", edited: "1d", agent: "codex" },
  { path: "Data/Retention cohort SQL.md", size: "2.0K", edited: "1h", agent: "gemini" },
];

export const GRAPH = (() => {
  const groups = [
    { id: "partnerships", color: "#60a5fa", nodes: ["Q2 brief", "Nimbus", "Tessera", "Vermilion", "Pricing models", "Contacts/Olivia", "Onboarding email", "Launch memo"] },
    { id: "infra",        color: "#a78bfa", nodes: ["Router v3", "Vitest migration", "CI pipeline", "OTel spans", "Docker compose", "Deploy runbook"] },
    { id: "data",         color: "#60a5fa", nodes: ["Retention cohort", "Events.raw schema", "BigQuery slots", "Weekly report", "Kepler config"] },
    { id: "brain",        color: "#34d399", nodes: ["Daily template", "Mem0 sync", "Vault graph digest", "Bge-large embedder", "Tagging conventions"] },
    { id: "ops",          color: "#f472b6", nodes: ["Hostinger runbook", "SSH probe", "Fail2ban rules", "Backups"] },
    { id: "inbox",        color: "#f472b6", nodes: ["Triage labels v2", "Calendar OAuth", "Friday standup"] },
  ];
  const nodes = [];
  groups.forEach((g) => g.nodes.forEach((n) => nodes.push({ id: n, group: g.id, color: g.color, w: 4 + Math.random() * 7 })));
  const hubs = ["Q2 brief", "Router v3", "Retention cohort", "Daily template", "Hostinger runbook"];
  hubs.forEach((h) => { const n = nodes.find((x) => x.id === h); if (n) n.w = 12 + Math.random() * 4; });

  const edges = [];
  groups.forEach((g) => {
    for (let i = 0; i < g.nodes.length; i++) {
      for (let j = i + 1; j < Math.min(g.nodes.length, i + 3); j++) {
        edges.push([g.nodes[i], g.nodes[j]]);
      }
    }
  });
  const cross = [
    ["Q2 brief", "Retention cohort"], ["Q2 brief", "Vermilion"], ["Q2 brief", "Onboarding email"],
    ["Router v3", "OTel spans"], ["Router v3", "Deploy runbook"], ["Router v3", "Mem0 sync"],
    ["Retention cohort", "Weekly report"], ["Retention cohort", "Events.raw schema"],
    ["Daily template", "Mem0 sync"], ["Daily template", "Tagging conventions"], ["Daily template", "Q2 brief"],
    ["Hostinger runbook", "SSH probe"], ["Hostinger runbook", "Fail2ban rules"], ["Hostinger runbook", "Router v3"],
    ["Mem0 sync", "Bge-large embedder"], ["Mem0 sync", "Tagging conventions"],
    ["Calendar OAuth", "Friday standup"], ["Triage labels v2", "Calendar OAuth"],
    ["Pricing models", "Vermilion"], ["Pricing models", "Tessera"],
    ["Nimbus", "Pricing models"], ["Onboarding email", "Launch memo"],
  ];
  cross.forEach((e) => edges.push(e));
  return { nodes, edges, groups };
})();

export const DATA = {
  AGENTS, VPS, CPU_SERIES, RAM_SERIES, NET_IN_SERIES, NET_OUT_SERIES,
  ACTIVITY, PROJECTS, SPEND, MEM0, VAULT_RECENT, GRAPH
};

export const agentById = (id) => AGENTS.find((a) => a.id === id);
