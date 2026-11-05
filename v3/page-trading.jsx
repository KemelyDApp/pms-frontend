/* v3 Trading — mirrors pages/Trading (Positions · Orders & executions · P&L attribution). */
const VEN = ['Binance', 'OKX', 'Bybit'];
const POS = [
  { id: 1, asset: 'BTC', sym: 'BTCUSDT', it: 'spot', v: 'Binance', side: 'long', qty: 21.14, entry: 99820, mark: 101284.5, lev: null, strat: 1, cat: 'Funding arbitrage', exp: 18 },
  { id: 2, asset: 'BTC', sym: 'BTCUSDT', it: 'perp', v: 'Binance', side: 'short', qty: -21.12, entry: 99905, mark: 101331, lev: 2.0, strat: 1, cat: 'Funding arbitrage', exp: -18 },
  { id: 3, asset: 'ETH', sym: 'ETH-USDT', it: 'spot', v: 'OKX', side: 'long', qty: 640.2, entry: 3361.2, mark: 3412.8, lev: null, strat: 2, cat: 'Funding arbitrage', exp: 11.5 },
  { id: 4, asset: 'ETH', sym: 'ETH-USDT-SWAP', it: 'perp', v: 'OKX', side: 'short', qty: -639.8, entry: 3366, mark: 3415.1, lev: 2.0, strat: 2, cat: 'Funding arbitrage', exp: -11.5 },
  { id: 5, asset: 'SOL', sym: 'SOLUSDT', it: 'spot', v: 'Bybit', side: 'long', qty: 8120, entry: 186.1, mark: 182.44, lev: null, strat: 3, cat: 'Spot–perp basis', exp: 7.8, stale: true },
  { id: 6, asset: 'SOL', sym: 'SOLUSDT', it: 'perp', v: 'Binance', side: 'short', qty: -8100, entry: 186.4, mark: 182.71, lev: 3.0, strat: 3, cat: 'Spot–perp basis', exp: -7.8 },
  { id: 7, asset: 'DOGE', sym: 'DOGEUSDT', it: 'perp', v: 'Bybit', side: 'long', qty: 4.0e5, entry: 0.405, mark: 0.4122, lev: 1.5, strat: 4, cat: 'Market making', exp: 0.9 },
].map(p => { const n = p.qty * p.mark, u = (p.mark - p.entry) * p.qty; return { ...p, notional: n, upnl: u, upct: u / Math.abs(p.entry * p.qty) * 100 }; });
const CLOSED = [['2026-11-05 16:41:02', 'ETHUSDT · perp', 'Binance', 'short', 184000, 942, 0.51, 22, 31, 'take_profit', 208, 'Funding Arb · Binance'], ['2026-11-05 16:12:18', 'AVAX-USDT · perp', 'OKX', 'short', 320000, 2140, 0.67, 48, 120, 'trailing_stop', 162, 'Funding Arb · OKX'], ['2026-11-05 15:34:08', 'SOLUSDT · spot', 'Bybit', 'long', 168000, -624, -0.37, 30, 0, 'stop_loss', 108, 'Basis Carry · Bybit'], ['2026-11-05 14:28:42', 'BTCUSDT · perp', 'Binance', 'long', 240000, 318, 0.13, 36, 12, 'timeout', 494, 'Cross-venue MM'], ['2026-11-05 13:08:02', 'BTCUSDT · perp', 'Binance', 'short', 240000, 184, 0.08, 36, 18, 'fund_release', 304, 'Funding Arb · Binance']];
const EXIT = { take_profit: 'Take profit', stop_loss: 'Stop loss', trailing_stop: 'Trailing stop', timeout: 'Timeout', fund_release: 'Fund release' };
const fmtPx = n => n >= 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 1 }) : n >= 1 ? n.toFixed(2) : n.toPrecision(4);
const SideTxt = ({ s }) => <span className={s === 'long' ? 'pos' : 'neg'} style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: 11 }}>{s}</span>;
const VenueCell = ({ v }) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: '50%', background: { Binance: '#F0B90B', OKX: '#E4E3E8', Bybit: '#F7A600' }[v] || '#5F5C70', opacity: .85 }}></span>{v}</span>;

