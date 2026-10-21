/* Overview — one block per destination tab. Click a block → that tab.
   Blocks tagged with the span (1D/7D/…) respond to the time toggle;
   blocks tagged NOW are point-in-time. Blocks are hidden by role scope. */

const OV_ICONS = {
  layers: <><path d="M8 2l6 3-6 3-6-3 6-3z"/><path d="M2 8l6 3 6-3" opacity=".6"/><path d="M2 12l6 3 6-3" opacity=".4"/></>,
  list:   <><path d="M2 4h12M2 8h12M2 12h12"/></>,
  flow:   <><circle cx="3" cy="4" r="1.6"/><circle cx="3" cy="12" r="1.6"/><circle cx="13" cy="8" r="1.6"/><path d="M4.5 4.5C8 5 10 6.5 11.5 7.5M4.5 11.5C8 11 10 9.5 11.5 8.5"/></>,
  users:  <><circle cx="6" cy="6" r="2.4"/><path d="M2 14c0-2.4 1.8-4 4-4s4 1.6 4 4"/><circle cx="11.5" cy="5.5" r="1.8" opacity=".6"/><path d="M9.5 10.5c1-.8 2-1.2 3-1.2 1.6 0 3 1.2 3 3" opacity=".6"/></>,
  check:  <><circle cx="8" cy="8" r="6"/><path d="M5.5 8.5l2 2 3.5-4"/></>,
  coin:   <><circle cx="8" cy="8" r="6"/><path d="M8 4v8M10 5.5c-.6-.5-1.5-.8-2.5-.8-1.4 0-2.5.7-2.5 1.6S6.1 7.7 7.5 8s2.5.7 2.5 1.6-1.1 1.6-2.5 1.6c-1 0-1.9-.3-2.5-.8"/></>,
  bell:   <><path d="M3 11V7a5 5 0 0110 0v4l1.5 2H1.5L3 11zM6 14a2 2 0 004 0"/></>,
  trend:  <><path d="M2 12l4-4 3 3 5-6"/><path d="M11 5h3v3"/></>,
  key:    <><circle cx="5" cy="8" r="3"/><path d="M8 8h6M12 8v3M14 8v2"/></>,
  bolt:   <><path d="M9 1.5L3.5 9H8l-1 5.5L12.5 7H8l1-5.5z"/></>,
};

// ── Block shell ────────────────────────────────────────────────
function OvBlock({ icon, title, dest, time, span, onOpen, layout = 1, tone, children }) {
  // layout: 1 = single cell, 2 = two cells (wide), 3 = full row (strip)
  return (
    <section className={`ovb ${layout === 2 ? 'wide' : ''} ${layout === 3 ? 'strip' : ''} ${tone ? 'tone-' + tone : ''}`} onClick={onOpen} role="link" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onOpen(); }}>
      <header className="ovb-h">
        <svg className="ovb-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{OV_ICONS[icon]}</svg>
        <h3>{title}</h3>
        <span className={`ovb-time ${time ? 'on' : ''}`} title={time ? 'Follows the time toggle' : 'Point-in-time'}>{time ? span.toUpperCase() : 'NOW'}</span>
        <span className="ovb-open">Open {dest} →</span>
      </header>
      <div className="ovb-b">{children}</div>
    </section>
  );
}

function OvKpi({ label, value, tone, delta, deltaAbs, good = 'up', small }) {
  const showAbs = deltaAbs != null;
  return (
    <div className={`ovk ${small ? 'sm' : ''}`}>
      <div className="ovk-l">{label}</div>
      <div className="ovk-row">
        <span className={`ovk-v ${tone || ''}`}>{value}</span>
        {showAbs
          ? <span className={`ovk-d ${deltaAbs >= 0 ? 'pms-pos' : 'pms-neg'}`}>{fmt.signedUsd(deltaAbs, { compact: true })}</span>
          : delta != null && isFinite(delta) ? <TrendChip delta={delta} good={good}/> : null}
      </div>
    </div>
  );
}

