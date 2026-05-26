import React from 'react';
import { AGENTS, VPS, CPU_SERIES, RAM_SERIES, NET_IN_SERIES, NET_OUT_SERIES, ACTIVITY, SPEND, agentById } from '../api/data';
import { Icon, Sparkline, LineChart, BarH, Donut, Gauge, LiveNumber, Clock } from '../components/Widgets';

export function fmt$(v) { return "$" + v.toFixed(2); }
export function fmtK(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return String(v);
}

// ─── Small reusable bits ───
export function CardHeader({ t, sub, action, pill }) {
  return (
    <div className="card-h">
      <div className="t">{t}</div>
      {pill}
      {sub && <div className="sub">{sub}</div>}
      {action && <div style={{ marginLeft: "auto" }}>{action}</div>}
    </div>
  );
}

export function Avatar({ a, size = 22 }) {
  return (
    <div className="av" style={{ width: size, height: size, background: a.color, color: "#0a0a0b", display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: size * 0.45, fontWeight: 600 }}>
      {a.name[0]}
    </div>
  );
}

export function StatusPill({ s }) {
  const map = { active: ["ok", "ACTIVE"], idle: ["muted", "IDLE"], error: ["bad", "ERROR"] };
  const [tone, label] = map[s] || ["muted", s];
  return <span className="pill" data-tone={tone}><i className="dot" />{label}</span>;
}

// ─── Activity row ───
export function ActivityRow({ a, onOpen, agents }) {
  const agent = (agents || AGENTS).find(x => x.id === a.agent) || AGENTS[0];
  return (
    <div className="act" onClick={() => onOpen && onOpen(agent.id)}>
      <i className="dot" data-tone={a.tone} />
      <div className="ts">{a.t}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Avatar a={agent} size={16} />
        <span className="who">{agent.name}</span>
      </div>
      <div className="what">{a.what}</div>
      <div className="tok">{fmtK(a.tokens)} tok</div>
    </div>
  );
}

// ─── Hero widget variants ───
export function HeroActivity({ onOpenChat, activities, agents }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column" }}>
      <CardHeader
        t="Live activity"
        pill={<span className="pill" data-tone="ok"><span className="live-dot" />stream open</span>}
        action={
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn" data-variant="ghost"><Icon.filter />Filter</button>
            <button className="btn" data-variant="ghost"><Icon.refresh />Tail</button>
          </div>
        }
      />
      <div style={{ flex: 1, overflowY: "auto", maxHeight: 360 }}>
        {(activities || ACTIVITY).map((a, i) => (
          <ActivityRow key={i} a={a} onOpen={onOpenChat} agents={agents} />
        ))}
      </div>
    </div>
  );
}

