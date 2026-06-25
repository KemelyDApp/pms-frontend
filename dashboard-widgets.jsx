/* Dashboard widget primitives — stats-only situational-awareness surface.
   Each widget: one primary number + one trend. No action buttons. */

// ─── Shared bits ───────────────────────────────────────────────
const FRESH = 'live';

function TrendChip({ delta, unit = '%', good = 'up', compareOn, prevLabel }) {
  // good: 'up' (rising is good), 'down' (falling is good), 'neutral'
  if (delta == null || isNaN(delta)) return <span className="dash-trend flat">—</span>;
  const rising = delta > 0;
  const flat = Math.abs(delta) < 0.005;
  let tone = 'flat';
  if (!flat) {
    if (good === 'neutral') tone = 'info';
    else tone = (rising === (good === 'up')) ? 'pos' : 'neg';
  }
  const arrow = flat ? '–' : rising ? '▲' : '▼';
  const mag = unit === 'pp' ? Math.abs(delta).toFixed(2) + ' pp'
            : unit === 'abs' ? fmt.num(Math.abs(delta), 0)
            : unit === 'usd' ? fmt.usd(Math.abs(delta), { compact: true })
            : Math.abs(delta).toFixed(2) + '%';
  return (
    <span className={`dash-trend ${tone}`} title={prevLabel}>
      <span className="ar">{arrow}</span>{mag}
    </span>
  );
}

function WidgetShell({ label, desc, children, tone, span, wide, tall }) {
  return (
    <div className={`dash-w ${tone ? 'tone-' + tone : ''} ${wide ? 'wide' : ''} ${tall ? 'tall' : ''}`}>
      <div className="dash-w-head">
        <span className="dash-w-label">{label}</span>
      </div>
      {children}
      <div className="dash-w-foot">
        <span>updated {FRESH}</span>
        {span && <span className="dash-w-span">{span}</span>}
      </div>
    </div>
  );
}

// ─── Absolute / relative value widget ──────────────────────────
function StatWidget({ label, metric, format = 'num', desc, good = 'up', unit = '%', tone, span, compareOn, critical }) {
  const v = metric?.value ?? 0;
  let display;
  if (format === 'usd') display = fmt.usd(v, { compact: Math.abs(v) >= 1000 });
  else if (format === 'usd-full') display = fmt.usd(v);
  else if (format === 'pct') display = v.toFixed(2) + '%';
  else if (format === 'hours') display = v.toFixed(2) + 'h';
  else display = fmt.num(v, 0);

  const delta = unit === 'pp' ? metric?.deltaPP : (metric?.deltaPct ?? metric?.deltaAbs);
  const deltaUnit = unit === 'pp' ? 'pp' : (metric?.deltaPct != null ? '%' : 'abs');

  // critical tone: red when >0, green when 0
  let appliedTone = tone;
  if (critical) appliedTone = v > 0 ? 'crit' : 'ok';

  const prevLabel = metric?.prev != null
    ? `prev: ${format.startsWith('usd') ? fmt.usd(metric.prev, { compact: true }) : format === 'pct' ? metric.prev.toFixed(2) + '%' : fmt.num(metric.prev, 0)}`
    : null;

  return (
    <WidgetShell label={label} tone={appliedTone} span={span}>
      <div className="dash-w-value-row">
        <span className="dash-w-value">{display}</span>
        <TrendChip delta={delta} unit={deltaUnit} good={good} compareOn={compareOn} prevLabel={prevLabel}/>
      </div>
      {desc && <div className="dash-w-desc">{desc}</div>}
    </WidgetShell>
  );
}

