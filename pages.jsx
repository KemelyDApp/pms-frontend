/* Other pages: Positions, Blotter, P&L, Risk, Recon, Strategies, Bots, Venues, Transfers, Reports, Admin */

function PositionsPage({ ccy }) {
  const [filter, setFilter] = React.useState('all');
  const [showZero, setShowZero] = React.useState(false);
  const filtered = POSITIONS.filter(p => filter==='all' || p.pool===Number(filter));
  const totalNotional = filtered.reduce((s,p)=>s+Math.abs(p.notional),0);
  const totalUpnl = filtered.reduce((s,p)=>s+p.upnl,0);
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Positions & exposures</h1>
          <div className="sub">{filtered.length} open positions · gross notional {fmt.usd(totalNotional,{compact:true})} · uPnL {fmt.signedUsd(totalUpnl,{compact:true})}</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Export</button>
          <button className="pms-btn">Hedge calculator</button>
          <button className="pms-btn primary">+ New order</button>
        </div>
      </div>
      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <div className="pms-kpi"><div className="pms-kpi-label">Gross notional</div><div className="pms-kpi-value">{ccyFmt(totalNotional, ccy)}</div><div className="pms-kpi-foot text-3">{filtered.length} positions</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Strategy 1 — Market-Neutral</div><div className="pms-kpi-value">{fmt.usd(POOLS[0].nav, {compact:true})}</div><div className="pms-kpi-foot text-3">delta-hedged · basis</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Strategy 2 — Cross-Exchange</div><div className="pms-kpi-value">{fmt.usd(POOLS[1].nav, {compact:true})}</div><div className="pms-kpi-foot text-3">delta-hedged · spread</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Strategy 3 — Proprietary</div><div className="pms-kpi-value pms-warn">{fmt.usd(POOLS[2].nav, {compact:true})}</div><div className="pms-kpi-foot text-3">directional · capped</div></div>
      </div>
      <div className="pms-card">
        <div className="pms-tabs">
          {[{k:'all',l:'All',c:POSITIONS.length},{k:'1',l:'Market-Neutral',c:POSITIONS.filter(p=>p.pool===1).length},{k:'2',l:'Cross-Ex',c:POSITIONS.filter(p=>p.pool===2).length},{k:'3',l:'Prop',c:POSITIONS.filter(p=>p.pool===3).length}].map(t=>(
            <div key={t.k} className={`pms-tab ${filter===t.k?'active':''}`} onClick={()=>setFilter(t.k)}>{t.l}<span className="count">{t.c}</span></div>
          ))}
        </div>
        <div className="pms-filters">
          <span className="pms-chip active">Open <span className="x">×</span></span>
          <span className="pms-chip">All venues</span>
          <span className="pms-chip">All assets</span>
          <span className="pms-chip">Hedged pairs</span>
          <div className="spacer"></div>
          <label className="row text-xs muted" style={{gap:6}}>
            <input type="checkbox" checked={showZero} onChange={e=>setShowZero(e.target.checked)}/> Show ~0 positions
          </label>
        </div>
        <SortableTable
          rowKey={r=>r.base+r.venue+r.side}
          initialSort={{key:'notional',dir:'desc'}}
          columns={[
            { key:'sym', label:'Asset', render:r=> <AssetChip sym={r.sym}/>},
            { key:'base', label:'Instrument', render:r=> <span className="pms-mono muted">{r.base}</span>},
            { key:'venue', label:'Venue', render:r=> <VenueChip name={r.venue}/>},
            { key:'side', label:'Side', render:r=> <span className={`pms-side ${r.side==='long'?'buy':'sell'}`}>{r.side.toUpperCase()}</span>},
            { key:'qty', label:'Qty', num:true, sortValue:r=>Math.abs(r.qty), render:r=> <span className={r.side==='short'?'pms-neg':''}>{fmt.num(r.qty, r.qty>1000?0:4)}</span>},
            { key:'entry', label:'Entry', num:true, render:r=> fmt.num(r.entry, r.entry<10?4:2)},
            { key:'mark', label:'Mark', num:true, render:r=> <span className="strong">{fmt.num(r.mark, r.mark<10?4:2)}</span>},
            { key:'notional', label:'Notional', num:true, sortValue:r=>Math.abs(r.notional), render:r=> <span className="strong">{ccyFmt(Math.abs(r.notional), ccy)}</span>},
            { key:'lev', label:'Lev', num:true, render:r=> r.lev.toFixed(1)+'×'},
            { key:'upnl', label:'uPnL', num:true, sortValue:r=>r.upnl, render:r=> <span className={classDelta(r.upnl)+' strong'}>{fmt.signedUsd(r.upnl,{compact:true})}</span>},
            { key:'upnl_pct', label:'%', num:true, sortValue:r=>r.upnl_pct, render:r=> <Delta value={r.upnl_pct}/>},
            { key:'exposure', label:'% Exposure', num:true, sortValue:r=>Math.abs(r.exposure), render:r=>(
              <div className="row" style={{justifyContent:'flex-end', gap:8}}>
                <span className={r.exposure<0?'muted':''}>{r.exposure.toFixed(2)}%</span>
                <MiniBar pct={Math.abs(r.exposure)*2}/>
              </div>
            )},
          ]}
          rows={filtered}
        />
      </div>
    </>
  );
}

function BlotterPage() {
  const [tick, setTick] = React.useState(0);
  const [flashKey, setFlashKey] = React.useState(null);
  React.useEffect(() => {
    const t = setInterval(() => {
      setFlashKey(BLOTTER[Math.floor(Math.random()*Math.min(5, BLOTTER.length))].id);
      setTick(x=>x+1);
      setTimeout(()=>setFlashKey(null), 1300);
    }, 3500);
    return () => clearInterval(t);
  }, []);
  const flashKeys = React.useMemo(()=> new Set(flashKey?[flashKey]:[]), [flashKey]);
  const stats = React.useMemo(() => ({
    filled: BLOTTER.filter(o=>o.status==='FILLED').length,
    working: BLOTTER.filter(o=>o.status==='WORKING'||o.status==='PARTIAL').length,
    canceled: BLOTTER.filter(o=>o.status==='CANCELED').length,
    notional: BLOTTER.reduce((s,o)=>s+o.qty*o.price,0),
    fees: BLOTTER.reduce((s,o)=>s+o.fees,0),
  }), []);
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Orders & executions</h1>
          <div className="sub">Live blotter · {stats.filled} filled · {stats.working} working · {stats.canceled} canceled · today's total notional {fmt.usd(stats.notional, {compact:true})}</div>
        </div>
        <div className="pms-page-actions">
          <span className="pms-pill info"><span className="dot"></span>STREAMING</span>
          <button className="pms-btn ghost">Pause</button>
          <button className="pms-btn">Cancel all</button>
        </div>
      </div>
      <div className="pms-card">
        <div className="pms-filters">
          <span className="pms-chip active">All status</span>
          <span className="pms-chip">All venues</span>
          <span className="pms-chip">All strategies</span>
          <span className="pms-chip">Today</span>
          <div className="spacer"></div>
          <span className="text-xs muted">Last update <span className="pms-mono" style={{color:'var(--fg-1)'}}>{NOW.toISOString().slice(11,19)}.{(412+tick*3).toString().slice(-3)}</span></span>
        </div>
        <SortableTable
          rowKey={r=>r.id}
          flashKeys={flashKeys}
          columns={[
            { key:'time', label:'Time', render:r=> <span className="pms-mono muted">{r.time}</span>},
            { key:'id', label:'Order ID', render:r=> <span className="pms-mono">{r.id}</span>},
            { key:'venue', label:'Venue', render:r=> <VenueChip name={r.venue}/>},
            { key:'sym', label:'Symbol', render:r=> <span className="pms-mono strong">{r.sym}</span>},
            { key:'side', label:'Side', render:r=> <span className={`pms-side ${r.side}`}>{r.side.toUpperCase()}</span>},
            { key:'type', label:'Type'},
            { key:'qty', label:'Qty', num:true, render:r=> fmt.num(r.qty, 3)},
            { key:'price', label:'Price', num:true, render:r=> fmt.num(r.price, r.price<10?4:2)},
            { key:'status', label:'Status', render:r=>{
              const cls = r.status==='FILLED'?'pos':r.status==='CANCELED'?'neg':r.status==='WORKING'?'info':'warn';
              return <span className={`pms-pill ${cls}`}><span className="dot"></span>{r.status}</span>;
            }},
            { key:'strat', label:'Strategy', render:r=> <span className="pms-pill purple">{r.strat}</span>},
            { key:'fees', label:'Fees', num:true, render:r=> r.fees>0?fmt.usd(r.fees,{dec:2}):'—'},
          ]}
          rows={BLOTTER}
        />
      </div>
    </>
  );
}