function NewOrderModal({ open, onClose }) {
  const [f, setF] = useState({ strat: '1', venue: 'Binance', sym: 'BTCUSDT', side: 'buy', type: 'LIMIT', qty: '', px: '' });
  const [code, setCode] = useState('');
  const s = (k, v) => setF(o => ({ ...o, [k]: v }));
  return <PmsModal open={open} title="New order" onClose={onClose} foot={<><PmsButton variant="ghost" onClick={onClose}>Cancel</PmsButton><PmsButton variant="primary" reason={NOT_SERVED + ' (order.create · phase 2)'}>Submit order</PmsButton></>}>
    <div className="note note--info">order.create is phase 2: the form is wired to the final schema and stays disabled until the backend serves it.</div>
    <div className="frow"><Field label="Strategy" req><Select value={f.strat} onChange={v => s('strat', v)} options={V3.STRATS.map(x => ({ v: String(x.id), l: x.name }))}/></Field><Field label="Venue" req><Select value={f.venue} onChange={v => s('venue', v)} options={VEN}/></Field></div>
    <div className="frow"><Field label="Symbol" req><Input value={f.sym} onChange={v => s('sym', v)} mono/></Field><Field label="Side" req><Seg options={['buy', 'sell']} value={f.side} onChange={v => s('side', v)}/></Field></div>
    <div className="frow"><Field label="Type" req><Seg options={['LIMIT', 'MARKET']} value={f.type} onChange={v => s('type', v)}/></Field><Field label="Quantity" req><Input value={f.qty} onChange={v => s('qty', v)} placeholder="0" mono/></Field>{f.type === 'LIMIT' && <Field label="Limit price" req><Input value={f.px} onChange={v => s('px', v)} prefix="$" mono/></Field>}</div>
    <Field label="Authenticator code" req><TotpCodeInput value={code} onChange={setCode}/></Field>
  </PmsModal>;
}
function HedgeModal({ open, onClose }) {
  const [asset, setAsset] = useState('BTC');
  const [venue, setVenue] = useState('Binance');
  const net = POS.filter(p => p.asset === asset).reduce((a, p) => a + p.qty, 0);
  return <PmsModal open={open} title="Hedge calculator" onClose={onClose} foot={<><PmsButton variant="ghost" onClick={onClose}>Close</PmsButton><PmsButton variant="primary" reason={NOT_SERVED + ' (hedge.stage · phase 2)'}>Stage hedge order</PmsButton></>}>
    <p className="muted" style={{ fontSize: 12 }}>Net delta from open positions, and the order that would neutralise it.</p>
    <div className="frow"><Field label="Asset"><Select value={asset} onChange={setAsset} options={[...new Set(POS.map(p => p.asset))]}/></Field><Field label="Hedge venue"><Select value={venue} onChange={setVenue} options={VEN}/></Field></div>
    <dl className="dl note">{[['Net exposure', `${net.toFixed(4)} ${asset}`], ['Hedge side', net >= 0 ? 'SELL (short perp)' : 'BUY'], ['Hedge quantity', `${Math.abs(net).toFixed(4)} ${asset}`], ['Instrument', `${asset}USDT perp · ${venue}`], ['Resulting net delta', '≈ 0']].map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
  </PmsModal>;
}
function Positions() {
  const [cat, setCat] = useState('all');
  const [f, setF] = useState({ status: 'open', venue: 'all', asset: 'all', hedged: false, zero: false });
  const [modal, setModal] = useState(null);
  const cats = [...new Set(POS.map(p => p.cat))];
  const open = POS.filter(p => (cat === 'all' || p.cat === cat) && (f.venue === 'all' || p.v === f.venue) && (f.asset === 'all' || p.asset === f.asset));
  const gross = POS.reduce((a, p) => a + Math.abs(p.notional), 0), net = POS.reduce((a, p) => a + p.notional, 0), up = POS.reduce((a, p) => a + p.upnl, 0);
  const maxExp = Math.max(...POS.map(p => Math.abs(p.exp)));
  return <>
    <div className="page-head"><div><h1>Positions &amp; exposures</h1><p className="page-head__sub">{POS.length} open · {fmtUsdCompact(gross)} gross · net {fmtSigned(net)} · {V3.STRATS.length} strategies</p></div>
      <div className="page-head__acts"><PmsButton reason={NOT_SERVED + ' (export.csv · phase 2)'}><Icon n="download"/>Export</PmsButton><PmsButton onClick={() => setModal('hedge')}>Hedge calculator</PmsButton><PmsButton variant="primary" reason={NOT_SERVED + ' (order.create · phase 2)'}>+ New order</PmsButton></div></div>
    <div className="kpi-row"><KpiCard label="Gross notional" val={fmtUsdCompact(gross)} sub={`${POS.length} positions`}/><KpiCard label="Net exposure" val={fmtSigned(net)} sub="hedged pairs net to ≈ 0"/><KpiCard label="Unrealized P&L" val={fmtSigned(up)} tone={up >= 0 ? 'positive' : 'negative'} sub="mark-to-market"/><KpiCard label="Hedged pairs" val="3" sub="spot + perp same asset"/><KpiCard label="Stale marks" val="1" tone="warning" sub="Bybit · SOLUSDT"/></div>
    <PmsCard flush>
      <div style={{ padding: '0 16px' }}><PmsTabs tabs={[{ id: 'all', label: 'All', badge: { v: String(POS.length), kind: 'count' } }, ...cats.map(c => ({ id: c, label: c, badge: { v: String(POS.filter(p => p.cat === c).length), kind: 'count' } }))]} active={cat} onChange={setCat}/></div>
      <div className="filters" style={{ padding: '10px 16px', justifyContent: 'space-between' }}><div className="filters">
        <FilterDropdown label="Status" value={f.status} options={[{ v: 'open', l: 'Open' }, { v: 'closed', l: 'Closed' }, { v: 'all', l: 'All' }]} onChange={v => setF({ ...f, status: v })}/>
        <FilterDropdown label="Venue" value={f.venue} options={[{ v: 'all', l: 'All venues' }, ...VEN]} onChange={v => setF({ ...f, venue: v })}/>
        <FilterDropdown label="Asset" value={f.asset} options={[{ v: 'all', l: 'All assets' }, ...new Set(POS.map(p => p.asset))]} onChange={v => setF({ ...f, asset: v })}/>
        <Switch label="Hedged pairs only" checked={f.hedged} onChange={v => setF({ ...f, hedged: v })}/></div>
        <Switch label="Show ~0 positions" checked={f.zero} onChange={v => setF({ ...f, zero: v })}/></div>
      <TopicSection>
        {f.status !== 'closed' && <>{f.status === 'all' && <p className="pms-card__title" style={{ padding: '6px 16px' }}>Open</p>}<PmsTable columns={[
          { key: 'asset', label: 'ASSET', render: r => <b>{r.asset}</b> }, { key: 'sym', label: 'INSTRUMENT', render: r => `${r.sym} · ${r.it}` }, { key: 'v', label: 'VENUE', render: r => <VenueCell v={r.v}/> }, { key: 'side', label: 'SIDE', render: r => <SideTxt s={r.side}/> },
          { key: 'qty', label: 'QTY', num: true, sortable: true, render: r => <span className={r.qty < 0 ? 'neg' : ''}>{r.qty.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span> }, { key: 'entry', label: 'ENTRY', num: true, render: r => fmtPx(r.entry) },
          { key: 'mark', label: 'MARK', num: true, render: r => <span>{fmtPx(r.mark)}{r.stale && <span className="warn" style={{ marginLeft: 6, fontSize: 10 }}>stale</span>}</span> }, { key: 'notional', label: 'NOTIONAL', num: true, sortable: true, sortVal: r => Math.abs(r.notional), render: r => fmtUsd(Math.abs(r.notional)) },
          { key: 'lev', label: 'LEV', num: true, render: r => r.lev ? r.lev.toFixed(1) + '×' : NO }, { key: 'upnl', label: 'UPNL', num: true, sortable: true, render: r => <span className={tone(r.upnl)}>{fmtSigned(r.upnl)}</span> },
          { key: 'upct', label: '%', num: true, render: r => <DeltaTag pct={r.upct}/> }, { key: 'exp', label: '% EXPOSURE', num: true, width: 120, render: r => <ProgressBar value={Math.abs(r.exp) / maxExp * 100} color="#B06CFF"/> }]} rows={open}/></>}
        {f.status !== 'open' && <>{f.status === 'all' && <p className="pms-card__title" style={{ padding: '10px 16px 6px', borderTop: '1px solid rgba(255,255,255,.06)' }}>Closed</p>}<PmsTable columns={[
          { key: 0, label: 'CLOSED (UTC)', render: r => r[0] }, { key: 1, label: 'INSTRUMENT', render: r => r[1] }, { key: 2, label: 'VENUE', render: r => <VenueCell v={r[2]}/> }, { key: 3, label: 'SIDE', render: r => <SideTxt s={r[3]}/> },
          { key: 4, label: 'NOTIONAL', num: true, render: r => fmtUsd(r[4]) }, { key: 5, label: 'NET P&L', num: true, render: r => <span className={tone(r[5])}>{fmtSigned(r[5])}</span> }, { key: 6, label: '%', num: true, render: r => `${r[6] >= 0 ? '+' : ''}${r[6].toFixed(2)}%` },
          { key: 7, label: 'FEES', num: true, render: r => <span className="neg">{fmtSigned(-r[7])}</span> }, { key: 8, label: 'FUNDING', num: true, render: r => r[8] ? <span className="pos">{fmtSigned(r[8])}</span> : NO }, { key: 9, label: 'EXIT', render: r => EXIT[r[9]] }, { key: 10, label: 'DURATION', num: true, render: r => fmtDur(r[10]) }, { key: 11, label: 'STRATEGY', render: r => <span className="muted">{r[11]}</span> }]} rows={CLOSED.map((r, i) => Object.assign(r, { id: i }))}/></>}
      </TopicSection>
    </PmsCard>
    <NewOrderModal open={modal === 'order'} onClose={() => setModal(null)}/>
    <HedgeModal open={modal === 'hedge'} onClose={() => setModal(null)}/>
  </>;
}
function DangerCmd({ open, title, body, phrase, cmd, onClose }) {
  const [code, setCode] = useState(''), [typed, setTyped] = useState('');
  useEffect(() => { setCode(''); setTyped(''); }, [open]);
  return <PmsModal open={open} title={title} onClose={onClose} foot={<><PmsButton variant="ghost" onClick={onClose}>Cancel</PmsButton><PmsButton variant="danger" reason={`${NOT_SERVED} (${cmd} · phase 2)`}>{title}</PmsButton></>}>
    <div className="note note--neg">{body}</div>
    {phrase && <Field label={<>Type <span className="mono neg">{phrase}</span> to confirm</>} req><Input value={typed} onChange={setTyped} placeholder={phrase} mono/></Field>}
    <Field label="Authenticator code" req hint="Fresh code required · the server's error is shown as is"><TotpCodeInput value={code} onChange={setCode}/></Field>
  </PmsModal>;
}
function Orders({ live }) {
  const [f, setF] = useState({ status: 'all', venue: 'all', strat: 'all' });
  const [modal, setModal] = useState(null);
  const { preview } = usePreviewRole();
  const rows = [['16:58:12.402', 'o-88412', 'Binance', 'BTCUSDT', 'buy', 'LIMIT', '0.420', '101,284.5', 'FILLED', 1, '$4.25'], ['16:58:12.398', 'o-88411', 'Binance', 'BTCUSDT-PERP', 'sell', 'LIMIT', '0.420', '101,322.0', 'FILLED', 1, '$8.51'], ['16:57:40.120', 'o-88410', 'OKX', 'ETH-USDT', 'buy', 'LIMIT', '12.00', '3,412.8', 'FILLED', 2, '$4.10'], ['16:57:03.114', 'o-88409', 'Bybit', 'SOLUSDT', 'buy', 'LIMIT', '40.0 / 120', '182.40', 'PARTIAL', 3, '$1.82'], ['16:55:41.020', 'o-88407', 'Binance', 'BTCUSDT-PERP', 'sell', 'LIMIT', '0.150', '101,410.0', 'WORKING', 1, NO], ['16:54:12.880', 'o-88405', 'OKX', 'ETH-USDT-SWAP', 'sell', 'MARKET', '12.00', '3,415.1', 'FILLED', 2, '$12.30'], ['16:51:03.877', 'o-88402', 'Binance', 'ETHUSDT-PERP', 'sell', 'LIMIT', '4.00', '3,409.1', 'CANCELED', 3, NO]]
    .map(r => ({ id: r[1], ts: r[0], v: r[2], sym: r[3], side: r[4], type: r[5], qty: r[6], px: r[7], st: r[8], strat: r[9], fee: r[10] }))
    .filter(r => (f.status === 'all' || r.st === f.status) && (f.venue === 'all' || r.v === f.venue) && (f.strat === 'all' || String(r.strat) === f.strat));
  const stream = live ? ['pos', 'Streaming'] : ['neg', 'Offline'];
  return <>
    <div className="page-head"><div><h1>Orders &amp; executions</h1><p className="page-head__sub">Live blotter · 7 orders · 4 filled · 1 partial · 1 working · 1 canceled</p></div>
      <div className="page-head__acts"><span className={`${stream[0]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}><StatusDot color="currentColor" glow={live}/>{stream[1]}</span>
        <PmsButton variant="ghost" reason={!can(preview, 'strategies.write') ? 'Needs strategies.write' : NOT_SERVED + ' (bot.pause · phase 2)'} onClick={() => setModal('pause')}>Pause</PmsButton>
        <PmsButton variant="danger" onClick={() => setModal('cancel')}>Cancel all</PmsButton></div></div>
    <PmsCard flush>
      <div className="filters" style={{ padding: '10px 16px', justifyContent: 'space-between' }}><div className="filters">
        <FilterDropdown label="Status" value={f.status} options={[{ v: 'all', l: 'All status' }, 'WORKING', 'PARTIAL', 'FILLED', 'CANCELED']} onChange={v => setF({ ...f, status: v })}/>
        <FilterDropdown label="Venue" value={f.venue} options={[{ v: 'all', l: 'All venues' }, ...VEN]} onChange={v => setF({ ...f, venue: v })}/>
        <FilterDropdown label="Strategy" value={f.strat} options={[{ v: 'all', l: 'All strategies' }, ...V3.STRATS.map(s => ({ v: String(s.id), l: s.name }))]} onChange={v => setF({ ...f, strat: v })}/></div>
        <span className="muted mono" style={{ fontSize: 10.5 }}>Last update 16:58:12.402 UTC</span></div>
      <TopicSection><PmsTable columns={[
        { key: 'ts', label: 'TIME (UTC)', render: r => <span className="muted">{r.ts}</span> }, { key: 'id', label: 'ORDER ID' }, { key: 'v', label: 'VENUE', render: r => <VenueCell v={r.v}/> }, { key: 'sym', label: 'SYMBOL', render: r => <b>{r.sym}</b> },
        { key: 'side', label: 'SIDE', render: r => SIDE(r.side) }, { key: 'type', label: 'Type' }, { key: 'qty', label: 'Qty', num: true }, { key: 'px', label: 'Price', num: true },
        { key: 'st', label: 'STATUS', render: r => <SquareTag tone={ORD_ST[r.st]}>● {r.st}</SquareTag> }, { key: 'strat', label: 'STRATEGY', render: r => <SquareTag tone="accent">{V3.STRATS.find(s => s.id === r.strat).name}</SquareTag> },
        { key: 'fee', label: 'FEES', num: true, render: r => <span className="muted">{r.fee}</span> },
        { key: 'a', label: '', render: r => ['WORKING', 'PARTIAL'].includes(r.st) ? <PmsButton sm variant="danger" reason={NOT_SERVED + ' (order.cancel · phase 2)'}>Cancel</PmsButton> : <span className="muted">{NO}</span> }]} rows={rows}/></TopicSection>
    </PmsCard>
    <DangerCmd open={modal === 'pause'} title="Pause all bots" cmd="bot.pause" body="Stops every bot from placing new orders. Open positions and working orders are left as they are." onClose={() => setModal(null)}/>
    <DangerCmd open={modal === 'cancel'} title="Cancel ALL working orders" cmd="orders.cancel_all" phrase="CANCEL ALL" body="Cancels every WORKING and PARTIAL order across all venues. Bots may re-submit unless paused; hedged legs may be left one-sided." onClose={() => setModal(null)}/>
  </>;
}
function PnlAttr() {
  const [span, setSpan] = useState('30D');
  const d = { '7D': 7, '30D': 30, '90D': 90, 'YTD': 120 }[span];
  const daily = V3.pnlSeries(d, 31 + d);
  let c = 0; const cum = daily.map(p => ({ date: p.date, value: (c += p.value) }));
  const by = [[1, 'Funding Arb · Binance', 18400, 46200, -2100, -3800], [2, 'Funding Arb · OKX', 11200, 27400, 900, -2600], [3, 'Basis Carry · Bybit', -6200, 8100, -9400, -1900], [4, 'Cross-venue MM', 14800, 0, -1100, -2200]].map(r => ({ id: r[0], name: r[1], b: r[2], f: r[3], dir: r[4], fee: r[5], net: r[2] + r[3] + r[4] + r[5] }));
  const tot = by.reduce((a, r) => a + r.net, 0);
  const sum = k => by.reduce((a, r) => a + r[k], 0);
  return <>
    <div className="page-head"><div><h1>P&amp;L attribution</h1><p className="page-head__sub">Since {cum[0].date} · cumulative {fmtSigned(tot)}</p></div><div className="page-head__acts"><Seg options={['7D', '30D', '90D', 'YTD']} value={span} onChange={setSpan}/><PmsButton reason={NOT_SERVED + ' (export.pdf · phase 2)'}><Icon n="download"/>Export PDF</PmsButton></div></div>
    <TopicSection>
      <div className="kpi-row"><KpiCard featured label="Net realized P&L" val={fmtSigned(tot)} tone="positive" sub={span}/><KpiCard label="Basis / spread" val={fmtSigned(sum('b'))} tone="positive" sub={`${(sum('b') / tot * 100).toFixed(0)}% of total`}/><KpiCard label="Funding" val={fmtSigned(sum('f'))} tone="positive" sub={`${(sum('f') / tot * 100).toFixed(0)}% of total`}/><KpiCard label="Directional" val={fmtSigned(sum('dir'))} tone="negative" sub="residual delta"/><KpiCard label="Fees" val={fmtSigned(sum('fee'))} tone="negative" sub="venue + network"/></div>
      <div className="grid12"><div style={{ gridColumn: '1 / 9' }}><PmsCard title="Cumulative realized P&L" meta={span}><PmsChart data={cum} color="#68DA98" height={220}/></PmsCard></div><div style={{ gridColumn: '9 / -1' }}><PmsCard title="Daily P&L distribution"><PmsChart data={daily} variant="bar" height={220}/></PmsCard></div>
        <div style={{ gridColumn: '1 / -1' }}><PmsCard title="Attribution by strategy" meta={span} flush><PmsTable columns={[{ key: 'name', label: 'STRATEGY', sans: true, render: r => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><ColorDot color={stratColor(r.id)}/>{r.name}</span> }, ...[['b', 'BASIS / SPREAD'], ['f', 'FUNDING'], ['dir', 'DIRECTIONAL'], ['fee', 'FEES']].map(([k, l]) => ({ key: k, label: l, num: true, render: r => <span className={tone(r[k])}>{fmtSigned(r[k])}</span> })), { key: 'net', label: 'NET', num: true, render: r => <b className={tone(r.net)}>{fmtSigned(r.net)}</b> }, { key: 'pct', label: '% TOTAL', num: true, render: r => (r.net / tot * 100).toFixed(1) + '%' }]} rows={by}/></PmsCard></div></div>
    </TopicSection>
  </>;
}
function TradingPage({ segs, live }) {
  const t = segs[0] || 'positions';
  return <section className="tab-page"><PmsTabs tabs={[{ id: 'positions', label: 'Positions' }, { id: 'orders', label: 'Orders & executions', badge: live ? { v: 'LIVE', kind: 'info' } : undefined }, { id: 'pnl', label: 'P&L attribution' }]} active={t} onChange={id => navigate('/trading/' + id)}/>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{t === 'orders' ? <Orders live={live}/> : t === 'pnl' ? <PnlAttr/> : <Positions/>}</div></section>;
}
Object.assign(window, { TradingPage, VenueCell });
