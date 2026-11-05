/* v3 UI kit — mirrors apps/pm-system/src/shared/{ui,components}. */
const { useState, useEffect, useRef, useMemo } = React;

const IC = {
  overview: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  strategies: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  list: 'M4 6h1M4 12h1M4 18h1M8 6h12M8 12h12M8 18h12',
  groups: 'M8 11a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6zM2 19c0-3 3-5 6-5s6 2 6 5M14 14.3c.6-.2 1.3-.3 2-.3 3 0 6 2 6 5',
  sync: 'M4 8h14l-3-3M20 16H6l3 3',
  check: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8 12.5l2.5 2.5L16 9.5',
  paid: 'M12 21a9 9 0 100-18 9 9 0 000 18zM14.8 9c-.5-.8-1.5-1.3-2.8-1.3-1.7 0-2.8.8-2.8 2s1.1 1.7 2.8 2 2.8.8 2.8 2-1.1 2-2.8 2c-1.3 0-2.4-.5-2.9-1.4M12 6v1.7M12 16.3V18',
  key: 'M14.5 10a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM13.5 12.5L21 20M18 17l2-2M16 15l1.5-1.5',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  bell: 'M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  east: 'M4 12h15M14 7l5 5-5 5',
  chevL: 'M15 6l-6 6 6 6', chevR: 'M9 6l6 6-6 6', chevD: 'M6 9l6 6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  shield: 'M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3zM9 12l2 2 4-4',
  logout: 'M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 16l-4-4 4-4M6 12h10',
  plus: 'M12 5v14M5 12h14', download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
};
function Icon({ n, className = '' }) {
  return <svg className={'ico ' + className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={IC[n]}></path></svg>;
}

const SquareTag = ({ tone, md, children, title }) => <span className={`sq ${tone ? 'sq--' + tone : ''} ${md ? 'sq--md' : ''}`} title={title}>{children}</span>;
const RoundTag = ({ tone = 'neutral', dot, sm, plain, children, title }) => <span className={`rt rt--${tone} ${sm ? 'rt--sm' : ''} ${plain ? 'rt--plain' : ''}`} title={title}>{dot && <span className="rt__dot"></span>}{children}</span>;
const StatusDot = ({ color, glow }) => <span className={`status-dot ${glow ? 'status-dot--glow' : ''}`} style={{ background: color, color }}></span>;
const ColorDot = ({ color }) => <span className="cdot" style={{ background: color }}></span>;
const ProgressBar = ({ value, color = '#36C2FF' }) => <div className="pbar"><i style={{ width: Math.max(0, Math.min(100, value)) + '%', background: color }}></i></div>;
const DeltaTag = ({ pct }) => { const t = pct > 0 ? 'pos' : pct < 0 ? 'neg' : ''; return <SquareTag tone={t} md>{pct > 0 ? '▲ ' : pct < 0 ? '▼ ' : ''}{Math.abs(pct).toFixed(1)}%</SquareTag>; };

function PmsButton({ variant = 'default', sm, disabled, reason, onClick, children, type = 'button' }) {
  const b = <button type={type} className={`btn btn--${variant} ${sm ? 'btn--sm' : ''}`} disabled={disabled || !!reason} onClick={onClick}>{children}</button>;
  return reason ? <span className="ph2" title={reason}>{b}</span> : b;
}

function Seg({ options, value, onChange }) {
  return <div className="seg">{options.map(o => { const v = o.v ?? o, l = o.l ?? o; return <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>; })}</div>;
}

function PmsTabs({ tabs, active, onChange }) {
  return <div className="pms-tabs" role="tablist">{tabs.map(t => (
    <button key={t.id} role="tab" className={`pms-tabs__item ${t.id === active ? 'on' : ''}`} onClick={() => onChange(t.id)}>{t.label}{t.badge && <span className={`tbadge tbadge--${t.badge.kind}`}>{t.badge.v}</span>}</button>
  ))}</div>;
}

function PmsCard({ title, meta, actions, flush, interactive, onClick, children, style }) {
  return <div className={`pms-card ${interactive ? 'pms-card--int' : ''}`} onClick={onClick} style={style}>
    {(title || meta || actions) && <div className="pms-card__head"><div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}><span className="pms-card__title">{title}</span>{meta && <span className="pms-card__meta">{meta}</span>}</div>{actions}</div>}
    <div className={`pms-card__body ${flush ? 'pms-card__body--flush' : ''}`}>{children}</div>
  </div>;
}

