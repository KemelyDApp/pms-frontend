/* v3 Overview — mirrors pages/Overview (OverviewControls + OverviewGrid, 10 widgets). */
const SPAN_LABELS = ['1D', '7D', '30D', '90D'];
const PERIOD = { '1d': 'today', '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days' };
const SpanTag = ({ span }) => <SquareTag tone="accent">{span.toUpperCase()}</SquareTag>;
const NowTag = () => <SquareTag>NOW</SquareTag>;

function PerformanceWidget({ span, p, tr }) {
  const [view, setView] = useState('NAV');
  return <WidgetShell icon="trend" title="Performance" tag={<SpanTag span={span}/>}>
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: '0 0 190px' }}>
        <WidgetKpi label="Assets under management" value={fmtUsdCompact(p.total_aum.value)} percent={p.total_aum.delta_pct}/>
        <div><div className="wkpi__label">Gross P&L · {PERIOD[span]}</div><div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}><span className={`wkpi__val wkpi__val--${tone(p.gross_pnl.value)}`}>{fmtSigned(p.gross_pnl.value)}</span><span className={`mono ${tone(p.gross_pnl.delta_abs)}`} style={{ fontSize: 13, fontWeight: 600 }} title="vs the previous period">{fmtSigned(p.gross_pnl.delta_abs)}</span></div></div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11 }} className="muted"><span>Win rate <b style={{ color: '#fff' }}>{p.win_rate.value}%</b></span>{tr && <span>Open positions <b style={{ color: '#fff' }}>{tr.open_positions.value}</b></span>}</div>
        {tr && <div className="muted" style={{ fontSize: 11 }}>Unrealized <span className={`mono ${tone(tr.unrealized_pnl.value)}`} style={{ fontWeight: 600 }}>{fmtSigned(tr.unrealized_pnl.value)}</span></div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minWidth: 0, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Seg options={['NAV', 'Daily P&L']} value={view} onChange={setView}/><span className="mono muted" style={{ fontSize: 10 }}>{PERIOD[span]}</span></div>
        <div style={{ height: 210 }}>{view === 'NAV' ? <PmsChart data={p.nav_series} height={210}/> : <PmsChart data={p.pnl_series} variant="bar" height={210}/>}</div>
      </div>
    </div>
  </WidgetShell>;
}
function AttentionWidget() {
  const { preview } = usePreviewRole();
  const rows = V3.ATTENTION.filter(r => can(preview, r.scope));
  const sev = rows.some(r => r.tone === 'crit') ? 'critical' : rows.length ? 'warning' : undefined;
  const TC = { crit: ['#FF7072', 'rgba(255,112,114,.13)'], warn: ['#FF9B4F', 'rgba(255,155,79,.13)'], info: ['#4EB5FF', 'rgba(78,181,255,.13)'] };
  const SUB = { list: '', approvals: '/approvals', admin: '/users', kyc: '/kyc' };
  return <div className="ov-att"><WidgetShell icon="bell" title="Needs attention" severity={sev} tag={<NowTag/>}>
    {rows.length === 0 ? <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 14px' }}><span className="pos" style={{ fontSize: 22, fontWeight: 700 }}>✓</span><div style={{ fontSize: 12, fontWeight: 600 }}>All clear for {preview.name}<div className="muted" style={{ fontSize: 10, fontWeight: 400 }}>No breaches, breaks or approvals in your scope.</div></div></div> :
      <ul>{rows.map(r => <li key={r.kind} className="att-row" style={{ borderLeftColor: TC[r.tone][0] }} onClick={() => navigate('/' + r.link.page + (r.link.sub ? SUB[r.link.sub] : ''))}>
        <div className="att-row__n" style={{ color: TC[r.tone][0], background: TC[r.tone][1] }}>{r.count}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}><p style={{ fontSize: 11, fontWeight: 600 }}>{r.title}</p>{(r.subtitle || r.amount) && <p className="muted" style={{ fontSize: 10 }}>{r.subtitle || fmtUsd(r.amount)}</p>}</div>
        <Icon n="east" className="att-row__arr"/></li>)}</ul>}
  </WidgetShell></div>;
}
function StrategiesWidget({ span, s }) {
  const total = s.rows.reduce((a, r) => a + r.pnl, 0);
  return <WidgetShell icon="strategies" title="Strategies" tag={<SpanTag span={span}/>} onClick={() => navigate('/strategies')} kpi={<WidgetKpi label={`${s.rows.length} bots · P&L ${PERIOD[span]}`} value={fmtSigned(total)} tone={tone(total)}/>}>
    <ul style={{ display: 'flex', flexDirection: 'column', marginTop: 2 }}>{s.rows.map(r => <LineShell key={r.id}><ColorDot color={stratColor(r.id)}/><span style={{ flex: 1, minWidth: 0, color: 'var(--neutral-90)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}<span className="lrow__s">DD {r.dd.toFixed(2)}% / {r.dd_limit}%</span></span><span className={`mono ${tone(r.pnl) || 'muted'}`} style={{ fontSize: 10.5 }}>{fmtSigned(r.pnl)}</span><span className="mono" style={{ fontWeight: 600 }}>{fmtUsdCompact(r.nav)}</span></LineShell>)}</ul>
  </WidgetShell>;
}
function TshubWidget() {
  const T = V3.TSHUB;
  const lines = [['Recorder', `${T.recorder.streams} venue streams · ${T.recorder.shards[0]}/${T.recorder.shards[1]} shards`, T.recorder.status.toUpperCase(), 'pos'], ['Background loops', T.loops.bad, `${T.loops.ok}/${T.loops.total} ok`, 'warn'], ['Best pair score', T.best.pair, T.best.score.toFixed(2), ''], ['Top net carry', T.carry.pair, `+${T.carry.pct.toFixed(1)}%`, 'pos']];
  return <WidgetShell icon="bolt" title="TradeSim Hub" tag={<NowTag/>} onClick={() => navigate('/tradesim')} kpi={<WidgetKpi label={`Simulations run · ${T.window}`} value={(T.sims / 1000).toFixed(1) + 'K'}/>}>
    <ul>{lines.map(([n, d, v, t]) => <LineShell key={n}><div className="lrow"><span><span className="lrow__t" style={{ fontSize: 12 }}>{n}</span><span className="lrow__s">{d}</span></span><span className={`lrow__v ${t}`} style={{ fontSize: 12 }}>{v}</span></div></LineShell>)}</ul>
  </WidgetShell>;
}
function TradingWidget({ span, tr }) {
  const max = Math.max(...tr.trades_per_strategy.map(r => r.value), 1);
  return <WidgetShell icon="list" title="Trading" tag={<SpanTag span={span}/>} onClick={() => navigate('/trading')} kpi={<WidgetKpi label={`roundtrips · ${PERIOD[span]}`} value={fmtCount(tr.total_trades.value)} percent={tr.total_trades.delta_pct}/>}>
    <div style={{ display: 'flex', gap: 18, fontSize: 11 }}><span className="muted">Fill rate: <b style={{ color: '#fff', fontSize: 12 }}>{tr.fill_rate.value.toFixed(1)}%</b></span><span className="muted">Gross notional: <b style={{ color: '#fff', fontSize: 12 }}>{fmtUsdCompact(tr.gross_notional.value)}</b></span></div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
      {tr.trades_per_strategy.map(r => <div key={r.strategy_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 112, flex: '0 0 auto', fontSize: 11, color: 'var(--neutral-90)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span><div style={{ flex: 1 }}><ProgressBar value={r.value / max * 100} color={stratColor(r.strategy_id)}/></div><span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{r.value}</span></div>)}
      <ul><LineShell><div className="lrow" style={{ marginTop: 8 }}><span className="lrow__t">Open positions</span><span style={{ display: 'flex', gap: 8 }}><span className="lrow__p">{fmtUsdCompact(tr.gross_notional.value)} notional</span><span className="lrow__v">{tr.open_positions.value}</span></span></div></LineShell>
      <LineShell><div className="lrow" style={{ marginTop: 8 }}><span className="lrow__t">Unrealized P&L</span><span className={`lrow__v ${tone(tr.unrealized_pnl.value)}`}>{fmtSigned(tr.unrealized_pnl.value)}</span></div></LineShell></ul>
    </div>
  </WidgetShell>;
}
function FundflowWidget({ span, f }) {
  const aw = f.awaiting_approval, has = aw && aw.count > 0;
  const lines = [['Deposits in flight', null, fmtCount(f.deposits_in_flight.value)], ['Withdrawals in flight', null, fmtCount(f.withdrawals_in_flight.value)], ['Notional in flight', null, fmtUsdCompact(f.notional_in_flight.value)], ['Change-strategy requests', null, NO], ['Awaiting approval', has ? fmtUsdCompact(aw.amount) : null, fmtCount(aw.count), has], ['Avg time to settle', null, f.avg_settle_hrs.value.toFixed(1) + 'h']];
  return <WidgetShell icon="sync" title="Fund flow" severity={has ? 'warning' : undefined} tag={<SpanTag span={span}/>} onClick={() => navigate('/fundflow')} kpi={<WidgetKpi label={`Settled · ${PERIOD[span]}`} value={fmtUsdCompact(f.settled_in_period.value)} percent={f.settled_in_period.delta_pct}/>}>
    <ul>{lines.map(([t, p, v, w]) => <LineShell key={t}><div className="lrow" style={w ? { background: 'rgba(255,155,79,.08)' } : null}><span className="lrow__t">{t}</span><span style={{ display: 'flex', gap: 8 }}>{p && <span className="lrow__p">{p}</span>}<span className={`lrow__v ${w ? 'warn' : ''}`}>{v}</span></span></div></LineShell>)}</ul>
  </WidgetShell>;
}
function OrgsWidget({ inv, org }) {
  const G = { off: ['OFF', ''], shadow: ['SHADOW', 'info'], enforce_new: ['ENF NEW', 'warn'], enforce: ['ENFORCE', 'warn'], invalid: ['INVALID', 'neg'] }[org.gating_mode];
  const total = Object.values(org.by_status).reduce((a, b) => a + b, 0);
  const tip = `KYC gating: ${org.gating_mode} · ${org.org_overrides} org override\nWould block: ${org.would_block_today} today · ${org.would_block_7d} in 7d\n` + org.gate_top_7d.map(g => `${g.point} · ${g.code} · ${g.outcome}: ${g.n}`).join('\n');
  const rows = [['Combined balance', null, fmtUsdCompact(inv.combined_balance.value)], ['KYC to review', `${org.by_status.second_approval} needs 2nd approval · ${org.sla_breached} past SLA`, org.needs_review, 'warn'], ['Waiting on client', null, org.waiting_on_client], ['Quarantined deposits', null, org.quarantine_held, 'warn'], ['Re-KYC due ≤ 30d', null, org.review_due_30d]];
  return <WidgetShell icon="groups" title="Organizations" tag={<SquareTag tone={G[1]} title={tip}>{G[0]}</SquareTag>} onClick={() => navigate('/investors')} kpi={<WidgetKpi label="KYC approved" value={`${org.by_status.approved} / ${total}`}/>}>
    <ul>{rows.map(([t, s, v, w]) => <LineShell key={t}><div className="lrow"><span className="lrow__t">{t}{s && <span className="lrow__s">{s}</span>}</span><span className={`lrow__v ${w && v ? w : ''}`} style={{ fontSize: 12 }}>{v}</span></div></LineShell>)}</ul>
  </WidgetShell>;
}
function ReconWidget({ r }) {
  const o = r.open, act = o.actionable > 0;
  const rows = [['High severity', 'FAIL · needs action', o.actionable, act ? 'neg' : ''], ['Medium', null, o.by_severity.warn, o.by_severity.warn ? 'warn' : ''], ['Low', null, o.by_severity.info, ''], ['Last full run', '1h ago', o.last_full_run_at.slice(11, 16) + ' UTC', ''], ['SLA compliance', null, NO, '']];
  return <WidgetShell icon="check" title="Reconciliation" severity={act ? 'critical' : undefined} tag={<NowTag/>} onClick={() => navigate('/recon')} kpi={<WidgetKpi label="Open findings" value={o.total} tone={act ? 'neg' : undefined}/>}>
    <ul>{rows.map(([t, s, v, c]) => <LineShell key={t}><div className="lrow"><span className="lrow__t">{t}{s && <span className="lrow__s">{s}</span>}</span><span className={`lrow__v ${c}`}>{v}</span></div></LineShell>)}</ul>
  </WidgetShell>;
}
function FinanceWidget({ span, f }) {
  const C = { PERFORMANCE_FEE: 'var(--additional-purple-500)', MANAGEMENT_FEE: 'var(--additional-sky-500)', TXN_FEE_SPREAD: 'var(--additional-orange-500)' };
  return <WidgetShell icon="paid" title="Finance" tag={<SpanTag span={span}/>} onClick={() => navigate('/finance')} kpi={<WidgetKpi label={`Firm revenue · ${PERIOD[span]}`} value={fmtUsdCompact(f.revenue_in_period.value)} percent={f.revenue_in_period.delta_pct}/>}>
    <ul>{f.revenue_by_type.map(x => <LineShell key={x.type}><ColorDot color={C[x.type]}/><span style={{ flex: 1, color: 'var(--neutral-90)', fontSize: 11 }}>{x.label}</span><span className="lrow__v">{fmtUsdCompact(x.value)}</span></LineShell>)}
      <LineShell><div className="lrow"><span className="lrow__t">Revenue sub-account balance</span><span className="lrow__v">{fmtUsdCompact(f.firm_balance.value)}</span></div></LineShell></ul>
  </WidgetShell>;
}
function AdminWidget({ m }) {
  const deg = m.health.services_degraded.value, ka = m.keys.keys_attention.value, pa = m.audit.privileged_actions_24h;
  const St = ({ l, v, c, x }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><div className="wkpi__label">{l}</div><div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span className={c} style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.55px', lineHeight: '23px' }}>{v}</span>{x && <span className="muted" style={{ fontSize: 12 }}>{x}</span>}</div></div>;
  const rows = [['Venues degraded', null, m.strategies.venues_degraded.value], ['Active sagas', `${m.strategies.sagas_in_error.value} in error`, m.strategies.active_sagas.value], ['Team members', `${m.keys.team_members.roles} roles`, m.keys.team_members.value], ['Audit events today', null, m.audit.audit_events_today.value], ['Reports ready', null, NO]];
  return <WidgetShell icon="key" title="Admin" severity={deg ? 'warning' : undefined} tag={<NowTag/>} onClick={() => navigate('/admin')}>
    <div style={{ display: 'flex', gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, flex: '0 0 170px' }}><St l="Services degraded" v={deg} c={deg ? 'neg' : ''}/><St l="API keys to rotate" v={ka} c={ka ? 'warn' : ''}/><St l="Privileged actions · 24h" v={pa.count} x={`${pa.anomalies} anomalies`}/></div>
      <ul style={{ flex: 1, minWidth: 0 }}>{rows.map(([t, s, v]) => <LineShell key={t}><div className="lrow"><span className="lrow__t">{t}{s && <span className="lrow__s">{s}</span>}</span><span className="lrow__v">{v}</span></div></LineShell>)}</ul>
    </div>
  </WidgetShell>;
}

function OverviewPage() {
  const [interval, setIntervalL] = useState('7D');
  const span = interval.toLowerCase();
  const m = useMemo(() => V3.metrics(span), [span]);
  const { preview } = usePreviewRole();
  const blocks = [
    ['performance', 2, 'strategies', <PerformanceWidget span={span} p={m.performance} tr={can(preview, 'trading') ? m.trading : null}/>],
    ['attention', 1, null, <AttentionWidget/>],
    ['strategies', 1, 'strategies', <StrategiesWidget span={span} s={m.strategies}/>],
    ['tshub', 1, 'research', <TshubWidget/>],
    ['trading', 1, 'trading', <TradingWidget span={span} tr={m.trading}/>],
    ['fundflow', 1, 'fundflow', <FundflowWidget span={span} f={m.fundflow}/>],
    ['investors', 1, 'investors', <OrgsWidget inv={m.investors} org={m.organizations}/>],
    ['recon', 1, 'recon', <ReconWidget r={m.recon}/>],
    ['finance', 1, 'finance', <FinanceWidget span={span} f={m.finance}/>],
    ['admin', 1, ['admin', 'admin.audit', 'admin.health'], <AdminWidget m={m}/>],
  ].filter(b => can(preview, b[2]));
  let used = 0;
  const spans = blocks.map((b, i) => { const s = i === blocks.length - 1 ? 3 - (used % 3) : b[1]; used += s; return s; });
  return <section className="basic-page">
    <div className="page-head"><div><h1>Overview</h1><p className="page-head__sub">One block per section · click to open · <SquareTag tone="accent">{interval}</SquareTag> blocks follow the time toggle, <SquareTag>NOW</SquareTag> blocks are live</p></div><Seg options={SPAN_LABELS} value={interval} onChange={setIntervalL}/></div>
    <TopicSection><div className="ov-grid">{blocks.map((b, i) => <div key={b[0]} style={{ gridColumn: `span ${spans[i]}` }}>{b[3]}</div>)}</div></TopicSection>
  </section>;
}
window.OverviewPage = OverviewPage;
