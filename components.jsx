/* Shared UI components and helpers */

const fmt = {
  usd: (n, opts={}) => {
    if (n === null || n === undefined) return "—";
    const abs = Math.abs(n);
    const sign = n < 0 ? "−" : "";
    if (opts.compact) {
      if (abs >= 1e9) return `${sign}$${(abs/1e9).toFixed(2)}B`;
      if (abs >= 1e6) return `${sign}$${(abs/1e6).toFixed(2)}M`;
      if (abs >= 1e3) return `${sign}$${(abs/1e3).toFixed(1)}K`;
    }
    const dec = opts.dec ?? 2;
    return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
  },
  num: (n, dec=2) => {
    if (n === null || n === undefined) return "—";
    const sign = n < 0 ? "−" : "";
    return `${sign}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
  },
  pct: (n, dec=2) => {
    if (n === null || n === undefined) return "—";
    const sign = n > 0 ? "+" : (n < 0 ? "−" : "");
    return `${sign}${Math.abs(n).toFixed(dec)}%`;
  },
  signedUsd: (n, opts={}) => {
    if (n === 0) return fmt.usd(0, opts);
    const sign = n > 0 ? "+" : "−";
    return `${sign}${fmt.usd(Math.abs(n), opts).replace('−','')}`;
  },
};

function classDelta(n) {
  if (n > 0) return "pms-pos";
  if (n < 0) return "pms-neg";
  return "";
}

function Delta({ value, suffix = "%", dec = 2, signed = true }) {
  const cls = value > 0 ? "pos" : value < 0 ? "neg" : "flat";
  const sign = signed ? (value > 0 ? "▲" : value < 0 ? "▼" : "—") : "";
  return (
    <span className={`pms-delta ${cls}`}>
      <span style={{fontSize:'8px'}}>{sign}</span>
      {Math.abs(value).toFixed(dec)}{suffix}
    </span>
  );
}

function RiskPill({ risk }) {
  const k = (risk||"").toLowerCase();
  return <span className={`pms-pill risk-${k}`}>{risk}</span>;
}

function VenueChip({ name }) {
  const k = (name||"").toLowerCase().replace(/[^a-z]/g,'');
  const initials = name.match(/[A-Z]/g)?.slice(0,2).join('') || name.slice(0,2).toUpperCase();
  return (
    <span className="pms-venue">
      <span className={`vchip ${k}`}>{initials}</span>
      {name}
    </span>
  );
}

function AssetChip({ sym }) {
  const k = (sym||"").toLowerCase();
  return (
    <span className="pms-asset">
      <span className={`achip ${k}`}>{sym.slice(0,3)}</span>
      {sym}
    </span>
  );
}

function BotStatusDot({ status }) {
  const cls = status === "killed" ? "killed" : status === "idle" ? "idle" : status === "warning" ? "warning" : "";
  const color = status === "killed" ? "var(--pms-neg)" : status === "warning" ? "var(--pms-warn)" : status === "idle" ? "var(--fg-3)" : "var(--pms-pos)";
  return (
    <span className="pms-bot-status" style={{color}}>
      <span className="dot" style={{background: color, boxShadow: status==='active' ? `0 0 8px ${color}` : 'none'}}></span>
      {status}
    </span>
  );
}

function MiniBar({ pct, color }) {
  return (
    <div className="pms-bar" style={{minWidth: 60}}>
      <span style={{
        width: `${Math.min(100, Math.max(0, pct))}%`,
        background: color || undefined,
      }}></span>
    </div>
  );
}

// Sparkline that works from a series of numbers
function Sparkline({ data, w = 80, h = 24, color, fill }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${(i*step).toFixed(1)},${(h - ((v-min)/range)*h).toFixed(1)}`);
  const path = `M ${points.join(' L ')}`;
  const stroke = color || (data[data.length-1] >= data[0] ? "var(--pms-pos)" : "var(--pms-neg)");
  const areaFill = fill ?? (data[data.length-1] >= data[0] ? "rgba(104,218,152,0.18)" : "rgba(255,112,114,0.18)");
  const areaPath = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width={w} height={h} className="pms-spark">
      <path d={areaPath} fill={areaFill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

// genenerated synthetic spark
function gensSpark(seed, len=24, trend=0) {
  const out = [];
  let v = 50;
  for (let i = 0; i < len; i++) {
    v += Math.sin((seed*0.3 + i)*0.7) * 4 + (Math.random()-0.5)*3 + trend;
    out.push(v);
  }
  return out;
}

// LineChart — bigger, with axes
function LineChart({ data, accessor=(d=>d.nav), height=240, color="var(--pms-accent)", fill="rgba(176,108,255,0.20)", showGrid=true, yLabels=4, xLabels }) {
  const W = 800; const H = height;
  const padL = 56, padR = 14, padT = 12, padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const values = data.map(accessor);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = innerW / (data.length - 1);
  const pts = data.map((d,i) => [padL + i*step, padT + innerH - ((accessor(d)-min)/range)*innerH]);
  const linePath = `M ${pts.map(p=>p.join(',')).join(' L ')}`;
  const areaPath = `${linePath} L ${padL+innerW},${padT+innerH} L ${padL},${padT+innerH} Z`;

  // y labels
  const yTicks = [];
  for (let i=0; i<=yLabels; i++) {
    const v = min + (range * i/yLabels);
    const y = padT + innerH - (i/yLabels)*innerH;
    yTicks.push({ y, label: fmt.usd(v, {compact:true}) });
  }
  // x labels (every 1/6 of the data)
  const xTicks = (xLabels || []).length ? xLabels : (() => {
    const n = 6;
    const ticks = [];
    for (let i=0;i<=n;i++) {
      const idx = Math.round((data.length-1) * i/n);
      const x = padL + idx*step;
      ticks.push({ x, label: data[idx]?.date?.slice(5) || "" });
    }
    return ticks;
  })();

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pms-chart" preserveAspectRatio="none">
      {showGrid && yTicks.map((t,i) => (
        <line key={i} x1={padL} x2={W-padR} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.05)" />
      ))}
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      {yTicks.map((t,i) => (
        <text key={i} x={padL-8} y={t.y+3} textAnchor="end" fill="var(--fg-muted)" fontSize="9" fontFamily="var(--pms-mono)">{t.label}</text>
      ))}
      {xTicks.map((t,i) => (
        <text key={i} x={t.x} y={H-8} textAnchor="middle" fill="var(--fg-muted)" fontSize="9" fontFamily="var(--pms-mono)">{t.label}</text>
      ))}
    </svg>
  );
}

