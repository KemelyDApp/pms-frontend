/* Investor detail — full client profile page */

// ─── Mock data synthesized per-investor (deterministic from id) ───
const INV_DETAIL = {
  // Profile / KYC
  profile: (inv) => ({
    legal_name: inv.name,
    type: inv.kyc === 'institutional' ? 'Institutional · Limited Partnership' : 'Professional · Individual',
    domicile: ['Cayman Islands','Singapore','Switzerland','United Kingdom','Delaware (USA)'][inv.id.charCodeAt(5) % 5],
    kyc_tier: inv.kyc === 'institutional' ? 'Tier 3 · Enhanced' : 'Tier 2 · Standard',
    kyc_completed: '2025-08-14',
    kyc_renews: '2026-08-14',
    aml_score: 12 + (inv.id.charCodeAt(5) % 18),
    accredited: true,
    onboarded: '2025-08-22',
    relationship_mgr: ['Sarah Kim','Marcus Holm','Emily Chen'][inv.id.charCodeAt(5) % 3],
    primary_contact: {
      name: inv.kyc === 'institutional' ? 'Authorized Signatory · Diane Westmore' : inv.name.split(' (')[0],
      email: inv.name.toLowerCase().replace(/[^a-z]/g,'').slice(0,12) + '@' + (inv.kyc === 'institutional' ? 'stratton.fund' : 'gmail.com'),
      phone: '+44 20 7' + (1000 + (inv.id.charCodeAt(5)*97)%9000),
    },
    structuring_doc: '/docs/' + inv.id + '/subscription.pdf',
    tax_id: inv.kyc === 'institutional' ? 'KY-LP-' + inv.id.slice(-4) + '-' + (inv.id.charCodeAt(5)*7)%9999 : 'NIN-' + inv.id.slice(-4) + '·XX',
  }),

  // Performance & cost basis
  performance: (inv) => {
    const months = 8;
    const series = [];
    let nav = 1.0000;
    for (let i = 0; i < months; i++) {
      const noise = (Math.sin(i*0.6 + inv.id.charCodeAt(5)*0.1)) * 0.012 + 0.004;
      nav = nav * (1 + noise + (i === months-1 ? -0.002 : 0));
      const d = new Date(2025, 8 + i, 1);
      series.push({ date: d.toISOString().slice(0,7), nav_per_share: nav });
    }
    return {
      since_inception_pct: ((nav - 1) * 100),
      since_inception_usd: inv.balance - (inv.deposits - inv.withdrawals),
      ytd_pct: ((nav / 1.04) - 1) * 100,
      ytd_usd: (inv.balance - (inv.deposits - inv.withdrawals)) * 0.62,
      mtd_pct: 0.84 + (inv.id.charCodeAt(5) % 10) * 0.04,
      mtd_usd: inv.balance * 0.0084,
      sharpe: 2.4 + (inv.id.charCodeAt(5)%9) * 0.1,
      max_dd: -(1.2 + (inv.id.charCodeAt(5)%5) * 0.4),
      best_month: '+4.82% · 2026-02',
      worst_month: '−1.18% · 2026-04',
      nav_series: series,
    };
  },

  // Strategy allocation
  allocation: (inv) => {
    const seed = inv.id.charCodeAt(5);
    const presets = [
      [{strat:'MN-Arb', color:'#B06CFF', pct:55, perf_ytd_pct:7.84, fees:'2/20 · HWM'},
       {strat:'X-Arb',  color:'#FF8330', pct:30, perf_ytd_pct:14.40, fees:'2/25 · HWM'},
       {strat:'Prop',   color:'#36C2FF', pct:15, perf_ytd_pct:24.10, fees:'2/30 · HWM'}],
      [{strat:'MN-Arb', color:'#B06CFF', pct:70, perf_ytd_pct:7.62, fees:'2/20 · HWM'},
       {strat:'X-Arb',  color:'#FF8330', pct:30, perf_ytd_pct:14.10, fees:'2/25 · HWM'}],
      [{strat:'X-Arb',  color:'#FF8330', pct:100, perf_ytd_pct:14.80, fees:'2/25 · HWM'}],
    ];
    return presets[seed % presets.length];
  },

  // Fees paid YTD
  fees: (inv) => {
    const base = inv.balance * 0.018;
    return {
      ytd_mgmt: Math.round(base),
      ytd_perf: Math.round(inv.balance * 0.024),
      ytd_total: Math.round(base + inv.balance * 0.024),
      crystallizations: [
        { period:'2026-04', nav_open:inv.hwm*0.96, nav_close:inv.hwm,        gain: inv.hwm*0.04, fee: Math.round(inv.hwm*0.04*0.20), crystallized:true },
        { period:'2026-03', nav_open:inv.hwm*0.93, nav_close:inv.hwm*0.96,   gain: inv.hwm*0.03, fee: Math.round(inv.hwm*0.03*0.20), crystallized:true },
        { period:'2026-02', nav_open:inv.hwm*0.92, nav_close:inv.hwm*0.93,   gain: inv.hwm*0.01, fee: Math.round(inv.hwm*0.01*0.20), crystallized:true },
        { period:'2026-01', nav_open:inv.hwm*0.91, nav_close:inv.hwm*0.92,   gain: inv.hwm*0.01, fee: Math.round(inv.hwm*0.01*0.20), crystallized:true },
        { period:'2026-05', nav_open:inv.hwm,      nav_close:inv.balance,    gain: inv.balance - inv.hwm, fee: Math.max(0,Math.round((inv.balance-inv.hwm)*0.20)), crystallized:false },
      ],
    };
  },

  // Activity ledger
  activity: (inv) => [
    { t:'2026-05-12 14:18:42', kind:'deposit',    amount: 240_000, asset:'USDC', chain:'Ethereum', strategy:'X-Arb',  ref:'FI-D-04210', status:'in flight · KYT 3/5' },
    { t:'2026-05-10 11:08:14', kind:'withdrawal', amount: 124_000, asset:'USDC', chain:'Ethereum', strategy:'X-Arb',  ref:'FI-W-08841', status:'pending approval' },
    { t:'2026-04-30 23:55:00', kind:'fee',        amount: -Math.round(inv.balance*0.0017), asset:'USDC', chain:'-',  strategy:'all',    ref:'MGMT-2026-04', status:'crystallized' },
    { t:'2026-04-30 23:55:00', kind:'fee',        amount: -Math.round(inv.hwm*0.04*0.20),  asset:'USDC', chain:'-',  strategy:'all',    ref:'PERF-2026-04', status:'crystallized' },
    { t:'2026-04-18 09:12:18', kind:'deposit',    amount: 1_840_000, asset:'USDT', chain:'TRON',     strategy:'MN-Arb',ref:'FI-D-04108', status:'settled' },
    { t:'2026-04-04 16:42:08', kind:'withdrawal', amount: 480_000,  asset:'USDC', chain:'Ethereum', strategy:'all',    ref:'FI-W-08712', status:'settled' },
    { t:'2026-03-12 10:08:42', kind:'deposit',    amount: 2_400_000, asset:'USDC', chain:'Ethereum',strategy:'X-Arb',  ref:'FI-D-03991', status:'settled' },
    { t:'2025-12-04 14:18:09', kind:'deposit',    amount: 1_240_000, asset:'USDC', chain:'Ethereum',strategy:'MN-Arb', ref:'FI-D-03512', status:'settled' },
    { t:'2025-08-22 12:00:00', kind:'onboarding', amount: 0, asset:'-', chain:'-', strategy:'-', ref:'KYC-' + inv.id, status:'completed' },
  ],

  // Compliance log
  compliance: (inv) => [
    { t:'2026-05-08 06:00:18', kind:'KYT screen',   provider:'Chainalysis', outcome:'clear', score:12, ref:'KYT-2841',  detail:'24h re-screen · withdrawal address 0x84..fA' },
    { t:'2026-04-22 14:42:18', kind:'sanctions',    provider:'Refinitiv',   outcome:'clear', score:'-', ref:'SCR-1814',  detail:'OFAC + EU + UN cross-check' },
    { t:'2026-04-18 09:12:18', kind:'KYT screen',   provider:'Chainalysis', outcome:'clear', score:8,  ref:'KYT-2842',  detail:'Inbound deposit · TRC20 1.84M USDT' },
    { t:'2026-03-12 10:08:42', kind:'KYT screen',   provider:'Chainalysis', outcome:'clear', score:6,  ref:'KYT-2843',  detail:'Inbound deposit · ETH 2.40M USDC' },
    { t:'2025-12-04 14:18:09', kind:'source-of-funds', provider:'Manual review · Compliance', outcome:'verified', score:'-', ref:'SOF-1240', detail:'Subscription document + bank attestation' },
    { t:'2025-08-22 12:00:00', kind:'KYC onboard',  provider:'Sumsub', outcome:'verified', score:'-', ref:'KYC-' + inv.id, detail:'Tier 3 · enhanced due-diligence completed' },
  ],

  // Documents
  documents: (inv) => [
    { name:'Subscription Agreement · v3',  type:'PDF', size:'1.84 MB', signed:'2025-08-22', expires:'-',           tags:['legal','signed'] },
    { name:'KYC Identity Pack',            type:'ZIP', size:'24.4 MB', signed:'2025-08-14', expires:'2026-08-14', tags:['kyc','expires-90d'] },
    { name:'Beneficial Ownership Decl',    type:'PDF', size:'318 KB',  signed:'2025-08-14', expires:'-',           tags:['kyc','ubo'] },
    { name:'Source of Funds Attestation',  type:'PDF', size:'1.24 MB', signed:'2025-12-04', expires:'-',           tags:['compliance'] },
    { name:'Q1 2026 Statement',            type:'PDF', size:'412 KB',  signed:'2026-04-01', expires:'-',           tags:['statement'] },
    { name:'Q4 2025 Statement',            type:'PDF', size:'408 KB',  signed:'2026-01-02', expires:'-',           tags:['statement'] },
    { name:'Q3 2025 Statement',            type:'PDF', size:'342 KB',  signed:'2025-10-01', expires:'-',           tags:['statement'] },
    { name:'Tax Form W-8BEN-E',            type:'PDF', size:'184 KB',  signed:'2025-08-22', expires:'2028-12-31', tags:['tax'] },
  ],

  // Communication
  comms: (inv) => [
    { t:'2026-05-12 13:48:14', dir:'in',  channel:'email',    from:'INV-1842',    subject:'Withdrawal status — FI-W-08841', preview:'Hello team, can you provide an update on the withdrawal I requested on…', actor:'Sarah Kim (Sales)' },
    { t:'2026-05-12 14:02:18', dir:'out', channel:'email',    from:'Sarah Kim',   subject:'RE: Withdrawal status — FI-W-08841', preview:'Hi! Your withdrawal is in stage W2 awaiting Risk approval. ETA ~2h…',     actor:'Sarah Kim (Sales)' },
    { t:'2026-04-30 16:18:08', dir:'out', channel:'system',   from:'system',      subject:'Q1 statement available', preview:'Your Q1 2026 statement has been generated and is available in your portal.', actor:'system' },
    { t:'2026-04-22 09:42:42', dir:'in',  channel:'call',     from:'INV-1842',    subject:'Quarterly review call', preview:'30min · discussed strategy allocation drift and 2026 H2 plans',           actor:'Marcus Holm (PM)' },
    { t:'2026-04-18 12:08:42', dir:'in',  channel:'email',    from:'INV-1842',    subject:'Increasing MN-Arb allocation', preview:'We would like to add 1.84M USDT to MN-Arb. Wire instructions please.',  actor:'Sarah Kim (Sales)' },
    { t:'2026-03-12 11:24:18', dir:'out', channel:'email',    from:'Emily Chen',  subject:'Welcome to X-Arb · onboarding complete', preview:'Your initial allocation of 2.40M USDC has been credited to the X-Arb strategy.', actor:'Emily Chen (PM)' },
  ],
};

