/* v3 TradeSim Hub — mirrors pages/TradeSimHub (header + Data collection + Live simulation + Spot vs perp basis). */
function TsPanel({ title, tag, subtitle, right, children }) {
  return <section className="pms-card" style={{ padding: '16px 18px', gap: 14, display: 'flex', flexDirection: 'column' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
      <div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><h2 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>{tag}</div>{subtitle && <p className="muted" style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.55, maxWidth: 900 }}>{subtitle}</p>}</div>
      {right && <div style={{ flex: '0 0 auto' }}>{right}</div>}
    </header>{children}
  </section>;
}
const Stats = ({ val, sub, color }) => <div><p className="mono" style={{ fontSize: 22, fontWeight: 700, color }}>{val}</p><p className="muted" style={{ fontSize: 10.5 }}>{sub}</p></div>;
const Dv = () => <div style={{ height: 1, background: 'rgba(255,255,255,.06)' }}></div>;
const Marker = ({ tag, label, val, sub }) => <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--neutral-90)' }}>{tag}{label}</div><p className="mono" style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{val}</p><p className="muted" style={{ fontSize: 10 }}>{sub}</p></div>;
const MarkerC = ({ tag, label, val, warn }) => <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, background: warn ? 'rgba(255,155,79,.08)' : 'rgba(255,255,255,.03)', fontSize: 11 }}>{tag}<span className="mono" style={{ flex: 1, color: 'var(--neutral-90)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span><span className={`mono ${warn ? 'warn' : 'muted'}`}>{val}</span></div>;

function DataCollection() {
  const workers = [['binance-spot', 'ok', 8, 8, 412, 1], ['binance-usdm', 'ok', 6, 6, 318, 1], ['okx-spot', 'ok', 4, 4, 266, 2], ['okx-swap', 'degraded', 3, 4, 241, 14], ['bybit-linear', 'ok', 3, 3, 198, 1]];
  const loops = [['basis_refresh', 'ok', 12], ['funding_snapshot', 'ok', 41], ['live_results_rank', 'ok', 22], ['symbols_sync', 'ok', 380], ['fees_refresh', 'ok', 900], ['delistings_scan', 'stale', 1080]];
  const WC = { ok: 'var(--system-success-500)', degraded: 'var(--system-warning-500)', down: 'var(--system-error-500)' };
  const ev = V3.series(24, 52000, 0, 0.35, 21);
  return <TsPanel title="Data collection" tag={<SquareTag tone="pos">24/7</SquareTag>} subtitle="One recorder worker per venue stream · sharded websocket feeds">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 8 }}>{workers.map(([n, st, c, t, sy, age]) => <Marker key={n} tag={<StatusDot color={WC[st]}/>} label={n} val={`${c}/${t} shards`} sub={`${sy} symbols · ${age}s ago`}/>)}</div>
    <Dv/>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><h3 style={{ fontSize: 12, fontWeight: 700 }}>Background loops</h3><p className="muted" style={{ fontSize: 10.5 }}>per-loop heartbeat — a stuck refresh loop surfaces here within minutes</p></div><SquareTag tone="warn">DEGRADED</SquareTag></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 6 }}>{loops.map(([n, st, a]) => <MarkerC key={n} label={n} val={fmtAge(a)} tag={<StatusDot color={st === 'ok' ? WC.ok : WC.degraded}/>} warn={st !== 'ok'}/>)}</div>
    <Dv/>
    <div style={{ display: 'flex', gap: 40 }}><Stats val="1,435" sub="simulated symbols"/><Stats val="14" sub="exchange streams"/><Stats val="1.24M" sub="events · 24h"/><Stats val="96.1K/h" sub="peak"/></div>
    <Dv/>
    <div><p className="muted" style={{ fontSize: 10.5, marginBottom: 6 }}>Recorded events per hour · last 24h</p><PmsChart data={ev} variant="bar" height={90}/></div>
    <Dv/>
    <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><h3 style={{ fontSize: 12, fontWeight: 700 }}>Disk usage by table</h3><p className="muted" style={{ fontSize: 10.5 }}>total DB 412 GB</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 6 }}>{[['trades', 'hypertable', '188 GB'], ['book_ticks', 'hypertable', '141 GB'], ['funding_rates', 'hypertable', '22 GB'], ['simulations', 'table', '38 GB'], ['symbols', 'table', '12 MB'], ['delistings', 'table', '2 MB']].map(([t, k, p]) => <MarkerC key={t} label={t} val={p} tag={<SquareTag tone={k === 'hypertable' ? 'accent' : ''}>{k === 'hypertable' ? 'HT' : 'TBL'}</SquareTag>}/>)}</div></div>
  </TsPanel>;
}
function LiveSim() {
  const [page, setPage] = useState(0);
  const pairs = [['Binance', 'BTCUSDT', 2.84], ['OKX', 'ETH-USDT', 2.61], ['Binance', 'SOLUSDT', 2.4], ['Bybit', 'DOGEUSDT', 2.12], ['OKX', 'ARB-USDT', 1.98]];
  const variants = (seed) => { const r = V3.rnd(seed); return [0, 1, 2].map(i => ({ id: i, side: i % 2 ? 'sell' : 'buy', spread: (0.08 + i * 0.04).toFixed(2), stop: (0.3 + i * 0.1).toFixed(1), n: 3 + i, trades: Math.round(80 + r() * 200), tpd: 4 + r() * 9, act: 0.6 + r() * 0.35, ad: 24 + i, dd: 30, win: 0.55 + r() * 0.2, avg: (0.02 + r() * 0.05).toFixed(3), tot: (1.2 + r() * 6).toFixed(2), apy: 8 + r() * 30, mdd: 0.4 + r() * 2.2, p95: 2000 + r() * 40000, size: 4000 + r() * 30000, score: 0.9 - i * 0.07 - r() * 0.05 })); };
  return <TsPanel title="Live simulation" tag={<SquareTag tone="pos">REAL-TIME</SquareTag>} subtitle="Events detected and simulated automatically by the data recorder" right={<p className="muted mono" style={{ fontSize: 10.5 }}>Updated 8s ago</p>}>
    <div style={{ display: 'flex', gap: 40 }}><Stats val="42.8K" sub="market events"/><Stats val="18.4K" sub="simulations run" color="#B06CFF"/><Stats val="312" sub="symbols with events" color="#4EB5FF"/></div>
    <div><h3 style={{ fontSize: 12, fontWeight: 700 }}>Best parameter combinations</h3><p className="muted" style={{ fontSize: 10.5 }}>ranked by composite score · up to 5 variations per pair · win rate, drawdown, speed, frequency and APY blended 0-1</p></div>
    {pairs.slice(0, 3).map(([ex, sym, sc], k) => <div key={sym} style={{ border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(255,255,255,.06)' }}><SquareTag>{ex.toUpperCase()}</SquareTag><b className="mono" style={{ fontSize: 12 }}>{sym}</b><span className="muted" style={{ fontSize: 10.5, marginLeft: 'auto' }}>best score <b className="mono" style={{ color: '#c68eff' }}>{sc.toFixed(2)}</b></span></div>
      <PmsTable columns={[{ key: 'side', label: 'SIDE', render: v => <span className={v.side === 'sell' ? 'neg' : 'pos'}>{v.side}</span> }, { key: 'spread', label: 'SPREAD', render: v => v.spread + '%' }, { key: 'stop', label: 'STOP', render: v => v.stop + '%' }, { key: 'n', label: 'EXIT N', num: true }, { key: 'trades', label: 'TRADES', num: true }, { key: 'tpd', label: 'T/DAY', num: true, render: v => <span className="muted">{v.tpd.toFixed(1)}</span> }, { key: 'act', label: 'ACTIVITY', num: true, render: v => <span>{v.act.toFixed(2)} <span className="muted">({v.ad}/{v.dd}d)</span></span> }, { key: 'win', label: 'WIN %', num: true, render: v => <span className={v.win > 0.6 ? 'pos' : ''}>{(v.win * 100).toFixed(1)}%</span> }, { key: 'avg', label: 'AVG PNL', num: true, render: v => <span className="pos">{v.avg}%</span> }, { key: 'tot', label: 'TOTAL PNL', num: true, render: v => <span className="pos">{v.tot}%</span> }, { key: 'apy', label: 'APY', num: true, render: v => <span className="pos">{v.apy.toFixed(1)}%</span> }, { key: 'mdd', label: 'MAX DD', num: true, render: v => <span className={v.mdd > 2 ? 'warn' : ''}>{v.mdd.toFixed(2)}%</span> }, { key: 'p95', label: 'P95 HOLD', num: true, render: v => v.p95 > 60000 ? `${(v.p95 / 60000).toFixed(1)}m` : `${(v.p95 / 1000).toFixed(1)}s` }, { key: 'size', label: 'AVG SIZE', num: true, render: v => <span className="muted">${(v.size / 1000).toFixed(1)}K</span> }, { key: 'score', label: 'SCORE', num: true, render: v => <b style={{ color: '#c68eff' }}>{v.score.toFixed(3)}</b> }]} rows={variants(k + page * 7 + 3)}/>
    </div>)}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }} className="muted"><span>showing 3 of 312 pairs</span><span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><PmsButton sm variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>‹ Prev</PmsButton><span className="mono">{page + 1} / 104</span><PmsButton sm variant="ghost" onClick={() => setPage(page + 1)}>Next ›</PmsButton></span></div>
  </TsPanel>;
}
function SpotPerp() {
  const [venue, setVenue] = useState('ALL');
  const all = [[0, 'binance', 'BTCUSDT', '101,284.5', '101,331.0', 0.046, 0.0100, 8, 10.9, 0.2, 10.7, 9.8, 6.8, 0.92, 48e6, 1], [0, 'okx', 'ETH-USDT', '3,412.80', '3,415.10', 0.067, 0.0128, 8, 14.0, 0.2, 13.8, 12.1, 5.3, 0.88, 21e6, 1], [3, 'binance', 'SOLUSDT', '182.44', '182.71', 0.148, 0.0210, 8, 23.0, 0.2, 22.8, 18.4, 3.2, 0.81, 6.4e6, 1], [4, 'okx', 'DOGE-USDT', '0.4122', '0.4129', 0.170, 0.0180, 8, 19.7, 0.2, 19.5, 11.2, 3.7, 0.74, 2.1e6, 1], [5, 'binance', 'WLDUSDT', '2.311', '2.318', 0.303, 0.0420, 4, 92.0, 0.2, 91.8, null, 0.8, 0.66, 0.4e6, 1, true], [6, 'okx', 'PEPE-USDT', '0.0000192', '0.0000192', -0.010, -0.0040, 8, -4.4, 0.2, -4.6, null, null, 0.21, 0.9e6, 0]];
  const rows = all.filter(r => venue === 'ALL' || r[1] === venue.toLowerCase()).map(r => ({ id: r[1] + r[2], rank: r[0], venue: r[1], sym: r[2], spot: r[3], perp: r[4], basis: r[5], fr: r[6], fi: r[7], ann: r[8], fee: r[9], net: r[10], stable: r[11], be: r[12], score: r[13], cap: r[14], prof: r[15], delist: r[16] }));
  const yt = n => n == null ? 'muted' : n > 15 ? 'pos' : n > 0 ? '' : 'neg';
  return <TsPanel title="Spot vs perp basis" tag={<SquareTag>CASH-AND-CARRY</SquareTag>} right={<Seg options={['ALL', 'BINANCE', 'OKX']} value={venue} onChange={setVenue}/>}
    subtitle={<>Long spot + short perp, collect funding while the hedge stays market-neutral. <b>Funding</b> is the venue’s last rate for one funding interval. <b>Annual carry</b> = funding × funding periods per year. <b>Net annual</b> subtracts round-trip fees (Binance 0.20% / OKX 0.20%). <b>Capacity</b> is the smaller of the 5-minute spot and perp volume. BTC &amp; ETH pinned; the rest sorted by score.</>}>
    <div style={{ border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden' }}><PmsTable columns={[
      { key: 'rank', label: '#', render: r => r.rank === 0 ? <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#b06cff' }}></span> : <span className="muted">{r.rank}</span> },
      { key: 'venue', label: 'VENUE', render: r => <SquareTag tone={r.venue === 'binance' ? 'warn' : 'info'}>{r.venue.toUpperCase()}</SquareTag> },
      { key: 'sym', label: 'SYMBOL', render: r => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><b>{r.sym}</b>{r.delist && <span title="Delisting 2026-11-12 08:00 UTC"><SquareTag tone="neg">DELIST</SquareTag></span>}</span> },
      { key: 'spot', label: 'SPOT', num: true }, { key: 'perp', label: 'PERP', num: true },
      { key: 'basis', label: 'BASIS %', num: true, render: r => <span className={r.basis > 0 ? 'pos' : 'neg'}>{r.basis.toFixed(3)}%</span> },
      { key: 'fr', label: 'FUNDING', num: true, render: r => <span className={tone(r.fr)}>{r.fr.toFixed(4)}%<span className="muted"> /{r.fi}h</span></span> },
      { key: 'ann', label: 'ANNUAL CARRY', num: true, render: r => <span className={yt(r.ann)}>{r.ann.toFixed(1)}%</span> },
      { key: 'fee', label: 'FEES', num: true, render: r => <span className="muted">{r.fee.toFixed(2)}%</span> },
      { key: 'net', label: 'NET ANNUAL', num: true, render: r => <span className={yt(r.net)}>{r.net.toFixed(1)}%</span> },
      { key: 'stable', label: 'STABLE CARRY', num: true, render: r => r.stable == null ? <span className="muted">{NO}</span> : <span className={yt(r.stable)}>{r.stable.toFixed(1)}%</span> },
      { key: 'be', label: 'BE DAYS', num: true, render: r => r.be == null ? <span className="muted">{NO}</span> : <span className={r.be < 4 ? 'pos' : ''}>{r.be.toFixed(1)}d</span> },
      { key: 'score', label: 'SCORE', num: true, render: r => <span className={r.score > 0.8 ? 'pos' : r.score < 0.4 ? 'muted' : ''}>{r.score.toFixed(2)}</span> },
      { key: 'cap', label: 'CAPACITY ≈', num: true, render: r => fmtUsdCompact(r.cap) },
      { key: 'dir', label: 'DIRECTION', render: r => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{r.prof ? <SquareTag tone="pos">✓ PROFITABLE</SquareTag> : null}<span className="muted">{r.prof ? 'long spot / short perp' : NO}</span></span> },
      { key: 'age', label: 'AGE', num: true, render: () => <span className="muted">4s</span> }]} rows={rows}
      foot={<><span>showing {rows.length} pairs ({rows.filter(r => r.rank === 0).length} pinned)</span><span>updated 4s ago</span></>}/></div>
  </TsPanel>;
}
function TradeSimPage() {
  return <section className="basic-page">
    <div className="page-head"><div><h1>TradeSim Hub</h1><p className="page-head__sub">Data collection, research, backtesting &amp; live simulation · feeds the parameters bots trade with</p></div>
      <div className="stream-status stream-status--live"><StatusDot color="var(--system-success-500)" glow/><span>Recorder OK · 14 streams</span></div></div>
    <TopicSection><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><DataCollection/><LiveSim/><SpotPerp/></div></TopicSection>
  </section>;
}
window.TradeSimPage = TradeSimPage;