const KpiCard = ({ label, val, sub, featured, tone }) => <div className={`kpi ${featured ? 'kpi--featured' : ''}`}><p className="kpi__label">{label}</p><p className={`kpi__val ${tone ? 'kpi__val--' + tone : ''}`}>{val}</p>{sub !== undefined && <p className="kpi__sub">{sub}</p>}</div>;

function WidgetShell({ icon, title, tag, kpi, severity, onClick, children }) {
  return <article className={`ws ${severity ? 'ws--' + severity : ''} ${onClick ? 'ws--click' : ''}`} onClick={onClick}>
    <div className="ws__top"><div className="ws__title"><Icon n={icon}/><h2>{title}</h2>{tag}</div>{onClick && <span className="ws__open"><span>Open {title}</span><Icon n="east"/></span>}</div>
    <div className="ws__body">{kpi}{children}</div>
  </article>;
}
function WidgetKpi({ label, value, tone, percent }) {
  return <div className="wkpi"><div className="wkpi__label">{label}</div><div className="wkpi__row"><span className={`wkpi__val ${tone ? 'wkpi__val--' + tone : ''}`}>{value}</span>{percent !== undefined && percent !== null && <SquareTag tone={percent >= 0 ? 'pos' : 'neg'}>{percent >= 0 ? '▲' : '▼'} {Math.abs(percent)}%</SquareTag>}</div></div>;
}
const LineShell = ({ children }) => <li className="line">{children}</li>;

