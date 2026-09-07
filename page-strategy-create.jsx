/* Strategy creation flow — mirrors admin-panel StrategyEditView.vue:
   Identity → Investment parameters → Legs (pools + roles) → Bot wiring →
   Accepted deposit networks → Review. Rules kept from the source:
   · a leg = one pool (exchange + sub-account) playing a role with an allocation %
   · one bot per leg; Bot ID + Bot strategy are paired (both set or both empty)
   · Bot ID auto-suggests `<prefix>-pool-<id>` (candle-sniper / basis-bot / arb-bot)
   · deposit networks need ≥1 leg (exchange) to query; none selected = all allowed */

const SC_EXCHANGES = ['Binance', 'OKX', 'Bybit', 'Deribit'];
const SC_CATEGORIES = [
  { id: 1, name: 'Market-Neutral Arb', desc: 'Same logic, one bot per venue' },
  { id: 2, name: 'Cross-Exchange Arb', desc: 'Price dislocation between venues' },
  { id: 3, name: 'Basis / Cash-and-carry', desc: 'Long spot + short perp, collect funding' },
  { id: 4, name: 'Proprietary', desc: 'Directional · candle-sniper' },
];
const SC_STABLECOINS = ['USDT', 'USDC', 'FDUSD'];
const SC_POOLS = [
  { id: 11, name: 'Binance-MN-Spot',   exchange: 'Binance', sub: 'mn-arb-01@kemely.fund',   type: 'spot' },
  { id: 12, name: 'Binance-MN-Perp',   exchange: 'Binance', sub: 'mn-arb-01@kemely.fund',   type: 'futures' },
  { id: 13, name: 'OKX-Basis-Spot',    exchange: 'OKX',     sub: 'basis-02@kemely.fund',    type: 'spot' },
  { id: 14, name: 'OKX-Basis-Perp',    exchange: 'OKX',     sub: 'basis-02@kemely.fund',    type: 'futures' },
  { id: 15, name: 'Bybit-Prop-Perp',   exchange: 'Bybit',   sub: 'prop-01@kemely.fund',     type: 'futures' },
];
const SC_SUBACCOUNTS = {
  Binance: [{ email: 'mn-arb-01@kemely.fund', active: true }, { email: 'xarb-03@kemely.fund', active: true }, { email: 'legacy-00@kemely.fund', active: false, frozen: true }],
  OKX:     [{ email: 'basis-02@kemely.fund', active: true }, { email: 'okx-new-04@kemely.fund', active: true }],
  Bybit:   [{ email: 'prop-01@kemely.fund', active: true }],
  Deribit: [{ email: 'opts-01@kemely.fund', active: true }],
};
const SC_NETWORKS = [
  { chain: 'Ethereum',     by: { Binance: { code: 'ETH', fee: '3.20', dep: true }, OKX: { code: 'ERC20', fee: '2.80', dep: true }, Bybit: { code: 'ETH', fee: '3.00', dep: true } } },
  { chain: 'Arbitrum One', by: { Binance: { code: 'ARBITRUM', fee: '0.10', dep: true }, OKX: { code: 'Arbitrum One', fee: '0.10', dep: true }, Bybit: { code: 'ARBI', fee: '0.12', dep: true } } },
  { chain: 'TRON',         by: { Binance: { code: 'TRX', fee: '1.00', dep: true }, OKX: { code: 'TRC20', fee: '0.80', dep: true } } },
  { chain: 'BNB Chain',    by: { Binance: { code: 'BSC', fee: '0.29', dep: true }, Bybit: { code: 'BSC', fee: '0.30', dep: false } } },
  { chain: 'Solana',       by: { Binance: { code: 'SOL', fee: '0.50', dep: true }, OKX: { code: 'Solana', fee: '0.50', dep: true }, Bybit: { code: 'SOL', fee: '0.60', dep: true } } },
  { chain: 'Polygon',      by: { Binance: { code: 'MATIC', fee: '0.20', dep: false }, OKX: { code: 'Polygon', fee: '0.20', dep: true } } },
];
const SC_BOT = { PROP: { label: 'PROP (candle-sniper)', prefix: 'candle-sniper' }, BASIS: { label: 'BASIS (basis-bot)', prefix: 'basis-bot' }, ARBITRAGE: { label: 'ARBITRAGE (arb-bot)', prefix: 'arb-bot' } };
const SC_STEPS = [
  { id: 'identity', n: 1, t: 'Identity', d: 'Name, category, description' },
  { id: 'params',   n: 2, t: 'Investment parameters', d: 'Fees, hurdle, limits, ops token' },
  { id: 'legs',     n: 3, t: 'Legs · pools & roles', d: 'One pool per venue, allocation %' },
  { id: 'wiring',   n: 4, t: 'Bot wiring', d: 'One bot per leg' },
  { id: 'networks', n: 5, t: 'Deposit networks', d: 'Chains clients may deposit on' },
  { id: 'review',   n: 6, t: 'Review & create', d: 'Confirm and provision' },
];