// ─── Sub-components ────────────────────────────────────────────
function InvHeader({ inv, profile, onClose }) {
  const initials = inv.name.split(' ').filter(p=>p.length>1).slice(0,2).map(p=>p[0]).join('');
  return (
    <div className="pms-inv-header">
      <button className="pms-inv-back" onClick={onClose}><span>‹</span> All investors</button>
      <div className="pms-inv-header-main">
        <div className="pms-inv-avatar">{initials}</div>
        <div className="pms-inv-id">
          <div className="pms-inv-name">
            {inv.name}
            {inv.flag && <span className="pms-pill warn" style={{marginLeft:10}}>{inv.flag.toUpperCase()}</span>}
            <span className="pms-pill" style={{marginLeft:10}}>{inv.kyc}</span>
          </div>
          <div className="pms-inv-meta">
            <span className="pms-mono">{inv.id}</span>
            <span className="sep">·</span>
            <span>{profile.type}</span>
            <span className="sep">·</span>
            <span>{profile.domicile}</span>
            <span className="sep">·</span>
            <span>Onboarded {profile.onboarded}</span>
            <span className="sep">·</span>
            <span>RM: <strong>{profile.relationship_mgr}</strong></span>
          </div>
        </div>
      </div>
      <div className="pms-inv-header-actions">
        <button className="pms-btn ghost">📞 Call</button>
        <button className="pms-btn ghost">✉ Message</button>
        <button className="pms-btn ghost">Statement (PDF)</button>
        <button className="pms-btn">+ Manual deposit</button>
        <button className="pms-btn primary">Approve withdrawal</button>
      </div>
    </div>
  );
}