function PmsTable({ columns, rows, rowKey = 'id', onRow, empty = 'Nothing to show', subRows, foot, sort }) {
  const [s, setS] = useState(sort || null);
  let data = rows;
  if (s) { const c = columns.find(c => c.key === s.key); if (c) data = [...rows].sort((a, b) => { const x = c.sortVal ? c.sortVal(a) : a[c.key], y = c.sortVal ? c.sortVal(b) : b[c.key]; return (x > y ? 1 : x < y ? -1 : 0) * (s.dir === 'asc' ? 1 : -1); }); }
  return <div className="pt"><div className="pt__scroll"><table>
    <thead><tr>{columns.map((c, i) => <th key={i} className={c.num ? 'num' : c.center ? 'ctr' : ''} style={{ width: c.width, cursor: c.sortable ? 'pointer' : undefined }} onClick={c.sortable ? () => setS(p => ({ key: c.key, dir: p && p.key === c.key && p.dir === 'desc' ? 'asc' : 'desc' })) : undefined}>{c.label}{s && s.key === c.key ? (s.dir === 'desc' ? ' ↓' : ' ↑') : ''}</th>)}</tr></thead>
    <tbody>{data.length === 0 ? <tr><td colSpan={columns.length} className="pt__empty">{empty}</td></tr> : data.map((r, i) => <React.Fragment key={r[rowKey] ?? i}>
      <tr className={onRow ? 'click' : ''} onClick={onRow ? () => onRow(r) : undefined}>{columns.map((c, j) => <td key={j} className={`${c.num ? 'num' : c.center ? 'ctr' : ''} ${c.sans ? 'sans' : ''}`}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>
      {subRows && subRows(r)}
    </React.Fragment>)}</tbody>
  </table></div>{foot && <div className="pt__foot">{foot}</div>}</div>;
}

function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const cur = options.find(o => (o.v ?? o) === value) || options[0];
  return <div className="fd">
    <button className={`fd__btn ${value !== (options[0].v ?? options[0]) ? 'on' : ''}`} onClick={() => setOpen(o => !o)}><span>{label}:</span><b>{cur.l ?? cur}</b><Icon n="chevD" className="sm"/></button>
    {open && <><div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setOpen(false)}></div><div className="fd__menu">{options.map(o => <button key={o.v ?? o} className={`fd__opt ${(o.v ?? o) === value ? 'on' : ''}`} onClick={() => { onChange(o.v ?? o); setOpen(false); }}>{o.l ?? o}{(o.v ?? o) === value && <span>✓</span>}</button>)}</div></>}
  </div>;
}
const Switch = ({ label, checked, onChange }) => <span className={`sw ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><span className="sw__t"><i></i></span>{label}</span>;

function PmsModal({ open, title, onClose, children, foot, sm }) {
  if (!open) return null;
  return ReactDOM.createPortal(<div className="modal-bg" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className={`modal ${sm ? 'modal--sm' : ''}`}>
    <div className="modal__head"><h3 className="modal__title">{title}</h3><button className="modal__close" onClick={onClose}><Icon n="close"/></button></div>
    <div className="modal__body">{children}</div>{foot && <div className="modal__foot">{foot}</div>}
  </div></div>, document.body);
}
const Field = ({ label, req, hint, err, children }) => <label className="fld"><span className="fld__label">{label}{req && <span className="fld__req">*</span>}</span>{children}{err ? <span className="fld__err">{err}</span> : hint ? <span className="fld__hint">{hint}</span> : null}</label>;
const Input = ({ value, onChange, placeholder, prefix, suffix, type = 'text', mono }) => <div className="inp">{prefix && <span className="inp__fix">{prefix}</span>}<input type={type} value={value} placeholder={placeholder} className={mono ? 'mono' : ''} onChange={e => onChange(e.target.value)}/>{suffix && <span className="inp__fix">{suffix}</span>}</div>;
const Select = ({ value, onChange, options }) => <div className="inp"><select value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.v ?? o} value={o.v ?? o}>{o.l ?? o}</option>)}</select></div>;
const Textarea = ({ value, onChange, placeholder }) => <div className="inp"><textarea value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}></textarea></div>;

function TotpCodeInput({ value, onChange }) {
  const refs = useRef([]);
  const set = (i, ch) => { const d = value.split(''); d[i] = ch.replace(/\D/g, '').slice(-1); const v = d.join('').slice(0, 6); onChange(v); if (ch && i < 5) refs.current[i + 1]?.focus(); };
  return <div className="totp">{[0, 1, 2, 3, 4, 5].map(i => <input key={i} ref={el => refs.current[i] = el} value={value[i] || ''} onChange={e => set(i, e.target.value)} onKeyDown={e => e.key === 'Backspace' && !value[i] && i > 0 && refs.current[i - 1]?.focus()} inputMode="numeric"/>)}</div>;
}

function ActionsMenu({ items }) {
  const [open, setOpen] = useState(false);
  return <span className="amenu" onClick={e => e.stopPropagation()}>
    <button className="amenu__btn" onClick={() => setOpen(o => !o)}><Icon n="more"/></button>
    {open && <><div style={{ position: 'fixed', inset: 0, zIndex: 29 }} onClick={() => setOpen(false)}></div><div className="amenu__list">{items.filter(Boolean).map((it, i) => <button key={i} className={`amenu__it ${it.danger ? 'neg' : ''}`} disabled={!!it.reason} title={it.reason || ''} onClick={() => { setOpen(false); it.onClick && it.onClick(); }}>{it.label}</button>)}</div></>}
  </span>;
}

function TopicSection({ state = 'live', children, what = 'data' }) {
  const st = window.V3_STATE && window.V3_STATE !== 'live' ? window.V3_STATE : state;
  if (st === 'error') return <p className="ts-error" role="alert">Couldn’t load: socket closed before the snapshot arrived</p>;
  if (st === 'loading') return <div className="ts-load"><span className="spin"></span></div>;
  return children;
}

function PmsChart({ data, variant = 'line', color = '#B06CFF', height = 200, prev }) {
  const W = 600, H = height, P = 4;
  const vals = data.map(d => d.value);
  const all = prev ? vals.concat(prev.map(d => d.value)) : vals;
  const min = Math.min(...all, variant === 'bar' ? 0 : Infinity), max = Math.max(...all, variant === 'bar' ? 0 : -Infinity);
  const y = v => H - P - ((v - min) / (max - min || 1)) * (H - P * 2);
  const x = i => P + i * ((W - P * 2) / Math.max(1, data.length - 1));
  if (variant === 'bar') {
    const bw = (W - P * 2) / data.length * 0.7;
    return <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }}>
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.1)"/>
      {data.map((d, i) => { const cx = P + (i + 0.5) * ((W - P * 2) / data.length); return <rect key={i} x={cx - bw / 2} width={bw} y={Math.min(y(d.value), y(0))} height={Math.max(1, Math.abs(y(d.value) - y(0)))} rx="2" fill={d.value >= 0 ? '#68DA98' : '#FF7072'}><title>{d.date}: {fmtUsdCompact(d.value)}</title></rect>; })}
    </svg>;
  }
  const path = pts => pts.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' ');
  const gid = 'g' + Math.random().toString(36).slice(2, 7);
  return <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }}>
    <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {prev && <path d={path(prev)} fill="none" stroke="rgba(173,171,186,.5)" strokeDasharray="4 4" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>}
    <path d={`${path(data)} L${x(data.length - 1)},${H} L${x(0)},${H} Z`} fill={`url(#${gid})`}/>
    <path d={path(data)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
  </svg>;
}

// formatters (shared/utils)
const NO = '—';
const fmtUsd = (v, dec = 0) => v == null || isNaN(v) ? NO : (v < 0 ? '-' : '') + '$' + Math.abs(+v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtUsdCompact = v => { if (v == null || isNaN(v)) return NO; const a = Math.abs(+v), s = v < 0 ? '-' : ''; return a >= 1e9 ? `${s}$${(a / 1e9).toFixed(2)}B` : a >= 1e6 ? `${s}$${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${s}$${(a / 1e3).toFixed(1)}K` : `${s}$${a.toFixed(0)}`; };
const fmtSigned = v => v == null || isNaN(v) ? NO : (v > 0 ? '+' : '') + fmtUsdCompact(v);
const fmtCount = v => v == null ? NO : (+v).toLocaleString('en-US');
const fmtPct = (v, d = 2) => v == null ? NO : `${(+v).toFixed(d)}%`;
const tone = v => v > 0 ? 'pos' : v < 0 ? 'neg' : undefined;
const shortAddr = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : NO;
const fmtAge = sec => sec < 60 ? `${sec}s` : sec < 3600 ? `${Math.round(sec / 60)}m` : sec < 86400 ? `${Math.round(sec / 3600)}h` : `${Math.round(sec / 86400)}d`;
const STRAT_COLORS = ['var(--additional-purple-500)', 'var(--additional-orange-500)', 'var(--additional-sky-500)', 'var(--additional-mint-500)', 'var(--additional-yellow-500)', 'var(--additional-pink-500)'];
const stratColor = id => STRAT_COLORS[id % STRAT_COLORS.length];
const NOT_SERVED = 'Not served by the backend yet';

Object.assign(window, { Icon, SquareTag, RoundTag, StatusDot, ColorDot, ProgressBar, DeltaTag, PmsButton, Seg, PmsTabs, PmsCard, KpiCard, WidgetShell, WidgetKpi, LineShell, PmsTable, FilterDropdown, Switch, PmsModal, Field, Input, Select, Textarea, TotpCodeInput, ActionsMenu, TopicSection, PmsChart, NO, fmtUsd, fmtUsdCompact, fmtSigned, fmtCount, fmtPct, tone, shortAddr, fmtAge, stratColor, NOT_SERVED });