// ─── Line chart widget (with compare) ──────────────────────────
function LineWidget({ label, series, prevSeries, compareOn, primary, trend, good = 'up', span, format = 'usd', desc }) {
  const W = 720, H = 116, PADL = 52, PADR = 10, PADT = 10, PADB = 18;
  const innerW = W - PADL - PADR, innerH = H - PADT - PADB;
  const all = compareOn ? [...series, ...(prevSeries || [])] : series;
  const min = Math.min(...all.map(d => d.value));
  const max = Math.max(...all.map(d => d.value));
  const range = max - min || 1;
  const xy = (arr) => arr.map((d, i) => [PADL + (i / Math.max(1, arr.length - 1)) * innerW, PADT + innerH - ((d.value - min) / range) * innerH]);
  const path = (pts) => pts.length ? `M ${pts.map(p => p.join(',')).join(' L ')}` : '';
  const cur = xy(series);
  const prev = compareOn && prevSeries?.length ? xy(prevSeries) : null;
  const yTicks = [0, 0.5, 1].map(f => ({ y: PADT + innerH - f * innerH, v: min + f * range }));

  return (
    <WidgetShell label={label} span={span} wide>
      <div className="dash-w-value-row">
        <span className="dash-w-value">{primary}</span>
        {trend != null && <TrendChip delta={trend} unit="%" good={good}/>}
      </div>
      {desc && <div className="dash-w-desc">{desc}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} className="dash-chart" preserveAspectRatio="none">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PADL} x2={W - PADR} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.05)"/>
            <text x={PADL - 6} y={t.y + 3} textAnchor="end" fontSize="9" fill="var(--fg-muted)" fontFamily="var(--pms-mono)">{fmt.usd(t.v, { compact: true })}</text>
          </g>
        ))}
        <path d={`${path(cur)} L ${PADL + innerW},${PADT + innerH} L ${PADL},${PADT + innerH} Z`} fill="rgba(176,108,255,0.12)"/>
        {prev && <path d={path(prev)} fill="none" stroke="var(--fg-3)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.5"/>}
        <path d={path(cur)} fill="none" stroke="var(--pms-accent)" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
      {compareOn && (
        <div className="dash-legend">
          <span><span className="ln cur"></span>{span}</span>
          <span><span className="ln prev"></span>prior {span}</span>
        </div>
      )}
    </WidgetShell>
  );
}

