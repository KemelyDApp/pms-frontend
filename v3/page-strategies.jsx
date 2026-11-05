/* v3 Strategies — mirrors pages/Strategies (StrategiesHub: list + Bots & sagas · StrategyDetails · StrategyCreate). */
const RISK = { 1: 'Moderate', 2: 'Moderate', 3: 'High', 4: 'Low' };
const RiskTag = ({ r }) => <SquareTag tone={{ Low: '', Moderate: 'accent', High: 'warn' }[r]}>{r.toUpperCase()}</SquareTag>;
const BOT_C = { active: 'var(--system-success-500)', warning: 'var(--system-warning-500)', killed: 'var(--system-error-500)', idle: 'var(--neutral-80)' };
const BotStatus = ({ s }) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BOT_C[s], fontSize: 11, fontWeight: 600, textTransform: 'capitalize', fontFamily: 'Montserrat' }}><StatusDot color={BOT_C[s]} glow={s === 'active'}/>{s}</span>;
const Chip = ({ children }) => <span className="sq" style={{ fontSize: 10, letterSpacing: '.04em' }}>{children}</span>;
const STRAT_X = {
  1: { venues: ['Binance'], legs: 2, nav_ps: 1.1842, pnl24: 8740, pnl30: 214300, aum: 44.5, fees: 'perf 20% · mgmt 2%', kind: 'funding_arb' },
  2: { venues: ['OKX'], legs: 2, nav_ps: 1.1215, pnl24: 4980, pnl30: 121400, aum: 27.0, fees: 'perf 20% · mgmt 2%', kind: 'funding_arb' },
  3: { venues: ['Bybit', 'Binance'], legs: 3, nav_ps: 1.0377, pnl24: -2310, pnl30: -14120, aum: 17.2, fees: 'perf 25% · mgmt 1.5%', kind: 'basis_carry' },
  4: { venues: ['Binance', 'OKX', 'Bybit'], legs: 3, nav_ps: 1.0092, pnl24: 1420, pnl30: 31880, aum: 11.3, fees: 'perf 15% · mgmt 1%', kind: 'market_making' },
};
const BOTS = [
  { id: 'fa-bnb-01', strat: 'Funding Arb · Binance', venues: ['Binance'], status: 'active', up: 1123200, pnl: 8740, alloc: 8420000, last: '16:58:12', deficits: 0, err: 2, locked: 0 },
  { id: 'fa-okx-01', strat: 'Funding Arb · OKX', venues: ['OKX'], status: 'active', up: 864000, pnl: 4980, alloc: 5110000, last: '16:57:40', deficits: 0, err: 0, locked: 0 },
  { id: 'bc-byb-01', strat: 'Basis Carry · Bybit', venues: ['Bybit', 'Binance'], status: 'warning', up: 42300, pnl: -2310, alloc: 3260000, last: '16:51:03', deficits: 1, err: 11, locked: 184000 },
  { id: 'mm-x-01', strat: 'Cross-venue MM', venues: ['Binance', 'OKX'], status: 'idle', up: 0, pnl: 0, alloc: 0, last: '11:20:44', deficits: 0, err: 0, locked: 0 },
];
const SAGAS = [
  { id: 'sg-71a2', wf: 'Deposit → allocate', status: 'running', i: 3, n: 5, step: 'transfer to Binance sub-account', strat: 'Funding Arb · Binance', actor: 'orchestrator', dur: 312 },
  { id: 'sg-71a0', wf: 'Withdrawal unwind', status: 'stalled', i: 2, n: 6, step: 'close perp leg · waiting for fill', strat: 'Basis Carry · Bybit', actor: 'bc-byb-01', dur: 2280 },
  { id: 'sg-719c', wf: 'Fee distribution', status: 'running', i: 1, n: 3, step: 'compute crystallisation', strat: 'Funding Arb · OKX', actor: 'fee-engine', dur: 48 },
];
const fmtDur = s => s >= 86400 ? `${Math.floor(s / 86400)}d ${Math.floor(s % 86400 / 3600)}h` : s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m` : `${Math.floor(s / 60)}m ${s % 60}s`;

function StrategyCard({ s }) {
  const x = STRAT_X[s.id];
  const M = [['APY (90d annualized)', fmtPct(s.apy), 'pos'], ['Drawdown', fmtPct(s.dd), s.dd <= -s.dd_limit * 0.9 ? 'neg' : ''], ['P&L 24h', fmtSigned(x.pnl24), tone(x.pnl24)], ['P&L 30d', fmtSigned(x.pnl30), tone(x.pnl30)]];
  return <PmsCard interactive onClick={() => navigate('/strategies/' + s.id + '/overview')} title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ColorDot color={stratColor(s.id)}/>{s.name}</span>} meta={<RiskTag r={RISK[s.id]}/>}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div><p className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{fmtUsd(s.nav)}</p><p className="muted" style={{ fontSize: 11 }}>NAV per share <span className="mono" style={{ color: '#fff' }}>{x.nav_ps.toFixed(4)}</span></p></div>
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>{M.map(([l, v, t]) => <div key={l}><dt className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{l}</dt><dd className={`mono ${t}`} style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{v}</dd></div>)}</dl>
      <div style={{ height: 1, background: 'rgba(255,255,255,.06)' }}></div>
      <div><p className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Bot · {x.legs} pools</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}><span className="mono" style={{ fontSize: 12 }}>{s.bot_id || NO}</span>{s.bot_id && <BotStatus s={s.bot_status}/>}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>{x.venues.map(v => <Chip key={v}>{v}</Chip>)}</div></div>
      <div><SquareTag tone="accent">{x.fees.toUpperCase()}</SquareTag></div>
    </div>
  </PmsCard>;
}
function StrategiesList() {
  const pools = Object.values(STRAT_X).reduce((a, x) => a + x.legs, 0);
  return <>
    <div className="page-head"><div><h1>Strategies</h1><p className="page-head__sub">{V3.STRATS.length} strategies · {pools} pools · click a card for details</p></div><div className="page-head__acts"><PmsButton>Compare</PmsButton><PmsButton variant="primary" onClick={() => navigate('/strategies/new')}>+ New strategy</PmsButton></div></div>
    <TopicSection><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>{V3.STRATS.map(s => <StrategyCard key={s.id} s={s}/>)}</div></TopicSection>
  </>;
}
function BotsSagas() {
  const [focus, setFocus] = useState(BOTS[2].id);
  const counts = ['active', 'killed', 'warning', 'idle'].map(st => `${BOTS.filter(b => b.status === st).length} ${st}`).join(' · ');
  const b = BOTS.find(x => x.id === focus);
  return <>
    <div className="page-head"><div><h1>Bots &amp; sagas</h1><p className="page-head__sub">{counts}</p></div><div className="page-head__acts"><PmsButton variant="ghost" reason={NOT_SERVED}>Bot console</PmsButton><PmsButton variant="danger" reason={NOT_SERVED}>Kill all</PmsButton></div></div>
    <p className="muted" style={{ fontSize: 11 }}><b style={{ color: 'var(--neutral-90)' }}>Source</b> orchestrator · venue connectors · risk-core · <b style={{ color: 'var(--neutral-90)' }}>Refresh</b> WS · 1s tick · <b style={{ color: 'var(--neutral-90)' }}>Visible to</b> PM · OPS · RISK · <span className="warn">1 wallet deficit · 13 errors / 1h · $184.0K locked</span></p>
    <div className="note note--info">Bots &amp; sagas still run on mocks: the contract has no bots-list or sagas topic yet.</div>
    <div className="grid12">
      <div style={{ gridColumn: '1 / 9' }}><PmsCard title="Bots" meta="click a row to focus" flush><PmsTable onRow={r => setFocus(r.id)} columns={[
        { key: 'id', label: 'BOT', render: r => <b style={{ color: r.id === focus ? '#c68eff' : '#fff' }}>{r.id}</b> }, { key: 'strat', label: 'STRATEGY', sans: true, render: r => <span className="muted">{r.strat}</span> },
        { key: 'venues', label: 'VENUES', render: r => r.venues.join(' × ') }, { key: 'status', label: 'STATUS', render: r => <BotStatus s={r.status}/> },
        { key: 'up', label: 'UPTIME', sortable: true, render: r => <span className="muted">{r.up ? fmtDur(r.up) : NO}</span> }, { key: 'pnl', label: 'P&L 24H', num: true, sortable: true, render: r => <b className={tone(r.pnl)}>{fmtSigned(r.pnl)}</b> },
        { key: 'alloc', label: 'ALLOCATED', num: true, sortable: true, render: r => fmtUsdCompact(r.alloc) }, { key: 'last', label: 'LAST TRADE', render: r => <span className="muted">{r.last}</span> }]} rows={BOTS}/></PmsCard></div>
      <div style={{ gridColumn: '9 / -1' }}><PmsCard title="Saga workflows" meta={`${SAGAS.filter(s => s.status === 'running').length} running`} flush><ul>{SAGAS.map(s => <li key={s.id} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12, fontWeight: 600 }}>{s.wf}</span><SquareTag tone={s.status === 'running' ? 'info' : 'warn'}>{s.status.toUpperCase()}</SquareTag></div>
        <p className="muted" style={{ fontSize: 11, margin: '3px 0 6px' }}>{s.i}/{s.n} — {s.step}</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10.5, flexWrap: 'wrap' }} className="muted"><span className="mono">{s.id}</span><SquareTag tone="accent">{s.strat}</SquareTag><span>{s.actor}</span><span className="mono" style={{ marginLeft: 'auto' }}>{fmtDur(s.dur)}</span></div>
      </li>)}</ul></PmsCard></div>
    </div>
    <BotTriage b={b}/>
  </>;
}
function BotTriage({ b, scoped }) {
  const wallets = [{ w: 'Binance · spot', free: 412000, req: 380000 }, { w: 'Bybit · futures', free: 96000, req: 164000 }];
  const errs = [{ code: 'ORDER_REJECTED', src: 'venue.bybit', msg: 'Insufficient margin for reduce-only order', n: 8, c: 3, esc: true, at: '16:51:03' }, { code: 'WS_RECONNECT', src: 'connector.bybit', msg: 'Market-data socket reconnected', n: 3, c: 0, esc: false, at: '16:40:12' }];
  const locks = [{ asset: 'ETH', open: 820000, locked: 184000, orders: 4, held: 1840 }];
  const Shell = ({ title, meta, act, children }) => <PmsCard title={title} meta={meta} actions={<PmsButton variant="ghost" sm reason={NOT_SERVED}>{act}</PmsButton>} flush><ul>{children}</ul></PmsCard>;
  const row = { padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' };
  return <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}><BotStatus s={b.status}/><b className="mono" style={{ fontSize: 14 }}>{b.id}</b><span className="muted" style={{ fontSize: 12 }}>{b.strat}</span><span className="muted mono" style={{ fontSize: 10.5, marginLeft: 'auto' }}>{scoped ? "scoped to this strategy's bot" : 'focused bot'}</span></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
      <Shell title="Wallet balances" meta="free vs required" act="Rebalance">{wallets.map(w => { const short = w.free < w.req; return <li key={w.w} style={row}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 12 }}>{w.w}</span>{short && <SquareTag tone="neg">−{fmtUsdCompact(w.req - w.free)}</SquareTag>}</div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ProgressBar value={w.free / Math.max(w.req, w.free) * 100} color={short ? 'var(--system-error-500)' : 'var(--system-success-500)'}/><span className="mono muted" style={{ fontSize: 10.5, whiteSpace: 'nowrap' }}>{fmtUsdCompact(w.free)} / {fmtUsdCompact(w.req)}</span></div></li>; })}</Shell>
      <Shell title="Errors · last 1h" meta="grouped by code" act="View all errors">{errs.map(e => <li key={e.code} style={row}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{e.code}</span><SquareTag tone={e.esc ? 'warn' : ''}>×{e.n}{e.c > 0 && ` · ${e.c} consec`}</SquareTag></div><p style={{ fontSize: 11, margin: '4px 0' }}>{e.msg}</p><div className="muted mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>{e.src}</span><span>{e.at}</span></div></li>)}</Shell>
      <Shell title="Position locks" meta="held orders / leg notional" act="Release stale locks">{locks.map(l => <li key={l.asset} style={row}><div style={{ display: 'flex', justifyContent: 'space-between' }}><Chip>{l.asset}</Chip><span className="muted mono" style={{ fontSize: 10.5 }}>held {fmtDur(l.held)}</span></div><dl style={{ display: 'flex', gap: 18, marginTop: 8, fontSize: 11 }}><div><dt className="muted" style={{ fontSize: 10 }}>Open legs</dt><dd className="mono">{fmtUsdCompact(l.open)}</dd></div><div><dt className="muted" style={{ fontSize: 10 }}>Locked</dt><dd className="mono warn">{fmtUsdCompact(l.locked)}</dd></div><div><dt className="muted" style={{ fontSize: 10 }}>Orders</dt><dd className="mono">{l.orders}</dd></div></dl></li>)}</Shell>
    </div>
  </>;
}

const SIDE = s => <SquareTag tone={s === 'long' || s === 'buy' ? 'pos' : 'neg'}>{s.toUpperCase()}</SquareTag>;
const ORD_ST = { FILLED: 'pos', PARTIAL: 'warn', WORKING: 'info', CANCELED: 'neg' };
function StrategyDetails({ id, tab }) {
  const s = V3.STRATS.find(x => String(x.id) === id);
  if (!s) return <><a className="muted" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/strategies')}>‹ All strategies</a><p className="neg" style={{ fontSize: 12 }}>No strategy with id "{id}"</p></>;
  const x = STRAT_X[s.id], b = BOTS.find(bb => bb.id === s.bot_id) || BOTS[3];
  const tabs = [{ id: 'overview', label: 'Overview' }, { id: 'pools', label: 'Pools', badge: { v: String(x.legs), kind: 'count' } }, { id: 'bot-triage', label: 'Bot triage', badge: b.err ? { v: String(b.err), kind: b.deficits ? 'neg' : 'warn' } : undefined }, { id: 'fee-policy', label: 'Fee policy' }, { id: 'orders', label: 'Orders' }];
  const t = tab || 'overview';
  const kpis = [['NAV', fmtUsdCompact(s.nav), `${x.aum.toFixed(1)}% of AUM`, '', true], ['P&L 24h', fmtSigned(x.pnl24), <DeltaTag pct={x.pnl24 / s.nav * 100}/>, x.pnl24 > 0 ? 'positive' : 'negative'], ['P&L 30d', fmtSigned(x.pnl30), <DeltaTag pct={x.pnl30 / s.nav * 100}/>, x.pnl30 > 0 ? 'positive' : 'negative'], ['APY · 90d annualized', fmtPct(s.apy), undefined, 'positive'], ['Drawdown', fmtPct(s.dd), `limit ${fmtPct(-s.dd_limit)}`, s.dd <= -s.dd_limit * 0.9 ? 'negative' : '']];
  const venueRows = x.venues.flatMap((v, i) => [{ id: v + i, venue: v, account: `${s.bot_id || 'pool'}-${v.toLowerCase()}-${i + 1}`, capital: s.nav / x.legs, pct: 100 / x.legs, pnl: x.pnl24 / x.legs, st: s.bot_status === 'warning' && i === 0 ? 'degraded' : s.bot_status === 'idle' ? 'idle' : 'healthy' }]);
  while (venueRows.length < x.legs) venueRows.push({ ...venueRows[0], id: 'l' + venueRows.length, account: venueRows[0].account.replace(/\d$/, String(venueRows.length + 1)), st: 'healthy' });
  return <>
    <a className="muted" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/strategies')}>‹ All strategies</a>
    <TopicSection>
      <div className="page-head"><div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ColorDot color={stratColor(s.id)}/><h1>{s.name}</h1><RiskTag r={RISK[s.id]}/></div><p className="page-head__sub">Strategy #{s.id} · 1 bot ({s.bot_id || NO}) · {x.legs} pools</p></div>
        <div className="page-head__acts"><PmsButton variant="ghost" reason={NOT_SERVED}>Edit leg allocation</PmsButton><PmsButton reason={NOT_SERVED}>Bot console</PmsButton><PmsButton variant="danger" reason={NOT_SERVED}>Pause strategy</PmsButton></div></div>
      <div className="kpi-row">{kpis.map(([l, v, sub, tn, f]) => <KpiCard key={l} label={l} val={v} sub={sub} tone={tn} featured={f}/>)}</div>
      <PmsTabs tabs={tabs} active={t} onChange={id => navigate(`/strategies/${s.id}/${id}`)}/>
      {t === 'overview' && <div className="grid12">
        <div style={{ gridColumn: '1 / 9' }}><PmsCard title="NAV history" meta="daily · from strategy.nav_daily"><PmsChart data={V3.series(60, s.nav * 0.9, 0.0018, 0.008, s.id * 3)} height={200} color={stratColor(s.id).includes('purple') ? '#B06CFF' : '#B06CFF'}/></PmsCard></div>
        <div style={{ gridColumn: '9 / -1' }}><PmsCard title={`Bot · ${s.bot_id || NO}`} meta={s.bot_id && <BotStatus s={s.bot_status}/>}><dl className="dl">{[['Strategy', x.kind], ['Allocated capital', fmtUsdCompact(b.alloc)], ['Active venues', x.venues.join(' · ')], ['Drawdown limit', fmtPct(-s.dd_limit)], ['Fees', x.fees]].map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl></PmsCard></div>
        <div style={{ gridColumn: '1 / -1' }}><PmsCard title="Open positions" meta="positions topic · this strategy" flush><PmsTable columns={[{ key: 'a', label: 'ASSET', render: r => <Chip>{r.a}</Chip> }, { key: 'v', label: 'VENUE', render: r => <Chip>{r.v}</Chip> }, { key: 'side', label: 'SIDE', render: r => SIDE(r.side) }, { key: 'n', label: 'NOTIONAL', num: true, sortable: true, render: r => fmtUsdCompact(r.n) }, { key: 'u', label: 'UPNL', num: true, sortable: true, render: r => <span className={tone(r.u)}>{fmtSigned(r.u)}{r.stale && <span className="muted" style={{ marginLeft: 6, fontSize: 10 }}>stale</span>}</span> }]}
          rows={[{ id: 1, a: 'BTC', v: x.venues[0], side: 'long', n: 2140000, u: 4210 }, { id: 2, a: 'BTC', v: x.venues[0], side: 'short', n: 2138000, u: -3980 }, { id: 3, a: 'ETH', v: x.venues[x.venues.length - 1], side: 'long', n: 820000, u: 1240, stale: s.id === 3 }]}/></PmsCard></div>
      </div>}
      {t === 'pools' && <PmsCard title="Pools" meta="one pool per venue leg" flush><PmsTable columns={[{ key: 'venue', label: 'VENUE', render: r => <Chip>{r.venue}</Chip> }, { key: 'account', label: 'ACCOUNT', render: r => <span className="muted">{r.account}</span> }, { key: 'capital', label: 'CAPITAL', num: true, sortable: true, render: r => <b>{fmtUsdCompact(r.capital)}</b> }, { key: 'pct', label: '% OF POOL', num: true, render: r => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="muted">{r.pct.toFixed(1)}%</span><span style={{ width: 70 }}><ProgressBar value={r.pct} color="#B06CFF"/></span></span> }, { key: 'pnl', label: 'P&L 24H', num: true, render: r => <span className={tone(r.pnl)}>{fmtSigned(r.pnl)}</span> }, { key: 'st', label: 'STATUS', render: r => <SquareTag tone={{ healthy: 'pos', degraded: 'warn', idle: '' }[r.st]}>● {{ healthy: 'OK', degraded: 'DEG', idle: 'IDLE' }[r.st]}</SquareTag> }]} rows={venueRows}/></PmsCard>}
      {t === 'bot-triage' && <><BotTriage b={b} scoped/><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><PmsButton variant="ghost" reason={NOT_SERVED}>Rebalance wallets</PmsButton><PmsButton reason={NOT_SERVED}>Pause bot</PmsButton><PmsButton variant="danger" reason={NOT_SERVED}>Kill switch</PmsButton></div></>}
      {t === 'fee-policy' && <>
        <div className="note note--info">Fee policy still runs on mocks: no fee-policy topic in the contract yet.</div>
        <div className="kpi-row"><KpiCard featured label="Perf fee · this period" val="$42.1K" sub="accrued · crystallises monthly" tone="positive"/><KpiCard label="Mgmt fee · this period" val="$7.0K" sub="2% / yr · pro-rata"/><KpiCard label="High water mark" val={fmtUsdCompact(s.nav * 0.97)} sub={`NAV ${fmtSigned(s.nav * 0.03)} above HWM`}/><KpiCard label="Hurdle rate" val="5.00%" sub="annual · hard hurdle"/></div>
        <div className="grid12"><div style={{ gridColumn: '1 / 7' }}><PmsCard title="Policy" meta="edits write to audit log" flush><ul>{[['Performance fee', '20.00% above HWM', 1], ['Management fee', '2.00% / year · pro-rata daily', 1], ['Hurdle rate', '5.00% annual · hard hurdle', 1], ['Crystallisation', 'monthly · last business day', 1], ['High-water mark', 'per investor · resets on full redemption', 0], ['Loss carry-forward', 'enabled · perpetual', 0]].map(([l, v, e]) => <li key={l} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 80px', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 12 }}><span className="muted">{l}</span><span className="mono">{v}</span><span style={{ textAlign: 'right' }}>{e ? <PmsButton variant="ghost" sm>Edit</PmsButton> : <span className="muted" style={{ fontSize: 10.5 }}>read-only</span>}</span></li>)}</ul></PmsCard></div>
          <div style={{ gridColumn: '7 / -1' }}><PmsCard title="Accrual waterfall" meta="this period"><dl className="dl">{[['Gross P&L', '+$214.3K'], ['− Hurdle (5%)', '−$3.5K'], ['= Above hurdle', '$210.8K'], ['× Perf fee 20%', '$42.1K'], ['+ Mgmt fee', '$7.0K'], ['= Total fees accrued', '$49.1K']].map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl></PmsCard></div></div>
        <PmsCard title="Crystallisations" flush><PmsTable columns={[{ key: 'p', label: 'PERIOD' }, { key: 'o', label: 'NAV OPEN', num: true, render: r => fmtUsdCompact(r.o) }, { key: 'c', label: 'NAV CLOSE', num: true, render: r => fmtUsdCompact(r.c) }, { key: 'pnl', label: 'P&L', num: true, render: r => <span className={tone(r.c - r.o)}>{fmtSigned(r.c - r.o)}</span> }, { key: 'pf', label: 'PERF FEE', num: true, render: r => <span className="pos">{fmtUsdCompact(r.pf)}</span> }, { key: 'mf', label: 'MGMT FEE', num: true, render: r => <span className="pos">{fmtUsdCompact(r.mf)}</span> }, { key: 'st', label: 'STATUS', render: r => <SquareTag tone={r.st === 'pending' ? 'warn' : 'pos'}>{r.st.toUpperCase()}</SquareTag> }]}
          rows={[{ id: 1, p: '2026-11', o: s.nav * 0.98, c: s.nav, pf: 42100, mf: 7000, st: 'pending' }, { id: 2, p: '2026-10', o: s.nav * 0.95, c: s.nav * 0.98, pf: 38400, mf: 13600, st: 'crystallised' }, { id: 3, p: '2026-09', o: s.nav * 0.93, c: s.nav * 0.95, pf: 31200, mf: 13100, st: 'crystallised' }]}/></PmsCard>
      </>}
      {t === 'orders' && <PmsCard title="Orders" meta="orders topic · this strategy" flush><PmsTable columns={[{ key: 'ts', label: 'TIME (UTC)', render: r => <span className="muted">{r.ts}</span> }, { key: 'id', label: 'ORDER' }, { key: 'v', label: 'VENUE', render: r => <Chip>{r.v}</Chip> }, { key: 'sym', label: 'SYMBOL', render: r => <b>{r.sym}</b> }, { key: 'side', label: 'SIDE', render: r => SIDE(r.side) }, { key: 'q', label: 'QTY', num: true }, { key: 'px', label: 'PRICE', num: true }, { key: 'st', label: 'STATUS', render: r => <SquareTag tone={ORD_ST[r.st]}>● {r.st}</SquareTag> }]}
        rows={[{ id: 'o-88412', ts: '16:58:12.402', v: x.venues[0], sym: 'BTCUSDT', side: 'buy', q: '0.420', px: '101,284.5', st: 'FILLED' }, { id: 'o-88411', ts: '16:58:12.398', v: x.venues[0], sym: 'BTCUSDT-PERP', side: 'sell', q: '0.420', px: '101,322.0', st: 'FILLED' }, { id: 'o-88409', ts: '16:57:03.114', v: x.venues[x.venues.length - 1], sym: 'ETHUSDT', side: 'buy', q: '12.00', px: '3,412.8', st: 'PARTIAL' }, { id: 'o-88407', ts: '16:55:41.020', v: x.venues[0], sym: 'BTCUSDT-PERP', side: 'sell', q: '0.150', px: '101,410.0', st: 'WORKING' }, { id: 'o-88402', ts: '16:51:03.877', v: x.venues[0], sym: 'ETHUSDT-PERP', side: 'sell', q: '4.00', px: '3,409.1', st: 'CANCELED' }]}/></PmsCard>}
    </TopicSection>
  </>;
}

const CREATE_STEPS = [['identity', 'Identity', 'Name, category, description'], ['params', 'Investment parameters', 'Fees, hurdle, limits, ops token'], ['legs', 'Legs · pools & roles', 'One pool per venue, allocation %'], ['wiring', 'Bot wiring', 'One bot per leg'], ['networks', 'Deposit networks', 'Chains clients may deposit on'], ['review', 'Review & create', 'Confirm and provision']];
function StrategyCreate() {
  const [i, setI] = useState(0);
  const [v, setV] = useState({ name: '', cat: '', desc: '', hurdle: '5', perf: '20', mgmt: '2', lock: '30', min: '1000', limit: '5000000', token: 'USDT', buy: '0.10', sell: '0.10', visible: true, legs: [{ pool: 'Binance · spot', role: 'spot', pct: '50' }, { pool: 'Binance · USDⓈ-M', role: 'perp', pct: '50' }], nets: { 'ETH': true, 'TRON': true, 'BSC': false, 'ARB': false } });
  const [done, setDone] = useState(false);
  const set = (k, x) => setV(o => ({ ...o, [k]: x }));
  const valid = { identity: v.name && v.cat, params: v.hurdle && v.perf && v.mgmt, legs: v.legs.reduce((a, l) => a + +l.pct, 0) === 100, wiring: true, networks: Object.values(v.nets).some(Boolean), review: true };
  const step = CREATE_STEPS[i];
  if (done) return <PmsCard title="Strategy created"><div style={{ textAlign: 'center', padding: '24px 0' }}><div className="pos" style={{ fontSize: 28 }}>✓</div><p style={{ fontWeight: 700, marginTop: 8 }}>{v.name} provisioned</p><p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{v.legs.length} pools · bot wiring queued · design mock, no command yet</p><div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}><PmsButton onClick={() => navigate('/strategies')}>All strategies</PmsButton></div></div></PmsCard>;
  return <>
    <a className="muted" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/strategies')}>‹ All strategies</a>
    <div className="page-head"><div><h1>New strategy</h1><p className="page-head__sub">Six steps · the create wizard still runs on mocks</p></div></div>
    <div className="wiz-grid">
      <ol style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{CREATE_STEPS.map(([id, t, d], k) => <li key={id} onClick={() => k <= i && setI(k)} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: k <= i ? 'pointer' : 'default', background: k === i ? 'rgba(168,74,255,.12)' : 'transparent', border: '1px solid ' + (k === i ? 'rgba(168,74,255,.35)' : 'transparent') }}>
        <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flex: '0 0 22px', background: k < i && valid[id] ? 'rgba(104,218,152,.18)' : k === i ? '#a84aff' : 'rgba(255,255,255,.06)', color: k < i && valid[id] ? 'var(--system-success-500)' : '#fff' }}>{k < i && valid[id] ? '✓' : k + 1}</span>
        <span><span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: k === i ? '#fff' : 'var(--neutral-90)' }}>{t}</span><span className="muted" style={{ fontSize: 10.5 }}>{d}</span></span></li>)}</ol>
      <PmsCard title={step[1]}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step[0] === 'identity' && <><Field label="Name" req><Input value={v.name} onChange={x => set('name', x)} placeholder="BTC-Basis-Q1"/></Field><Field label="Category" req hint="Same trading logic — one strategy per venue can share a category"><Select value={v.cat} onChange={x => set('cat', x)} options={[{ v: '', l: 'Select category…' }, 'Funding arbitrage', 'Spot–perp basis', 'Market making']}/></Field><Field label="Description"><Textarea value={v.desc} onChange={x => set('desc', x)} placeholder="What this strategy does, for the client app"/></Field></>}
          {step[0] === 'params' && <><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Hurdle rate (annual)" req><Input value={v.hurdle} onChange={x => set('hurdle', x)} suffix="%"/></Field><Field label="Performance fee" req><Input value={v.perf} onChange={x => set('perf', x)} suffix="%"/></Field>
            <Field label="Management fee (annual)" req><Input value={v.mgmt} onChange={x => set('mgmt', x)} suffix="%"/></Field><Field label="Lock period (days)" req><Input value={v.lock} onChange={x => set('lock', x)}/></Field>
            <Field label="Min amount" req><Input value={v.min} onChange={x => set('min', x)} suffix={v.token}/></Field><Field label="Total limit" req><Input value={v.limit} onChange={x => set('limit', x)} suffix={v.token}/></Field>
            <Field label="Ops token" req hint="Stablecoin the strategy operates in · drives deposit networks"><Select value={v.token} onChange={x => set('token', x)} options={['USDT', 'USDC']}/></Field><div></div>
            <Field label="Client buy fee" req hint="Charged to client per buy · spread over venue fee is firm revenue"><Input value={v.buy} onChange={x => set('buy', x)} suffix="%"/></Field><Field label="Client sell fee" req><Input value={v.sell} onChange={x => set('sell', x)} suffix="%"/></Field>
          </div><Switch label="Visible to clients" checked={v.visible} onChange={x => set('visible', x)}/></>}
          {step[0] === 'legs' && <>{v.legs.map((l, k) => <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 110px', gap: 10, padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)' }}><Field label={`Leg ${k + 1} · pool`}><Select value={l.pool} onChange={x => set('legs', v.legs.map((y, j) => j === k ? { ...y, pool: x } : y))} options={['Binance · spot', 'Binance · USDⓈ-M', 'OKX · spot', 'OKX · swap', 'Bybit · unified']}/></Field><Field label="Role"><Select value={l.role} onChange={x => set('legs', v.legs.map((y, j) => j === k ? { ...y, role: x } : y))} options={['spot', 'perp', 'hedge']}/></Field><Field label="Allocation"><Input value={l.pct} onChange={x => set('legs', v.legs.map((y, j) => j === k ? { ...y, pct: x } : y))} suffix="%"/></Field></div>)}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><PmsButton variant="ghost" onClick={() => set('legs', [...v.legs, { pool: 'OKX · spot', role: 'hedge', pct: '0' }])}>+ Add leg</PmsButton><span className={`mono ${valid.legs ? 'pos' : 'warn'}`} style={{ fontSize: 12 }}>Total {v.legs.reduce((a, l) => a + +l.pct, 0)}% / 100%</span></div></>}
          {step[0] === 'wiring' && <PmsTable columns={[{ key: 'pool', label: 'LEG', sans: true }, { key: 'role', label: 'ROLE' }, { key: 'bot', label: 'BOT ID', render: r => <span className="muted">auto · {r.bot}</span> }, { key: 'k', label: 'BOT STRATEGY', render: () => v.cat ? v.cat.toLowerCase().replace(/[^a-z]+/g, '_') : NO }]} rows={v.legs.map((l, k) => ({ id: k, ...l, bot: `new-${k + 1}` }))}/>}
          {step[0] === 'networks' && <PmsTable columns={[{ key: 'on', label: '', render: r => <Switch checked={v.nets[r.id]} onChange={x => set('nets', { ...v.nets, [r.id]: x })}/> }, { key: 'id', label: 'NETWORK' }, { key: 'tok', label: 'TOKEN' }, { key: 'conf', label: 'CONFIRMATIONS', num: true }]} rows={Object.keys(v.nets).map(n => ({ id: n, tok: v.token, conf: { ETH: 12, TRON: 20, BSC: 15, ARB: 20 }[n] }))}/>}
          {step[0] === 'review' && <dl className="dl">{[['Name', v.name || NO], ['Category', v.cat || NO], ['Fees', `perf ${v.perf}% · mgmt ${v.mgmt}% · hurdle ${v.hurdle}%`], ['Limits', `${v.min}–${v.limit} ${v.token}`], ['Client fees', `buy ${v.buy}% · sell ${v.sell}%`], ['Legs', v.legs.map(l => `${l.pool} ${l.pct}%`).join(' · ')], ['Networks', Object.keys(v.nets).filter(n => v.nets[n]).join(', ')], ['Visible to clients', v.visible ? 'yes' : 'no']].map(([k, x]) => <React.Fragment key={k}><dt>{k}</dt><dd>{x}</dd></React.Fragment>)}</dl>}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 12 }}>{i === 0 ? <PmsButton variant="ghost" onClick={() => navigate('/strategies')}>Cancel</PmsButton> : <PmsButton variant="ghost" onClick={() => setI(i - 1)}>← Back</PmsButton>}{i < 5 ? <PmsButton variant="primary" disabled={!valid[step[0]]} onClick={() => setI(i + 1)}>Continue →</PmsButton> : <PmsButton variant="primary" onClick={() => setDone(true)}>Create strategy</PmsButton>}</div>
        </div>
      </PmsCard>
      <PmsCard title="Summary"><dl className="dl" style={{ fontSize: 11 }}>{[['Name', v.name || NO], ['Category', v.cat || NO], ['Perf / mgmt', `${v.perf}% / ${v.mgmt}%`], ['Ops token', v.token], ['Legs', v.legs.length], ['Networks', Object.values(v.nets).filter(Boolean).length]].map(([k, x]) => <React.Fragment key={k}><dt>{k}</dt><dd>{x}</dd></React.Fragment>)}</dl></PmsCard>
    </div>
  </>;
}

function StrategiesPage({ segs }) {
  const [a, b] = segs;
  if (a === 'new') return <section className="basic-page"><StrategyCreate/></section>;
  if (a && a !== 'bots') return <section className="basic-page"><StrategyDetails id={a} tab={b}/></section>;
  return <section className="tab-page"><PmsTabs tabs={[{ id: 'list', label: 'Strategies' }, { id: 'bots', label: 'Bots & sagas', badge: { v: '1', kind: 'warn' } }]} active={a === 'bots' ? 'bots' : 'list'} onChange={id => navigate(id === 'bots' ? '/strategies/bots' : '/strategies')}/>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{a === 'bots' ? <BotsSagas/> : <StrategiesList/>}</div></section>;
}
Object.assign(window, { StrategiesPage, SIDE, ORD_ST, fmtDur, Chip, BotStatus });