export function HeroVPS({ vpsStats, cpuSeries, ramSeries, netInSeries, netOutSeries }) {
  const cpu = vpsStats.cpu.usage;
  const ramPct = (vpsStats.ram.used / vpsStats.ram.total) * 100;
  const diskPct = (vpsStats.disk.used / vpsStats.disk.total) * 100;
  return (
    <div className="card">
      <CardHeader t={vpsStats.name}
        pill={<span className="pill" data-tone="ok"><i className="dot" />ONLINE</span>}
        sub={<span>{vpsStats.provider} · {vpsStats.plan} · {vpsStats.location}</span>} />
      <div className="card-b">
        <div className="grid g-4" style={{ gap: 12 }}>
          <Gauge value={cpu} label="CPU" sub={`${vpsStats.cpu.cores}c · ${vpsStats.cpu.model.split(" ").pop()}`} tone={cpu > 80 ? "bad" : cpu > 60 ? "warn" : "ok"} />
          <Gauge value={ramPct} label="RAM" sub={`${vpsStats.ram.used.toFixed(1)} / ${vpsStats.ram.total} GB`} tone={ramPct > 85 ? "bad" : "accent"} />
          <Gauge value={diskPct} label="Disk" sub={`${vpsStats.disk.used.toFixed(1)} / ${vpsStats.disk.total} GB`} tone="accent" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "var(--fg-3)" }}>NET IN</span>
              <span className="mono">{vpsStats.net.in.toFixed(1)} Mbps</span>
            </div>
            <Sparkline data={netInSeries} color="var(--info)" height={28} max={100} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "var(--fg-3)" }}>NET OUT</span>
              <span className="mono">{vpsStats.net.out.toFixed(1)} Mbps</span>
            </div>
            <Sparkline data={netOutSeries} color="var(--accent)" height={28} max={100} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSpend({ agents }) {
  return (
    <div className="card">
      <CardHeader t="Spend — month to date"
        action={<button className="btn" data-variant="ghost"><Icon.expand />Open</button>} />
      <div className="card-b" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>This month</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--fg-0)", fontWeight: 500 }}>${SPEND.monthToDate.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)" }}>
            of ${SPEND.monthBudget.toFixed(0)} budget · <span style={{ color: "var(--ok)" }}>59.6%</span>
          </div>
          <div className="bar" style={{ marginTop: 8 }}>
            <i style={{ width: `${(SPEND.monthToDate / SPEND.monthBudget) * 100}%`, background: "var(--accent)" }} />
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>BURN — last 7d</div>
            <Sparkline data={SPEND.burn7d} color="var(--accent)" height={36} />
            <div style={{ fontSize: 11, color: "var(--fg-2)" }}>
              <span className="mono">${SPEND.burn7d[SPEND.burn7d.length - 1].toFixed(2)}</span>
              <span style={{ color: "var(--fg-3)" }}> /day · </span>
              <span style={{ color: "var(--ok)" }}>+24%</span>
            </div>
          </div>
        </div>
        <BarH items={(agents || AGENTS).map(a => ({ id: a.id, name: a.name, color: a.color, v: a.spend })).sort((a, b) => b.v - a.v)} formatV={fmt$} />
      </div>
    </div>
  );
}