function InvHero({ inv, perf, alloc }) {
  return (
    <div className="pms-inv-hero">
      <div className="pms-inv-hero-balance">
        <div className="pms-inv-hero-l">Total balance</div>
        <div className="pms-inv-hero-v">{fmt.usd(inv.balance)}</div>
        <div className="pms-inv-hero-deltas">
          <span className={`pms-mono ${perf.mtd_pct >=0 ? 'pms-pos' : 'pms-neg'}`}>{perf.mtd_pct>=0?'+':''}{perf.mtd_pct.toFixed(2)}% MTD</span>
          <span className="sep">·</span>
          <span className={`pms-mono ${perf.ytd_pct >=0 ? 'pms-pos' : 'pms-neg'}`}>{perf.ytd_pct>=0?'+':''}{perf.ytd_pct.toFixed(2)}% YTD</span>
          <span className="sep">·</span>
          <span className={`pms-mono ${perf.since_inception_pct >=0 ? 'pms-pos' : 'pms-neg'}`}>{perf.since_inception_pct>=0?'+':''}{perf.since_inception_pct.toFixed(2)}% ITD</span>
        </div>
      </div>
      <div className="pms-inv-hero-stats">
        <div className="pms-inv-stat">
          <div className="l">Withdrawable</div>
          <div className="v pms-pos">{fmt.usd(inv.withdrawable, {compact:true})}</div>
          <div className="s">{((inv.withdrawable/inv.balance)*100).toFixed(0)}% of balance</div>
        </div>
        <div className="pms-inv-stat">
          <div className="l">Locked</div>
          <div className="v pms-warn">{fmt.usd(inv.locked, {compact:true})}</div>
          <div className="s">{((inv.locked/inv.balance)*100).toFixed(0)}% in provider + strategy holds</div>
        </div>
        <div className="pms-inv-stat">
          <div className="l">High-water mark</div>
          <div className="v">{fmt.usd(inv.hwm, {compact:true})}</div>
          <div className="s">{inv.balance >= inv.hwm ? '✓ at HWM' : `${fmt.usd(inv.hwm - inv.balance,{compact:true})} below`}</div>
        </div>
        <div className="pms-inv-stat">
          <div className="l">ITD P&L</div>
          <div className={`v ${perf.since_inception_usd >= 0 ? 'pms-pos' : 'pms-neg'}`}>{fmt.signedUsd(perf.since_inception_usd, {compact:true})}</div>
          <div className="s">Sharpe {perf.sharpe.toFixed(2)} · Max DD {perf.max_dd.toFixed(2)}%</div>
        </div>
        <div className="pms-inv-stat">
          <div className="l">Allocation</div>
          <div className="pms-inv-alloc-stack">
            {alloc.map(a => (
              <span key={a.strat}
                style={{width:a.pct+'%', background:a.color}}
                title={`${a.strat} · ${a.pct}%`}/>
            ))}
          </div>
          <div className="s">{alloc.map(a=>`${a.strat} ${a.pct}%`).join(' · ')}</div>
        </div>
      </div>
    </div>
  );
}