// Donut chart
function Donut({ segments, size=140, thickness=22 }) {
  const r = size/2 - thickness/2;
  const c = size/2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const total = segments.reduce((s,x)=>s+x.value,0);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness}/>
      {segments.map((s, i) => {
        const len = (s.value/total) * C;
        const dasharray = `${len} ${C-len}`;
        const dashoffset = -offset;
        offset += len;
        return (
          <circle key={i} cx={c} cy={c} r={r} fill="none"
            stroke={s.color} strokeWidth={thickness}
            strokeDasharray={dasharray}
            strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${c} ${c})`}
          />
        );
      })}
    </svg>
  );
}

// Sortable table
function SortableTable({ columns, rows, initialSort, rowKey, dense=false, flashKeys, onRowClick }) {
  const [sort, setSort] = React.useState(initialSort || { key: null, dir: 'desc' });
  const sorted = React.useMemo(() => {
    if (!sort.key) return rows;
    const col = columns.find(c => c.key === sort.key);
    if (!col) return rows;
    const accessor = col.sortValue || col.value || (r => r[sort.key]);
    return [...rows].sort((a,b) => {
      const va = accessor(a); const vb = accessor(b);
      if (va === vb) return 0;
      if (typeof va === 'number') return sort.dir==='asc' ? va-vb : vb-va;
      return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [rows, sort, columns]);
  const toggle = (k) => {
    if (sort.key !== k) setSort({ key: k, dir: 'desc' });
    else setSort({ key: k, dir: sort.dir==='asc' ? 'desc' : 'asc' });
  };
  return (
    <div className="pms-table-wrap">
      <table className="pms-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} className={c.num ? 'num' : ''} onClick={() => toggle(c.key)} style={{width: c.width}}>
                {c.label}
                {sort.key === c.key && <span style={{marginLeft:4, opacity:0.6}}>{sort.dir==='asc'?'↑':'↓'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r,i) => (
            <tr key={rowKey ? rowKey(r) : i} className={flashKeys?.has(rowKey?.(r)) ? 'row-flash' : ''} onClick={()=>onRowClick?.(r)} style={{cursor: onRowClick?'pointer':'default'}}>
              {columns.map(c => (
                <td key={c.key} className={c.num ? 'num' : ''} style={{width: c.width}}>
                  {c.render ? c.render(r) : (c.value ? c.value(r) : r[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Simple Modal
function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="pms-modal-backdrop" onClick={onClose}>
      <div className="pms-modal" onClick={e=>e.stopPropagation()}>
        <div className="pms-modal-head">
          <h3>{title}</h3>
          <div className="spacer"></div>
          <button className="pms-icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="pms-modal-body">{children}</div>
        {footer && <div className="pms-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// Currency conversion (mock)
const CCY_RATES = { USD: 1, USDC: 1.0001, BTC: 1/67284.21 };
function ccyAdjust(usd, ccy) {
  const r = CCY_RATES[ccy] || 1;
  return usd * r;
}
function ccyFmt(usd, ccy) {
  if (ccy === 'BTC') {
    return `₿${(usd / 67284.21).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  }
  if (ccy === 'USDC') {
    return `${(usd*1.0001).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})} USDC`;
  }
  return fmt.usd(usd, { compact: usd >= 1e6 });
}

// Unified filter dropdown (status / venue / asset) with icon
const FILTER_ICONS = {
  status: <><circle cx="8" cy="8" r="6"/><path d="M5.5 8.5l1.8 1.8L10.8 6"/></>,
  venue:  <><rect x="2.5" y="3" width="11" height="10" rx="1"/><path d="M5 6h2M9 6h2M5 9h2M9 9h2"/></>,
  asset:  <><circle cx="8" cy="8" r="6"/><path d="M8 4.5v7M9.8 6c-.5-.5-1.2-.7-2-.7-1.2 0-2 .6-2 1.4S6.6 8 7.8 8.2s2 .6 2 1.4-.9 1.4-2 1.4c-.8 0-1.5-.2-2-.7"/></>,
};
function FilterDropdown({ icon, label, value, options, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [val, setVal] = React.useState(value);
  const cur = options.find(o => o.v === val) || options[0];
  const pick = (v) => { setVal(v); setOpen(false); onChange && onChange(v); };
  return (
    <div className="pms-fdrop">
      <button className={`pms-fdrop-btn ${val !== options[0].v ? 'active' : ''}`} onClick={() => setOpen(o => !o)}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">{FILTER_ICONS[icon]}</svg>
        <span className="lbl">{label}:</span>
        <span className="val">{cur.l}</span>
        <svg className="caret" width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4l3 3 3-3"/></svg>
      </button>
      {open && <>
        <div className="pms-fdrop-scrim" onClick={() => setOpen(false)}></div>
        <div className="pms-fdrop-menu">
          {options.map(o => (
            <button key={o.v} className={`pms-fdrop-opt ${o.v === val ? 'sel' : ''}`} onClick={() => pick(o.v)}>
              {o.l}{o.v === val && <span className="ck">✓</span>}
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}

// Unified filter toggle (switch) for boolean options
function FilterToggle({ label, checked, onChange }) {
  const [on, setOn] = React.useState(!!checked);
  const toggle = () => { const n = !on; setOn(n); onChange && onChange(n); };
  return (
    <button className={`pms-ftoggle ${on ? 'on' : ''}`} onClick={toggle} role="switch" aria-checked={on}>
      <span className="track"><span className="knob"></span></span>
      <span className="lbl">{label}</span>
    </button>
  );
}

Object.assign(window, {
  fmt, classDelta, Delta, RiskPill, VenueChip, AssetChip,
  BotStatusDot, MiniBar, Sparkline, gensSpark, LineChart, Donut,
  SortableTable, Modal, ccyAdjust, ccyFmt, CCY_RATES,
  FilterDropdown, FilterToggle,
});