function PnlPage() {
  const data = NAV_HISTORY.map(d=>({...d, day_pnl: d.pnl - (NAV_HISTORY[NAV_HISTORY.indexOf(d)-1]?.pnl ?? 0)}));
  const ATTRIB = [
    { strat:'Market-Neutral Arb', pool:1, basis:142800, funding:38400, fees:-3120, net:178080, color:'#B06CFF'},
    { strat:'Cross-Exchange Arb', pool:2, spread:284200, funding:128400, fees:-4280, net:408320, color:'#FF8330'},
    { strat:'Proprietary Trading',pool:3, dir:912000, vol:-18200, fees:-1200, net:892600, color:'#36C2FF'},
  ];
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>P&L attribution</h1>
          <div className="sub">90d cumulative · {fmt.signedUsd(NAV_HISTORY[NAV_HISTORY.length-1].pnl,{compact:true})}</div>
        </div>
        <div className="pms-page-actions">
          <div className="pms-seg">
            <button>1d</button><button>7d</button><button>30d</button><button className="active">90d</button><button>YTD</button>
          </div>
          <button className="pms-btn">Export PDF</button>
        </div>
      </div>
      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <div className="pms-kpi featured"><div className="pms-kpi-label">Cumulative P&L</div><div className="pms-kpi-value pms-pos">{fmt.signedUsd(1_478_900,{compact:true})}</div><div className="pms-kpi-foot"><Delta value={4.42}/> period</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Realized</div><div className="pms-kpi-value pms-pos">{fmt.signedUsd(1_298_400, {compact:true})}</div><div className="pms-kpi-foot text-3">87.8% of total</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Unrealized</div><div className="pms-kpi-value pms-pos">{fmt.signedUsd(180_500, {compact:true})}</div><div className="pms-kpi-foot text-3">across {POSITIONS.length} positions</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Fees paid</div><div className="pms-kpi-value pms-neg">{fmt.usd(8_600,{compact:true})}</div><div className="pms-kpi-foot text-3">0.58% of P&L</div></div>
      </div>
      <div className="pms-grid-2">
        <div className="pms-card">
          <div className="pms-card-head">Cumulative P&L<div className="label-meta">90d</div></div>
          <div className="pms-card-body">
            <LineChart data={data} accessor={d=>d.pnl} height={240} color="var(--pms-pos)" fill="rgba(104,218,152,0.18)"/>
          </div>
        </div>
        <div className="pms-card">
          <div className="pms-card-head">Daily P&L distribution</div>
          <div className="pms-card-body">
            <svg viewBox="0 0 800 240" className="pms-chart" preserveAspectRatio="none">
              {data.slice(-30).map((d,i)=>{
                const x = 30 + i*25;
                const v = d.day_pnl || 0;
                const h = Math.min(100, Math.abs(v)/3000);
                const y = 120;
                return <rect key={i} x={x} y={v>=0?y-h:y} width="18" height={h} fill={v>=0?'var(--pms-pos)':'var(--pms-neg)'} opacity="0.85"/>;
              })}
              <line x1="20" x2="780" y1="120" y2="120" stroke="rgba(255,255,255,0.15)"/>
            </svg>
          </div>
        </div>
      </div>
      <div className="pms-grid-row" style={{gridTemplateColumns:'1fr', marginTop:'var(--pms-gap)'}}>
        <div className="pms-card">
          <div className="pms-card-head">Attribution by strategy<div className="label-meta">30d</div></div>
          <div className="pms-card-body flush">
            <table className="pms-table">
              <thead><tr><th>Strategy</th><th className="num">Basis / Spread</th><th className="num">Funding</th><th className="num">Directional</th><th className="num">Fees</th><th className="num">Net</th><th className="num">% Total</th></tr></thead>
              <tbody>
                {ATTRIB.map(a=>(
                  <tr key={a.pool}>
                    <td><span className="row" style={{gap:8}}><span style={{width:8,height:8,background:a.color,borderRadius:2}}></span><span className="strong">{a.strat}</span></span></td>
                    <td className="num pms-pos">{fmt.signedUsd(a.basis||a.spread||0,{compact:true})}</td>
                    <td className="num">{a.funding ? fmt.signedUsd(a.funding,{compact:true}):'—'}</td>
                    <td className="num">{a.dir? <span className="pms-pos">{fmt.signedUsd(a.dir,{compact:true})}</span> : '—'}</td>
                    <td className="num pms-neg">{fmt.signedUsd(a.fees,{compact:true})}</td>
                    <td className="num strong pms-pos">{fmt.signedUsd(a.net,{compact:true})}</td>
                    <td className="num">{((a.net/(ATTRIB.reduce((s,x)=>s+x.net,0)))*100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function RiskPage() {
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Risk & limits</h1>
          <div className="sub">Per-pool drawdown limits · 1 active breach · Pool 3 at 4.18% / 5.00% cap</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Edit limits</button>
          <button className="pms-btn danger">Kill switch</button>
        </div>
      </div>
      <div className="pms-callout" style={{margin:'0 0 var(--pms-gap) 0', padding:'10px 14px', background:'rgba(176,108,255,0.06)', border:'1px solid rgba(176,108,255,0.20)', borderRadius:8, fontSize:11, color:'var(--fg-2)', lineHeight:1.55}}>
        <strong style={{color:'var(--fg-1)'}}>Risk model.</strong> Kemely operates a drawdown-only risk regime per pool. Each pool has a hard maximum drawdown configured at onboarding; breaching it pauses the strategy and triggers manual review. Other risk metrics (VaR, leverage caps, scenario stress, net delta) are computed off-platform by the Risk Committee — not enforced by this PMS.
      </div>
      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <div className="pms-kpi"><div className="pms-kpi-label">Strategy 1 — Market-Neutral</div><div className="pms-kpi-value">{POOLS[0].drawdown_pct.toFixed(2)}%</div><div className="pms-kpi-foot text-3">limit −2.00%</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Strategy 2 — Cross-Exchange</div><div className="pms-kpi-value">{POOLS[1].drawdown_pct.toFixed(2)}%</div><div className="pms-kpi-foot text-3">limit −3.00%</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Strategy 3 — Proprietary</div><div className="pms-kpi-value pms-warn">{POOLS[2].drawdown_pct.toFixed(2)}%</div><div className="pms-kpi-foot pms-warn">limit −5.00% · breaching</div></div>
      </div>
      <div className="pms-grid-2">
        <div className="pms-card">
          <div className="pms-card-head">Drawdown limits<div className="label-meta">3 strategies</div></div>
          <div className="pms-card-body" style={{padding:'4px 0'}}>
            {[
              { name:'Strategy 1 — Market-Neutral Arb', used: Math.abs(POOLS[0].drawdown_pct), limit: 2.00 },
              { name:'Strategy 2 — Cross-Exchange Arb', used: Math.abs(POOLS[1].drawdown_pct), limit: 3.00 },
              { name:'Strategy 3 — Proprietary Trading', used: Math.abs(POOLS[2].drawdown_pct), limit: 5.00 },
            ].map(l=>{
              const pct = (l.used/l.limit)*100;
              const color = pct>=85 ? 'var(--pms-neg)' : pct>=60 ? 'var(--pms-warn)' : 'var(--pms-pos)';
              return (
                <div key={l.name} style={{padding:'12px 16px', borderBottom:'1px solid var(--pms-divider)'}}>
                  <div className="row" style={{justifyContent:'space-between', marginBottom:6}}>
                    <span className="text-sm strong">{l.name}</span>
                    <span className="pms-mono text-xs" style={{color}}>−{l.used.toFixed(2)}% / −{l.limit.toFixed(2)}%</span>
                  </div>
                  <div className="pms-bar" style={{height:6}}>
                    <span style={{width:`${Math.min(100,pct)}%`, background:color}}></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pms-card">
          <div className="pms-card-head">Pool 3 drawdown · 90d</div>
          <div className="pms-card-body">
            <LineChart data={NAV_HISTORY} accessor={d=>d.drawdown_pct} height={240} color="var(--pms-neg)" fill="rgba(255,112,114,0.16)"/>
            <div className="row text-xs" style={{gap:24, marginTop:8, color:'var(--fg-3)'}}>
              <span>Current <span className="pms-mono pms-neg">{NAV_HISTORY[NAV_HISTORY.length-1].drawdown_pct.toFixed(2)}%</span></span>
              <span>Max 90d <span className="pms-mono pms-neg">{Math.min(...NAV_HISTORY.map(d=>d.drawdown_pct)).toFixed(2)}%</span></span>
              <span>Days underwater <span className="pms-mono" style={{color:'var(--fg-1)'}}>4</span></span>
            </div>
          </div>
        </div>
      </div>
      <div className="pms-grid-row" style={{gridTemplateColumns:'1fr', marginTop:'var(--pms-gap)'}}>
        <div className="pms-card">
          <div className="pms-card-head">Drawdown breach history<div className="label-meta">last 90d</div></div>
          <div className="pms-card-body flush">
            <table className="pms-table">
              <thead><tr><th>Time</th><th>Pool</th><th className="num">Drawdown</th><th className="num">Limit</th><th>Action</th><th>Resolution</th></tr></thead>
              <tbody>
                {[
                  { t:'2026-05-01 08:18 UTC', pool:'Pool 3 — Prop',     dd:-4.18, lim:-5.00, act:'Strategy paused', res:'Pending Risk review' },
                  { t:'2026-04-12 02:42 UTC', pool:'Pool 3 — Prop',     dd:-3.84, lim:-5.00, act:'Alert · approaching', res:'Auto-cleared at −2.10%' },
                  { t:'2026-03-28 14:08 UTC', pool:'Pool 2 — X-Arb',    dd:-2.91, lim:-3.00, act:'Alert · approaching', res:'Auto-cleared at −1.42%' },
                  { t:'2026-02-14 11:22 UTC', pool:'Pool 1 — MN-Arb',   dd:-1.84, lim:-2.00, act:'Alert · approaching', res:'Auto-cleared at −0.40%' },
                ].map((r,i)=>(
                  <tr key={i}>
                    <td className="pms-mono text-xs muted">{r.t}</td>
                    <td className="strong">{r.pool}</td>
                    <td className="num pms-neg">{r.dd.toFixed(2)}%</td>
                    <td className="num muted">{r.lim.toFixed(2)}%</td>
                    <td>{r.act.startsWith('Strategy paused') ? <span className="pms-pill neg">{r.act}</span> : <span className="pms-pill warn">{r.act}</span>}</td>
                    <td className="text-xs muted">{r.res}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function ReconPage() {
  const [selected, setSelected] = React.useState(null);
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Reconciliation</h1>
          <div className="sub">Internal ledger vs venue snapshots · last reconciled {NOW.toISOString().slice(11,16)} UTC · {RECON_BREAKS.length} unresolved breaks</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Export breaks</button>
          <button className="pms-btn primary">Run reconciliation</button>
        </div>
      </div>
      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <div className="pms-kpi"><div className="pms-kpi-label">Open breaks</div><div className="pms-kpi-value pms-warn">{RECON_BREAKS.length}</div><div className="pms-kpi-foot text-3">1 high · 1 med · 2 low</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Net diff</div><div className="pms-kpi-value pms-neg">−$5,142</div><div className="pms-kpi-foot text-3">across 4 breaks</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Last full recon</div><div className="pms-kpi-value">14:30:00</div><div className="pms-kpi-foot text-3">2 minutes ago</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">SLA compliance</div><div className="pms-kpi-value pms-pos">99.84%</div><div className="pms-kpi-foot text-3">30d rolling</div></div>
      </div>
      <div className="pms-card">
        <div className="pms-card-head">Open breaks<div className="label-meta">click row for detail</div></div>
        <SortableTable
          rowKey={r=>r.id}
          onRowClick={r=>setSelected(r)}
          columns={[
            { key:'id', label:'Break ID', render:r=> <span className="pms-mono">{r.id}</span>},
            { key:'venue', label:'Venue', render:r=> <VenueChip name={r.venue}/>},
            { key:'asset', label:'Asset', render:r=> <AssetChip sym={r.asset}/>},
            { key:'expected', label:'Expected', num:true, render:r=> <span className="pms-mono">{fmt.num(r.expected, r.expected<10?4:2)}</span>},
            { key:'actual', label:'Actual', num:true, render:r=> <span className="pms-mono">{fmt.num(r.actual, r.actual<10?4:2)}</span>},
            { key:'diff', label:'Diff', num:true, sortValue:r=>Math.abs(r.diff), render:r=> <span className={classDelta(r.diff)+' strong'}>{fmt.num(r.diff, r.diff<1?4:2)}</span>},
            { key:'pct', label:'Diff %', num:true, render:r=> <span className={classDelta(r.diff)}>{(r.pct*100).toFixed(4)}%</span>},
            { key:'age', label:'Age', render:r=> <span className="pms-mono muted">{r.age}</span>},
            { key:'severity', label:'Severity', render:r=> <span className={`pms-pill ${r.severity==='high'?'neg':r.severity==='medium'?'warn':''}`}>{r.severity.toUpperCase()}</span>},
            { key:'act', label:'', render:r=> <button className="pms-btn ghost text-xs" onClick={(e)=>{e.stopPropagation();setSelected(r);}}>Investigate →</button>},
          ]}
          rows={RECON_BREAKS}
        />
      </div>
      <Modal open={!!selected} title={selected ? `Break ${selected.id}` : ''} onClose={()=>setSelected(null)}
        footer={<>
          <button className="pms-btn ghost">Mark resolved</button>
          <button className="pms-btn">Open ticket</button>
          <button className="pms-btn primary">Force reconcile</button>
        </>}>
        {selected && (
          <dl className="pms-dl">
            <dt>Venue</dt><dd>{selected.venue}</dd>
            <dt>Asset</dt><dd>{selected.asset}</dd>
            <dt>Internal ledger</dt><dd>{fmt.num(selected.expected, 4)}</dd>
            <dt>Venue snapshot</dt><dd>{fmt.num(selected.actual, 4)}</dd>
            <dt>Difference</dt><dd className={classDelta(selected.diff)}>{fmt.num(selected.diff, 4)} ({(selected.pct*100).toFixed(4)}%)</dd>
            <dt>First seen</dt><dd>{selected.age} ago</dd>
            <dt>Last 5 events</dt><dd style={{fontSize:11, lineHeight:1.7}}>
              <div>14:30:02 · snapshot taken · diff confirmed</div>
              <div>14:25:18 · 3 trades since last recon</div>
              <div>14:14:08 · order fill OXJ-92823 · qty 0.4</div>
              <div>14:04:42 · funding payment received</div>
              <div>13:58:11 · prior recon ✓ matched</div>
            </dd>
            <dt>Likely cause</dt><dd>Pending settlement (T+0 cycle)</dd>
          </dl>
        )}
      </Modal>
    </>
  );
}

function StrategiesPage({ onSelect }) {
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Strategies</h1>
          <div className="sub">3 strategies · 1 bot per strategy, allocated across N pools · click a row for detail</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn">Compare</button>
          <button className="pms-btn primary">+ New pool</button>
        </div>
      </div>
      <div className="pms-grid-3">
        {POOLS.map(p => (
          <div className="pms-card pms-card-clickable" key={p.id} onClick={()=>onSelect && onSelect(p.id)}>
            <div className="pms-card-head">
              <div className="row" style={{gap:8}}>
                <span style={{width:8, height:8, borderRadius:2, background: p.id===1?'#B06CFF':p.id===2?'#FF8330':'#36C2FF'}}></span>
                <span>{p.name}</span>
              </div>
              <div className="label-meta"><RiskPill risk={p.risk}/></div>
            </div>
            <div className="pms-card-body">
              <div className="pms-bignum">{fmt.usd(p.nav, {compact:true})}</div>
              <div className="text-xs muted" style={{marginTop:2}}>NAV per share <span className="pms-mono" style={{color:'var(--fg-1)'}}>{p.nav_per_share.toFixed(4)}</span></div>
              <div style={{marginTop:14}}>
                <Sparkline data={gensSpark(p.id*7, 40, p.pnl_30d>0?0.3:-0.2)} w={400} h={48} color={p.pnl_30d>0?'var(--pms-pos)':'var(--pms-neg)'}/>
              </div>
              <div className="pms-grid-row" style={{gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14}}>
                <div><div className="text-xs muted">APY (90d annualized)</div><div className="strong pms-pos" style={{fontSize:16}}>{p.apy.toFixed(2)}%</div></div>
                <div><div className="text-xs muted">Drawdown</div><div className={p.drawdown_pct<-3?'pms-neg strong':'strong'} style={{fontSize:16}}>{p.drawdown_pct.toFixed(2)}%</div></div>
                <div><div className="text-xs muted">P&L 24h</div><div className={classDelta(p.pnl_24h)+' strong'} style={{fontSize:14}}>{fmt.signedUsd(p.pnl_24h,{compact:true})}</div></div>
                <div><div className="text-xs muted">P&L 30d</div><div className={classDelta(p.pnl_30d)+' strong'} style={{fontSize:14}}>{fmt.signedUsd(p.pnl_30d,{compact:true})}</div></div>
              </div>
              <div style={{marginTop:14, paddingTop:12, borderTop:'1px solid var(--pms-divider)'}}>
                <div className="text-xs muted" style={{marginBottom:6}}>Bot · {p.cex_pools.length} CEX pools</div>
                <div className="row" style={{gap:6}}>
                  <span className="pms-mono text-xs strong">{p.bot_id}</span>
                  <BotStatusDot status={p.bot_status}/>
                </div>
                <div className="row" style={{flexWrap:'wrap', gap:6, marginTop:8}}>
                  {p.venues.map(v=> <VenueChip key={v} name={v}/>)}
                </div>
              </div>
              <div className="row" style={{marginTop:14, gap:8}}>
                <span className="pms-pill purple">perf {p.fees.perf}% / mgmt {p.fees.mgmt}%</span>
                <div className="spacer"></div>
                <span className="pms-link text-xs">Open detail →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PoolDetailPage({ poolId, onBack }) {
  const p = POOLS.find(x=>x.id===poolId) || POOLS[0];
  const ddLimit = p.id===1 ? -2.00 : p.id===2 ? -3.00 : -5.00;
  const positions = POSITIONS.filter(pos => pos.pool === p.id);
  const orders = BLOTTER.filter(o => {
    if (p.id===1) return o.strat==='basis';
    if (p.id===2) return o.strat==='x-arb';
    return o.strat==='prop';
  });
  const [tab, setTab] = React.useState('overview');
  const wallets = BOT_WALLETS[p.bot_id] || BOT_WALLETS['prop-bot-01'];
  const errors = BOT_ERRORS[p.bot_id] || BOT_ERRORS['prop-bot-01'];
  const locks = BOT_LOCKS[p.bot_id] || BOT_LOCKS['prop-bot-01'];
  const shortCount = wallets.filter(w=>w.status==='short').length;
  const errorCount = errors.reduce((s,e)=>s+e.count,0);
  return (
    <>
      <div className="pms-page-head">
        <div>
          <div className="row" style={{gap:8, marginBottom:6}}>
            <button className="pms-btn ghost text-xs" onClick={onBack}>← All strategies</button>
            <span className="text-xs muted">/ Strategies / <span style={{color:'var(--fg-1)'}}>{p.name}</span></span>
          </div>
          <h1 style={{display:'flex', alignItems:'center', gap:10}}>
            <span style={{width:12, height:12, borderRadius:3, background: p.id===1?'#B06CFF':p.id===2?'#FF8330':'#36C2FF'}}></span>
            {p.name}
            <RiskPill risk={p.risk}/>
          </h1>
          <div className="sub">Strategy #{p.id} · 1 bot ({p.bot_id}) · {p.cex_pools.length} pools · {p.strategy}</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Edit allocation</button>
          <button className="pms-btn">Bot console</button>
          <button className="pms-btn danger">Pause strategy</button>
        </div>
      </div>

      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
        <div className="pms-kpi featured"><div className="pms-kpi-label">NAV</div><div className="pms-kpi-value">{fmt.usd(p.nav, {compact:true})}</div><div className="pms-kpi-foot text-3">{p.aum_pct.toFixed(1)}% of firm AUM</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">P&L 24h</div><div className={`pms-kpi-value ${classDelta(p.pnl_24h)}`}>{fmt.signedUsd(p.pnl_24h, {compact:true})}</div><div className="pms-kpi-foot"><Delta value={p.pnl_24h_pct}/></div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">P&L 30d</div><div className={`pms-kpi-value ${classDelta(p.pnl_30d)}`}>{fmt.signedUsd(p.pnl_30d, {compact:true})}</div><div className="pms-kpi-foot"><Delta value={p.pnl_30d_pct}/></div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">APY · 90d annualized</div><div className="pms-kpi-value pms-pos">{p.apy.toFixed(2)}%</div><div className="pms-kpi-foot text-3">since inception</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Drawdown</div><div className={`pms-kpi-value ${p.drawdown_pct<ddLimit*0.85 ? 'pms-warn' : ''}`}>{p.drawdown_pct.toFixed(2)}%</div><div className="pms-kpi-foot text-3">limit {ddLimit.toFixed(2)}%</div></div>
      </div>

      <div className="pms-subtabs">
        {[
          { id:'overview',  label:'Overview' },
          { id:'venues',    label:'Pools', count: p.cex_pools.length },
          { id:'bot',       label:'Bot triage', count: errorCount, badge: shortCount>0 ? 'warn' : (errorCount>20?'warn':null) },
          { id:'fees',      label:'Fee policy' },
          { id:'orders',    label:'Orders' },
        ].map(t => (
          <button key={t.id} className={`pms-subtab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            <span>{t.label}</span>
            {t.count != null && <span className={`pms-subtab-count ${t.badge||''}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab==='overview' && <>
        <div className="pms-grid-2">
          <div className="pms-card">
            <div className="pms-card-head">NAV · 90d</div>
            <div className="pms-card-body">
              <LineChart data={NAV_HISTORY} accessor={d=>d.nav} height={220}/>
            </div>
          </div>
          <div className="pms-card">
            <div className="pms-card-head">Bot · {p.bot_id}<div className="label-meta"><BotStatusDot status={p.bot_status}/></div></div>
            <div className="pms-card-body">
              <dl className="pms-dl">
                <dt>Strategy</dt><dd className="pms-mono">{p.strategy}</dd>
                <dt>Status</dt><dd><BotStatusDot status={p.bot_status}/></dd>
                <dt>Allocated capital</dt><dd className="strong">{fmt.usd(p.nav, {compact:true})}</dd>
                <dt>Active venues</dt><dd>{p.venues.join(' · ')}</dd>
                <dt>Drawdown limit</dt><dd>{ddLimit.toFixed(2)}%</dd>
                <dt>Fees</dt><dd>{p.fees.perf}% perf / {p.fees.mgmt}% mgmt</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="pms-grid-row" style={{gridTemplateColumns:'1fr', marginTop:'var(--pms-gap)'}}>
          <div className="pms-card">
            <div className="pms-card-head">Open positions<div className="label-meta">{positions.length}</div></div>
            <div className="pms-card-body flush">
              <table className="pms-table">
                <thead><tr><th>Asset</th><th>Venue</th><th>Side</th><th className="num">Notional</th><th className="num">uPnL</th></tr></thead>
                <tbody>
                  {positions.map((pos,i)=>(
                    <tr key={i}>
                      <td><AssetChip sym={pos.sym}/></td>
                      <td><VenueChip name={pos.venue}/></td>
                      <td><span className={`pms-side ${pos.side==='long'?'buy':'sell'}`}>{pos.side.toUpperCase()}</span></td>
                      <td className="num">{fmt.usd(Math.abs(pos.notional), {compact:true})}</td>
                      <td className={`num ${classDelta(pos.upnl)} strong`}>{fmt.signedUsd(pos.upnl, {compact:true})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>}

      {tab==='venues' && (
        <div className="pms-card">
          <div className="pms-card-head">Pools<div className="label-meta">{p.cex_pools.length} pools · capital allocated by the strategy's bot</div></div>
          <div className="pms-card-body flush">
            <table className="pms-table">
              <thead><tr><th>Venue</th><th>Account</th><th className="num">Capital</th><th className="num">% of pool</th><th className="num">P&L 24h</th><th>Status</th></tr></thead>
              <tbody>
                {p.cex_pools.map((cp,i)=>(
                  <tr key={i}>
                    <td><VenueChip name={cp.venue}/></td>
                    <td className="text-xs muted">{cp.account}</td>
                    <td className="num strong">{fmt.usd(cp.capital, {compact:true})}</td>
                    <td className="num">
                      <div className="row" style={{justifyContent:'flex-end', gap:8}}>
                        <span className="muted">{(cp.capital/p.nav*100).toFixed(1)}%</span>
                        <MiniBar pct={(cp.capital/p.nav*100)*2}/>
                      </div>
                    </td>
                    <td className={`num ${classDelta(cp.pnl_24h)}`}>{fmt.signedUsd(cp.pnl_24h, {compact:true})}</td>
                    <td>
                      {cp.status==='healthy'
                        ? <span className="pms-pill pos"><span className="dot"></span>OK</span>
                        : <span className="pms-pill warn"><span className="dot"></span>DEG</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='bot' && (
        <div className="pms-card pms-bot-focus">
          <div className="pms-card-head">
            <BotStatusDot status={p.bot_status}/>
            <span className="pms-mono strong">{p.bot_id}</span>
            <span className="muted text-xs">· {p.strategy}</span>
            <div className="label-meta">scoped to this pool's bot</div>
          </div>
          <div className="pms-bot-focus-grid">
            <BotWalletCard wallets={wallets}/>
            <BotErrorsCard errors={errors}/>
            <BotLocksCard locks={locks}/>
          </div>
          <div style={{padding:'12px 16px', display:'flex', gap:8, justifyContent:'flex-end', borderTop:'1px solid var(--pms-divider)', background:'rgba(255,255,255,0.02)'}}>
            <button className="pms-btn ghost">Rebalance wallets</button>
            <button className="pms-btn">Pause bot</button>
            <button className="pms-btn danger">Kill switch</button>
          </div>
        </div>
      )}

      {tab==='fees' && <PoolFeesTab pool={p}/>}

      {tab==='orders' && (
        <div className="pms-card">
          <div className="pms-card-head">Recent orders<div className="label-meta">filtered to this strategy</div></div>
          <div className="pms-card-body flush">
            <table className="pms-table">
              <thead><tr><th>Time</th><th>Order</th><th>Venue</th><th>Symbol</th><th>Side</th><th className="num">Qty</th><th className="num">Price</th><th>Status</th></tr></thead>
              <tbody>
                {orders.slice(0,12).map(o=>(
                  <tr key={o.id}>
                    <td className="pms-mono muted text-xs">{o.time}</td>
                    <td className="pms-mono text-xs">{o.id}</td>
                    <td><VenueChip name={o.venue}/></td>
                    <td className="pms-mono strong">{o.sym}</td>
                    <td><span className={`pms-side ${o.side}`}>{o.side.toUpperCase()}</span></td>
                    <td className="num">{fmt.num(o.qty,3)}</td>
                    <td className="num">{fmt.num(o.price, o.price<10?4:2)}</td>
                    <td>
                      {(() => {
                        const cls = o.status==='FILLED'?'pos':o.status==='CANCELED'?'neg':o.status==='WORKING'?'info':'warn';
                        return <span className={`pms-pill ${cls}`}><span className="dot"></span>{o.status}</span>;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function PoolFeesTab({ pool }) {
  // Synthesised mock fee state
  const period = '2026-05-01 → 2026-05-31';
  const hwm = pool.nav * 0.96;
  const above = Math.max(0, pool.nav - hwm);
  const grossPnL = pool.pnl_30d;
  const hurdle = pool.nav * 0.04 / 12; // 4% annual / monthly
  const perfBase = Math.max(0, grossPnL - hurdle);
  const perfAccrued = perfBase * pool.fees.perf / 100;
  const mgmtAccrued = pool.nav * pool.fees.mgmt / 100 / 12;
  return (
    <>
      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <div className="pms-kpi featured"><div className="pms-kpi-label">Perf fee · this period</div><div className="pms-kpi-value pms-pos">{fmt.usd(perfAccrued,{compact:true})}</div><div className="pms-kpi-foot text-3">accrued · crystallises {pool.fees.crystal}</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Mgmt fee · this period</div><div className="pms-kpi-value">{fmt.usd(mgmtAccrued,{compact:true})}</div><div className="pms-kpi-foot text-3">{pool.fees.mgmt}% / yr · pro-rata</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">High water mark</div><div className="pms-kpi-value">{fmt.usd(hwm,{compact:true})}</div><div className="pms-kpi-foot text-3">NAV +{fmt.usd(above,{compact:true})} above HWM</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Hurdle rate</div><div className="pms-kpi-value">4.00%</div><div className="pms-kpi-foot text-3">annual · soft hurdle</div></div>
      </div>

      <div className="pms-grid-2" style={{marginTop:'var(--pms-gap)'}}>
        <div className="pms-card">
          <div className="pms-card-head">Policy<div className="label-meta">edits write to audit log</div></div>
          <div className="pms-card-body" style={{padding:0}}>
            <div className="pms-cfg-row"><div className="k">Performance fee</div><div className="v pms-mono">{pool.fees.perf}.00% above HWM</div><div className="act"><button className="pms-btn ghost text-xs">Edit</button></div></div>
            <div className="pms-cfg-row"><div className="k">Management fee</div><div className="v pms-mono">{pool.fees.mgmt}.00% / year · pro-rata daily</div><div className="act"><button className="pms-btn ghost text-xs">Edit</button></div></div>
            <div className="pms-cfg-row"><div className="k">Hurdle rate</div><div className="v pms-mono">4.00% annual · soft hurdle</div><div className="act"><button className="pms-btn ghost text-xs">Edit</button></div></div>
            <div className="pms-cfg-row"><div className="k">Crystallisation</div><div className="v pms-mono">{pool.fees.crystal} · last business day</div><div className="act"><button className="pms-btn ghost text-xs">Edit</button></div></div>
            <div className="pms-cfg-row"><div className="k">High-water mark</div><div className="v pms-mono">per-investor · resets on full redemption</div><div className="act"><span className="muted text-xs">read-only</span></div></div>
            <div className="pms-cfg-row"><div className="k">Loss carry-forward</div><div className="v pms-mono">enabled · perpetual</div><div className="act"><span className="muted text-xs">read-only</span></div></div>
          </div>
        </div>

        <div className="pms-card">
          <div className="pms-card-head">Accrual waterfall · {period}<div className="label-meta">how this period's fees roll up</div></div>
          <div className="pms-card-body">
            <div className="pms-waterfall">
              {[
                {l:'Gross P&L · 30d', v:Math.max(grossPnL,0), accent:'pos'},
                {l:'− Hurdle (4% pro-rata)', v:hurdle, accent:'muted'},
                {l:'= Performance base', v:perfBase, accent:''},
                {l:'× Perf fee rate', v:perfAccrued, accent:'pos', label:`× ${pool.fees.perf}%`},
                {l:'+ Mgmt fee accrual', v:mgmtAccrued, accent:'pos'},
              ].map((r,i,arr)=>{
                const max = Math.max(...arr.map(x=>Math.abs(x.v)));
                return (
                  <div className={`pms-waterfall-row ${r.accent==='muted'?'':''}`} key={r.l}>
                    <div className="l">{r.l}</div>
                    <div className="b"><div className="fill" style={{width:(Math.abs(r.v)/max*100)+'%'}}></div></div>
                    <div className="v pms-mono">{r.label || fmt.usd(r.v,{compact:true})}</div>
                  </div>
                );
              })}
              <div className="pms-waterfall-row total">
                <div className="l">Total firm accrual · period</div>
                <div className="b"></div>
                <div className="v pms-mono strong pms-pos">{fmt.usd(perfAccrued + mgmtAccrued, {compact:true})}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pms-card" style={{marginTop:'var(--pms-gap)'}}>
        <div className="pms-card-head">Recent crystallisations<div className="label-meta">historical · last 6 periods</div></div>
        <SortableTable rowKey={r=>r.period}
          columns={[
            { key:'period', label:'Period', render:r=> <span className="pms-mono text-xs">{r.period}</span>},
            { key:'nav_open', label:'NAV open', num:true, render:r=> <span className="pms-mono">{fmt.usd(r.nav_open,{compact:true})}</span>},
            { key:'nav_close', label:'NAV close', num:true, render:r=> <span className="pms-mono">{fmt.usd(r.nav_close,{compact:true})}</span>},
            { key:'pnl', label:'P&L', num:true, render:r=> <span className={classDelta(r.pnl)}>{fmt.signedUsd(r.pnl,{compact:true})}</span>},
            { key:'perf', label:'Perf fee', num:true, render:r=> <span className="pms-pos">{fmt.usd(r.perf,{compact:true})}</span>},
            { key:'mgmt', label:'Mgmt fee', num:true, render:r=> <span className="pms-pos">{fmt.usd(r.mgmt,{compact:true})}</span>},
            { key:'status', label:'', render:r=> <span className="pms-pill pos">crystallised</span>},
          ]}
          rows={[
            { period:'2026-04', nav_open: pool.nav*0.92, nav_close: pool.nav*0.96, pnl: pool.nav*0.04, perf: pool.nav*0.04*0.2, mgmt: pool.nav*0.0017 },
            { period:'2026-03', nav_open: pool.nav*0.88, nav_close: pool.nav*0.92, pnl: pool.nav*0.04, perf: pool.nav*0.04*0.2, mgmt: pool.nav*0.0017 },
            { period:'2026-02', nav_open: pool.nav*0.86, nav_close: pool.nav*0.88, pnl: pool.nav*0.02, perf: pool.nav*0.02*0.2, mgmt: pool.nav*0.0017 },
            { period:'2026-01', nav_open: pool.nav*0.84, nav_close: pool.nav*0.86, pnl: pool.nav*0.02, perf: pool.nav*0.02*0.2, mgmt: pool.nav*0.0017 },
            { period:'2025-12', nav_open: pool.nav*0.82, nav_close: pool.nav*0.84, pnl: pool.nav*0.02, perf: pool.nav*0.02*0.2, mgmt: pool.nav*0.0017 },
            { period:'2025-11', nav_open: pool.nav*0.80, nav_close: pool.nav*0.82, pnl: pool.nav*0.02, perf: pool.nav*0.02*0.2, mgmt: pool.nav*0.0017 },
          ]}/>
      </div>
    </>
  );
}

function BotsPage() {
  const [selected, setSelected] = React.useState(null);
  // Focus card — pick the bot with the worst situation (warning/short wallet)
  const focus = BOTS.find(b=>b.status==='warning') || BOTS.find(b=>b.status==='active') || BOTS[0];
  const wallets = BOT_WALLETS[focus.id] || BOT_WALLETS['prop-bot-01'];
  const errors = BOT_ERRORS[focus.id] || BOT_ERRORS['prop-bot-01'];
  const locks = BOT_LOCKS[focus.id] || BOT_LOCKS['prop-bot-01'];
  const sagaEvents = BOT_SAGAS[focus.id] || BOT_SAGAS['prop-bot-01'];
  const shortCount = wallets.filter(w=>w.status==='short').length;
  const errorCount = errors.reduce((s,e)=>s+e.count,0);
  const lockedTotal = locks.reduce((s,l)=>s+l.locked_amount,0);

  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Bots &amp; sagas</h1>
          <div className="sub">{BOTS.filter(b=>b.status==='active').length} active · {BOTS.filter(b=>b.status==='killed').length} killed · {BOTS.filter(b=>b.status==='warning').length} warning · {BOTS.filter(b=>b.status==='idle').length} idle</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Bot console</button>
          <button className="pms-btn danger">Kill all</button>
        </div>
      </div>
      <PageMeta src="orchestrator · venue connectors · risk-core" refresh="WS · 1s tick" role="PM · OPS · RISK" note={`${shortCount} wallet deficit${shortCount===1?'':'s'} · ${errorCount} errors / 1h · ${fmt.usd(lockedTotal,{compact:true})} locked`}/>

      <div className="pms-card pms-bot-focus">
        <div className="pms-card-head">
          <BotStatusDot status={focus.status}/>
          <span className="pms-mono strong">{focus.id}</span>
          <span className="muted text-xs">· {focus.strategy} · {focus.venues}</span>
          <div className="label-meta">most active · click another bot below to switch</div>
        </div>
        <div className="pms-bot-focus-grid">
          <BotWalletCard wallets={wallets}/>
          <BotErrorsCard errors={errors}/>
          <BotLocksCard locks={locks}/>
        </div>
        <div className="pms-bot-focus-saga">
          <div className="pms-card-head" style={{borderTop:'1px solid var(--pms-divider)', borderBottom:'1px solid var(--pms-divider)'}}>
            Saga timeline · last 10 events
            <div className="label-meta">orchestrator → venue → recorder</div>
          </div>
          <div className="pms-sagastream">
            {sagaEvents.map((e,i)=>(
              <div className={`pms-sagastream-row ${e.kind.includes('error')||e.kind.includes('deficit')?'neg':e.kind.includes('kill')?'warn':''}`} key={i}>
                <span className="t pms-mono">{e.t}</span>
                <span className={`k`}>{e.kind}</span>
                <span className="d">{e.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pms-grid-2" style={{gridTemplateColumns:'2fr 1fr', marginTop:'var(--pms-gap)'}}>
        <div className="pms-card">
          <div className="pms-card-head">All trading bots<div className="label-meta">{BOTS.length} total</div></div>
          <SortableTable
            rowKey={r=>r.id}
            onRowClick={r=>setSelected(r)}
            initialSort={{key:'pnl_24h',dir:'desc'}}
            columns={[
              { key:'id', label:'Bot', render:r=> <span className="pms-mono strong">{r.id}</span>},
              { key:'strategy', label:'Strategy', render:r=> <span className="text-xs muted">{r.strategy}</span>},
              { key:'venues', label:'Venues', render:r=> <span className="pms-mono text-xs">{r.venues}</span>},
              { key:'status', label:'Status', render:r=> <BotStatusDot status={r.status}/>},
              { key:'uptime', label:'Uptime', render:r=> <span className="pms-mono text-xs muted">{r.uptime}</span>},
              { key:'pnl_24h', label:'P&L 24h', num:true, sortValue:r=>r.pnl_24h, render:r=> <span className={classDelta(r.pnl_24h)+' strong'}>{fmt.signedUsd(r.pnl_24h,{compact:true})}</span>},
              { key:'allocated', label:'Allocated', num:true, render:r=> fmt.usd(r.allocated,{compact:true})},
              { key:'last_trade', label:'Last trade', render:r=> <span className="pms-mono text-xs muted">{r.last_trade}</span>},
            ]}
            rows={BOTS}
          />
        </div>
        <div className="pms-card">
          <div className="pms-card-head">Saga workflows<div className="label-meta">{SAGAS.length} running</div></div>
          <div className="pms-card-body" style={{padding:'4px 0'}}>
            {SAGAS.map(s=>(
              <div key={s.id} style={{padding:'12px 16px', borderBottom:'1px solid var(--pms-divider)'}}>
                <div className="row" style={{justifyContent:'space-between'}}>
                  <span className="strong" style={{fontSize:13}}>{s.workflow}</span>
                  <span className="pms-pill info"><span className="dot"></span>{s.status}</span>
                </div>
                <div className="text-xs muted" style={{marginTop:4}}>{s.step}</div>
                <div className="row text-xs" style={{marginTop:8, gap:8}}>
                  <span className="pms-mono muted">{s.id}</span>
                  <span className="pms-pill purple">{s.pool}</span>
                  <span className="muted">{s.actor}</span>
                  <div className="spacer"></div>
                  <span className="pms-mono">{s.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Modal open={!!selected} title={selected?selected.id:''} onClose={()=>setSelected(null)}
        footer={<><button className="pms-btn ghost">Logs</button><button className="pms-btn">Restart</button><button className="pms-btn danger">Kill</button></>}>
        {selected && (
          <dl className="pms-dl">
            <dt>Strategy</dt><dd>{selected.strategy}</dd>
            <dt>Pool</dt><dd>#{selected.pool}</dd>
            <dt>Status</dt><dd><BotStatusDot status={selected.status}/></dd>
            <dt>Uptime</dt><dd>{selected.uptime}</dd>
            <dt>Allocated capital</dt><dd>{fmt.usd(selected.allocated, {compact:true})}</dd>
            <dt>P&L 24h</dt><dd className={classDelta(selected.pnl_24h)}>{fmt.signedUsd(selected.pnl_24h)}</dd>
            <dt>Active venues</dt><dd>{selected.venues}</dd>
            <dt>Last trade</dt><dd>{selected.last_trade}</dd>
          </dl>
        )}
      </Modal>
    </>
  );
}

function BotWalletCard({ wallets }) {
  return (
    <div className="pms-bot-card">
      <div className="pms-bot-card-head"><span>Wallet balances</span><span className="muted text-xs">free vs required</span></div>
      <div className="pms-bot-card-body">
        {wallets.map((w,i)=>{
          const pct = Math.min(100, (w.free/Math.max(w.required, w.free))*100);
          return (
            <div className="pms-walletrow" key={i}>
              <div className="t">
                <span className="pms-mono text-xs">{w.wallet}</span>
                {w.status==='short' && <span className="pms-pill" style={{background:'rgba(255,112,114,0.16)', color:'var(--pms-neg)', fontSize:9}}>−{fmt.usd(w.deficit,{compact:true})}</span>}
              </div>
              <div className="b">
                <div className="bar"><div className="fill" style={{width:pct+'%', background: w.status==='short' ? 'var(--pms-neg)' : 'var(--pms-pos)'}}></div></div>
              </div>
              <div className="v pms-mono text-xs">{fmt.usd(w.free,{compact:true})} / {fmt.usd(w.required,{compact:true})}</div>
            </div>
          );
        })}
      </div>
      <div className="pms-bot-card-foot">
        <button className="pms-btn ghost">Rebalance</button>
      </div>
    </div>
  );
}

function BotErrorsCard({ errors }) {
  return (
    <div className="pms-bot-card">
      <div className="pms-bot-card-head"><span>Errors · last 1h</span><span className="muted text-xs">grouped by code</span></div>
      <div className="pms-bot-card-body">
        {errors.map((e,i)=>(
          <div className="pms-errorrow" key={i}>
            <div className="row" style={{justifyContent:'space-between', gap:8}}>
              <span className="pms-mono strong text-xs">{e.code}</span>
              <span className={`pms-pill ${e.consecutive>=3?'orange':''}`} style={{fontSize:9}}>×{e.count}{e.consecutive>0 && <> · {e.consecutive} consec</>}</span>
            </div>
            <div className="text-xs muted" style={{marginTop:4}}>{e.message}</div>
            <div className="row" style={{marginTop:4, gap:8}}>
              <span className="pms-mono text-xs muted">{e.source}</span>
              <div className="spacer"></div>
              <span className="pms-mono text-xs muted">{e.last}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="pms-bot-card-foot">
        <button className="pms-btn ghost">View all errors</button>
      </div>
    </div>
  );
}

function BotLocksCard({ locks }) {
  return (
    <div className="pms-bot-card">
      <div className="pms-bot-card-head"><span>Position locks</span><span className="muted text-xs">held orders / leg notional</span></div>
      <div className="pms-bot-card-body">
        {locks.map((l,i)=>(
          <div className="pms-lockrow" key={i}>
            <div className="row" style={{justifyContent:'space-between', gap:8}}>
              <AssetChip sym={l.ccy}/>
              <span className="pms-mono text-xs muted">held {l.oldest_lock}</span>
            </div>
            <div className="row text-xs" style={{marginTop:6, gap:14}}>
              <div><div className="muted">Open legs</div><div className="pms-mono">{fmt.usd(l.open_leg_notional,{compact:true})}</div></div>
              <div><div className="muted">Locked</div><div className="pms-mono pms-warn">{fmt.usd(l.locked_amount,{compact:true})}</div></div>
              <div><div className="muted">Orders</div><div className="pms-mono">{l.locked_orders}</div></div>
            </div>
          </div>
        ))}
      </div>
      <div className="pms-bot-card-foot">
        <button className="pms-btn ghost">Release stale locks</button>
      </div>
    </div>
  );
}

function VenuesPage() {
  const [expanded, setExpanded] = React.useState({});
  // Per-venue sub-account roll-up — venue → [{account, type, capital, free, used, status}]
  const SUBS = {
    Binance: [
      { account:'Master',     type:'spot+derivs', strategy:'MN-Arb',  capital: 6_240_000, free: 1_240_000, used: 5_000_000, status:'healthy' },
      { account:'Sub-A01',    type:'derivatives', strategy:'X-Arb',   capital: 4_240_000, free:   840_000, used: 3_400_000, status:'healthy' },
      { account:'Sub-A02',    type:'derivatives', strategy:'Prop',    capital: 3_760_000, free:    80_000, used: 3_680_000, status:'degraded' },
    ],
    OKX: [
      { account:'Master',     type:'spot+derivs', strategy:'X-Arb',   capital: 3_440_000, free:   720_000, used: 2_720_000, status:'healthy' },
      { account:'Sub-A12',    type:'derivatives', strategy:'MN-Arb',  capital: 5_120_000, free:   980_000, used: 4_140_000, status:'healthy' },
      { account:'Sub-A14',    type:'spot',        strategy:'MN-Arb',  capital: 4_280_000, free: 1_120_000, used: 3_160_000, status:'healthy' },
    ],
    Bybit: [
      { account:'Master',     type:'spot+derivs', strategy:'MN-Arb',  capital: 4_180_000, free:   620_000, used: 3_560_000, status:'healthy' },
      { account:'Sub-A02',    type:'derivatives', strategy:'Prop',    capital: 4_840_000, free:   280_000, used: 4_560_000, status:'healthy' },
    ],
    Kraken: [
      { account:'Master',     type:'spot',        strategy:'X-Arb',   capital: 2_840_990, free:   540_000, used: 2_300_990, status:'healthy' },
    ],
    Coinbase: [
      { account:'Prime',      type:'prime',       strategy:'X-Arb',   capital: 2_320_000, free:   480_000, used: 1_840_000, status:'healthy' },
    ],
    Deribit: [
      { account:'Master',     type:'options',     strategy:'MN-Arb',  capital: 2_880_500, free:   320_000, used: 2_560_500, status:'healthy' },
    ],
  };
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Counterparties & venues</h1>
          <div className="sub">{VENUES.length} venues · {fmt.usd(VENUES.reduce((s,v)=>s+v.capital,0), {compact:true})} total capital · {Object.values(SUBS).reduce((s,a)=>s+a.length,0)} sub-accounts</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Concentration report</button>
          <button className="pms-btn primary">+ Add venue</button>
        </div>
      </div>
      <PageMeta src="venue connectors · risk-core" refresh="WS · 5s tick" role="PM · RISK · OPS" note={`${VENUES.filter(v=>v.status!=='healthy').length} venues degraded · click any row to expand sub-accounts`}/>

      <div className="pms-card">
        <div className="pms-card-body flush">
          <table className="pms-table">
            <thead><tr>
              <th style={{width:24}}></th>
              <th>Venue</th><th>Type</th><th>Rating</th>
              <th className="num">Capital</th><th className="num">% AUM</th>
              <th className="num">Sub-accts</th><th className="num">API keys</th>
              <th className="num">Margin used</th><th>Status</th>
            </tr></thead>
            <tbody>
              {VENUES.map(v => {
                const open = expanded[v.name];
                const subs = SUBS[v.name] || [];
                return (
                  <React.Fragment key={v.name}>
                    <tr className="pms-row-clickable" onClick={()=>setExpanded(e=>({...e, [v.name]:!e[v.name]}))}>
                      <td><span className="pms-mono muted" style={{display:'inline-block', transition:'transform .15s', transform: open ? 'rotate(90deg)' : 'none'}}>▸</span></td>
                      <td><VenueChip name={v.name}/></td>
                      <td><span className="pms-pill">{v.type}</span></td>
                      <td><span className="pms-mono strong">{v.rating}</span></td>
                      <td className="num strong">{fmt.usd(v.capital,{compact:true})}</td>
                      <td className="num">
                        <div className="row" style={{justifyContent:'flex-end', gap:8}}>
                          <span>{v.pct.toFixed(1)}%</span>
                          <MiniBar pct={v.pct*2.5}/>
                        </div>
                      </td>
                      <td className="num">{v.sub_accts}</td>
                      <td className="num">{v.api_keys}</td>
                      <td className="num">{(()=>{ const pct=v.margin*100; return <span className={pct>50?'pms-warn':''}>{pct.toFixed(0)}%</span>; })()}</td>
                      <td>
                        {v.status==='healthy' && <span className="pms-pill pos"><span className="dot"></span>HEALTHY</span>}
                        {v.status==='degraded' && <span className="pms-pill warn"><span className="dot"></span>DEGRADED</span>}
                        {v.status==='offline' && <span className="pms-pill neg"><span className="dot"></span>OFFLINE</span>}
                      </td>
                    </tr>
                    {open && subs.map((s,i)=>(
                      <tr key={v.name+i} className="pms-row-sub">
                        <td></td>
                        <td colSpan={2}><span className="pms-mono text-xs muted">└</span>&nbsp;<span className="pms-mono">{s.account}</span> <span className="text-xs muted">· {s.type}</span></td>
                        <td><span className="pms-pill purple">{s.strategy}</span></td>
                        <td className="num">{fmt.usd(s.capital,{compact:true})}</td>
                        <td className="num muted">{(s.capital/v.capital*100).toFixed(0)}% of venue</td>
                        <td className="num muted" colSpan={2}>
                          <span className="pms-mono text-xs">free {fmt.usd(s.free,{compact:true})} · used {fmt.usd(s.used,{compact:true})}</span>
                        </td>
                        <td className="num">
                          <div style={{width:60, height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden', marginLeft:'auto'}}>
                            <div style={{width:`${s.used/s.capital*100}%`, height:'100%', background: s.used/s.capital>0.85 ? 'var(--pms-warn)' : 'var(--pms-info)'}}></div>
                          </div>
                        </td>
                        <td>{s.status==='healthy' ? <span className="pms-pill pos text-xs">OK</span> : <span className="pms-pill warn text-xs">DEG</span>}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TransfersPage() {
  const [confirm, setConfirm] = React.useState(null);
  const [tab, setTab] = React.useState('pending');
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Fund transfers</h1>
          <div className="sub">{TRANSFERS_PENDING.length} pending · {TRANSFERS_INFLIGHT.length} in-flight · {TRANSFERS_RECENT.length} recent · single-sig under {fmt.usd(1000)} · 2-of-2 above</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Audit trail</button>
          <button className="pms-btn">Threshold settings</button>
          <button className="pms-btn primary">+ New transfer</button>
        </div>
      </div>
      <PageMeta src="transfer-service · venue connectors · risk-core" refresh="WS · 2s tick · chain confirms" role="PM · OPS · RISK" note={`${TRANSFERS_PENDING.length} require approval · ${TRANSFERS_INFLIGHT.length} confirming on-chain · ${TRANSFERS_RECENT.filter(r=>r.status==='failed').length} failed in last 24h`}/>

      <div className="pms-subtabs">
        {[
          { id:'pending',  label:'Pending approvals', count: TRANSFERS_PENDING.length, badge: TRANSFERS_PENDING.length > 0 ? 'warn' : null },
          { id:'inflight', label:'In-flight',         count: TRANSFERS_INFLIGHT.length, badge: 'info' },
          { id:'recent',   label:'Recent',            count: TRANSFERS_RECENT.length },
        ].map(t => (
          <button key={t.id} className={`pms-subtab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            <span>{t.label}</span>
            {t.count != null && <span className={`pms-subtab-count ${t.badge||''}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab==='pending' && (
        <div className="pms-card">
          <div className="pms-card-head">Pending approvals<div className="label-meta">requires PM or Risk approval · oldest first</div></div>
          <SortableTable
            rowKey={r=>r.id}
            columns={[
              { key:'id', label:'Transfer ID', render:r=> <span className="pms-mono">{r.id}</span>},
              { key:'from', label:'From', render:r=> <span className="text-sm">{r.from}</span>},
              { key:'arrow', label:'', render:()=> <span className="muted">→</span>, width:24},
              { key:'to', label:'To', render:r=> <span className="text-sm">{r.to}</span>},
              { key:'asset', label:'Asset', render:r=> <AssetChip sym={r.asset}/>},
              { key:'chain', label:'Chain', render:r=> <span className="pms-pill">{r.chain}</span>},
              { key:'amount', label:'Amount', num:true, sortValue:r=>r.amount, render:r=> <span className="strong">{fmt.usd(r.amount, {compact:true})}</span>},
              { key:'sig', label:'Signing', render:r=> r.sig==='2-of-2' ? <span className="pms-pill warn">2-of-2</span> : <span className="pms-pill">single</span>},
              { key:'requestor', label:'Requestor', render:r=> <span className="pms-mono text-xs">{r.requestor}</span>},
              { key:'reason', label:'Reason', render:r=> <span className="text-xs muted">{r.reason}</span>},
              { key:'risk', label:'Risk', render:r=>{
                const cls = r.risk==='high'?'neg':r.risk==='medium'?'warn':'pos';
                return <span className={`pms-pill ${cls}`}>{r.risk.toUpperCase()}</span>;
              }},
              { key:'initiated', label:'Initiated', render:r=> <span className="pms-mono text-xs muted">{r.initiated}</span>},
              { key:'act', label:'', render:r=> (
                <div className="row" style={{gap:6, justifyContent:'flex-end'}}>
                  <button className="pms-btn success text-xs" onClick={()=>setConfirm({type:'approve', t:r})}>Approve</button>
                  <button className="pms-btn danger text-xs" onClick={()=>setConfirm({type:'reject', t:r})}>Reject</button>
                </div>
              )},
            ]}
            rows={TRANSFERS_PENDING}
          />
        </div>
      )}

      {tab==='inflight' && (
        <div className="pms-card">
          <div className="pms-card-head">In-flight on-chain<div className="label-meta">broadcast · awaiting confirmations</div></div>
          <SortableTable
            rowKey={r=>r.id}
            columns={[
              { key:'id', label:'Transfer ID', render:r=> <span className="pms-mono">{r.id}</span>},
              { key:'from', label:'From', render:r=> <span className="text-sm">{r.from}</span>},
              { key:'arrow', label:'', render:()=> <span className="muted">→</span>, width:24},
              { key:'to', label:'To', render:r=> <span className="text-sm">{r.to}</span>},
              { key:'asset', label:'Asset', render:r=> <AssetChip sym={r.asset}/>},
              { key:'chain', label:'Chain', render:r=> <span className="pms-pill">{r.chain}</span>},
              { key:'amount', label:'Amount', num:true, sortValue:r=>r.amount, render:r=> <span className="strong">{typeof r.amount==='number' && r.amount<1000 ? fmt.num(r.amount,4) : fmt.usd(r.amount,{compact:true})}</span>},
              { key:'conf', label:'Confirmations', sortValue:r=>r.confirmations/r.required, render:r=>(
                <div className="row" style={{gap:8, alignItems:'center'}}>
                  <span className="pms-mono text-xs">{r.confirmations}/{r.required}</span>
                  <div style={{width:80, height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden'}}>
                    <div style={{width:`${(r.confirmations/r.required)*100}%`, height:'100%', background:'var(--pms-info)'}}></div>
                  </div>
                </div>
              )},
              { key:'eta', label:'ETA', render:r=> <span className="pms-mono text-xs">{r.eta}</span>},
              { key:'txhash', label:'TX hash', render:r=> <span className="pms-mono text-xs muted">{r.txhash}</span>},
              { key:'broadcast', label:'Broadcast', render:r=> <span className="pms-mono text-xs muted">{r.broadcast}</span>},
              { key:'status', label:'Status', render:r=>{
                const cls = r.status==='finalising'?'pos':'info';
                return <span className={`pms-pill ${cls}`}><span className="dot"></span>{r.status}</span>;
              }},
            ]}
            rows={TRANSFERS_INFLIGHT}
          />
        </div>
      )}

      {tab==='recent' && (
        <div className="pms-card">
          <div className="pms-card-head">Recent · last 24h<div className="label-meta">{TRANSFERS_RECENT.filter(r=>r.status==='failed').length} failed</div></div>
          <SortableTable
            rowKey={r=>r.id}
            columns={[
              { key:'id', label:'Transfer ID', render:r=> <span className="pms-mono">{r.id}</span>},
              { key:'from', label:'From', render:r=> <span className="text-sm">{r.from}</span>},
              { key:'arrow', label:'', render:()=> <span className="muted">→</span>, width:24},
              { key:'to', label:'To', render:r=> <span className="text-sm">{r.to}</span>},
              { key:'asset', label:'Asset', render:r=> <AssetChip sym={r.asset}/>},
              { key:'chain', label:'Chain', render:r=> <span className="pms-pill">{r.chain}</span>},
              { key:'amount', label:'Amount', num:true, sortValue:r=>r.amount, render:r=> <span className="strong">{fmt.usd(r.amount,{compact:true})}</span>},
              { key:'sig', label:'Signing', render:r=> r.sig==='2-of-2' ? <span className="pms-pill">2-of-2</span> : <span className="pms-pill">single</span>},
              { key:'settled', label:'Settled', render:r=> <span className="pms-mono text-xs">{r.settled}</span>},
              { key:'duration', label:'Duration', render:r=> <span className={`pms-mono text-xs ${r.status==='failed'?'pms-neg':'muted'}`}>{r.duration}</span>},
              { key:'status', label:'Status', render:r=>{
                const cls = r.status==='failed'?'neg':'pos';
                return <span className={`pms-pill ${cls}`}><span className="dot"></span>{r.status}</span>;
              }},
            ]}
            rows={TRANSFERS_RECENT}
          />
        </div>
      )}
      <Modal open={!!confirm} title={confirm? `${confirm.type==='approve'?'Approve':'Reject'} ${confirm.t.id}`:''} onClose={()=>setConfirm(null)}
        footer={<><button className="pms-btn ghost" onClick={()=>setConfirm(null)}>Cancel</button>
          <button className={`pms-btn ${confirm?.type==='approve'?'primary':'danger'}`} onClick={()=>setConfirm(null)}>
            Confirm {confirm?.type}
          </button></>}>
        {confirm && (
          <>
            <dl className="pms-dl">
              <dt>From</dt><dd>{confirm.t.from}</dd>
              <dt>To</dt><dd>{confirm.t.to}</dd>
              <dt>Chain</dt><dd>{confirm.t.chain}</dd>
              <dt>Amount</dt><dd className="strong">{fmt.usd(confirm.t.amount)} {confirm.t.asset}</dd>
              <dt>Signing</dt><dd>{confirm.t.sig==='2-of-2'? '2-of-2 multi-sig (required above $1,000)' : 'Single-sig (under $1,000)'}</dd>
              <dt>Requestor</dt><dd>{confirm.t.requestor}</dd>
              <dt>Reason</dt><dd>{confirm.t.reason}</dd>
            </dl>
            {confirm.type==='reject' && (
              <div style={{marginTop:14}}>
                <label className="text-xs muted">Rejection reason</label>
                <textarea style={{width:'100%', marginTop:4, padding:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--pms-divider)', borderRadius:6, color:'var(--fg-1)', fontFamily:'inherit', fontSize:12, minHeight:60}} placeholder="Required — min 3 characters"></textarea>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

function ReportsPage() {
  const REPORTS = [
    { name:"Monthly NAV statement", period:"April 2026", type:"PDF", size:"412 KB", generated:"2026-05-01 09:00", status:"ready"},
    { name:"Daily P&L attribution", period:"2026-04-30", type:"PDF", size:"118 KB", generated:"2026-05-01 06:00", status:"ready"},
    { name:"Risk & compliance summary", period:"April 2026", type:"PDF", size:"284 KB", generated:"2026-05-01 09:00", status:"ready"},
    { name:"Tax lot detail (US)", period:"YTD 2026", type:"CSV", size:"48 KB", generated:"2026-04-30 18:00", status:"ready"},
    { name:"Counterparty exposure", period:"Weekly", type:"XLSX", size:"94 KB", generated:"2026-04-28 06:00", status:"ready"},
    { name:"Strategy 3 stress scenarios", period:"Custom", type:"PDF", size:"—", generated:"—", status:"queued"},
  ];
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Reports & statements</h1>
          <div className="sub">Generated reports · scheduled exports · investor statements</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Schedule</button>
          <button className="pms-btn primary">+ Generate report</button>
        </div>
      </div>
      <div className="pms-card">
        <SortableTable
          rowKey={r=>r.name+r.period}
          columns={[
            { key:'name', label:'Report', render:r=> <span className="strong">{r.name}</span>},
            { key:'period', label:'Period'},
            { key:'type', label:'Format', render:r=> <span className="pms-pill">{r.type}</span>},
            { key:'size', label:'Size', render:r=> <span className="pms-mono text-xs muted">{r.size}</span>},
            { key:'generated', label:'Generated', render:r=> <span className="pms-mono text-xs muted">{r.generated}</span>},
            { key:'status', label:'Status', render:r=> r.status==='ready' ? <span className="pms-pill pos">READY</span> : <span className="pms-pill warn">QUEUED</span>},
            { key:'act', label:'', render:r=> r.status==='ready' ? <button className="pms-btn ghost text-xs">Download ↓</button> : <button className="pms-btn ghost text-xs">View progress</button>},
          ]}
          rows={REPORTS}
        />
      </div>
    </>
  );
}

function AdminPage() {
  const [tab, setTab] = React.useState('team');
  const TABS = [
    { id:'team', label:'Team & keys', count: USERS.length + API_KEYS.length },
    { id:'health', label:'System health', count: SERVICES.filter(s=>s.status!=='healthy').length || null, badge: SERVICES.filter(s=>s.status!=='healthy').length ? 'warn' : null },
    { id:'audit', label:'Audit log', count: AUDIT_LOG.length },
    { id:'config', label:'Config' },
  ];
  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Admin</h1>
          <div className="sub">{USERS.length} users · {API_KEYS.length} API keys · {AUDIT_LOG.length} audit events today · {SERVICES.filter(s=>s.status==='degraded').length} service degraded</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Download audit (CSV)</button>
          <button className="pms-btn primary">+ Invite user</button>
        </div>
      </div>
      <PageMeta src="auth · audit-service · prometheus · config-store" refresh="health: 5s · audit: live · users/keys: on-change" role="ADMIN only" note="Audit log is write-once · all actions immutable"/>

      <div className="pms-subtabs">
        {TABS.map(t => (
          <button key={t.id} className={`pms-subtab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            <span>{t.label}</span>
            {t.count != null && <span className={`pms-subtab-count ${t.badge||''}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab==='team' && <AdminTeamTab/>}
      {tab==='health' && <AdminHealthTab/>}
      {tab==='audit' && <AdminAuditTab/>}
      {tab==='config' && <AdminConfigTab/>}
    </>
  );
}

function AdminTeamTab() {
  return (
    <div className="pms-grid-2" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="pms-card">
        <div className="pms-card-head">Team members<div className="label-meta">{USERS.length}</div></div>
        <div className="pms-card-body flush">
          <table className="pms-table">
            <thead><tr><th>Member</th><th>Role</th><th>2FA</th><th>Last seen</th></tr></thead>
            <tbody>
              {USERS.map(u=>{
                const initials = u.name.split(' ').map(p=>p[0]).join('');
                return (
                  <tr key={u.email}>
                    <td>
                      <div className="row" style={{gap:10}}>
                        <div className="pms-sb-avatar" style={{width:24, height:24, fontSize:9}}>{initials}</div>
                        <div>
                          <div className="strong">{u.name}</div>
                          <div className="muted text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`pms-role ${u.role.toLowerCase()}`}>{u.role}</span></td>
                    <td>{u.twofa ? <span className="pms-pos">✓</span> : <span className="pms-neg">✗</span>}</td>
                    <td className="pms-mono text-xs muted">{u.last}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pms-card">
        <div className="pms-card-head">API keys<div className="label-meta">{API_KEYS.length}</div></div>
        <div className="pms-card-body flush">
          <table className="pms-table">
            <thead><tr><th>Venue</th><th>Account</th><th>Key</th><th>Status</th><th>Rotated</th></tr></thead>
            <tbody>
              {API_KEYS.map(k=>(
                <tr key={k.id}>
                  <td><VenueChip name={k.venue}/></td>
                  <td className="text-xs">{k.account}</td>
                  <td className="pms-mono text-xs muted">{k.masked}</td>
                  <td>
                    {k.status==='active' && <span className="pms-pill pos">ACTIVE</span>}
                    {k.status==='rotate-soon' && <span className="pms-pill warn">ROTATE</span>}
                    {k.status==='expired' && <span className="pms-pill neg">EXPIRED</span>}
                  </td>
                  <td className="pms-mono text-xs muted">{k.rotated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminHealthTab() {
  return (
    <div className="pms-card">
      <div className="pms-card-head">System health<div className="label-meta">all microservices · p50/p99 from last 5min</div></div>
      <SortableTable rowKey={r=>r.svc}
        columns={[
          { key:'svc', label:'Service', render:r=> <span className="pms-mono strong">{r.svc}</span>},
          { key:'status', label:'Status', render:r=> r.status==='healthy'
            ? <span className="pms-pill pos"><span className="dot"></span>UP</span>
            : <span className="pms-pill warn"><span className="dot"></span>DEGRADED</span>},
          { key:'p50', label:'p50', num:true, render:r=> <span className="pms-mono">{r.p50}ms</span>},
          { key:'p99', label:'p99', num:true, render:r=> <span className={`pms-mono ${r.p99>500?'pms-warn':''}`}>{r.p99}ms</span>},
          { key:'uptime', label:'Uptime', render:r=> <span className="pms-mono text-xs">{r.uptime}</span>},
          { key:'cpu', label:'CPU', num:true, render:r=> <span className="pms-mono text-xs">{(r.cpu*100).toFixed(0)}%</span>},
          { key:'mem', label:'Mem', num:true, render:r=> <span className="pms-mono text-xs">{(r.mem*100).toFixed(0)}%</span>},
          { key:'err', label:'Last error', render:r=> <span className="text-xs muted">{r.last_error}</span>},
        ]}
        rows={SERVICES}/>
    </div>
  );
}

function AdminAuditTab() {
  return (
    <div className="pms-card">
      <div className="pms-card-head">Audit log<div className="label-meta">{AUDIT_LOG.length} events · write-once · immutable</div></div>
      <SortableTable rowKey={(r,i)=>r.t+i}
        columns={[
          { key:'t', label:'Time', render:r=> <span className="pms-mono text-xs muted">{r.t}</span>},
          { key:'actor', label:'Actor', render:r=> <span className="text-xs">{r.actor}</span>},
          { key:'role', label:'Role', render:r=> <span className={`pms-role ${r.role.toLowerCase()}`}>{r.role}</span>},
          { key:'action', label:'Action', render:r=> <span className="pms-mono text-xs strong">{r.action}</span>},
          { key:'target', label:'Target', render:r=> <span className="pms-mono text-xs muted">{r.target}</span>},
          { key:'diff', label:'Diff', render:r=> <span className="text-xs muted">{r.diff || '—'}</span>},
          { key:'ip', label:'IP', render:r=> <span className="pms-mono text-xs muted">{r.ip}</span>},
          { key:'result', label:'', render:r=> r.result==='ok' ? <span className="pms-pos">✓</span> : <span className="pms-neg">×</span>},
        ]}
        rows={AUDIT_LOG}/>
    </div>
  );
}

function AdminConfigTab() {
  const CFG = [
    { group:'Risk limits', rows: [
      { k:'Drawdown notify threshold', v:'−2.00%', edit:true },
      { k:'Hard liquidation drawdown', v:'−5.00%', edit:true },
      { k:'KYT score block threshold', v:'30', edit:true },
    ]},
    { group:'Transfer policy', rows: [
      { k:'On-chain auto threshold', v:'$1,000', edit:true },
      { k:'M-of-N approval above', v:'$1,000', edit:true },
      { k:'KYT provider', v:'Chainalysis · primary', edit:false },
      { k:'Provider lock duration', v:'24h after deposit credit', edit:false },
    ]},
    { group:'Fee defaults', rows: [
      { k:'Default mgmt fee', v:'2.00% / yr', edit:true },
      { k:'Default perf fee', v:'20.00% above HWM', edit:true },
      { k:'Hurdle rate', v:'4.00% / yr', edit:true },
      { k:'Crystallisation', v:'Monthly · last business day', edit:false },
    ]},
    { group:'Integrations', rows: [
      { k:'Custody', v:'Fireblocks · Mainnet Vault', edit:false },
      { k:'Accounting', v:'Lukka · daily push 23:55 UTC', edit:false },
      { k:'KYC', v:'Sumsub · investor & UBO', edit:false },
    ]},
  ];
  return (
    <div className="pms-card">
      <div className="pms-card-head">Configuration<div className="label-meta">edits write to audit log</div></div>
      <div className="pms-card-body" style={{padding:0}}>
        {CFG.map(g => (
          <div key={g.group} className="pms-cfg-group">
            <div className="pms-cfg-group-head">{g.group}</div>
            {g.rows.map(r => (
              <div className="pms-cfg-row" key={r.k}>
                <div className="k">{r.k}</div>
                <div className="v pms-mono">{r.v}</div>
                <div className="act">{r.edit ? <button className="pms-btn ghost text-xs">Edit</button> : <span className="muted text-xs">read-only</span>}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PositionsPage, BlotterPage, PnlPage, RiskPage, ReconPage, StrategiesPage, PoolDetailPage, BotsPage, BotWalletCard, BotErrorsCard, BotLocksCard, VenuesPage, TransfersPage, ReportsPage, AdminPage });