// ─── Right rail widgets ───
export function SystemHealth({ cpuUsage, loadAverage, ramUsed, ramTotal, diskUsed, diskTotal, uptime, connections, cpuHistory, ramHistory }) {
  return (
    <div className="card">
      <CardHeader t="System" pill={<Clock />} />
      <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: "var(--fg-3)" }}><Icon.cpu style={{ width: 11, height: 11, verticalAlign: -1 }} /> CPU</span>
            <span className="mono">{cpuUsage}% · load {loadAverage.join(", ")}</span>
          </div>
          <Sparkline data={cpuHistory} color="var(--accent)" height={26} max={100} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: "var(--fg-3)" }}><Icon.ram style={{ width: 11, height: 11, verticalAlign: -1 }} /> RAM</span>
            <span className="mono">{ramUsed.toFixed(1)}/{ramTotal}G</span>
          </div>
          <Sparkline data={ramHistory} color="var(--info)" height={26} max={100} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 4 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Uptime</div>
            <div className="mono" style={{ fontSize: 12 }}>{uptime}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Conns</div>
            <div className="mono" style={{ fontSize: 12 }}>{connections}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Disk</div>
            <div className="mono" style={{ fontSize: 12 }}>{diskUsed.toFixed(1)}/{diskTotal}G</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Region</div>
            <div className="mono" style={{ fontSize: 12 }}>EU-DE-1</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TokensThisHour({ agents }) {
  const total = (agents || AGENTS).reduce((s, a) => s + a.tokensIn + a.tokensOut, 0);
  return (
    <div className="card">
      <CardHeader t="Tokens · last 24h" sub="rolling" />
      <div className="card-b">
        <div className="stat" style={{ padding: 0 }}>
          <div className="v"><LiveNumber value={Math.floor(total / 30)} interval={1400} vary={120} /></div>
          <div className="delta" data-sign="+">+18.2% vs yesterday</div>
        </div>
        <div style={{ marginTop: 8 }}>
          <Sparkline data={Array.from({length: 40}, () => 30 + Math.random() * 70)} color="var(--accent)" height={42} max={120} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Input</div>
            <div className="mono" style={{ fontSize: 13, color: "var(--fg-1)" }}>{fmtK(Math.floor(total * 0.78))}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Output</div>
            <div className="mono" style={{ fontSize: 13, color: "var(--fg-1)" }}>{fmtK(Math.floor(total * 0.22))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentRoster({ onOpenChat, agents }) {
  const currentAgents = agents || AGENTS;
  return (
    <div className="card">
      <CardHeader t="Agents" sub={`${currentAgents.filter(a => a.status === "active").length}/${currentAgents.length} active`} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {currentAgents.map((a) => (
          <div key={a.id} onClick={() => onOpenChat(a.id)}
               style={{
                 display: "grid",
                 gridTemplateColumns: "auto 1fr auto",
                 gap: 10,
                 alignItems: "center",
                 padding: "9px 14px",
                 borderTop: "1px solid var(--line)",
                 cursor: "default",
                 fontSize: "var(--font-sm)"
               }}
               onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-2)"}
               onMouseLeave={(e) => e.currentTarget.style.background = ""}>
            <Avatar a={a} size={26} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "var(--fg-0)", fontSize: 12.5, fontWeight: 500 }}>{a.name}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.now}</div>
            </div>
            <StatusPill s={a.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity (home) view ───
export function ActivityView({ hero, onOpenChat, activities, agents }) {
  // VPS states local wire up for home widget
  const [vpsStats, setVpsStats] = React.useState(VPS);
  const [cpuHistory, setCpuHistory] = React.useState(CPU_SERIES);
  const [ramHistory, setRamHistory] = React.useState(RAM_SERIES);
  const [netInSeries, setNetInSeries] = React.useState(NET_IN_SERIES);
  const [netOutSeries, setNetOutSeries] = React.useState(NET_OUT_SERIES);

  React.useEffect(() => {
    const ws = new WebSocket("ws://localhost:8001/ws/metrics");
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setVpsStats(prev => ({
          ...prev,
          cpu: { usage: msg.cpu_pct, cores: prev.cpu.cores, model: prev.cpu.model, load: [msg.cpu_pct/50, msg.cpu_pct/60, msg.cpu_pct/70] },
          ram: { used: msg.ram_used_gb, total: msg.ram_total_gb },
          disk: { used: msg.disk_used_gb, total: msg.disk_total_gb },
          net: { in: msg.net_in || prev.net.in, out: msg.net_out || prev.net.out, conns: msg.connections },
          uptime: `${Math.floor(msg.uptime_seconds / 86400)}d ${Math.floor((msg.uptime_seconds % 86400) / 3600)}h`
        }));
        setCpuHistory(prev => [...prev.slice(1), msg.cpu_pct]);
        setRamHistory(prev => [...prev.slice(1), (msg.ram_used_gb / msg.ram_total_gb) * 100]);
        if (msg.net_in) setNetInSeries(prev => [...prev.slice(1), msg.net_in]);
        if (msg.net_out) setNetOutSeries(prev => [...prev.slice(1), msg.net_out]);
      } catch (err) {
        console.error("WS Metrics parsing error on home activity:", err);
      }
    };
    return () => ws.close();
  }, []);

  const HeroComp = {
    activity: () => <HeroActivity onOpenChat={onOpenChat} activities={activities} agents={agents} />,
    vps:      () => <HeroVPS vpsStats={vpsStats} cpuSeries={cpuHistory} ramSeries={ramHistory} netInSeries={netInSeries} netOutSeries={netOutSeries} />,
    spend:    () => <HeroSpend agents={agents} />
  }[hero] || (() => <HeroActivity onOpenChat={onOpenChat} activities={activities} agents={agents} />);

  const currentAgents = agents || AGENTS;
  return (
    <>
      <div className="grid g-4">
        <div className="card">
          <div className="stat">
            <div className="l">Active agents</div>
            <div className="v">{currentAgents.filter(a => a.status === "active").length}<small>/ {currentAgents.length}</small></div>
            <div className="delta">{currentAgents.filter(a => a.status === "idle").length} idle · {currentAgents.filter(a => a.status === "error").length} error</div>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div className="l">Tokens · today</div>
            <div className="v"><LiveNumber value={2412088} interval={900} vary={300} format={fmtK} /></div>
            <div className="delta" data-sign="+">+12.4%</div>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div className="l">Spend · today</div>
            <div className="v">$48.<span style={{ color: "var(--fg-3)" }}>92</span></div>
            <div className="delta" data-sign="+">$2.10 in last hour</div>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div className="l">VPS load · 1m</div>
            <div className="v">{vpsStats.cpu.load[0].toFixed(2)}</div>
            <div className="delta">{vpsStats.cpu.cores}c · {vpsStats.ram.total}G · {vpsStats.disk.total}G</div>
          </div>
        </div>
      </div>

      <div className="grid row-2">
        <HeroComp />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          <SystemHealth
            cpuUsage={vpsStats.cpu.usage}
            loadAverage={vpsStats.cpu.load}
            ramUsed={vpsStats.ram.used}
            ramTotal={vpsStats.ram.total}
            diskUsed={vpsStats.disk.used}
            diskTotal={vpsStats.disk.total}
            uptime={vpsStats.uptime}
            connections={vpsStats.net.conns}
            cpuHistory={cpuHistory}
            ramHistory={ramHistory}
          />
          <TokensThisHour agents={agents} />
        </div>
      </div>

      <AgentRoster onOpenChat={onOpenChat} agents={agents} />
    </>
  );
}

// ─── Agents view (API-backed Lifecycles) ───
export function AgentsView({ onOpenChat, agents, setAgents }) {
  const toggleAgentStatus = (agent) => {
    const action = agent.status === "active" ? "stop" : "start";
    if (agent.dbId) {
      fetch(`http://localhost:8001/api/agents/${agent.dbId}/${action}`, {
        method: "POST"
      })
        .then(res => res.json())
        .then(updatedDbAgent => {
          setAgents(prev => prev.map(localAgent => {
            if (localAgent.id === agent.id) {
              return { ...localAgent, status: updatedDbAgent.status };
            }
            return localAgent;
          }));
        })
        .catch(() => {
          // Local fallback toggle
          setAgents(prev => prev.map(localAgent => {
            if (localAgent.id === agent.id) {
              return { ...localAgent, status: agent.status === "active" ? "idle" : "active" };
            }
            return localAgent;
          }));
        });
    } else {
      // Local fallback toggle
      setAgents(prev => prev.map(localAgent => {
        if (localAgent.id === agent.id) {
          return { ...localAgent, status: agent.status === "active" ? "idle" : "active" };
        }
        return localAgent;
      }));
    }
  };

  const currentAgents = agents || AGENTS;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, color: "var(--fg-0)", fontWeight: 500, letterSpacing: "-0.01em" }}>Agents</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{currentAgents.length} agents · {currentAgents.filter(a=>a.status==="active").length} running on agent-os-prod-01</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => alert("Syncing agent runtimes...")}><Icon.refresh />Sync state</button>
          <button className="btn" data-variant="primary"><Icon.plus />New agent</button>
        </div>
      </div>
      <div className="grid g-3">
        {currentAgents.map((a) => (
          <div className="agent-card" key={a.id}>
            <div className="ah" style={{ cursor: "pointer" }} onClick={() => onOpenChat(a.id)}>
              <div className="av" style={{ background: a.color }}>{a.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="n">{a.name}</div>
                <div className="m">{a.role} · {a.model}</div>
              </div>
              <StatusPill s={a.status} />
            </div>
            <div className="now">{a.now}</div>
            <div className="meta">
              <div><span className="l">Msgs</span><span className="v">{fmtK(a.msgs)}</span></div>
              <div><span className="l">Spend</span><span className="v">${a.spend.toFixed(2)}</span></div>
              <div><span className="l">Uptime</span><span className="v">{a.uptime}</span></div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
              <button className="btn" data-variant="primary" style={{ flex: 1 }} onClick={() => onOpenChat(a.id)}><Icon.chat />Open chat</button>
              <button className="btn" style={{ flex: 1 }} onClick={() => toggleAgentStatus(a)}>
                <Icon.refresh style={a.status === "active" ? { color: "var(--bad)" } : { color: "var(--ok)" }} />
                {a.status === "active" ? "Stop" : "Start"}
              </button>
              <button className="btn" onClick={() => alert(`Managing config for ${a.name}`)}><Icon.cog /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── VPS view (WebSocket-backed Telemetry) ───
export function VPSView() {
  const [rebooting, setRebooting] = React.useState(false);
  const [sshOpen, setSshOpen] = React.useState(false);
  const [sshLogs, setSshLogs] = React.useState([
    "Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-45-generic x86_64)",
    " * Documentation:  https://help.ubuntu.com",
    " * Management:     https://landscape.canonical.com",
    " * Support:        https://ubuntu.com/pro",
    "",
    "Last login: Tue May 26 16:48:11 2026 from 198.51.100.42",
    "felix@agent-os-prod-01:~$ "
  ]);
  const [sshCommand, setSshCommand] = React.useState("");

  // Live WebSocket Metrics States
  const [vpsStats, setVpsStats] = React.useState(VPS);
  const [cpuSeries, setCpuSeries] = React.useState(CPU_SERIES);
  const [ramSeries, setRamSeries] = React.useState(RAM_SERIES);
  const [netInSeries, setNetInSeries] = React.useState(NET_IN_SERIES);
  const [netOutSeries, setNetOutSeries] = React.useState(NET_OUT_SERIES);

  React.useEffect(() => {
    if (rebooting) return;
    const ws = new WebSocket("ws://localhost:8001/ws/metrics");
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setVpsStats(prev => ({
          ...prev,
          cpu: { usage: msg.cpu_pct, cores: prev.cpu.cores, model: prev.cpu.model, load: [msg.cpu_pct/50, msg.cpu_pct/60, msg.cpu_pct/70] },
          ram: { used: msg.ram_used_gb, total: msg.ram_total_gb },
          disk: { used: msg.disk_used_gb, total: msg.disk_total_gb },
          net: { in: msg.net_in || prev.net.in, out: msg.net_out || prev.net.out, conns: msg.connections },
          uptime: `${Math.floor(msg.uptime_seconds / 86400)}d ${Math.floor((msg.uptime_seconds % 86400) / 3600)}h`
        }));
        setCpuSeries(prev => [...prev.slice(1), msg.cpu_pct]);
        setRamSeries(prev => [...prev.slice(1), (msg.ram_used_gb / msg.ram_total_gb) * 100]);
        if (msg.net_in) setNetInSeries(prev => [...prev.slice(1), msg.net_in]);
        if (msg.net_out) setNetOutSeries(prev => [...prev.slice(1), msg.net_out]);
      } catch (err) {
        console.error("WS Metrics parsing error in VPSView:", err);
      }
    };
    ws.onerror = () => {
      console.warn("WebSocket Metrics offline, using mock telemetry.");
    };
    return () => ws.close();
  }, [rebooting]);

  const handleReboot = () => {
    setRebooting(true);
    setTimeout(() => {
      setRebooting(false);
    }, 3000);
  };

  const handleSshSubmit = (e) => {
    e.preventDefault();
    const cmd = sshCommand.trim();
    if (!cmd) return;
    let response = `bash: ${cmd}: command not found (mock shell only)`;
    if (cmd === "ls") {
      response = "agent-os-api/  agent-os-web/  docker-compose.yml  Obsidian/";
    } else if (cmd === "top" || cmd === "ps") {
      response = "  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n 1042 felix     20   0 10.4g  1.2g  84.2m S   1.8   7.8   0:14.08 node\n 2104 postgres  20   0  2.1g 98.4m  44.1m S   0.0   0.6   0:00.09 postgres";
    }
    setSshLogs(prev => [
      ...prev,
      `felix@agent-os-prod-01:~$ ${cmd}`,
      cmd === "clear" ? "" : response,
      cmd === "clear" ? "" : "felix@agent-os-prod-01:~$ "
    ].filter(Boolean));
    if (cmd === "clear") {
      setSshLogs(["felix@agent-os-prod-01:~$ "]);
    }
    setSshCommand("");
  };

  const cpu = rebooting ? 0 : vpsStats.cpu.usage;
  const ramPct = rebooting ? 0 : (vpsStats.ram.used / vpsStats.ram.total) * 100;
  const diskPct = (vpsStats.disk.used / vpsStats.disk.total) * 100;
  const swapPct = rebooting ? 0 : (vpsStats.swap.used / vpsStats.swap.total) * 100;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, color: "var(--fg-0)", fontWeight: 500, letterSpacing: "-0.01em" }}>
            {vpsStats.name}
            {rebooting ? (
              <span className="pill" data-tone="warn" style={{ marginLeft: 10, verticalAlign: 3 }}><span className="live-dot" style={{ background: "var(--warn)" }} />REBOOTING</span>
            ) : (
              <span className="pill" data-tone="ok" style={{ marginLeft: 10, verticalAlign: 3 }}><i className="dot" />online</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
            {vpsStats.provider} · {vpsStats.plan} · {vpsStats.location} · uptime <span className="mono" style={{ color: "var(--fg-1)" }}>{rebooting ? "0s" : vpsStats.uptime}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setSshOpen(!sshOpen)} style={sshOpen ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent-line)" } : null}>
            <Icon.terminal />{sshOpen ? "Close SSH" : "SSH Terminal"}
          </button>
          <button className="btn" onClick={handleReboot} disabled={rebooting}>
            <Icon.refresh style={rebooting ? { animation: "spin 1s linear infinite" } : undefined} />
            {rebooting ? "Rebooting..." : "Reboot VPS"}
          </button>
          <button className="btn" onClick={() => alert("VPS agent manager config open")}><Icon.cog />Manage</button>
        </div>
      </div>

      {sshOpen && (
        <div className="card">
          <CardHeader t="Secure Shell (SSH) — Web Console" sub="ssh felix@agent-os-prod-01" />
          <div className="card-b" style={{ background: "#000", padding: 12, display: "flex", flexDirection: "column", gap: 8, height: 260 }}>
            <div style={{ flex: 1, overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ok)", lineHeight: 1.4 }}>
              {sshLogs.map((l, i) => <div key={i} style={{ whiteSpace: "pre-wrap" }}>{l}</div>)}
            </div>
            <form onSubmit={handleSshSubmit} style={{ display: "flex", gap: 8, borderTop: "1px solid var(--line-strong)", paddingTop: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ok)", marginTop: 5 }}>$</span>
              <input style={{
                flex: 1, background: "transparent", border: 0, outline: 0,
                color: "var(--ok)", fontFamily: "var(--font-mono)", fontSize: 11.5
              }} value={sshCommand} onChange={(e) => setSshCommand(e.target.value)} placeholder="Type command (e.g. ls, top, clear)..." />
            </form>
          </div>
        </div>
      )}

      {/* Specs + facts row */}
      <div className="grid g-4" style={rebooting ? { opacity: 0.3, transition: "opacity 0.3s" } : undefined}>
        <div className="card stat">
          <div className="l">vCPU</div>
          <div className="v">{vpsStats.cpu.cores}<small>cores</small></div>
          <div className="delta">{vpsStats.cpu.model}</div>
        </div>
        <div className="card stat">
          <div className="l">RAM</div>
          <div className="v">{rebooting ? 0 : vpsStats.ram.total}<small>GB</small></div>
          <div className="delta">{rebooting ? 0 : vpsStats.ram.used.toFixed(1)}GB used · {rebooting ? 0 : ramPct.toFixed(1)}%</div>
        </div>
        <div className="card stat">
          <div className="l">Disk</div>
          <div className="v">{vpsStats.disk.total}<small>GB NVMe</small></div>
          <div className="delta">{vpsStats.disk.used.toFixed(1)}GB used · {diskPct.toFixed(1)}%</div>
        </div>
        <div className="card stat">
          <div className="l">Bandwidth</div>
          <div className="v">∞<small>this month</small></div>
          <div className="delta">{rebooting ? 0 : (vpsStats.net.in + vpsStats.net.out).toFixed(1)} Mbps now</div>
        </div>
      </div>

      {/* CPU + RAM chart */}
      <div className="grid g-2" style={rebooting ? { opacity: 0.3, transition: "opacity 0.3s" } : undefined}>
        <div className="card">
          <CardHeader t="CPU usage" sub="last 30 min · 30s tick"
            pill={<span className="pill" data-tone={cpu > 80 ? "bad" : cpu > 60 ? "warn" : "ok"}><i className="dot"/>{cpu.toFixed(0)}%</span>} />
          <div className="card-b">
            <LineChart series={rebooting ? [0, 0, 0, 0] : cpuSeries} color="var(--accent)" max={100}
              labels={["30m","20m","10m","now"]} yFmt={(v) => `${Math.round(v)}%`} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, paddingTop: 10, borderTop: "1px solid var(--line)", marginTop: 10 }}>
              {vpsStats.cpu.load.map((l, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Load {["1m","5m","15m"][i]}</div>
                  <div className="mono" style={{ fontSize: 14, color: "var(--fg-1)" }}>{rebooting ? "0.00" : l.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <CardHeader t="Memory" sub="resident + swap"
            pill={<span className="pill" data-tone={ramPct > 85 ? "bad" : "info"}><i className="dot"/>{ramPct.toFixed(0)}%</span>} />
          <div className="card-b">
            <LineChart series={rebooting ? [0, 0, 0, 0] : ramSeries} color="var(--info)" max={100}
              labels={["30m","20m","10m","now"]} yFmt={(v) => `${Math.round(v)}%`} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingTop: 10, borderTop: "1px solid var(--line)", marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Resident</div>
                <div className="mono" style={{ fontSize: 14, color: "var(--fg-1)" }}>{rebooting ? "0.00" : vpsStats.ram.used.toFixed(2)} GB</div>
                <div className="bar" data-tone={ramPct > 85 ? "bad" : ""} style={{ marginTop: 5 }}><i style={{ width: `${ramPct}%` }} /></div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Swap</div>
                <div className="mono" style={{ fontSize: 14, color: "var(--fg-1)" }}>{rebooting ? "0.00" : vpsStats.swap.used.toFixed(2)} / {vpsStats.swap.total} GB</div>
                <div className="bar" style={{ marginTop: 5 }}><i style={{ width: `${swapPct}%` }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network + Disk + Info */}
      <div className="grid g-3" style={rebooting ? { opacity: 0.3, transition: "opacity 0.3s" } : undefined}>
        <div className="card">
          <CardHeader t="Network" sub="Mbps · 30 min" />
          <div className="card-b">
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "var(--info)" }}>● IN</span>
                <span className="mono">{rebooting ? "0.0" : vpsStats.net.in.toFixed(1)} Mbps</span>
              </div>
              <Sparkline data={rebooting ? [0, 0, 0] : netInSeries} color="var(--info)" height={38} max={120} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "var(--accent)" }}>● OUT</span>
                <span className="mono">{rebooting ? "0.0" : vpsStats.net.out.toFixed(1)} Mbps</span>
              </div>
              <Sparkline data={rebooting ? [0, 0, 0] : netOutSeries} color="var(--accent)" height={38} max={120} />
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--fg-3)" }}>
              Active TCP <span className="mono" style={{ color: "var(--fg-1)" }}>{rebooting ? "0" : vpsStats.net.conns}</span> · UDP <span className="mono" style={{ color: "var(--fg-1)" }}>{rebooting ? "0" : "14"}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <CardHeader t="Disk" sub="200 GB NVMe" />
          <div className="card-b">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "/", used: 52.1, total: 180, tone: "" },
                { name: "/var/lib/docker", used: 18.4, total: 50, tone: "warn" },
                { name: "/mnt/agent-data", used: 7.7, total: 100, tone: "" },
                { name: "/mnt/obsidian-vault", used: 1.2, total: 20, tone: "" },
              ].map((d) => {
                const p = (d.used / d.total) * 100;
                return (
                  <div key={d.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                      <span className="mono" style={{ color: "var(--fg-1)" }}>{d.name}</span>
                      <span className="mono" style={{ color: "var(--fg-3)" }}>{d.used.toFixed(1)} / {d.total} GB</span>
                    </div>
                    <div className="bar" data-tone={d.tone}><i style={{ width: `${p}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="card">
          <CardHeader t="Identity" />
          <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: "var(--font-sm)" }}>
            <Kv k="OS" v={vpsStats.os} />
            <Kv k="Kernel" v={vpsStats.kernel} />
            <Kv k="IPv4" v={vpsStats.ip4} mono />
            <Kv k="IPv6" v={vpsStats.ip6} mono />
            <Kv k="Region" v={vpsStats.location} />
            <Kv k="Datacenter" v="EU-DE-1 · de-fra-1" mono />
            <Kv k="Reverse DNS" v="agent-os.cloud.internal" mono />
          </div>
        </div>
      </div>

      {/* Process / log */}
      <div className="card">
        <CardHeader t="systemctl status agent-os.service" sub="live tail · journalctl -u agent-os" />
        <div className="card-b" style={{ padding: 0 }}>
          <div className="term" style={{ borderRadius: 0, border: 0, maxHeight: 200 }}>
            {rebooting ? (
              <div className="ln" data-tone="bad"><span className="t">-- rebooting systems --</span></div>
            ) : (
              <>
                <div className="ln"><span className="t">22:14:08</span><span data-tone="ok">●</span> agent-os.service: active (running) — main PID 1042 (node)</div>
                <div className="ln"><span className="t">22:14:08</span> ├─ <span style={{ color: "var(--fg-1)" }}>node /opt/agent-os/dist/server.js --cluster 4</span></div>
                <div className="ln"><span className="t">22:14:08</span> ├─ <span style={{ color: "var(--fg-1)" }}>node /opt/agent-os/dist/worker.js (×4)</span></div>
                <div className="ln"><span className="t">22:14:09</span> └─ <span style={{ color: "var(--fg-1)" }}>postgres -D /var/lib/postgresql/16</span></div>
                <div className="ln" data-tone="info"><span className="t">22:14:32</span> [router] dispatch hermes → runner.status (hermes) ✓ 12ms</div>
                <div className="ln" data-tone="ok"><span className="t">22:14:33</span> [scribe] mem.write 23 docs ✓ embed=412ms upsert=88ms</div>
                <div className="ln" data-tone="info"><span className="t">22:14:41</span> [claude] shell pnpm test → spawn pid=21044</div>
                <div className="ln" data-tone="warn"><span className="t">22:14:55</span> [codex] probe.ssh 198.51.100.42:22 econnrefused (3/3) — backing off 30s</div>
                <div className="ln" data-tone="info"><span className="t">22:15:02</span> [gemini] bq.job 9f1a72c started — slots=120</div>
                <div className="ln" data-tone="ok"><span className="t">22:15:18</span> [router] memo flush 412 events → mem0:bge-large</div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Kv({ k, v, mono }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, fontSize: 12 }}>
      <span style={{ color: "var(--fg-3)" }}>{k}</span>
      <span className={mono ? "mono" : ""} style={{ color: "var(--fg-1)" }}>{v}</span>
    </div>
  );
}