function OvLines({ rows }) {
  return (
    <div className="ovl">
      {rows.map((r, i) => (
        <div key={i} className={`ovl-r ${r.tone || ''}`}>
          {r.dot && <span className="dot" style={{ background: r.dot }}></span>}
          <span className="k">{r.k}{r.sub && <span className="s">{r.sub}</span>}</span>
          {r.x != null && <span className="x pms-mono" style={r.xc ? { color: r.xc } : null}>{r.x}</span>}
          <span className="v pms-mono" style={r.vc ? { color: r.vc } : null}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function OvBars({ rows, max }) {
  const mx = max || Math.max(...rows.map(r => r.v), 1);
  return (
    <div className="ovbars">
      {rows.map((r, i) => (
        <div key={i} className="ovbar">
          <span className="k">{r.k}</span>
          <span className="t"><span style={{ width: `${(r.v / mx) * 100}%`, background: r.color || 'var(--pms-accent)' }}></span></span>
          <span className="v pms-mono">{r.label ?? r.v.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function OvMiniChart({ series, mode }) {
  const W = 600, H = 120, P = 4;
  if (!series || series.length < 2) {
    return <svg className="ovchart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"><line x1={P} x2={W - P} y1={H / 2} y2={H / 2} stroke="var(--pms-accent)" strokeWidth="2" strokeDasharray="6 6" opacity=".5" vectorEffect="non-scaling-stroke"/></svg>;
  }
  const vs = series.map(d => d.v);
  const mx = Math.max(...vs), mn = Math.min(...vs);
  const lo = mode === 'pnl' ? Math.min(mn, 0) : mn, hi = Math.max(mx, mode === 'pnl' ? 0 : mx);
  const pad = (hi - lo) * 0.1 || 1;
  const y = v => P + (H - 2 * P) - ((v - (lo - pad)) / ((hi + pad) - (lo - pad))) * (H - 2 * P);
  const x = i => P + (i / (series.length - 1)) * (W - 2 * P);
  if (mode === 'pnl') {
    const bw = Math.max(2, ((W - 2 * P) / series.length) * 0.6), z = y(0);
    return (
      <svg className="ovchart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <line x1={P} x2={W - P} y1={z} y2={z} stroke="var(--pms-divider-strong)"/>
        {series.map((d, i) => { const cx = P + (i + .5) * ((W - 2 * P) / series.length); const top = d.v >= 0 ? y(d.v) : z; return <rect key={i} x={cx - bw / 2} y={top} width={bw} height={Math.max(1.5, Math.abs(y(d.v) - z))} rx="1.5" fill={d.v >= 0 ? 'var(--pms-pos)' : 'var(--pms-neg)'} opacity=".8"/>; })}
      </svg>
    );
  }
  const d = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  return (
    <svg className="ovchart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs><linearGradient id="ovg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B06CFF" stopOpacity=".3"/><stop offset="1" stopColor="#B06CFF" stopOpacity="0"/></linearGradient></defs>
      <path d={`${d} L${x(series.length - 1)},${H - P} L${P},${H - P} Z`} fill="url(#ovg)"/>
      <path d={d} fill="none" stroke="var(--pms-accent)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────
function DashboardPage({ onOpenPool, onNav, can, roleId }) {
  const [span, setSpan] = React.useState('7d');
  const [chart, setChart] = React.useState('nav');
  const m = React.useMemo(() => window.dashMetricsFor(span), [span]);
  const S = { '1d': 'today', '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days' }[span];
  const go = (id, sub) => () => onNav && onNav(id, sub);
  const mapS = arr => (arr || []).map(d => ({ v: typeof d === 'number' ? d : (d.v ?? d.value ?? 0) }));
  const nav = mapS(m.navSeries), pnl = mapS(m.pnlSeries);

  const POOLS_ = window.POOLS || [];
  const INV = window.INVESTORS || [];
  const KO = window.KYC_ORGS || [], KW = window.KYC_WALLETS || [];
  const kycQueue = KO.filter(o => ['submitted', 'in_review', 'second_approval'].includes(o.status)).length;
  const KQ = (window.KYC_QUARANTINE || []).filter(q => q.status !== 'returned').length;
  const fi = window.FUND_INTENTS || [];
  const reconAll = window.RECON_BREAKS_FULL || window.RECON_BREAKS || [];
  const sevN = s => reconAll.filter(r => r.severity === s).length;
  const pendW = fi.filter(i => i.dir === 'withdraw' && (i.stage === 'W2_APPROVAL' || i.stage === 'W4_PROVIDER_CHECK'));
  const ddLimit = { 1: -2, 2: -3, 3: -5 };
  const scolor = id => id === 1 ? '#B06CFF' : id === 2 ? '#FF8330' : '#36C2FF';
  const errs = m.errorsByService || [];
  const errsTotal = errs.reduce((s, e) => s + e.value, 0);
  const ddAlerts = m.strategiesInDd?.value ?? 0;
  const keysAtt = m.keysAttention?.value ?? 0;
  const pnlFlip = m.grossPnl.prev <= 0 || (m.grossPnl.prev < 0) !== (m.grossPnl.value < 0);
  // revenue scaled from YTD to the selected span
  const ytdDays = 132, rf = Math.min(1, m.days / ytdDays);
  const rev = (m.revenueByType || []).map(r => ({ ...r, value: r.value * rf }));
  const revTotal = rev.reduce((s, r) => s + r.value, 0);

  // Needs-attention rows — each routes to its own tab, filtered by scope
  const attention = [
    ddAlerts > 0 && can('strategies') && { tone: 'crit', n: ddAlerts, k: 'Drawdown limit breach', s: 'strategy paused', nav: ['strategies', 'list'] },
    sevN('high') > 0 && can('recon') && { tone: 'crit', n: sevN('high'), k: 'Reconciliation FAIL', s: 'ledger ≠ venue', nav: ['recon'] },
    pendW.length > 0 && can('fundflow.approve') && { tone: 'warn', n: pendW.length, k: 'Withdrawals awaiting approval', s: fmt.usd(pendW.reduce((a, w) => a + w.amount, 0), { compact: true }), nav: ['fundflow', 'approvals'] },
    errsTotal > 0 && can('admin.health') && { tone: 'warn', n: errsTotal, k: 'Service errors · 1h', s: errs.filter(e => e.value).map(e => e.label).join(', '), nav: ['admin', 'admin'] },
    keysAtt > 0 && can('admin') && { tone: 'info', n: keysAtt, k: 'API keys need rotation', s: 'past policy', nav: ['admin', 'admin'] },
    kycQueue > 0 && can('kyc.approve') && { tone: 'warn', n: kycQueue, k: 'KYC cases to review', s: 'Organizations › KYC review', nav: ['investors', 'review'] },
    KQ > 0 && can('investors') && { tone: 'info', n: KQ, k: 'Quarantined deposits', s: 'sender not whitelisted', nav: ['investors', 'quarantine'] },
  ].filter(Boolean);

  const roleLbl = (window.PMS_ROLES?.[roleId] || {}).label;

  // ── Blocks as data: base span + renderer. The grid self-heals: the last visible
  //    block is stretched to fill whatever is left of its row, for any role/count.
  const blocks = [];
  if (can('strategies')) blocks.push({ base: 2, render: L => (
    <OvBlock key="perf" icon="trend" title="Performance" dest="Strategies" time span={span} layout={L} onOpen={go('strategies', 'list')}>
      <div className="ovp">
        <div className="ovp-k">
          <OvKpi label="Assets under management" value={fmt.usd(m.totalAum.value, { compact: true })} delta={m.totalAum.deltaPct}/>
          <OvKpi label={`Gross P&L · ${S}`} value={fmt.signedUsd(m.grossPnl.value, { compact: true })} tone={m.grossPnl.value >= 0 ? 'pos' : 'neg'}
            delta={pnlFlip ? null : m.grossPnl.deltaPct} deltaAbs={pnlFlip ? m.grossPnl.deltaAbs : null}/>
          <div className="ovp-mini">
            <span>Win rate <b>{span === '1d' ? '—' : m.winRate.value.toFixed(0) + '%'}</b></span>
            <span>Open positions <b>{m.openPositions.value}</b></span>
            <span>Unrealized <b className={m.uPnl.value >= 0 ? 'pms-pos' : 'pms-neg'}>{fmt.signedUsd(m.uPnl.value, { compact: true })}</b></span>
          </div>
        </div>
        <div className="ovp-c" onClick={e => e.stopPropagation()}>
          <div className="ovp-ct">
            <button className={chart === 'nav' ? 'active' : ''} onClick={() => setChart('nav')}>NAV</button>
            <button className={chart === 'pnl' ? 'active' : ''} onClick={() => setChart('pnl')}>Daily P&L</button>
            <span className="l">{S}</span>
          </div>
          <OvMiniChart series={chart === 'nav' ? nav : pnl} mode={chart}/>
        </div>
      </div>
    </OvBlock>
  )});

  blocks.push({ base: 1, render: L => (
    <OvBlock key="att" icon="bell" title="Needs attention" dest="details" layout={L} onOpen={attention[0] ? go(...attention[0].nav) : () => {}}
      tone={attention.some(a => a.tone === 'crit') ? 'crit' : attention.length ? 'warn' : 'ok'}>
      {attention.length === 0 ? (
        <div className="ov-clear"><span className="ovk-v pos">✓</span><div>All clear{roleLbl ? ` for ${roleLbl}` : ''}<span className="s">No breaches, breaks or approvals in your scope.</span></div></div>
      ) : (
        <div className="ova">
          {attention.map((a, i) => (
            <div key={i} className={`ova-r ${a.tone}`} onClick={e => { e.stopPropagation(); onNav && onNav(...a.nav); }}>
              <span className="n">{a.n}</span>
              <span className="k">{a.k}<span className="s">{a.s}</span></span>
              <span className="go">→</span>
            </div>
          ))}
        </div>
      )}
    </OvBlock>
  )});

  if (can('strategies')) blocks.push({ base: 1, render: L => (
    <OvBlock key="strat" icon="layers" title="Strategies" dest="Strategies" time span={span} layout={L} onOpen={go('strategies', 'list')}>
      <OvKpi small label={`${POOLS_.length} bots · P&L ${S}`} value={fmt.signedUsd((m.strategySummary || []).reduce((s, p) => s + p.pnl, 0), { compact: true })}
        tone={(m.strategySummary || []).reduce((s, p) => s + p.pnl, 0) >= 0 ? 'pos' : 'neg'}/>
      <OvLines rows={(m.strategySummary || []).map(p => ({
        dot: scolor(p.id), k: p.name, sub: `DD ${p.dd.toFixed(2)}% / ${p.ddLimit.toFixed(0)}%`,
        x: fmt.signedUsd(p.pnl, { compact: true }), xc: p.pnl >= 0 ? 'var(--pms-pos)' : 'var(--pms-neg)',
        v: fmt.usd(POOLS_.find(q => q.id === p.id)?.nav || 0, { compact: true }),
      }))}/>
    </OvBlock>
  )});

  if (can('research')) blocks.push({ base: 1, render: L => (
    <OvBlock key="tradesim" icon="bolt" title="TradeSim Hub" dest="TradeSim" layout={L} onOpen={go('tradesim')}>
      <OvKpi small label="Simulations run · 24h" value="418.9K"/>
      <OvLines rows={[
        { k: 'Recorder', sub: '4 venue streams · 13/14 shards', v: 'OK', vc: 'var(--pms-pos)' },
        { k: 'Background loops', sub: 'delisting_sync stale 14m', v: '5/6 ok', vc: 'var(--pms-warn)' },
        { k: 'Best pair score', sub: 'binance SOLUSDT', v: '0.91' },
        { k: 'Top net carry', sub: 'cash-and-carry', v: '+31.4%', vc: 'var(--pms-pos)' },
      ]}/>
    </OvBlock>
  )});

  if (can('trading')) blocks.push({ base: 1, render: L => (
    <OvBlock key="trade" icon="list" title="Trading" dest="Trading" time span={span} layout={L} onOpen={go('trading', 'blotter')}>
      <OvKpi small label={`Roundtrips · ${S}`} value={m.totalTrades.value.toLocaleString()} delta={m.totalTrades.deltaPct}/>
      <div className="ovp-mini"><span>Fill rate <b>{m.fillRate.value.toFixed(1)}%</b></span><span>Gross notional <b>{fmt.usd(m.grossNotional.value, { compact: true })}</b></span></div>
      <OvBars rows={(m.tradesPerStrategy || []).map(t => ({ k: t.label, v: t.value, color: t.color }))}/>
      <OvLines rows={[
        { k: 'Open positions', v: m.openPositions.value, x: fmt.usd(m.grossNotional.value, { compact: true }) + ' notional' },
        { k: 'Unrealized P&L', v: fmt.signedUsd(m.uPnl.value, { compact: true }), vc: m.uPnl.value >= 0 ? 'var(--pms-pos)' : 'var(--pms-neg)' },
      ]}/>
    </OvBlock>
  )});

  if (can('fundflow')) blocks.push({ base: 1, render: L => (
    <OvBlock key="ff" icon="flow" title="Fund flow" dest="Fund flow" time span={span} layout={L} onOpen={go('fundflow', 'pipeline')} tone={pendW.length && can('fundflow.approve') ? 'warn' : undefined}>
      <OvKpi small label={`Settled · ${S}`} value={fmt.usd(m.settledInPeriod.value, { compact: true })} delta={m.settledInPeriod.deltaPct}/>
      <OvLines rows={[
        { k: 'Deposits in flight', v: m.depositsInFlight.value, x: fmt.usd(m.notionalInFlight.value, { compact: true }) },
        { k: 'Withdrawals in flight', v: fi.filter(i => i.dir === 'withdraw' && i.stage !== 'W7_SETTLED' && !i.failed).length },
        { k: 'Change-strategy requests', v: 3 },
        can('fundflow.approve') && { k: 'Awaiting your approval', v: pendW.length, vc: pendW.length ? 'var(--pms-warn)' : undefined, tone: pendW.length ? 'hl' : '' },
        { k: 'Avg time to settle', v: `${m.avgSettleHrs.value.toFixed(1)}h` },
      ].filter(Boolean)}/>
    </OvBlock>
  )});

  if (can('investors')) blocks.push({ base: 1, render: L => (
    <OvBlock key="inv" icon="users" title="Organizations" dest="Organizations" layout={L} onOpen={go('investors')}>
      <OvKpi small label="KYC approved" value={<>{KO.filter(o => o.status === 'approved').length}<span style={{ color: 'var(--fg-3)', fontSize: '0.6em' }}> / {KO.length}</span></>}/>
      <OvLines rows={[
        { k: 'Combined balance', v: fmt.usd(INV.reduce((s, i) => s + i.balance, 0), { compact: true }) },
        { k: 'KYC to review', sub: `${KO.filter(o => o.status === 'second_approval').length} need 2nd approval`, v: kycQueue, vc: kycQueue ? 'var(--pms-warn)' : undefined },
        { k: 'Waiting on client', v: KO.filter(o => ['draft', 'info_requested'].includes(o.status)).length },
        { k: 'Wallets whitelisted', sub: `${KW.filter(w => ['awaiting_email', 'awaiting_connect', 'review', 'cooldown'].includes(w.status)).length} in progress`, v: KW.filter(w => w.status === 'active').length },
        { k: 'Quarantined deposits', v: KQ, vc: KQ ? 'var(--pms-warn)' : undefined },
        { k: 'Re-KYC due ≤ 30d', v: KO.filter(o => o.status === 'approved' && o.nextReview && (new Date(o.nextReview) - new Date('2026-10-21')) / 864e5 <= 30).length },
      ]}/>
    </OvBlock>
  )});

  if (can('recon')) blocks.push({ base: 1, render: L => (
    <OvBlock key="recon" icon="check" title="Reconciliation" dest="Reconciliation" layout={L} onOpen={go('recon')} tone={sevN('high') ? 'crit' : undefined}>
      <OvKpi small label="Open findings" value={reconAll.length} tone={sevN('high') ? 'neg' : undefined}/>
      <OvLines rows={[
        { k: 'High severity', sub: 'FAIL · needs action', v: sevN('high'), vc: sevN('high') ? 'var(--pms-neg)' : undefined },
        { k: 'Medium', v: sevN('medium'), vc: sevN('medium') ? 'var(--pms-warn)' : undefined },
        { k: 'Low', v: sevN('low') },
        { k: 'Last full run', sub: 'all reconcilers', v: '09:40 UTC' },
        { k: 'SLA compliance', sub: '30d rolling', v: `${m.slaCompliance.value.toFixed(1)}%` },
      ]}/>
    </OvBlock>
  )});

  if (can('finance')) blocks.push({ base: 1, render: L => (
    <OvBlock key="fin" icon="coin" title="Finance" dest="Finance" time span={span} layout={L} onOpen={go('finance', 'pnl')}>
      <OvKpi small label={`Firm revenue · ${S}`} value={fmt.usd(revTotal, { compact: true })} delta={m.ytdRevenue.deltaPct}/>
      <OvLines rows={[
        ...rev.map(r => ({ dot: r.color, k: r.label, v: fmt.usd(r.value, { compact: true }) })),
        { k: 'Revenue sub-account balance', v: fmt.usd(m.firmBalance.value, { compact: true }) },
      ]}/>
    </OvBlock>
  )});

  if (can('admin')) blocks.push({ base: 1, render: L => (
    <OvBlock key="admin" icon="key" title="Admin" dest="Admin" layout={L} onOpen={go('admin', 'admin')} tone={m.servicesDegraded.value ? 'warn' : undefined}>
      <OvKpi small label="Services degraded" value={m.servicesDegraded.value} tone={m.servicesDegraded.value ? 'neg' : 'pos'}/>
      <OvLines rows={[
        { k: 'API keys to rotate', v: keysAtt, vc: keysAtt ? 'var(--pms-warn)' : undefined },
        { k: 'Venues degraded', v: m.venuesDegraded.value },
        { k: 'Active sagas', sub: `${m.sagasInError.value} in error`, v: m.activeSagas.value },
        { k: 'Team members', sub: `${Object.keys(window.PMS_ROLES || {}).length} roles`, v: (window.USERS || []).length },
        { k: 'Privileged actions · 24h', sub: `${window.PRIVILEGED_ACTIONS_24H?.anomalies ?? 0} anomalies`, v: window.PRIVILEGED_ACTIONS_24H?.count ?? 0 },
        { k: 'Reports ready', v: m.reportsReady.value },
      ]}/>
    </OvBlock>
  )});

  // Self-healing layout: the last block takes whatever is left of its row (1, 2 or 3 cells).
  let used = 0;
  const rendered = blocks.map((b, i) => {
    const last = i === blocks.length - 1;
    const layout = last ? 3 - (used % 3) : b.base;
    used += layout;
    return b.render(layout);
  });

  return (
    <div className="ov">
      <div className="ov-head">
        <div>
          <h1>Overview</h1>
          <div className="sub">One block per section · click to open · <span className="ov-time-hint"><span className="ovb-time on">{span.toUpperCase()}</span> blocks follow the time toggle, <span className="ovb-time">NOW</span> blocks are live</span></div>
        </div>
        <span className="spacer"></span>
        <div className="ov-span" role="tablist" aria-label="Time span">
          {['1d', '7d', '30d', '90d'].map(s => <button key={s} className={span === s ? 'active' : ''} onClick={() => setSpan(s)}>{s.toUpperCase()}</button>)}
        </div>
      </div>
      <div className="ov-grid">{rendered}</div>
    </div>
  );
}

window.DashboardPage = DashboardPage;
