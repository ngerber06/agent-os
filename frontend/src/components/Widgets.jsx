import React from 'react';

// ─── Icons (Lucide-style 14px strokes) ───
export const Icon = {
  activity: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>),
  agents:   (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><circle cx="12" cy="8" r="3"/></svg>),
  projects: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="6" height="6" rx="1"/><rect x="3" y="14" width="6" height="6" rx="1"/><rect x="14" y="4" width="7" height="16" rx="1"/></svg>),
  spend:    (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>),
  brain:    (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1-2.5-2.5 2.5 2.5 0 0 1-1-4.78A2.5 2.5 0 0 1 4 7.5a2.5 2.5 0 0 1 3-2.45A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0 1-4.78A2.5 2.5 0 0 0 20 7.5a2.5 2.5 0 0 0-3-2.45A2.5 2.5 0 0 0 14.5 2Z"/></svg>),
  vps:      (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/><path d="M6 6h.01M6 18h.01"/></svg>),
  vault:    (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 4h16v16H4z"/><path d="M9 9h6v6H9z"/><path d="M4 9h2M4 15h2M18 9h2M18 15h2M9 4v2M15 4v2M9 18v2M15 18v2"/></svg>),
  chat:     (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  search:   (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  bell:     (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>),
  cog:      (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.16.66.42.86.74.21.32.32.69.32 1.06v.4a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  send:     (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg>),
  plus:     (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M12 5v14"/></svg>),
  cpu:      (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>),
  ram:      (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 8h20v8H2z"/><path d="M6 8v8M10 8v8M14 8v8M18 8v8"/></svg>),
  disk:     (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>),
  net:      (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>),
  chevron:  (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6"/></svg>),
  expand:   (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 17h10V7M7 7l10 10"/></svg>),
  collapse: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 17H7V7M17 7 7 17"/></svg>),
  close:    (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>),
  refresh:  (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>),
  filter:   (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></svg>),
  more:     (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>),
  attach:   (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m21.4 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.38a2 2 0 0 1-2.83-2.83l8.49-8.49"/></svg>),
  terminal: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>),
};

// ─── Sparkline ───
export function Sparkline({ data, color = "currentColor", height = 32, max, fill = true, smooth = true }) {
  const w = 100, h = 100;
  const m = max ?? Math.max(...data, 1);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - (v / m) * h]);
  let d;
  if (smooth) {
    d = pts.reduce((acc, [x, y], i) => {
      if (i === 0) return `M${x} ${y}`;
      const [px, py] = pts[i - 1];
      const cx = (px + x) / 2;
      return `${acc} Q${px} ${py} ${cx} ${(py + y) / 2} T${x} ${y}`;
    }, "");
  } else {
    d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  }
  const fillD = `${d} L${w} ${h} L0 ${h} Z`;
  const id = React.useId();
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillD} fill={`url(#g-${id})`} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Line chart with axis ticks ───
export function LineChart({ series, height = 160, color = "var(--accent)", labels = [], yFmt = (v) => v, max }) {
  const w = 600, h = 160;
  const padL = 36, padR = 8, padT = 8, padB = 18;
  const m = max ?? Math.max(...series, 1);
  const xW = w - padL - padR;
  const yH = h - padT - padB;
  const step = xW / (series.length - 1);
  const pts = series.map((v, i) => [padL + i * step, padT + yH - (v / m) * yH]);
  const d = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${acc} Q${px} ${py} ${cx} ${(py + y) / 2} T${x} ${y}`;
  }, "");
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => p * m);
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }}>
      {yTicks.map((t, i) => {
        const y = padT + yH - (t / m) * yH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text x={padL - 6} y={y + 3} fill="var(--fg-3)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">{yFmt(t)}</text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${pts[pts.length-1][0]} ${h - padB} L${padL} ${h - padB} Z`} fill="url(#lc-fill)" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {labels.length > 0 && labels.map((l, i) => (
        <text key={i} x={padL + (i * (xW / (labels.length - 1)))} y={h - 4}
              fill="var(--fg-3)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">{l}</text>
      ))}
    </svg>
  );
}

// ─── Bar chart (horizontal) ───
export function BarH({ items, formatV = (v) => v.toFixed(2) }) {
  const max = Math.max(...items.map((i) => i.v), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, idx) => (
        <div key={idx} style={{ display: "grid", gridTemplateColumns: "120px 1fr 64px", gap: 10, alignItems: "center", fontSize: "var(--font-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <i style={{ width: 8, height: 8, borderRadius: 2, background: it.color, flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
          </div>
          <div style={{ height: 6, background: "var(--bg-3)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(it.v / max) * 100}%`, background: it.color, borderRadius: 3 }} />
          </div>
          <div className="mono" style={{ color: "var(--fg-2)", textAlign: "right", fontSize: 11 }}>{formatV(it.v)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Donut (model spend share) ───
export function Donut({ items, size = 130, thickness = 18 }) {
  const r = size / 2;
  const inner = r - thickness;
  const total = items.reduce((s, i) => s + i.v, 0);
  let a0 = -Math.PI / 2;
  const arc = (a1, a2, color, key) => {
    const x1 = r + Math.cos(a1) * r, y1 = r + Math.sin(a1) * r;
    const x2 = r + Math.cos(a2) * r, y2 = r + Math.sin(a2) * r;
    const ix1 = r + Math.cos(a2) * inner, iy1 = r + Math.sin(a2) * inner;
    const ix2 = r + Math.cos(a1) * inner, iy2 = r + Math.sin(a1) * inner;
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return <path key={key} d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix1} ${iy1} A${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2} Z`} fill={color} />;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {items.map((it, idx) => {
        const a1 = a0;
        const a2 = a0 + (it.v / total) * Math.PI * 2;
        a0 = a2;
        return arc(a1, a2, it.color, idx);
      })}
      <circle cx={r} cy={r} r={inner - 2} fill="var(--bg-1)" />
    </svg>
  );
}

// ─── Gauge (radial usage %) ───
export function Gauge({ value, max = 100, label, sub, tone = "accent", size = 110 }) {
  const r = size / 2;
  const stroke = 8;
  const radius = r - stroke;
  const circ = Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  const colorVar = { accent: "var(--accent)", ok: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)" }[tone];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={r + 6} viewBox={`0 0 ${size} ${r + 6}`}>
        <path d={`M ${stroke} ${r} A ${radius} ${radius} 0 0 1 ${size - stroke} ${r}`}
              fill="none" stroke="var(--bg-3)" strokeWidth={stroke} strokeLinecap="round" />
        <path d={`M ${stroke} ${r} A ${radius} ${radius} 0 0 1 ${size - stroke} ${r}`}
              fill="none" stroke={colorVar} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${pct * circ} ${circ}`} />
        <text x={r} y={r - 4} fill="var(--fg-0)" fontSize="20" fontFamily="var(--font-mono)" fontWeight="500" textAnchor="middle">
          {Math.round(value)}
          <tspan fontSize="11" fill="var(--fg-3)">%</tspan>
        </text>
      </svg>
      <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      {sub && <div className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>{sub}</div>}
    </div>
  );
}

// ─── Live counter ───
export function LiveNumber({ value, format = (v) => v.toLocaleString(), interval = 1800, vary = 5 }) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setInterval(() => setV((prev) => prev + Math.floor(Math.random() * vary) + 1), interval);
    return () => clearInterval(id);
  }, [interval, vary]);
  return <span>{format(v)}</span>;
}

// ─── Live time ───
export function Clock({ tz = "UTC" }) {
  const [t, setT] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="mono">{t.toUTCString().slice(17, 25)} {tz}</span>;
}
