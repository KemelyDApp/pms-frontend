/* TradeSim Hub — mirrors admin-panel TradeSimDashboard.vue:
   Data collection (24/7 recorder workers, background-loop heartbeats, collection
   over time, disk usage) → Live simulation (summary + best parameter combinations
   grouped by pair, ranked by composite score) → Spot vs perp basis (cash-and-carry). */

const tsRng = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
const tsFmtN = n => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n);
const tsFmtUsd = v => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}k` : `$${v.toFixed(0)}`;
const tsFmtPx = n => Math.abs(n) >= 1000 ? n.toFixed(2) : Math.abs(n) >= 1 ? n.toFixed(4) : Math.abs(n) >= 0.01 ? n.toFixed(5) : n.toPrecision(4);
const tsMs = ms => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
const tsYieldClass = n => n >= 20 ? 'pms-pos strong' : n >= 10 ? 'pms-pos' : n >= 5 ? 'pms-pos dim' : n >= 0 ? 'muted' : n > -10 ? 'pms-neg' : 'pms-neg strong';

const TS_WORKERS = [
  { name: 'binance spot', state: 'green', shards: '4/4', symbols: 412, age: 0.4 },
  { name: 'binance perp', state: 'green', shards: '4/4', symbols: 318, age: 0.2 },
  { name: 'okx spot',     state: 'amber', shards: '2/3', symbols: 187, age: 1.8 },
  { name: 'okx perp',     state: 'green', shards: '3/3', symbols: 204, age: 0.6 },
];
const TS_LOOPS = [
  { name: 'summary_refresh', status: 'ok', age: '2m', interval: 300 }, { name: 'basis_carry', status: 'ok', age: '41s', interval: 120 },
  { name: 'rotation_advice', status: 'ok', age: '4m', interval: 600 }, { name: 'delisting_sync', status: 'stale', age: '14m', interval: 600 },
  { name: 'advisory', status: 'ok', age: '1m', interval: 300 }, { name: 'disk_stats', status: 'ok', age: '8m', interval: 900 },
];
const TS_TABLES = [
  { t: 'market_events', kind: 'HT', size: '412 GB' }, { t: 'ticks_spot', kind: 'HT', size: '288 GB' }, { t: 'ticks_perp', kind: 'HT', size: '241 GB' },
  { t: 'funding_rates', kind: 'HT', size: '3.1 GB' }, { t: 'sim_results', kind: 'TBL', size: '9.4 GB' }, { t: 'sim_summary', kind: 'TBL', size: '612 MB' },
];
const TS_PAIRS = (() => {
  const r = tsRng(42);
  const syms = [['binance', 'SOLUSDT'], ['binance_perp', 'ETHUSDT'], ['okx_perp', 'BTCUSDT'], ['binance', 'AVAXUSDT'], ['okx', 'DOGEUSDT'], ['binance_perp', 'LINKUSDT'], ['okx_perp', 'ARBUSDT'], ['binance', 'INJUSDT']];
  return syms.map(([ex, sym], gi) => {
    const combos = [0, 1, 2, 3, 4].map(i => {
      const win = 92 - gi * 3 - i * 4 + r() * 3, trades = Math.round(120 + r() * 900), days = 30;
      return { side: r() > 0.4 ? 'buy' : 'sell', spread: (0.15 + i * 0.05).toFixed(2), stop: (0.3 + i * 0.1).toFixed(1), timeout: [400, 800, 1500, 3000, 6000][i], trades, tpd: trades / days,
        active: Math.round(days * (0.55 + r() * 0.45)), days, win, avg: (0.04 + r() * 0.08 - i * 0.01).toFixed(3), total: (2 + r() * 9 - i).toFixed(2), apy: 18 + r() * 40 - gi * 3 - i * 4, dd: 0.8 + i * 0.9 + r(), p95: [900, 1800, 3200, 6100, 12000][i], size: Math.round(4000 + r() * 30000), score: 0.91 - gi * 0.05 - i * 0.06 + r() * 0.02 };
    });
    return { ex, sym, combos, delist: sym === 'INJUSDT' };
  });
})();
const TS_BASIS = (() => {
  const r = tsRng(7);
  const rows = [['binance', 'BTCUSDT', 67420], ['okx', 'BTCUSDT', 67418], ['binance', 'ETHUSDT', 3512.4], ['okx', 'ETHUSDT', 3511.9], ['binance', 'SOLUSDT', 148.2], ['okx', 'TIAUSDT', 8.41], ['binance', 'WIFUSDT', 2.13], ['okx', 'ORDIUSDT', 41.2], ['binance', 'PEPEUSDT', 0.0000112], ['okx', 'SUIUSDT', 1.84], ['binance', 'ONDOUSDT', 0.912], ['okx', 'JUPUSDT', 1.06]];
  return rows.map(([venue, symbol, spot]) => {
    const f8 = (r() * 0.05 - 0.005); const annual = f8 * 3 * 365; const fee = venue === 'binance' ? 0.28 : 0.30; const net = annual - fee;
    const stable = annual * 0.4 + (annual * (0.8 + r() * 0.4)) * 0.3 + (annual * (0.7 + r() * 0.6)) * 0.3; const be = stable > 0 ? fee / (stable / 365) : null; const cap = 20000 + r() * 4_000_000;
    const score = stable > 0 ? Math.min(1, (stable / 40) * 0.45 + Math.min(1, cap / 3e6) * 0.15 + Math.min(1, 7 / (be || 999)) * 0.4) : 0;
    return { venue, symbol, spot, perp: spot * (1 + (r() * 0.002 - 0.0005)), f8, annual, fee, net, stable, be, cap, score, age: Math.round(r() * 50) + 's', delist: symbol === 'ORDIUSDT' };
  }).sort((a, b) => { const pa = ['BTCUSDT', 'ETHUSDT'].indexOf(a.symbol), pb = ['BTCUSDT', 'ETHUSDT'].indexOf(b.symbol); if ((pa >= 0) !== (pb >= 0)) return pa >= 0 ? -1 : 1; if (pa >= 0) return pa - pb || a.venue.localeCompare(b.venue); return b.score - a.score || b.stable - a.stable; });
})();
const TS_EVENTS = (() => { const r = tsRng(3); return Array.from({ length: 24 }, (_, i) => Math.round(38000 + Math.sin(i / 3.8) * 14000 + r() * 6000 + (i === 9 ? -30000 : 0))); })();

function TsPanel({ title, tag, sub, right, children }) {
  return (
    <section className="ts-panel">
      <header className="ts-h"><div><h3>{title}{tag && <span className={`ts-tag ${tag.k || ''}`}>{tag.t}</span>}</h3>{sub && <p>{sub}</p>}</div><span className="spacer"></span>{right}</header>
      {children}
    </section>
  );
}

function TradeSimPage() {
  const [venue, setVenue] = React.useState('all');
  const [page, setPage] = React.useState(0);
  const PAGE = 5;
  const pairs = TS_PAIRS.slice(page * PAGE, page * PAGE + PAGE);
  const basis = venue === 'all' ? TS_BASIS : TS_BASIS.filter(b => b.venue === venue);
  const evMax = Math.max(...TS_EVENTS), evTotal = TS_EVENTS.reduce((a, b) => a + b, 0);
  const winClass = w => w >= 80 ? 'pms-pos strong' : w >= 50 ? 'pms-warn' : 'pms-neg';
  const ddClass = d => d <= 2 ? 'pms-pos' : d <= 5 ? 'pms-warn' : 'pms-neg';

  return (
    <div className="ts">
      <div className="ts-head">
        <div><h1>TradeSim Hub</h1><div className="sub">Data collection, research, backtesting & live simulation · feeds the parameters bots trade with</div></div>
        <span className="spacer"></span>
        <span className="ov-live"><span className="dot"></span>RECORDER OK</span>
      </div>

      <div className="ts-grid">
        <TsPanel title="Data collection" tag={{ t: '24/7', k: 'ok' }} sub="One recorder worker per venue stream · sharded websocket feeds">
          <div className="ts-workers">
            {TS_WORKERS.map(w => (
              <div key={w.name} className="ts-worker">
                <span className={`d ${w.state}`}></span><b>{w.name}</b><span className="muted pms-mono">{w.shards} shards</span>
                <div className="m">{w.symbols} symbols · <span className="pms-mono">{w.age.toFixed(1)}s</span> ago</div>
              </div>
            ))}
          </div>
          <div className="ts-sub"><span>Background loops</span><span className="muted">per-loop heartbeat — a stuck refresh loop surfaces here within minutes</span><span className="ts-tag warn" style={{ marginLeft: 'auto' }}>degraded</span></div>
          <div className="ts-loops">
            {TS_LOOPS.map(l => <div key={l.name} className={`ts-loop ${l.status}`} title={`interval ${l.interval}s`}><span className={`d ${l.status}`}></span><span className="pms-mono">{l.name}</span><span className="pms-mono muted">{l.age}</span></div>)}
          </div>
          <div className="ts-stats"><div><b>1,121</b><span>simulated symbols</span></div><div><b>4</b><span>exchange streams</span></div><div><b>{tsFmtN(evTotal)}</b><span>events · 24h</span></div><div><b>{tsFmtN(evMax)}/h</b><span>peak</span></div></div>
          <div className="ts-sub"><span>Collection over time</span><span className="muted">market events per hour · last 24h</span></div>
          <svg className="ts-bars" viewBox="0 0 240 60" preserveAspectRatio="none">
            {TS_EVENTS.map((v, i) => <rect key={i} x={i * 10} y={60 - Math.max(1, (v / evMax) * 56)} width="9" height={Math.max(1, (v / evMax) * 56)} rx="1" fill={v < evMax * 0.35 ? 'var(--pms-warn)' : 'var(--pms-pos)'} opacity=".85"><title>{`${String((new Date().getUTCHours() - 23 + i + 48) % 24).padStart(2, '0')}:00 — ${tsFmtN(v)} events`}</title></rect>)}
          </svg>
          <div className="ts-axis pms-mono"><span>−24h</span><span>−12h</span><span>now</span></div>
          <div className="ts-sub"><span>Disk usage by table</span><span className="muted pms-mono" style={{ marginLeft: 'auto' }}>total DB 954 GB</span></div>
          <div className="ts-tables">{TS_TABLES.map(t => <div key={t.t} className="ts-table"><span className={`k ${t.kind}`}>{t.kind}</span><span className="pms-mono">{t.t}</span><b className="pms-mono">{t.size}</b></div>)}</div>
        </TsPanel>

        <TsPanel title="Live simulation" tag={{ t: 'Real-time', k: 'ok' }} sub="Events detected and simulated automatically by the data recorder"
          right={<span className="text-xs muted pms-mono">updated 2m ago</span>}>
          <div className="ts-stats three"><div><b>{tsFmtN(2_184_320)}</b><span>market events</span></div><div><b className="acc">{tsFmtN(418_902)}</b><span>simulations run</span></div><div><b className="info">341</b><span>symbols with events</span></div></div>
          <div className="ts-sub"><span>Best parameter combinations</span><span className="muted">ranked by composite score · up to 5 variations per pair · win rate, drawdown, speed, frequency and APY blended 0–1</span></div>
          {pairs.map((g, gi) => { const best = g.combos[0]; return (
            <div key={g.sym + g.ex} className="ts-pair">
              <div className="ts-pair-h">
                <span className="muted pms-mono">#{page * PAGE + gi + 1}</span>
                <span className={`ts-ex ${g.ex.includes('perp') ? 'perp' : 'spot'}`}>{g.ex.replace('_', ' ')}</span>
                <b className="pms-mono">{g.sym}</b>
                {g.delist && <span className="ts-tag neg" title="Venue announced delisting · score zeroed">DELIST</span>}
                <span className="spacer"></span>
                <span className="ts-pair-m">Score <b className="acc pms-mono">{best.score.toFixed(3)}</b></span>
                <span className="ts-pair-m">Win <b className="pms-pos pms-mono">{best.win.toFixed(1)}%</b></span>
                <span className="ts-pair-m">APY <b className={`pms-mono ${best.apy > 0 ? 'pms-pos' : 'pms-neg'}`}>{best.apy.toFixed(1)}%</b></span>
                <span className="ts-pair-m">DD <b className={`pms-mono ${ddClass(best.dd)}`}>{best.dd.toFixed(2)}%</b></span>
                <span className="muted">· {g.combos.length} vars</span>
              </div>
              <div className="ts-scroll"><table className="ts-tbl">
                <thead><tr><th>Side</th><th>Spread</th><th>Stop</th><th>Timeout</th><th className="r">Trades</th><th className="r">T/day</th><th className="r" title="Share of days in the 30-day window with ≥1 trade">Activity</th><th className="r">Win %</th><th className="r">Avg PnL</th><th className="r">Total PnL</th><th className="r">APY</th><th className="r">Max DD</th><th className="r">P95 hold</th><th className="r">Avg size</th><th className="r">Score</th></tr></thead>
                <tbody>{g.combos.map((c, i) => (
                  <tr key={i} className={i === 0 ? 'best' : ''}>
                    <td className={c.side === 'sell' ? 'pms-neg' : 'pms-pos'}>{c.side}</td><td className="pms-mono">{c.spread}%</td><td className="pms-mono">{c.stop}%</td><td className="pms-mono">{tsMs(c.timeout)}</td>
                    <td className="r pms-mono">{c.trades}</td><td className="r pms-mono muted">{c.tpd.toFixed(1)}</td>
                    <td className={`r pms-mono ${c.active / c.days >= 0.8 ? 'pms-pos strong' : c.active / c.days >= 0.5 ? 'pms-warn' : 'muted'}`}>{(c.active / c.days).toFixed(2)} <span className="muted" style={{ fontSize: 9 }}>({c.active}/{c.days}d)</span></td>
                    <td className={`r pms-mono ${winClass(c.win)}`}>{c.win.toFixed(1)}%</td><td className={`r pms-mono ${c.avg > 0 ? 'pms-pos' : 'pms-neg'}`}>{c.avg}%</td><td className={`r pms-mono ${c.total > 0 ? 'pms-pos' : 'pms-neg'}`}>{c.total}%</td>
                    <td className={`r pms-mono ${c.apy > 0 ? 'pms-pos' : 'pms-neg'}`}>{c.apy.toFixed(1)}%</td><td className={`r pms-mono ${ddClass(c.dd)}`}>{c.dd.toFixed(2)}%</td><td className="r pms-mono">{tsMs(c.p95)}</td><td className="r pms-mono muted">${tsFmtN(c.size)}</td><td className="r pms-mono acc strong">{c.score.toFixed(3)}</td>
                  </tr>))}
                </tbody></table></div>
            </div>
          ); })}
          <div className="ts-pg"><button className="pms-btn ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button><span>Page <b>{page + 1}</b> of <b>{Math.ceil(TS_PAIRS.length / PAGE)}</b></span><button className="pms-btn ghost" disabled={page >= Math.ceil(TS_PAIRS.length / PAGE) - 1} onClick={() => setPage(p => p + 1)}>Next →</button><span className="muted">showing {pairs.length} of {TS_PAIRS.length} pairs</span></div>
        </TsPanel>

        <TsPanel title="Spot vs perp basis" tag={{ t: 'cash-and-carry' }}
          sub={<>Long spot + short perp, collect funding while the hedge stays market-neutral. <b>Funding 8h</b> is the venue's last rate (every 2 min). <b>Annual carry</b> = funding × 3 × 365. <b>Net annual</b> subtracts round-trip fees (Binance 0.28% / OKX 0.30%). <b>Stable carry</b> = 40% now + 30% 7d + 30% 30d. <b>BE days</b> = days to recoup switching cost. <b>Score</b> = 45% stable carry + 15% capacity + 40% 1/BE. BTC & ETH pinned; the rest sorted by score.</>}
          right={<div className="ov-span">{['all', 'binance', 'okx'].map(v => <button key={v} className={venue === v ? 'active' : ''} onClick={() => setVenue(v)}>{v === 'all' ? 'ALL' : v.toUpperCase()}</button>)}</div>}>
          <div className="ts-scroll"><table className="ts-tbl basis">
            <thead><tr><th>#</th><th>Venue</th><th>Symbol</th><th className="r">Spot</th><th className="r">Perp</th><th className="r">Basis %</th><th className="r">Funding 8h</th><th className="r">Annual carry</th><th className="r">Fees</th><th className="r">Net annual</th><th className="r">Stable carry</th><th className="r">BE days</th><th className="r">Score</th><th className="r">Capacity ≈</th><th>Direction</th><th>Age</th></tr></thead>
            <tbody>{basis.map((b, i) => { const pin = ['BTCUSDT', 'ETHUSDT'].includes(b.symbol); const basisPct = (b.perp - b.spot) / b.spot * 100; return (
              <tr key={b.venue + b.symbol} className={pin ? 'pin' : ''}>
                <td className="muted pms-mono">{pin ? '●' : i + 1 - basis.filter(x => ['BTCUSDT', 'ETHUSDT'].includes(x.symbol)).length}</td>
                <td><span className={`ts-venue ${b.venue}`}>{b.venue}</span></td>
                <td className="pms-mono strong">{b.symbol}{b.delist && <span className="ts-tag neg" style={{ marginLeft: 6 }}>DELIST</span>}</td>
                <td className="r pms-mono">{tsFmtPx(b.spot)}</td><td className="r pms-mono">{tsFmtPx(b.perp)}</td>
                <td className={`r pms-mono ${basisPct > 0 ? 'pms-pos' : 'pms-neg'}`}>{basisPct.toFixed(3)}%</td>
                <td className={`r pms-mono ${b.f8 > 0 ? 'pms-pos' : b.f8 < 0 ? 'pms-neg' : 'muted'}`}>{b.f8.toFixed(4)}%</td>
                <td className={`r pms-mono ${tsYieldClass(b.annual)}`}>{b.annual.toFixed(1)}%</td>
                <td className="r pms-mono muted">{b.fee.toFixed(2)}%</td>
                <td className={`r pms-mono strong ${tsYieldClass(b.net)}`}>{b.net.toFixed(1)}%</td>
                <td className={`r pms-mono ${tsYieldClass(b.stable)}`}>{b.stable.toFixed(1)}%</td>
                <td className={`r pms-mono ${b.be != null && b.be <= 7 ? 'pms-pos strong' : b.be != null && b.be <= 14 ? 'pms-warn' : 'muted'}`}>{b.be != null ? `${b.be.toFixed(1)}d` : '—'}</td>
                <td className={`r pms-mono ${b.score >= 0.7 ? 'pms-pos strong' : b.score >= 0.4 ? 'pms-pos' : 'muted'}`}>{b.score.toFixed(2)}</td>
                <td className="r pms-mono">{tsFmtUsd(b.cap)}</td>
                <td className="text-xs">{b.net > 0 ? <><span className="ts-tag ok">✓ profitable</span> <span className="muted">long spot / short perp</span></> : <span className="muted">— unfavorable</span>}</td>
                <td className="pms-mono muted">{b.age}</td>
              </tr>); })}
            </tbody></table></div>
          <div className="ts-pg"><span className="muted">showing {basis.length} pairs (2 pinned)</span><span className="spacer"></span><span className="muted pms-mono">updated 38s ago</span></div>
        </TsPanel>
      </div>
    </div>
  );
}

window.TradeSimPage = TradeSimPage;