// ─── Horizontal bar widget (categories; compare = 2nd group) ───
function BarWidgetH({ label, data, compareOn, span, onBar, format = 'num', desc }) {
  const max = Math.max(...data.map(d => Math.max(d.value, compareOn ? (d.prev || 0) : 0)), 1);
  const fv = (v) => format === 'usd' ? fmt.usd(v, { compact: true }) : format === 'pct' ? v + '%' : fmt.num(v, 0);
  return (
    <WidgetShell label={label} span={span} wide>
      {desc && <div className="dash-w-desc" style={{ marginBottom: 8 }}>{desc}</div>}
      <div className="dash-barh">
        {data.map((d, i) => (
          <div className="dash-barh-row" key={i} onClick={() => onBar && onBar(d)} style={{ cursor: onBar ? 'pointer' : 'default' }}>
            <div className="dash-barh-label" title={d.label}>{d.label}</div>
            <div className="dash-barh-track">
              <div className="dash-barh-fill" style={{ width: (d.value / max * 100) + '%', background: d.color || 'var(--pms-accent)' }}></div>
              {compareOn && d.prev != null && (
                <div className="dash-barh-fill prev" style={{ width: (d.prev / max * 100) + '%' }}></div>
              )}
            </div>
            <div className="dash-barh-val pms-mono">{fv(d.value)}</div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ─── Vertical (time-series) bar widget; compare = 2nd group ────
function BarWidgetV({ label, series, prevSeries, compareOn, primary, trend, good = 'up', span, desc }) {
  const W = 720, H = 116, PADL = 52, PADR = 10, PADT = 10, PADB = 18;
  const innerW = W - PADL - PADR, innerH = H - PADT - PADB;
  const all = compareOn ? [...series, ...(prevSeries || [])] : series;
  const maxAbs = Math.max(...all.map(d => Math.abs(d.value)), 1);
  const yAt = v => PADT + innerH / 2 - (v / maxAbs) * (innerH / 2);
  const zero = yAt(0);
  const n = series.length;
  const slot = innerW / n;
  const bw = compareOn ? slot * 0.36 : slot * 0.7;

  return (
    <WidgetShell label={label} span={span} wide>
      <div className="dash-w-value-row">
        <span className="dash-w-value">{primary}</span>
        {trend != null && <TrendChip delta={trend} unit="usd" good={good}/>}
      </div>
      {desc && <div className="dash-w-desc">{desc}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} className="dash-chart" preserveAspectRatio="none">
        {[0.5, 1].map((f, i) => (
          <g key={i}>
            <line x1={PADL} x2={W - PADR} y1={PADT + innerH / 2 - f * innerH / 2} y2={PADT + innerH / 2 - f * innerH / 2} stroke="rgba(255,255,255,0.05)"/>
            <line x1={PADL} x2={W - PADR} y1={PADT + innerH / 2 + f * innerH / 2} y2={PADT + innerH / 2 + f * innerH / 2} stroke="rgba(255,255,255,0.05)"/>
          </g>
        ))}
        <line x1={PADL} x2={W - PADR} y1={zero} y2={zero} stroke="rgba(255,255,255,0.18)"/>
        {series.map((d, i) => {
          const x = PADL + i * slot + (slot - (compareOn ? bw * 2 + 2 : bw)) / 2;
          const y = d.value >= 0 ? yAt(d.value) : zero;
          const h = Math.abs(yAt(d.value) - zero);
          const pv = prevSeries?.[i]?.value ?? 0;
          return (
            <g key={i}>
              {compareOn && (
                <rect x={x} y={pv >= 0 ? yAt(pv) : zero} width={bw} height={Math.abs(yAt(pv) - zero)} fill="var(--fg-3)" opacity="0.4" rx="1"/>
              )}
              <rect x={compareOn ? x + bw + 2 : x} y={y} width={bw} height={Math.max(1, h)} fill={d.value >= 0 ? 'var(--pms-pos)' : 'var(--pms-neg)'} opacity="0.9" rx="1"/>
            </g>
          );
        })}
      </svg>
      {compareOn && (
        <div className="dash-legend">
          <span><span className="ln cur" style={{ background: 'var(--pms-pos)' }}></span>{span}</span>
          <span><span className="ln prev"></span>prior {span}</span>
        </div>
      )}
    </WidgetShell>
  );
}

// ─── Donut widget (total + segments; compare = inner ring) ─────
function DonutWidget({ label, segments, compareOn, prevSegments, totalFormat = 'usd', span, desc }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const size = 124, thick = 16, innerThick = 7, gap = 5;
  const r = size / 2 - thick / 2;
  const ri = size / 2 - thick - gap - innerThick / 2;
  const c = size / 2;
  const C = 2 * Math.PI * r, Ci = 2 * Math.PI * ri;
  let off = 0, offi = 0;
  const prevTotal = (prevSegments || segments).reduce((s, x) => s + x.value, 0);

  const totalDisplay = totalFormat === 'usd' ? fmt.usd(total, { compact: true }) : fmt.num(total, 0);

  return (
    <WidgetShell label={label} span={span} wide>
      {desc && <div className="dash-w-desc" style={{ marginBottom: 6 }}>{desc}</div>}
      <div className="dash-donut-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thick}/>
          {segments.map((s, i) => {
            const len = (s.value / total) * C;
            const el = <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={thick}
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform={`rotate(-90 ${c} ${c})`}/>;
            off += len; return el;
          })}
          {compareOn && (prevSegments || segments).map((s, i) => {
            const len = (s.value / prevTotal) * Ci;
            const el = <circle key={'p' + i} cx={c} cy={c} r={ri} fill="none" stroke={s.color} strokeWidth={innerThick} opacity="0.45"
              strokeDasharray={`${len} ${Ci - len}`} strokeDashoffset={-offi} transform={`rotate(-90 ${c} ${c})`}/>;
            offi += len; return el;
          })}
          <text x={c} y={c - 2} textAnchor="middle" fontSize="17" fontWeight="700" fill="var(--fg-1)" fontFamily="var(--pms-mono)">{totalDisplay}</text>
          <text x={c} y={c + 14} textAnchor="middle" fontSize="9" fill="var(--fg-3)" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>total</text>
        </svg>
        <div className="dash-donut-legend">
          {segments.map((s, i) => (
            <div key={i} className="dash-donut-leg-row">
              <span className="sw" style={{ background: s.color }}></span>
              <span className="lbl">{s.label}</span>
              <span className="val pms-mono">{fmt.usd(s.value, { compact: true })}</span>
              <span className="pct">{(s.value / total * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      {compareOn && <div className="dash-legend" style={{ marginTop: 4 }}><span><span className="ln cur" style={{ borderRadius: 2 }}></span>this {span}</span><span><span className="ln prev"></span>inner: prior {span}</span></div>}
    </WidgetShell>
  );
}

// ─── Table widget ──────────────────────────────────────────────
function TableWidget({ label, desc, columns, rows, span, onRow, sortNote, action }) {
  return (
    <div className="dash-w dash-w-table">
      <div className="dash-w-head">
        <span className="dash-w-label">{label}</span>
        {action
          ? <button className="dash-w-action" onClick={action.onClick}>{action.label}<span className="arr">→</span></button>
          : (sortNote && <span className="dash-w-sortnote">{sortNote}</span>)}
      </div>
      {desc && <div className="dash-w-desc" style={{ marginBottom: 4 }}>{desc}</div>}
      <div className="dash-table-scroll">
        <table className="pms-table dash-table">
          <thead>
            <tr>{columns.map((c, i) => <th key={i} className={c.num ? 'num' : ''}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} className="dash-empty">No items · healthy</td></tr>
            )}
            {rows.map((r, ri) => (
              <tr key={ri} onClick={() => onRow && onRow(r)} style={{ cursor: onRow ? 'pointer' : 'default' }}>
                {columns.map((c, ci) => <td key={ci} className={c.num ? 'num' : ''}>{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dash-w-foot"><span>updated {FRESH}</span>{span && <span className="dash-w-span">{span}</span>}</div>
    </div>
  );
}

// ─── Section + Group wrappers ──────────────────────────────────
// True masonry: distribute groups into the shortest column (no balancing voids).
// `full` groups break out to full width; single-item bands render full width.
function DistributeCols({ items, cols = 2 }) {
  if (items.length === 1) {
    return <div className="dash-band-full">{items[0]}</div>;
  }
  // Balance column heights: assign largest groups first into the shortest column
  // (LPT partition → minimal void), then render each column in original order.
  const indexed = items.map((it, i) => ({ it, i, h: it.props.h || 3 }));
  const order = [...indexed].sort((a, b) => b.h - a.h);
  const colArr = Array.from({ length: cols }, () => ({ h: 0, nodes: [] }));
  order.forEach(node => {
    const c = colArr.reduce((a, b) => (b.h < a.h ? b : a));
    c.nodes.push(node);
    c.h += node.h;
  });
  return (
    <div className="dash-band">
      {colArr.map((c, ci) => (
        <div key={ci} className="dash-band-col">
          {c.nodes.sort((a, b) => a.i - b.i).map(n => n.it)}
        </div>
      ))}
    </div>
  );
}

function DashMasonry({ children, cols = 2 }) {
  const arr = React.Children.toArray(children).filter(Boolean);
  const bands = [];
  let buf = [];
  const flush = () => { if (buf.length) { bands.push({ type: 'cols', items: buf }); buf = []; } };
  arr.forEach(ch => {
    if (ch.props && ch.props.full) { flush(); bands.push({ type: 'full', item: ch }); }
    else buf.push(ch);
  });
  flush();
  return (
    <>
      {bands.map((b, i) => b.type === 'full'
        ? <div key={i} className="dash-band-full">{b.item}</div>
        : <DistributeCols key={i} items={b.items} cols={cols}/>)}
    </>
  );
}

function DashSection({ id, num, title, purpose, tone, children, anchorRef }) {
  return (
    <section className={`dash-section ${tone ? 'tone-' + tone : ''}`} id={'dash-' + id} ref={anchorRef}>
      <div className="dash-section-head">
        <span className="dash-section-num">{num}</span>
        <h2>{title}</h2>
        <span className="dash-section-purpose">{purpose}</span>
        <span className="line"></span>
      </div>
      <div className="dash-section-body">{children}</div>
    </section>
  );
}

function DashCap({ children }) { return <div className="dash-cap">{children}</div>; }
function DashStrip({ children }) { return <div className="dash-strip">{children}</div>; }
function DashRow({ children }) { return <div className="dash-row">{children}</div>; }
function DashFull({ children }) { return <div className="dash-full">{children}</div>; }

// ─── Global controls bar ───────────────────────────────────────
function DashControls({ span, setSpan, compare, setCompare, lastUpdated, onRefresh }) {
  return (
    <div className="dash-controls">
      <div className="dash-controls-group">
        <label>Time span</label>
        <div className="pms-seg">
          {window.DASH_SPANS.map(s => (
            <button key={s} className={span === s ? 'active' : ''} onClick={() => setSpan(s)}>{s}</button>
          ))}
        </div>
      </div>
      <label className="dash-compare">
        <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)}/>
        Compare to previous period
      </label>
      <div className="dash-controls-fresh">
        <span className="dash-live"><span className="dot"></span>LIVE</span>
        <span className="pms-mono" title="Streaming over WebSocket">streaming · updated {lastUpdated}</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  TrendChip, StatWidget, LineWidget, BarWidgetH, BarWidgetV, DonutWidget,
  TableWidget, DashSection, DashCap, DashStrip, DashRow, DashFull, DashControls,
});
