/* PMS v2 — new pages: Fund Flow, Investors, Firm PnL, Bot Triage */

// ─── helpers ───────────────────────────────────────────────────
const SHORT_STAGE = {
  D0_CREATED:'Created', D1_TX_SUBMITTED:'Tx sent', D2_SCANNED:'KYT', D3_CONFIRMED:'On-chain', D4_CREDITED:'Credited', D5_SETTLED:'Settled', D_FAIL:'Failed',
  W0_CREATED:'Requested', W1_KYT:'KYT', W2_APPROVAL:'Approval', W3_LOCK_CHECK:'Lock check', W4_PROVIDER_CHECK:'Provider', W5_EXECUTING:'Executing', W6_ON_CHAIN:'On-chain', W7_SETTLED:'Settled', W_FAIL:'Failed',
};

function StageDot({ stage, fail }) {
  return <span className="pms-pill" style={{ background: fail ? 'rgba(255,112,114,0.18)' : 'rgba(78,181,255,0.16)', color: fail ? 'var(--pms-neg)' : 'var(--pms-info)', textTransform:'none', fontSize:10, fontWeight:600 }}>{SHORT_STAGE[stage] || stage}</span>;
}

// ─── Annotated callout (data source / refresh / role) ──────────
function PageMeta({ src, refresh, role, note }) {
  return (
    <div className="pms-pagemeta">
      <span><span className="pms-pagemeta-k">Source</span> {src}</span>
      <span className="pms-pagemeta-sep">·</span>
      <span><span className="pms-pagemeta-k">Refresh</span> {refresh}</span>
      <span className="pms-pagemeta-sep">·</span>
      <span><span className="pms-pagemeta-k">Visible to</span> {role}</span>
      {note && <><span className="pms-pagemeta-sep">·</span><span className="muted">{note}</span></>}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  Sankey diagram
// ───────────────────────────────────────────────────────────────
function FlowSankey({ stages, flows, height = 360, accentByStage }) {
  const W = 1180;
  const H = height;
  const PAD_TOP = 24;
  const PAD_BOT = 24;
  const NODE_W = 14;

  // Totals per stage
  const inSums = {}, outSums = {};
  flows.forEach(f => {
    outSums[f.from] = (outSums[f.from]||0) + f.amount;
    inSums[f.to]    = (inSums[f.to]||0)    + f.amount;
  });
  const stageTotal = {};
  stages.forEach(s => { stageTotal[s] = Math.max(inSums[s]||0, outSums[s]||0); });

  // Column positions
  const colX = {};
  const cols = stages;
  const STEP = (W - 60 - NODE_W) / (cols.length - 1);
  cols.forEach((s,i) => { colX[s] = 40 + i * STEP; });
  colX['D_FAIL'] = W - NODE_W - 20;
  colX['W_FAIL'] = W - NODE_W - 20;

  const maxTotal = Math.max(...Object.values(stageTotal));
  const usable = H - PAD_TOP - PAD_BOT;
  const scale = (a) => (a / maxTotal) * usable * 0.85;

  // Node positions (centred vertically)
  const nodes = {};
  cols.forEach(s => {
    const h = scale(stageTotal[s] || 1);
    nodes[s] = { x: colX[s], y: (H - h)/2, h, total: stageTotal[s] };
  });
  // Failure node — at bottom right
  if (flows.some(f=>f.failed)) {
    const failTotal = flows.filter(f=>f.failed).reduce((s,f)=>s+f.amount,0);
    const failKey = stages[0].startsWith('D') ? 'D_FAIL' : 'W_FAIL';
    const h = scale(failTotal);
    nodes[failKey] = { x: colX[failKey], y: H - PAD_BOT - h, h, total: failTotal };
  }

  // Compute ribbon offsets — stack outflows from source, stack inflows to target.
  const outCursor = {}, inCursor = {};
  cols.forEach(s => { outCursor[s] = nodes[s]?.y || 0; inCursor[s] = nodes[s]?.y || 0; });

  // Sort flows: drive failed flows last (drawn on top)
  const sorted = [...flows].sort((a,b)=> (a.failed?1:0) - (b.failed?1:0));

  const [hover, setHover] = React.useState(null);

  const ribbons = sorted.map((f, i) => {
    const src = nodes[f.from];
    const dst = nodes[f.to];
    if (!src || !dst) return null;
    const h = scale(f.amount);
    const sy = outCursor[f.from];
    const dy = inCursor[f.to];
    outCursor[f.from] += h;
    inCursor[f.to] += h;
    const x1 = src.x + NODE_W;
    const x2 = dst.x;
    const cx = (x1 + x2) / 2;
    // bezier
    const d = `M${x1},${sy} C${cx},${sy} ${cx},${dy} ${x2},${dy} L${x2},${dy+h} C${cx},${dy+h} ${cx},${sy+h} ${x1},${sy+h} Z`;
    const color = f.failed ? 'rgba(255,112,114,0.45)' : (accentByStage?.[f.from] || 'rgba(176,108,255,0.42)');
    const id = f.from + '->' + f.to + '-' + i;
    const isHover = hover === id;
    return (
      <path key={id}
        d={d}
        fill={color}
        opacity={hover && !isHover ? 0.3 : 0.85}
        stroke={isHover ? 'var(--fg-1)' : 'none'}
        strokeOpacity={isHover ? 0.4 : 0}
        onMouseEnter={()=>setHover(id)}
        onMouseLeave={()=>setHover(null)}
        style={{transition:'opacity 0.12s'}}
      >
        <title>{`${SHORT_STAGE[f.from]} → ${SHORT_STAGE[f.to]}\n${fmt.usd(f.amount,{compact:true})}${f.failed?' · failed':''}`}</title>
      </path>
    );
  });

  const nodeEls = Object.entries(nodes).map(([s, n]) => {
    const fail = s.endsWith('_FAIL');
    return (
      <g key={s}>
        <rect x={n.x} y={n.y} width={NODE_W} height={n.h} fill={fail ? 'var(--pms-neg)' : (accentByStage?.[s] || 'var(--pms-accent)')} opacity="0.95" rx="2"/>
        <text x={n.x + NODE_W/2} y={n.y - 8} fontSize="10" fontWeight="700" fill="var(--fg-1)" textAnchor="middle" style={{textTransform:'uppercase', letterSpacing:0.5}}>
          {SHORT_STAGE[s] || s}
        </text>
        <text x={n.x + NODE_W/2} y={n.y + n.h + 14} fontSize="10" fontFamily="var(--pms-mono)" fill="var(--fg-2)" textAnchor="middle">
          {fmt.usd(n.total,{compact:true})}
        </text>
      </g>
    );
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pms-sankey" preserveAspectRatio="xMidYMid meet" width="100%" height={H}>
      {ribbons}
      {nodeEls}
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────
//  Fund Flow page
// ───────────────────────────────────────────────────────────────
function FundFlowPage() {
  const [tab, setTab] = React.useState('deposits');
  const [selected, setSelected] = React.useState(null);
  const isDeposit = tab==='deposits';
  const stages = isDeposit ? [...DEPOSIT_STAGES, 'D_FAIL'] : [...WITHDRAW_STAGES, 'W_FAIL'];
  const flows = isDeposit ? DEPOSIT_FLOWS : WITHDRAW_FLOWS;
  const intents = FUND_INTENTS.filter(i => isDeposit ? i.dir==='deposit' : i.dir==='withdraw');

  const total = intents.reduce((s,i)=>s+i.amount,0);
  const failed = intents.filter(i=>i.failed).length;
  const settledKey = isDeposit ? 'D5_SETTLED' : 'W7_SETTLED';
  const settledTotal = flows.find(f=>f.to===settledKey)?.amount || 0;
  const entryTotal = flows.filter(f=>f.from===(isDeposit?'D0_CREATED':'W0_CREATED')).reduce((s,f)=>s+f.amount,0);
  const conversion = entryTotal ? (settledTotal/entryTotal*100) : 0;
  const failedTotal = flows.filter(f=>f.failed).reduce((s,f)=>s+f.amount,0);

  const accentByStage = isDeposit
    ? { D0_CREATED:'rgba(78,181,255,0.55)', D1_TX_SUBMITTED:'rgba(78,181,255,0.55)', D2_SCANNED:'rgba(176,108,255,0.55)', D3_CONFIRMED:'rgba(176,108,255,0.55)', D4_CREDITED:'rgba(104,218,152,0.55)', D5_SETTLED:'rgba(104,218,152,0.65)' }
    : { W0_CREATED:'rgba(78,181,255,0.55)', W1_KYT:'rgba(176,108,255,0.55)', W2_APPROVAL:'rgba(255,196,84,0.55)', W3_LOCK_CHECK:'rgba(255,196,84,0.55)', W4_PROVIDER_CHECK:'rgba(255,131,48,0.55)', W5_EXECUTING:'rgba(176,108,255,0.55)', W6_ON_CHAIN:'rgba(104,218,152,0.55)', W7_SETTLED:'rgba(104,218,152,0.65)' };

  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Fund flow</h1>
          <div className="sub">Live intents from deposit/withdrawal pipelines · sankey shows $ flowing between stages over last 24h</div>
        </div>
        <div className="pms-page-actions">
          <div className="pms-seg">
            <button className={tab==='deposits'?'active':''} onClick={()=>setTab('deposits')}>Deposits</button>
            <button className={tab==='withdrawals'?'active':''} onClick={()=>setTab('withdrawals')}>Withdrawals</button>
          </div>
          <button className="pms-btn ghost">Export CSV</button>
          <button className="pms-btn primary">+ New {isDeposit?'deposit':'withdrawal'}</button>
        </div>
      </div>
      <PageMeta src="transfer-service · orchestrator · risk-core" refresh="WS · 1s tick (KYT 10s)" role="PM · OPS · COMPLIANCE" note={`${intents.length} intents in flight · 24h conversion ${conversion.toFixed(1)}%`}/>

      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <div className="pms-kpi featured"><div className="pms-kpi-label">In flight</div><div className="pms-kpi-value">{intents.filter(i=>!i.failed).length}</div><div className="pms-kpi-foot text-3">{fmt.usd(total,{compact:true})} notional</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Settled · 24h</div><div className="pms-kpi-value pms-pos">{fmt.usd(settledTotal,{compact:true})}</div><div className="pms-kpi-foot text-3">{conversion.toFixed(1)}% conversion</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Failed / blocked</div><div className="pms-kpi-value pms-neg">{failed}</div><div className="pms-kpi-foot pms-neg">{fmt.usd(failedTotal,{compact:true})} held</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Avg time to settle</div><div className="pms-kpi-value">{isDeposit ? '00:42:18' : '01:18:42'}</div><div className="pms-kpi-foot text-3">p50 · last 24h</div></div>
      </div>

      <div className="pms-card">
        <div className="pms-card-head">
          {isDeposit ? 'Deposit pipeline' : 'Withdrawal pipeline'}
          <div className="label-meta">$ flow between stages · hover ribbon for detail</div>
        </div>
        <div className="pms-card-body">
          <FlowSankey stages={stages} flows={flows} accentByStage={accentByStage}/>
          <div className="pms-sankey-legend">
            <span><span className="dot" style={{background:'rgba(176,108,255,0.65)'}}></span>Active stage</span>
            <span><span className="dot" style={{background:'rgba(104,218,152,0.65)'}}></span>Settled</span>
            <span><span className="dot" style={{background:'rgba(255,196,84,0.65)'}}></span>Awaiting approval / hold</span>
            <span><span className="dot" style={{background:'rgba(255,112,114,0.65)'}}></span>Failed / blocked</span>
          </div>
        </div>
      </div>

      <div className="pms-card" style={{marginTop:'var(--pms-gap)'}}>
        <div className="pms-card-head">
          Intents
          <div className="label-meta">{intents.length} in flight · click row for detail</div>
        </div>
        <SortableTable
          rowKey={r=>r.id}
          onRowClick={r=>setSelected(r)}
          columns={[
            { key:'id', label:'Intent', render:r=> <span className="pms-mono">{r.id}</span>},
            { key:'user', label:'Investor', render:r=> <span className="pms-mono text-xs">{r.user}</span>},
            { key:'amount', label:'Amount', num:true, sortValue:r=>r.amount, render:r=> <span className="strong">{fmt.usd(r.amount,{compact:true})}</span>},
            { key:'asset', label:'Asset', render:r=> <AssetChip sym={r.asset}/>},
            { key:'chain', label:'Chain', render:r=> <span className="pms-pill">{r.chain}</span>},
            { key:'strategy', label:'Strategy', render:r=> <span className="pms-pill purple">{r.strategy}</span>},
            { key:'stage', label:'Stage', render:r=> <StageDot stage={r.stage} fail={r.failed}/>},
            { key:'kyt', label:'KYT', num:true, render:r => <span className={typeof r.kyt==='number' && r.kyt>30 ? 'pms-warn' : ''}>{r.kyt}</span>},
            { key:'age', label:'Age', render:r=> <span className="pms-mono text-xs muted">{r.age}</span>},
            { key:'unlock', label:'Unlock ETA', render:r=> <span className="pms-mono text-xs">{r.unlock_eta}</span>},
          ]}
          rows={intents}
        />
      </div>

      <Modal open={!!selected} title={selected ? `Intent ${selected.id}` : ''} onClose={()=>setSelected(null)}
        footer={<>
          <button className="pms-btn ghost">View saga log</button>
          {selected?.failed ? <button className="pms-btn">Retry</button> : <button className="pms-btn primary">Force advance</button>}
        </>}>
        {selected && (
          <>
            <dl className="pms-dl">
              <dt>Direction</dt><dd>{selected.dir.toUpperCase()}</dd>
              <dt>Investor</dt><dd>{selected.user}</dd>
              <dt>Amount</dt><dd className="strong">{fmt.usd(selected.amount)} {selected.asset}</dd>
              <dt>Chain</dt><dd>{selected.chain}</dd>
              <dt>Strategy</dt><dd>{selected.strategy}</dd>
              <dt>Stage</dt><dd><StageDot stage={selected.stage} fail={selected.failed}/></dd>
              <dt>KYT score</dt><dd className={typeof selected.kyt==='number' && selected.kyt>30 ? 'pms-warn' : ''}>{selected.kyt}</dd>
              <dt>Confirmations</dt><dd>{selected.conf}</dd>
              <dt>Provider</dt><dd>{selected.provider}</dd>
              <dt>Age</dt><dd>{selected.age}</dd>
              <dt>Unlock</dt><dd>{selected.unlock_eta}</dd>
              {selected.reason && <><dt>Failure reason</dt><dd className="pms-neg">{selected.reason}</dd></>}
            </dl>
            <div style={{marginTop:14, paddingTop:12, borderTop:'1px solid var(--pms-divider)'}}>
              <div className="text-xs muted" style={{marginBottom:6}}>Saga timeline</div>
              <div style={{display:'grid', gridTemplateColumns:'auto 1fr', gap:'6px 12px', fontSize:11, fontFamily:'var(--pms-mono)'}}>
                <span className="muted">14:32:18</span><span>stage advance · {selected.stage}</span>
                <span className="muted">14:31:42</span><span>provider callback ok</span>
                <span className="muted">14:31:08</span><span>kyt score returned · {selected.kyt}</span>
                <span className="muted">14:30:42</span><span>on-chain tx broadcast</span>
                <span className="muted">14:30:08</span><span>intent created by {selected.user}</span>
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

// ───────────────────────────────────────────────────────────────
//  Investors page — balances, FIFO lots, unlock timeline
// ───────────────────────────────────────────────────────────────
function InvestorsPage() {
  const [sel, setSel] = React.useState(null);
  if (sel) return <InvestorDetailPage inv={sel} onClose={()=>setSel(null)}/>;
  const totals = INVESTORS.reduce((a,i)=>({ bal:a.bal+i.balance, locked:a.locked+i.locked, withdrawable:a.withdrawable+i.withdrawable, dep:a.dep+i.deposits, wd:a.wd+i.withdrawals }), {bal:0,locked:0,withdrawable:0,dep:0,wd:0});
  return (
    <>
      <div className="pms-page-head">
        <div><h1>Investors</h1><div className="sub">Per-investor balances, FIFO deposit lots, lock state · live</div></div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost">Export</button>
          <button className="pms-btn primary">+ New investor</button>
        </div>
      </div>
      <PageMeta src="user-service · transfer-service · risk-core" refresh="WS · 5s tick" role="PM · OPS · SALES" note={`${INVESTORS.length} investors · ${fmt.usd(totals.bal,{compact:true})} AUM`}/>

      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <div className="pms-kpi featured"><div className="pms-kpi-label">Total balance</div><div className="pms-kpi-value">{fmt.usd(totals.bal,{compact:true})}</div><div className="pms-kpi-foot text-3">across {INVESTORS.length} investors</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Withdrawable now</div><div className="pms-kpi-value pms-pos">{fmt.usd(totals.withdrawable,{compact:true})}</div><div className="pms-kpi-foot text-3">unlocked + no strategy hold</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Locked</div><div className="pms-kpi-value pms-warn">{fmt.usd(totals.locked,{compact:true})}</div><div className="pms-kpi-foot text-3">provider 24h + strategy holds</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">YTD net inflow</div><div className="pms-kpi-value pms-pos">{fmt.usd(totals.dep-totals.wd,{compact:true})}</div><div className="pms-kpi-foot text-3">{fmt.usd(totals.dep,{compact:true})} in · {fmt.usd(totals.wd,{compact:true})} out</div></div>
      </div>

      <div className="pms-card">
        <div className="pms-card-head">All investors<div className="label-meta">click row for full client profile</div></div>
        <SortableTable rowKey={r=>r.id} onRowClick={r=>setSel(r)}
          columns={[
            { key:'id', label:'ID', render:r=> <span className="pms-mono text-xs">{r.id}</span>},
            { key:'name', label:'Investor', render:r=> <span className="strong">{r.name}{r.flag && <span className="pms-pill orange" style={{marginLeft:8, fontSize:9}}>{r.flag}</span>}</span>},
            { key:'kyc', label:'KYC', render:r=> <span className="pms-pill">{r.kyc}</span>},
            { key:'strategies', label:'Strategies', num:true},
            { key:'balance', label:'Balance', num:true, sortValue:r=>r.balance, render:r=><span className="strong">{fmt.usd(r.balance,{compact:true})}</span>},
            { key:'hwm', label:'HWM', num:true, sortValue:r=>r.hwm, render:r=><span className="pms-mono text-xs">{fmt.usd(r.hwm,{compact:true})}</span>},
            { key:'withdrawable', label:'Withdrawable', num:true, sortValue:r=>r.withdrawable, render:r=><span className="pms-pos">{fmt.usd(r.withdrawable,{compact:true})}</span>},
            { key:'locked', label:'Locked', num:true, sortValue:r=>r.locked, render:r=><span className={r.locked>0?'pms-warn':''}>{fmt.usd(r.locked,{compact:true})}</span>},
            { key:'last_op', label:'Last op', render:r=> <span className="pms-mono text-xs muted">{r.last_op}</span>},
          ]}
          rows={INVESTORS}
        />
      </div>
    </>
  );
}

function InvestorDetail({ inv }) {
  const lots = INVESTOR_LOTS[inv.id] || INVESTOR_LOTS['INV-1842']; // demo fallback
  // Gantt date range: earliest deposit → today + 24h
  const dates = lots.map(l=>new Date(l.deposited).getTime());
  const minT = Math.min(...dates);
  const maxT = Date.now() + 24*3600*1000;
  const range = maxT - minT;
  const pct = t => ((t - minT)/range)*100;
  return (
    <>
      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(4,1fr)', marginBottom:14}}>
        <div className="pms-kpi"><div className="pms-kpi-label">Balance</div><div className="pms-kpi-value" style={{fontSize:20}}>{fmt.usd(inv.balance,{compact:true})}</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Withdrawable</div><div className="pms-kpi-value pms-pos" style={{fontSize:20}}>{fmt.usd(inv.withdrawable,{compact:true})}</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Locked</div><div className="pms-kpi-value pms-warn" style={{fontSize:20}}>{fmt.usd(inv.locked,{compact:true})}</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">HWM</div><div className="pms-kpi-value" style={{fontSize:20}}>{fmt.usd(inv.hwm,{compact:true})}</div></div>
      </div>

      <div className="text-xs muted" style={{marginBottom:8, textTransform:'uppercase', letterSpacing:0.5}}>FIFO deposit lots · unlock timeline</div>
      <div className="pms-gantt">
        <div className="pms-gantt-axis">
          {[0,25,50,75,100].map(p=> <span key={p} style={{left:p+'%'}}>{p===0?'oldest':p===100?'+24h':''}</span>)}
          <span className="now" style={{left: pct(Date.now())+'%'}}>now</span>
        </div>
        {lots.map(l => {
          const start = pct(new Date(l.deposited).getTime());
          const nowPct = pct(Date.now());
          const lockedFrac = l.amount ? (l.provider_locked + l.strategy_locked)/l.amount : 0;
          return (
            <div className="pms-gantt-row" key={l.lot}>
              <div className="pms-gantt-meta">
                <span className="pms-mono text-xs">{l.lot}</span>
                <span className="pms-pill purple" style={{fontSize:9}}>{l.strategy}</span>
                <span className="muted text-xs">{l.deposited}</span>
              </div>
              <div className="pms-gantt-track">
                <div className="bar avail" style={{left:start+'%', width:Math.max(2, nowPct-start)+'%'}}>
                  <span className="bar-label">{fmt.usd(l.available_now,{compact:true})} avail</span>
                </div>
                {l.provider_locked>0 && <div className="bar locked-provider" style={{left:nowPct+'%', width:Math.max(2, (lockedFrac*30))+'%'}} title={`provider lock · ${fmt.usd(l.provider_locked,{compact:true})}`}></div>}
                {l.strategy_locked>0 && <div className="bar locked-strategy" style={{left:nowPct+'%', width:Math.max(2, (l.strategy_locked/l.amount)*50)+'%'}} title={`strategy lock · ${fmt.usd(l.strategy_locked,{compact:true})}`}></div>}
              </div>
              <div className="pms-gantt-amt pms-mono text-xs">{fmt.usd(l.amount,{compact:true})}</div>
            </div>
          );
        })}
        <div className="pms-gantt-legend">
          <span><span className="sw avail"></span>Available now</span>
          <span><span className="sw locked-provider"></span>24h provider lock</span>
          <span><span className="sw locked-strategy"></span>Strategy lock</span>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────────────────────────────
//  Firm PnL page
// ───────────────────────────────────────────────────────────────
function FirmPnlPage() {
  const f = FIRM_PNL;
  return (
    <>
      <div className="pms-page-head">
        <div><h1>Firm PnL</h1><div className="sub">Where your fees, rebates, funding and undeployed cash live</div></div>
        <div className="pms-page-actions"><button className="pms-btn ghost">Export</button><button className="pms-btn primary">Sweep to treasury</button></div>
      </div>
      <PageMeta src="fee-engine · treasury · earn-providers" refresh="hourly · sweep-on-distribute" role="PM · ADMIN · COMPLIANCE"/>

      <div className="pms-kpis" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <div className="pms-kpi featured"><div className="pms-kpi-label">Firm balance</div><div className="pms-kpi-value">{fmt.usd(f.total_balance,{compact:true})}</div><div className="pms-kpi-foot text-3">{fmt.usd(f.deployed,{compact:true})} deployed · {fmt.usd(f.undeployed,{compact:true})} idle</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Perf fees · YTD</div><div className="pms-kpi-value pms-pos">{fmt.usd(f.perf_fees_ytd,{compact:true})}</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Mgmt fees · YTD</div><div className="pms-kpi-value pms-pos">{fmt.usd(f.mgmt_fees_ytd,{compact:true})}</div></div>
        <div className="pms-kpi"><div className="pms-kpi-label">Blended APY on idle</div><div className="pms-kpi-value">{f.apy.toFixed(2)}%</div><div className="pms-kpi-foot text-3">from earn deployments</div></div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'var(--pms-gap)', marginTop:'var(--pms-gap)'}}>
        <div className="pms-card">
          <div className="pms-card-head">Revenue accounts<div className="label-meta">where fees land before deployment</div></div>
          <SortableTable rowKey={r=>r.account}
            columns={[
              { key:'venue', label:'Venue', render:r=> <VenueChip name={r.venue}/>},
              { key:'account', label:'Account', render:r=> <span className="pms-mono text-xs">{r.account}</span>},
              { key:'balance', label:'Balance', num:true, sortValue:r=>r.balance, render:r=> <span className="strong">{fmt.usd(r.balance,{compact:true})} {r.ccy}</span>},
              { key:'sweep', label:'Last sweep', render:r=> <span className="pms-mono text-xs muted">{r.last_sweep}</span>},
            ]} rows={f.revenue_accounts}/>
        </div>
        <div className="pms-card">
          <div className="pms-card-head">Deployments<div className="label-meta">idle cash earning yield</div></div>
          <SortableTable rowKey={r=>r.name}
            columns={[
              { key:'name', label:'Venue', render:r=> <span>{r.name}</span>},
              { key:'balance', label:'Balance', num:true, sortValue:r=>r.balance, render:r=><span className="pms-mono">{fmt.usd(r.balance,{compact:true})}</span>},
              { key:'apy', label:'APY', num:true, render:r=> <span className="pms-pos">{r.apy.toFixed(2)}%</span>},
              { key:'status', label:'', render:r=> <span className="pms-pill" style={{background:'rgba(104,218,152,0.16)', color:'var(--pms-pos)'}}>{r.status}</span>},
            ]} rows={f.deployments}/>
        </div>
      </div>

      <div className="pms-card" style={{marginTop:'var(--pms-gap)'}}>
        <div className="pms-card-head">Fee waterfall · YTD<div className="label-meta">all numbers attributed to firm, not investors</div></div>
        <div className="pms-card-body">
          <div className="pms-waterfall">
            {[
              {l:'Perf fees',  v:f.perf_fees_ytd},
              {l:'Mgmt fees',  v:f.mgmt_fees_ytd},
              {l:'Funding',    v:f.funding_ytd},
              {l:'Rebates',    v:f.rebates_ytd},
              {l:'LP rewards', v:f.liquidity_ytd},
            ].map((r,i,arr)=>{
              const max = Math.max(...arr.map(x=>x.v));
              return (
                <div className="pms-waterfall-row" key={r.l}>
                  <div className="l">{r.l}</div>
                  <div className="b"><div className="fill" style={{width:(r.v/max*100)+'%'}}></div></div>
                  <div className="v pms-mono">{fmt.usd(r.v,{compact:true})}</div>
                </div>
              );
            })}
            <div className="pms-waterfall-row total">
              <div className="l">Total firm revenue</div>
              <div className="b"></div>
              <div className="v pms-mono strong">{fmt.usd(f.perf_fees_ytd+f.mgmt_fees_ytd+f.funding_ytd+f.rebates_ytd+f.liquidity_ytd,{compact:true})}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { FundFlowPage, InvestorsPage, FirmPnlPage, PageMeta, FlowSankey, StageDot });