function InvOverview({ inv, perf, alloc, profile, fees }) {
  const lots = INVESTOR_LOTS[inv.id] || INVESTOR_LOTS['INV-1842'];
  const totalLot = lots.reduce((s,l)=>s+l.amount, 0);
  const totalAvail = lots.reduce((s,l)=>s+l.available_now, 0);
  const totalProvider = lots.reduce((s,l)=>s+l.provider_locked, 0);
  const totalStrat = lots.reduce((s,l)=>s+l.strategy_locked, 0);
  return (
    <>
      <div className="pms-grid-row" style={{gridTemplateColumns:'1.4fr 1fr', gap:'var(--pms-gap)'}} data-stack>
        <div className="pms-card">
          <div className="pms-card-head">NAV per share<div className="label-meta">since inception · {perf.nav_series.length} months</div></div>
          <div className="pms-card-body">
            <LineChart
              data={perf.nav_series.map(p => ({date:p.date, nav: p.nav_per_share}))}
              accessor={d=>d.nav}
              height={200}
              color="var(--pms-pos)"
              fill="rgba(104,218,152,0.15)"
            />
            <div className="row" style={{marginTop:8, gap:18, fontSize:11, color:'var(--fg-3)', flexWrap:'wrap'}}>
              <span><span className="muted">ITD</span> <span className="pms-mono pms-pos">+{perf.since_inception_pct.toFixed(2)}%</span></span>
              <span><span className="muted">YTD</span> <span className="pms-mono pms-pos">+{perf.ytd_pct.toFixed(2)}%</span></span>
              <span><span className="muted">Best</span> <span className="pms-mono pms-pos">{perf.best_month}</span></span>
              <span><span className="muted">Worst</span> <span className="pms-mono pms-neg">{perf.worst_month}</span></span>
              <span><span className="muted">Sharpe</span> <span className="pms-mono">{perf.sharpe.toFixed(2)}</span></span>
            </div>
          </div>
        </div>

        <div className="pms-card">
          <div className="pms-card-head">Allocation breakdown<div className="label-meta">live</div></div>
          <div className="pms-card-body">
            <div className="row" style={{justifyContent:'center', padding:'4px 0 10px'}}>
              <Donut
                size={140} thickness={20}
                segments={alloc.map(a => ({ value: a.pct, color: a.color }))}
              />
            </div>
            {alloc.map((a,i) => (
              <div key={a.strat} className="row" style={{padding:'8px 0', borderBottom: i<alloc.length-1 ? '1px solid var(--pms-divider)' : 'none', gap:10}}>
                <span style={{width:8, height:8, borderRadius:2, background:a.color, flex:'0 0 8px'}}/>
                <div style={{flex:1, minWidth:0}}>
                  <div className="strong" style={{fontSize:12}}>{a.strat}</div>
                  <div className="text-xs muted">{a.fees}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="pms-mono strong" style={{fontSize:12}}>{a.pct}%</div>
                  <div className="text-xs pms-pos pms-mono">+{a.perf_ytd_pct.toFixed(2)}% YTD</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pms-grid-row" style={{gridTemplateColumns:'1fr 1fr 1fr', gap:'var(--pms-gap)', marginTop:'var(--pms-gap)'}} data-stack>
        <div className="pms-card">
          <div className="pms-card-head">Cost basis<div className="label-meta">FIFO accounting</div></div>
          <div className="pms-card-body">
            <dl className="pms-dl">
              <dt>Total deposited</dt><dd className="pms-mono strong">{fmt.usd(inv.deposits, {compact:true})}</dd>
              <dt>Total withdrawn</dt><dd className="pms-mono">{fmt.usd(inv.withdrawals, {compact:true})}</dd>
              <dt>Net inflow</dt><dd className="pms-mono">{fmt.usd(inv.deposits - inv.withdrawals, {compact:true})}</dd>
              <dt>Current balance</dt><dd className="pms-mono strong">{fmt.usd(inv.balance, {compact:true})}</dd>
              <dt>Unrealized P&L</dt><dd className={`pms-mono strong ${perf.since_inception_usd>=0?'pms-pos':'pms-neg'}`}>{fmt.signedUsd(perf.since_inception_usd, {compact:true})}</dd>
              <dt>Realized P&L (closed)</dt><dd className="pms-mono pms-pos">+$184.4K</dd>
            </dl>
          </div>
        </div>
        <div className="pms-card">
          <div className="pms-card-head">Fees paid YTD<div className="label-meta">crystallizations · {fees.crystallizations.filter(c=>c.crystallized).length}</div></div>
          <div className="pms-card-body">
            <dl className="pms-dl">
              <dt>Mgmt fees YTD</dt><dd className="pms-mono">{fmt.usd(fees.ytd_mgmt, {compact:true})}</dd>
              <dt>Perf fees YTD</dt><dd className="pms-mono">{fmt.usd(fees.ytd_perf, {compact:true})}</dd>
              <dt>Total fees YTD</dt><dd className="pms-mono strong">{fmt.usd(fees.ytd_total, {compact:true})}</dd>
              <dt>Effective fee rate</dt><dd className="pms-mono">{(fees.ytd_total/inv.balance*100).toFixed(2)}%</dd>
              <dt>Next crystal.</dt><dd className="pms-mono">2026-05-31 · {fees.crystallizations.find(c=>!c.crystallized)?.gain > 0 ? <span className="pms-pos">+{fmt.usd(fees.crystallizations.find(c=>!c.crystallized).fee, {compact:true})}</span> : <span className="muted">no perf fee</span>}</dd>
            </dl>
          </div>
        </div>
        <div className="pms-card">
          <div className="pms-card-head">Account profile<div className="label-meta">KYC tier</div></div>
          <div className="pms-card-body">
            <dl className="pms-dl">
              <dt>Type</dt><dd>{profile.type}</dd>
              <dt>Domicile</dt><dd>{profile.domicile}</dd>
              <dt>KYC tier</dt><dd>{profile.kyc_tier}</dd>
              <dt>KYC renews</dt><dd>{profile.kyc_renews}</dd>
              <dt>AML score</dt><dd className={profile.aml_score > 25 ? 'pms-warn pms-mono' : 'pms-mono pms-pos'}>{profile.aml_score} · low risk</dd>
              <dt>Tax ID</dt><dd className="pms-mono text-xs">{profile.tax_id}</dd>
              <dt>Primary contact</dt><dd className="text-xs">{profile.primary_contact.name}<br/><span className="pms-mono muted">{profile.primary_contact.email}</span></dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="pms-card" style={{marginTop:'var(--pms-gap)'}}>
        <div className="pms-card-head">FIFO deposit lots & unlock timeline<div className="label-meta">{lots.length} active lots · {fmt.usd(totalLot,{compact:true})} cost basis</div></div>
        <div className="pms-card-body">
          <div className="row" style={{gap:14, fontSize:11, color:'var(--fg-3)', marginBottom:10, flexWrap:'wrap'}}>
            <span><span className="muted">Available now</span> <span className="pms-mono pms-pos">{fmt.usd(totalAvail,{compact:true})}</span></span>
            <span><span className="muted">Provider locked</span> <span className="pms-mono pms-warn">{fmt.usd(totalProvider,{compact:true})}</span></span>
            <span><span className="muted">Strategy locked</span> <span className="pms-mono" style={{color:'var(--pms-accent)'}}>{fmt.usd(totalStrat,{compact:true})}</span></span>
          </div>
          <InvestorDetail inv={inv}/>
        </div>
      </div>
    </>
  );
}

function InvActivity({ activity }) {
  return (
    <div className="pms-card">
      <div className="pms-card-head">Activity ledger<div className="label-meta">deposits · withdrawals · fees · system events</div></div>
      <div className="pms-card-body flush pms-table-scroll">
        <table className="pms-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Kind</th>
              <th className="num">Amount</th>
              <th>Asset / chain</th>
              <th>Strategy</th>
              <th>Reference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((a,i) => {
              const kindColor = a.kind === 'deposit' ? 'pos' : a.kind === 'withdrawal' ? 'neg' : a.kind === 'fee' ? 'warn' : '';
              return (
                <tr key={i}>
                  <td className="pms-mono text-xs muted">{a.t}</td>
                  <td><span className={`pms-pill ${kindColor}`}>{a.kind.toUpperCase()}</span></td>
                  <td className={`num strong ${a.amount>0?'pms-pos':a.amount<0?'pms-neg':''}`}>
                    {a.amount === 0 ? '—' : fmt.signedUsd(a.amount,{compact:true})}
                  </td>
                  <td>{a.asset !== '-' ? <AssetChip sym={a.asset}/> : <span className="muted">—</span>} <span className="text-xs muted">{a.chain!=='-' ? a.chain : ''}</span></td>
                  <td>{a.strategy === 'all' ? <span className="muted text-xs">all strategies</span> : a.strategy === '-' ? <span className="muted">—</span> : <span className="pms-pill purple text-xs">{a.strategy}</span>}</td>
                  <td><span className="pms-mono text-xs">{a.ref}</span></td>
                  <td><span className={`text-xs ${a.status.includes('pending')?'pms-warn':a.status.includes('flight')?'pms-info':'pms-pos'}`}>{a.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvCompliance({ compliance, profile }) {
  return (
    <>
      <div className="pms-grid-row" style={{gridTemplateColumns:'1.6fr 1fr', gap:'var(--pms-gap)'}} data-stack>
        <div className="pms-card">
          <div className="pms-card-head">Screening log<div className="label-meta">{compliance.length} events · all cleared</div></div>
          <div className="pms-card-body flush pms-table-scroll">
            <table className="pms-table">
              <thead><tr><th>Time</th><th>Type</th><th>Provider</th><th>Outcome</th><th className="num">Score</th><th>Reference</th><th>Detail</th></tr></thead>
              <tbody>
                {compliance.map((c,i) => (
                  <tr key={i}>
                    <td className="pms-mono text-xs muted">{c.t}</td>
                    <td className="strong">{c.kind}</td>
                    <td className="text-xs">{c.provider}</td>
                    <td>
                      <span className={`pms-pill ${c.outcome==='clear'||c.outcome==='verified'?'pos':'neg'}`}>{c.outcome.toUpperCase()}</span>
                    </td>
                    <td className="num pms-mono">{c.score}</td>
                    <td><span className="pms-mono text-xs">{c.ref}</span></td>
                    <td className="text-xs muted" style={{maxWidth:280, whiteSpace:'normal'}}>{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="pms-card">
          <div className="pms-card-head">Risk posture<div className="label-meta">live</div></div>
          <div className="pms-card-body">
            <div className="pms-inv-riskbar" style={{marginBottom:14}}>
              <div className="t">AML score</div>
              <div className="b"><span style={{width:`${profile.aml_score/100*100}%`, background:profile.aml_score>25?'var(--pms-warn)':'var(--pms-pos)'}}></span></div>
              <div className="v"><span className={profile.aml_score>25?'pms-warn':'pms-pos'}>{profile.aml_score} / 100</span> · low risk</div>
            </div>
            <dl className="pms-dl">
              <dt>Sanctioned?</dt><dd className="pms-pos">No</dd>
              <dt>PEP exposure</dt><dd>None on record</dd>
              <dt>Geographic risk</dt><dd className="pms-pos">Low ({profile.domicile})</dd>
              <dt>Source of funds</dt><dd>Verified · {profile.kyc_completed}</dd>
              <dt>Last re-screen</dt><dd>{compliance[0]?.t.slice(0,10)}</dd>
              <dt>Next mandatory re-screen</dt><dd className={profile.kyc_renews < '2026-06' ? 'pms-warn' : ''}>{profile.kyc_renews}</dd>
              <dt>Withdrawal whitelist</dt><dd className="pms-mono text-xs">3 addresses · 1 new (cool-down)</dd>
            </dl>
            <div className="row" style={{marginTop:14, gap:8}}>
              <button className="pms-btn ghost text-xs">Run rescreen</button>
              <button className="pms-btn ghost text-xs">Edit whitelist</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InvDocuments({ documents }) {
  return (
    <div className="pms-card">
      <div className="pms-card-head">Documents<div className="label-meta">{documents.length} files · signed + statements</div></div>
      <div className="pms-card-body flush pms-table-scroll">
        <table className="pms-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Size</th>
              <th>Signed / generated</th>
              <th>Expires</th>
              <th>Tags</th>
              <th style={{textAlign:'right'}}></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d,i) => (
              <tr key={i}>
                <td><span className="strong">{d.name}</span></td>
                <td><span className="pms-pill">{d.type}</span></td>
                <td className="pms-mono text-xs muted">{d.size}</td>
                <td className="pms-mono text-xs">{d.signed}</td>
                <td className={`pms-mono text-xs ${d.expires !== '-' && d.expires < '2026-12-01' ? 'pms-warn' : 'muted'}`}>{d.expires}</td>
                <td>
                  <div className="row" style={{gap:4, flexWrap:'wrap'}}>
                    {d.tags.map(t => (
                      <span key={t} className={`pms-pill ${t==='expires-90d'?'warn':''}`} style={{fontSize:9}}>{t}</span>
                    ))}
                  </div>
                </td>
                <td style={{textAlign:'right'}}>
                  <button className="pms-btn ghost text-xs">View</button>
                  <button className="pms-btn ghost text-xs" style={{marginLeft:4}}>Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvComms({ comms }) {
  return (
    <div className="pms-card">
      <div className="pms-card-head">Communication log<div className="label-meta">{comms.length} interactions · calls · emails · system events</div></div>
      <div className="pms-card-body" style={{padding:0}}>
        {comms.map((c,i) => (
          <div key={i} className="pms-inv-comm-row">
            <div className="pms-inv-comm-time">
              <div className="pms-mono text-xs">{c.t.slice(0,10)}</div>
              <div className="pms-mono text-xs muted">{c.t.slice(11,16)}</div>
            </div>
            <div className={`pms-inv-comm-dir ${c.dir}`}>{c.dir === 'in' ? '↓' : c.dir === 'out' ? '↑' : '◇'}</div>
            <div className="pms-inv-comm-body">
              <div className="row" style={{gap:8, marginBottom:3, flexWrap:'wrap'}}>
                <span className={`pms-pill ${c.channel==='call'?'purple':c.channel==='email'?'info':''} text-xs`}>{c.channel}</span>
                <span className="strong" style={{fontSize:12}}>{c.subject}</span>
              </div>
              <div className="text-xs" style={{color:'var(--fg-2)', marginBottom:3}}>{c.preview}</div>
              <div className="text-xs muted">{c.from} · {c.actor}</div>
            </div>
          </div>
        ))}
        <div style={{padding:'12px 16px', borderTop:'1px solid var(--pms-divider)'}}>
          <button className="pms-btn primary">+ New message</button>
          <button className="pms-btn ghost" style={{marginLeft:6}}>Log a call</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main detail page ──────────────────────────────────────────
function InvestorDetailPage({ inv, onClose }) {
  const profile = INV_DETAIL.profile(inv);
  const perf = INV_DETAIL.performance(inv);
  const alloc = INV_DETAIL.allocation(inv);
  const fees = INV_DETAIL.fees(inv);
  const activity = INV_DETAIL.activity(inv);
  const compliance = INV_DETAIL.compliance(inv);
  const documents = INV_DETAIL.documents(inv);
  const comms = INV_DETAIL.comms(inv);

  const [tab, setTab] = React.useState('overview');
  const tabs = [
    { id:'overview',   label:'Overview',            count:null },
    { id:'activity',   label:'Activity',            count:activity.length },
    { id:'fees',       label:'Fees',                count:fees.crystallizations.length },
    { id:'compliance', label:'Compliance',          count:compliance.length, alert: profile.aml_score > 25 ? 'warn' : '' },
    { id:'documents',  label:'Documents',           count:documents.length },
    { id:'comms',      label:'Communication',       count:comms.length },
  ];

  return (
    <div className="pms-inv-page">
      <InvHeader inv={inv} profile={profile} onClose={onClose}/>
      <InvHero inv={inv} perf={perf} alloc={alloc}/>

      <div className="pms-tabbar" style={{position:'static', marginTop:14}}>
        {tabs.map(t => (
          <button key={t.id} className={`pms-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            <span>{t.label}</span>
            {t.count != null && <span className={`count ${t.alert||''}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div style={{marginTop:14}}>
        {tab==='overview'   && <InvOverview inv={inv} perf={perf} alloc={alloc} profile={profile} fees={fees}/>}
        {tab==='activity'   && <InvActivity activity={activity}/>}
        {tab==='fees'       && <InvFees fees={fees} inv={inv}/>}
        {tab==='compliance' && <InvCompliance compliance={compliance} profile={profile}/>}
        {tab==='documents'  && <InvDocuments documents={documents}/>}
        {tab==='comms'      && <InvComms comms={comms}/>}
      </div>
    </div>
  );
}

function InvFees({ fees, inv }) {
  return (
    <div className="pms-card">
      <div className="pms-card-head">Fee crystallization history<div className="label-meta">monthly · HWM-based perf · {fees.crystallizations.length} periods</div></div>
      <div className="pms-card-body flush pms-table-scroll">
        <table className="pms-table">
          <thead>
            <tr>
              <th>Period</th>
              <th className="num">NAV open</th>
              <th className="num">NAV close</th>
              <th className="num">Period P&L</th>
              <th className="num">Perf fee (20%)</th>
              <th className="num">Mgmt fee (pro-rata)</th>
              <th className="num">Total fee</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fees.crystallizations.map((c,i) => {
              const mgmt = inv.balance * 0.02 / 12;
              return (
                <tr key={i}>
                  <td className="strong pms-mono">{c.period}</td>
                  <td className="num pms-mono">{fmt.usd(c.nav_open,{compact:true})}</td>
                  <td className="num pms-mono">{fmt.usd(c.nav_close,{compact:true})}</td>
                  <td className={`num ${c.gain>=0?'pms-pos':'pms-neg'} strong`}>{fmt.signedUsd(c.gain,{compact:true})}</td>
                  <td className="num pms-mono pms-pos">{c.fee > 0 ? fmt.usd(c.fee,{compact:true}) : <span className="muted">—</span>}</td>
                  <td className="num pms-mono">{fmt.usd(mgmt,{compact:true})}</td>
                  <td className="num strong pms-mono">{fmt.usd(c.fee + mgmt,{compact:true})}</td>
                  <td>{c.crystallized ? <span className="pms-pill pos">CRYSTALLIZED</span> : <span className="pms-pill warn">PENDING · period not closed</span>}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'rgba(255,255,255,0.02)', borderTop:'1px solid var(--pms-divider-strong)'}}>
              <td className="strong" style={{color:'var(--fg-1)'}}>YTD Total</td>
              <td colSpan={3}></td>
              <td className="num strong pms-pos">{fmt.usd(fees.ytd_perf,{compact:true})}</td>
              <td className="num strong pms-pos">{fmt.usd(fees.ytd_mgmt,{compact:true})}</td>
              <td className="num strong pms-pos">{fmt.usd(fees.ytd_total,{compact:true})}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { InvestorDetailPage });