function ScField({ label, hint, req, children, warn }) {
  return <div className="sc-f"><label>{label}{req && <span className="req">*</span>}</label>{children}{hint && <div className={`h ${warn ? 'warn' : ''}`}>{hint}</div>}</div>;
}
function ScInput({ mono, ...p }) { return <input className={`sc-in ${mono ? 'pms-mono' : ''}`} {...p}/>; }
function ScSelect({ value, onChange, children, disabled }) {
  return <div className="sc-sel"><select value={value} disabled={disabled} onChange={e => onChange(e.target.value)}>{children}</select><span className="c">▾</span></div>;
}
const pct = v => `${(Number(v) * 100).toFixed(v * 100 % 1 ? 1 : 0)}%`;

function StrategyCreatePage({ onCancel, onDone }) {
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [f, setF] = React.useState({
    name: '', category_id: '', description: '',
    hurdle_rate: 0.10, performance_fee_rate: 0.20, management_fee_rate: 0.02, lock_period_days: 30,
    min_amount: 100, total_limit: 100000, ops_token: 'USDT',
    client_buy_transaction_fee: 0.001, client_sell_transaction_fee: 0.001, is_visible: true,
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const [pools, setPools] = React.useState(SC_POOLS);
  const [legs, setLegs] = React.useState([]);
  const [wiring, setWiring] = React.useState([]);
  const [chains, setChains] = React.useState([]);
  const [newPool, setNewPool] = React.useState(null); // inline pool creation

  // keep wiring rows positionally aligned with legs (source: syncBotWiringWithLegs)
  React.useEffect(() => {
    setWiring(w => legs.map((l, i) => ({ pool_id: l.pool_id, bot_id: w[i]?.bot_id || '', strategy: w[i]?.strategy || '' })));
  }, [legs]);

  const poolById = id => pools.find(p => p.id === Number(id));
  const legExchanges = [...new Set(legs.map(l => poolById(l.pool_id)?.exchange).filter(Boolean))];
  const allocSum = legs.reduce((s, l) => s + (Number(l.allocation_pct) || 0), 0);
  const suggest = (strategy, pool_id) => strategy && pool_id ? `${SC_BOT[strategy].prefix}-pool-${pool_id}` : '';
  const wiringErr = wiring.findIndex(w => w.pool_id && ((w.bot_id.trim() && !w.strategy) || (!w.bot_id.trim() && w.strategy)));

  const valid = {
    identity: f.name.trim().length > 1 && !!f.category_id,
    params: !!f.ops_token && f.total_limit > 0 && f.min_amount >= 0,
    legs: legs.length > 0 && legs.every(l => l.pool_id && Number(l.allocation_pct) > 0),
    wiring: wiringErr === -1,
    networks: true,
    review: true,
  };
  const stepOk = i => valid[SC_STEPS[i].id];
  const canGo = i => i === 0 || SC_STEPS.slice(0, i).every((s) => valid[s.id]);
  const cur = SC_STEPS[step].id;

  const addLeg = () => setLegs(l => [...l, { pool_id: '', allocation_pct: 100, leg_role: '', market_type: '', margin_mode: '' }]);
  const setLeg = (i, k, v) => setLegs(ls => ls.map((l, j) => j === i ? { ...l, [k]: v } : l));
  const rmLeg = i => setLegs(ls => ls.filter((_, j) => j !== i));
  const setW = (i, k, v) => setWiring(ws => ws.map((w, j) => {
    if (j !== i) return w;
    const n = { ...w, [k]: v };
    if (k === 'strategy' && !w.bot_id.trim()) n.bot_id = suggest(v, w.pool_id);  // auto-fill only when empty
    return n;
  }));
  const createPool = () => {
    const id = Math.max(...pools.map(p => p.id)) + 1;
    const p = { id, name: newPool.name, exchange: newPool.exchange, sub: newPool.sub, type: newPool.type };
    setPools(ps => [...ps, p]);
    if (newPool.forLeg != null) setLeg(newPool.forLeg, 'pool_id', id);
    setNewPool(null);
  };

  // Provision: push the new strategy into POOLS so the list + detail pages show it, then open it
  const provision = () => {
    const P = window.POOLS || [];
    const id = Math.max(0, ...P.map(p => p.id)) + 1;
    const cat = SC_CATEGORIES.find(c => String(c.id) === String(f.category_id));
    const rec = {
      id, name: f.name, bot_id: wiring.find(w => w.bot_id.trim())?.bot_id || `bot-${id}`, strategy: cat?.name || 'Custom', risk: 'MODERATE',
      nav: 1, nav_per_share: 1, pnl_24h: 0, pnl_24h_pct: 0, pnl_30d: 0, pnl_30d_pct: 0, pnl_ytd: 0, pnl_ytd_pct: 0, drawdown_pct: 0,
      apy: 0, sharpe: 0, bots: wiring.filter(w => w.bot_id.trim()).length, bot_status: 'idle',
      venues: legExchanges.slice(), fees: { perf: Math.round(Number(f.performance_fee_rate) * 100), mgmt: Number(f.management_fee_rate) * 100 }, aum_pct: 0,
      cex_pools: legs.map(l => poolById(l.pool_id)).filter(Boolean).map(p => ({ venue: p.exchange, account: p.sub.split('@')[0], capital: 0, pnl_24h: 0, status: 'idle' })),
      is_new: true,
    };
    P.push(rec);
    setNewId(id);
    setDone(true);
  };
  const [newId, setNewId] = React.useState(null);

  if (done) return (
    <div className="sc">
      <div className="sc-done">
        <div className="ic">✓</div>
        <h2>{f.name} created</h2>
        <p>Strategy #{newId} provisioned with {legs.length} leg{legs.length === 1 ? '' : 's'} across {legExchanges.join(', ')}. Wired bots will start receiving deposits automatically once funds arrive.</p>
        <div className="sc-done-grid">
          {legs.map((l, i) => { const p = poolById(l.pool_id); const w = wiring[i]; return (
            <div key={i} className="sc-done-leg"><b>{p?.name}</b><span>{l.leg_role || '—'} · {l.allocation_pct}%</span><span className="pms-mono">{w?.bot_id || 'unwired'}</span></div>
          ); })}
        </div>
        <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
          <button className="pms-btn ghost" onClick={onCancel}>Back to strategies</button>
          <button className="pms-btn primary" onClick={() => onDone(newId)}>Open strategy</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sc">
      <div className="sc-head">
        <button className="sc-back" onClick={onCancel}>← Strategies</button>
        <h1>Create strategy</h1>
        <span className="sub">A strategy is one trading logic; each leg is a pool (exchange + sub-account) run by its own bot.</span>
      </div>
      <div className="sc-body">
        <aside className="sc-rail">
          {SC_STEPS.map((s, i) => (
            <button key={s.id} className={`sc-step ${i === step ? 'cur' : ''} ${stepOk(i) && i < step ? 'ok' : ''} ${!canGo(i) ? 'locked' : ''}`} disabled={!canGo(i)} onClick={() => setStep(i)}>
              <span className="n">{stepOk(i) && i < step ? '✓' : s.n}</span>
              <span className="t">{s.t}<span className="d">{s.d}</span></span>
            </button>
          ))}
        </aside>

        <section className="sc-panel">
          {cur === 'identity' && <>
            <h2>Identity</h2>
            <div className="sc-grid2">
              <ScField label="Name" req><ScInput value={f.name} onChange={e => set('name', e.target.value)} placeholder="BTC-Basis-Q1"/></ScField>
              <ScField label="Category" req hint="Same trading logic — one strategy per venue can share a category">
                <ScSelect value={f.category_id} onChange={v => set('category_id', v)}>
                  <option value="" disabled>-- select category --</option>
                  {SC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </ScSelect>
              </ScField>
              <ScField label="Description" >
                <textarea className="sc-in" rows={2} value={f.description} onChange={e => set('description', e.target.value)} placeholder="What this strategy does, for the client app"/>
              </ScField>
            </div>
            <div className="sc-cats">
              {SC_CATEGORIES.map(c => <button key={c.id} className={`sc-cat ${String(f.category_id) === String(c.id) ? 'sel' : ''}`} onClick={() => set('category_id', String(c.id))}><b>{c.name}</b><span>{c.desc}</span></button>)}
            </div>
          </>}

          {cur === 'params' && <>
            <h2>Investment parameters</h2>
            <div className="sc-grid2">
              <ScField label="Hurdle rate (annual)"><ScInput type="number" step="0.01" value={f.hurdle_rate} onChange={e => set('hurdle_rate', e.target.value)} mono/></ScField>
              <ScField label="Performance fee"><ScInput type="number" step="0.01" value={f.performance_fee_rate} onChange={e => set('performance_fee_rate', e.target.value)} mono/></ScField>
              <ScField label="Management fee (annual)"><ScInput type="number" step="0.01" value={f.management_fee_rate} onChange={e => set('management_fee_rate', e.target.value)} mono/></ScField>
              <ScField label="Lock period (days)"><ScInput type="number" value={f.lock_period_days} onChange={e => set('lock_period_days', e.target.value)} mono/></ScField>
              <ScField label="Min amount"><ScInput type="number" value={f.min_amount} onChange={e => set('min_amount', e.target.value)} mono/></ScField>
              <ScField label="Total limit" req><ScInput type="number" value={f.total_limit} onChange={e => set('total_limit', e.target.value)} mono/></ScField>
              <ScField label="Ops token" req hint="Stablecoin the strategy operates in · drives deposit networks">
                <ScSelect value={f.ops_token} onChange={v => set('ops_token', v)}>{SC_STABLECOINS.map(s => <option key={s}>{s}</option>)}</ScSelect>
              </ScField>
              <div></div>
              <ScField label="Client buy fee" hint="Charged to client per buy · spread over venue fee is firm revenue"><ScInput type="number" step="0.001" value={f.client_buy_transaction_fee} onChange={e => set('client_buy_transaction_fee', e.target.value)} mono/></ScField>
              <ScField label="Client sell fee"><ScInput type="number" step="0.001" value={f.client_sell_transaction_fee} onChange={e => set('client_sell_transaction_fee', e.target.value)} mono/></ScField>
            </div>
            <label className="sc-check"><input type="checkbox" checked={f.is_visible} onChange={e => set('is_visible', e.target.checked)}/> Visible to clients</label>
          </>}

          {cur === 'legs' && <>
            <div className="row" style={{ alignItems: 'baseline', gap: 12 }}><h2>Legs · pools + roles</h2><span className="spacer"></span><button className="pms-btn ghost" onClick={addLeg}>+ Add leg</button></div>
            <p className="sc-p">Each leg is one pool playing a specific role (e.g. <span className="pms-mono">SPOT_LONG</span>, <span className="pms-mono">PERP_SHORT</span>) with an allocation % of that pool's balance. A pool is an exchange + sub-account container — investment parameters live on the strategy.</p>
            {legs.length === 0 && <div className="sc-empty">No legs yet. Click "+ Add leg".</div>}
            {legs.map((l, i) => { const p = poolById(l.pool_id); return (
              <div key={i} className="sc-leg">
                <div className="sc-leg-h"><span className="n">Leg {i + 1}</span>{p && <span className="pms-pill">{p.exchange}</span>}{p && <span className="pms-mono text-xs muted">{p.sub}</span>}<span className="spacer"></span><button className="sc-link neg" onClick={() => rmLeg(i)}>Remove</button></div>
                <div className="sc-leg-g">
                  <ScField label="Pool" req>
                    <ScSelect value={l.pool_id} onChange={v => v === '__new' ? setNewPool({ forLeg: i, name: '', exchange: 'Binance', sub: '', type: 'spot' }) : setLeg(i, 'pool_id', v)}>
                      <option value="" disabled>-- pool --</option>
                      {pools.map(p => <option key={p.id} value={p.id}>{p.name} ({p.exchange})</option>)}
                      <option value="__new">+ Create new pool…</option>
                    </ScSelect>
                  </ScField>
                  <ScField label="Alloc %" req><ScInput type="number" step="0.01" value={l.allocation_pct} onChange={e => setLeg(i, 'allocation_pct', e.target.value)} mono/></ScField>
                  <ScField label="Leg role"><ScInput value={l.leg_role} onChange={e => setLeg(i, 'leg_role', e.target.value)} placeholder="SPOT_LONG" mono/></ScField>
                  <ScField label="Market"><ScSelect value={l.market_type} onChange={v => setLeg(i, 'market_type', v)}><option value="">-</option>{['SPOT', 'MARGIN', 'FUTURES', 'FUNDING'].map(m => <option key={m}>{m}</option>)}</ScSelect></ScField>
                  <ScField label="Margin">{(l.market_type === 'FUTURES' || l.market_type === 'MARGIN') ? <ScSelect value={l.margin_mode} onChange={v => setLeg(i, 'margin_mode', v)}><option value="">-</option><option>CROSS</option><option>ISOLATED</option></ScSelect> : <div className="sc-na">n/a</div>}</ScField>
                </div>
              </div>
            ); })}
            {newPool && (
              <div className="sc-newpool">
                <div className="sc-leg-h"><span className="n">Create new pool</span><span className="text-xs muted">Sub-accounts are pulled live from the exchange via xbridge</span><span className="spacer"></span><button className="sc-link" onClick={() => setNewPool(null)}>Cancel</button></div>
                <div className="sc-pool-g">
                  <ScField label="Pool name" req><ScInput value={newPool.name} onChange={e => setNewPool({ ...newPool, name: e.target.value })} placeholder="Binance-BTC-Spot"/></ScField>
                  <ScField label="Exchange" req><ScSelect value={newPool.exchange} onChange={v => setNewPool({ ...newPool, exchange: v, sub: '' })}>{SC_EXCHANGES.map(e => <option key={e}>{e}</option>)}</ScSelect></ScField>
                  <ScField label="Sub-account" req>
                    <ScSelect value={newPool.sub} onChange={v => setNewPool({ ...newPool, sub: v })}>
                      <option value="" disabled>-- select sub-account --</option>
                      {(SC_SUBACCOUNTS[newPool.exchange] || []).map(s => <option key={s.email} value={s.email} disabled={!s.active}>{s.email}{s.frozen ? ' · frozen' : !s.active ? ' · inactive' : ''}</option>)}
                    </ScSelect>
                  </ScField>
                  <ScField label="Type"><ScSelect value={newPool.type} onChange={v => setNewPool({ ...newPool, type: v })}><option value="spot">spot</option><option value="futures">futures</option><option value="spot+derivs">spot + derivs</option></ScSelect></ScField>
                </div>
                <div className="sc-pool-f">
                  <span className="h">{(SC_SUBACCOUNTS[newPool.exchange] || []).filter(s => s.active).length} active sub-account{(SC_SUBACCOUNTS[newPool.exchange] || []).filter(s => s.active).length === 1 ? '' : 's'} live from {newPool.exchange} via xbridge · frozen/inactive are disabled</span>
                  <span className="spacer"></span>
                  <button className="pms-btn primary" disabled={!newPool.name || !newPool.sub} onClick={createPool}>Create pool</button>
                </div>
              </div>
            )}
            {legs.length > 0 && <div className={`sc-sum ${Math.abs(allocSum - 100) > 0.01 ? 'warn' : ''}`}>Allocation total <b className="pms-mono">{allocSum.toFixed(2)}%</b>{Math.abs(allocSum - 100) > 0.01 && <span> · legs are % of each pool's own balance, so ≠100% is allowed — double-check it's intended</span>}</div>}
          </>}

          {cur === 'wiring' && <>
            <h2>Bot wiring</h2>
            <p className="sc-p">One bot instance per leg/pool — a bot is tied to a sub-account, so a strategy spanning multiple exchanges needs one bot per exchange. Deposits fan out to the wired bots automatically. Leave both fields empty to keep a leg unwired (bot STOPPED).</p>
            <table className="sc-tbl">
              <thead><tr><th>Pool</th><th>Bot strategy</th><th>Bot ID</th><th className="r">%</th><th className="r">Allocated</th></tr></thead>
              <tbody>
                {wiring.map((w, i) => { const p = poolById(w.pool_id); const bad = wiringErr === i; return (
                  <tr key={i} className={bad ? 'bad' : ''}>
                    <td><b>{p?.name || '—'}</b><div className="text-xs muted">{p?.exchange} · {legs[i]?.leg_role || 'no role'}</div></td>
                    <td><ScSelect value={w.strategy} onChange={v => setW(i, 'strategy', v)}><option value="">— pick to wire —</option>{Object.entries(SC_BOT).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}</ScSelect></td>
                    <td><ScInput value={w.bot_id} onChange={e => setW(i, 'bot_id', e.target.value)} placeholder={suggest(w.strategy, w.pool_id) || 'pick a bot strategy →'} mono/></td>
                    <td className="r pms-mono">{legs[i]?.allocation_pct ?? '—'}%</td>
                    <td className="r pms-mono muted">0 {f.ops_token}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
            {wiringErr !== -1 && <div className="sc-err">Row {wiringErr + 1}: Bot ID and Bot strategy must both be set, or both cleared.</div>}
          </>}

          {cur === 'networks' && <>
            <h2>Accepted deposit networks</h2>
            <p className="sc-p">Blockchain networks the strategy's exchange(s) support for <b>{f.ops_token}</b> deposits. Pulled live from each exchange, refreshed every 5 minutes.</p>
            {legExchanges.length === 0 ? (
              <div className="sc-amber"><b>Assign a pool (leg) to this strategy first.</b><span>Strategies need at least one pool to know which exchange to check for deposit networks.</span></div>
            ) : (
              <>
                <table className="sc-tbl">
                  <thead><tr><th style={{ width: 28 }}></th><th>Chain</th>{legExchanges.map(e => <th key={e}>{e}</th>)}</tr></thead>
                  <tbody>
                    {SC_NETWORKS.filter(n => legExchanges.some(e => n.by[e])).map(n => (
                      <tr key={n.chain}>
                        <td><input type="checkbox" checked={chains.includes(n.chain)} onChange={e => setChains(c => e.target.checked ? [...c, n.chain] : c.filter(x => x !== n.chain))}/></td>
                        <td><b>{n.chain}</b></td>
                        {legExchanges.map(e => { const s = n.by[e]; return <td key={e} className="text-xs">{s ? <><span className="pms-mono">{s.code}</span><span className="muted"> · fee {s.fee}</span>{!s.dep && <span className="pms-neg"> (deposits off)</span>}</> : <span className="muted">—</span>}</td>; })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {chains.length === 0 && <div className="sc-sum warn">No networks selected — all supported networks will be available for deposits.</div>}
              </>
            )}
          </>}

          {cur === 'review' && <>
            <h2>Review</h2>
            <div className="sc-rev">
              <div className="sc-rev-g"><span className="k">Name</span><span className="v">{f.name}</span><span className="k">Category</span><span className="v">{SC_CATEGORIES.find(c => String(c.id) === String(f.category_id))?.name}</span><span className="k">Ops token</span><span className="v pms-mono">{f.ops_token}</span><span className="k">Visible</span><span className="v">{f.is_visible ? 'Yes' : 'No'}</span></div>
              <div className="sc-rev-g"><span className="k">Hurdle</span><span className="v pms-mono">{pct(f.hurdle_rate)}</span><span className="k">Perf fee</span><span className="v pms-mono">{pct(f.performance_fee_rate)}</span><span className="k">Mgmt fee</span><span className="v pms-mono">{pct(f.management_fee_rate)}</span><span className="k">Lock</span><span className="v pms-mono">{f.lock_period_days}d</span><span className="k">Min / limit</span><span className="v pms-mono">{Number(f.min_amount).toLocaleString()} / {Number(f.total_limit).toLocaleString()}</span><span className="k">Client fees</span><span className="v pms-mono">{pct(f.client_buy_transaction_fee)} / {pct(f.client_sell_transaction_fee)}</span></div>
            </div>
            <table className="sc-tbl"><thead><tr><th>Leg</th><th>Pool</th><th>Role · market</th><th className="r">%</th><th>Bot</th></tr></thead><tbody>
              {legs.map((l, i) => { const p = poolById(l.pool_id); const w = wiring[i]; return <tr key={i}><td className="muted">{i + 1}</td><td><b>{p?.name}</b><div className="text-xs muted">{p?.exchange} · {p?.sub}</div></td><td className="pms-mono text-xs">{l.leg_role || '—'} · {l.market_type || '—'}{l.margin_mode ? ` · ${l.margin_mode}` : ''}</td><td className="r pms-mono">{l.allocation_pct}%</td><td>{w?.bot_id ? <><span className="pms-mono text-xs">{w.bot_id}</span><span className="pms-pill purple" style={{ marginLeft: 6 }}>{w.strategy}</span></> : <span className="muted">unwired</span>}</td></tr>; })}
            </tbody></table>
            <div className="sc-sum">Deposit networks: <b>{chains.length ? chains.join(', ') : 'all supported'}</b> on {legExchanges.join(', ')}</div>
          </>}

          <div className="sc-foot">
            <button className="pms-btn ghost" onClick={step === 0 ? onCancel : () => setStep(step - 1)}>{step === 0 ? 'Cancel' : '← Back'}</button>
            <span className="spacer"></span>
            {step < SC_STEPS.length - 1
              ? <button className="pms-btn primary" disabled={!stepOk(step)} onClick={() => setStep(step + 1)}>Continue →</button>
              : <button className="pms-btn primary" onClick={provision}>Create strategy</button>}
          </div>
        </section>

        <aside className="sc-side">
          <div className="sc-side-t">Summary</div>
          <div className="sc-side-n">{f.name || <span className="muted">Untitled strategy</span>}</div>
          <div className="sc-side-c">{SC_CATEGORIES.find(c => String(c.id) === String(f.category_id))?.name || <span className="muted">no category</span>}</div>
          <div className="sc-side-r"><span>Fees</span><b className="pms-mono">{pct(f.performance_fee_rate)} / {pct(f.management_fee_rate)}</b></div>
          <div className="sc-side-r"><span>Hurdle · lock</span><b className="pms-mono">{pct(f.hurdle_rate)} · {f.lock_period_days}d</b></div>
          <div className="sc-side-r"><span>Ops token</span><b className="pms-mono">{f.ops_token}</b></div>
          <div className="sc-side-r"><span>Legs</span><b>{legs.length} · {legExchanges.join(', ') || '—'}</b></div>
          <div className="sc-side-r"><span>Bots wired</span><b>{wiring.filter(w => w.bot_id.trim()).length}/{legs.length}</b></div>
          <div className="sc-side-r"><span>Networks</span><b>{chains.length || 'all'}</b></div>
          <div className="sc-side-note">Saving creates the strategy, its legs, accepted networks and bot allocations in one pass — the same order the admin panel uses.</div>
        </aside>
      </div>
    </div>
  );
}

window.StrategyCreatePage = StrategyCreatePage;
