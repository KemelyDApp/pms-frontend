/* Firm Overview — full-firm dashboard */

/* ─── Synthesized data (overview-only) ─────────────────────── */

// Strategy categories — 1 category groups N strategies (1 bot each).
const STRAT_CATS = [
  { id:'mn-arb', name:'Market-Neutral Arb', logic:'delta_neutral_basis', color:'#B06CFF', risk:'Low',
    strategies:[
      { id:'mn-bnc-okx', label:'Basis · Binance × OKX',   bot:'basis-bot-bnc-01', venues:'Binance · OKX',
        nav: 11_360_500, pnl_24h:  7_820, pnl_30d: 112_320, apy: 8.42, dd:-0.18,
        trades_24h: 184, trades_30d: 5_120, last_trade:'14:32:18', status:'active' },
      { id:'mn-byb-drb', label:'Basis · Bybit × Deribit', bot:'basis-bot-byb-01', venues:'Bybit · Deribit',
        nav:  7_060_000, pnl_24h:  5_020, pnl_30d:  72_000, apy: 8.18, dd:-0.24,
        trades_24h:  96, trades_30d: 2_840, last_trade:'14:31:48', status:'active' },
    ]},
  { id:'x-arb', name:'Cross-Exchange Arb', logic:'triangular_xex', color:'#FF8330', risk:'Moderate',
    strategies:[
      { id:'xa-bnc-okx', label:'X-Arb · Binance × OKX',     bot:'x-arb-bot-bnc-01', venues:'Binance · OKX',
        nav: 7_680_990, pnl_24h: 18_420, pnl_30d: 248_330, apy: 17.20, dd:-1.42,
        trades_24h: 412, trades_30d: 11_840, last_trade:'14:32:14', status:'active' },
      { id:'xa-kra-cbn', label:'X-Arb · Kraken × Coinbase', bot:'x-arb-bot-kra-01', venues:'Kraken · Coinbase',
        nav: 5_160_000, pnl_24h: 10_060, pnl_30d: 164_000, apy: 15.84, dd:-2.10,
        trades_24h: 218, trades_30d: 6_280, last_trade:'14:32:09', status:'active' },
    ]},
  { id:'prop', name:'Proprietary Trading', logic:'directional_quant', color:'#36C2FF', risk:'High',
    strategies:[
      { id:'prop-multi', label:'Prop · Binance × Bybit × Deribit', bot:'prop-bot-01', venues:'Binance · Bybit · Deribit',
        nav: 12_490_700, pnl_24h:-64_210, pnl_30d: 894_220, apy: 35.10, dd:-4.18,
        trades_24h: 84, trades_30d: 2_120, last_trade:'14:31:48', status:'warning' },
    ]},
];

// P&L 24h decomposition
const PNL_24H = {
  gross:       42_840,
  to_clients:  34_272,
  firm_perf:    7_420,
  firm_mgmt:      828,
  firm_spread:    320,
};
PNL_24H.firm_total = PNL_24H.firm_perf + PNL_24H.firm_mgmt + PNL_24H.firm_spread;

// Asset mix backing the AUM tile
const AUM_ASSET_MIX = [
  { label:'Stablecoins', value: 18_420_000, color:'#68DA98', detail:'USDT · USDC · DAI' },
  { label:'BTC',         value:  9_240_000, color:'#FFB060', detail:'spot + perp delta' },
  { label:'ETH',         value:  7_180_000, color:'#8AA0FF', detail:'spot + perp delta' },
  { label:'SOL',         value:  5_120_000, color:'#7DF6C8', detail:'spot + perp delta' },
  { label:'Other alts',  value:  3_792_190, color:'#C68EFF', detail:'AVAX · LINK · ARB' },
];

// Recent roundtrips
const ROUNDTRIPS = [
  { id:'RT-92841', t:'14:31:42', strat:'X-Arb · BNC × OKX',   cat:'X-Arb',  notional: 284_000, gross:    842, perf:   168, fee_client: 14.20, fee_paid:  9.80, duration:'2m 18s' },
  { id:'RT-92840', t:'14:28:18', strat:'Basis · BNC × OKX',   cat:'MN-Arb', notional: 412_000, gross:    482, perf:    96, fee_client: 18.40, fee_paid: 12.80, duration:'4m 42s' },
  { id:'RT-92839', t:'14:24:08', strat:'X-Arb · KRA × CBN',   cat:'X-Arb',  notional: 168_000, gross:    624, perf:   124, fee_client:  8.40, fee_paid:  6.20, duration:'1m 48s' },
  { id:'RT-92838', t:'14:18:42', strat:'Prop · multi',        cat:'Prop',   notional: 240_000, gross: -2_140, perf:     0, fee_client: 12.00, fee_paid:  9.40, duration:'8m 14s' },
  { id:'RT-92837', t:'14:14:12', strat:'Basis · BYB × DRB',   cat:'MN-Arb', notional: 184_000, gross:    218, perf:    43, fee_client:  9.20, fee_paid:  6.10, duration:'3m 28s' },
  { id:'RT-92836', t:'14:08:18', strat:'X-Arb · BNC × OKX',   cat:'X-Arb',  notional: 320_000, gross:    942, perf:   188, fee_client: 16.00, fee_paid: 10.80, duration:'2m 42s' },
  { id:'RT-92835', t:'14:02:14', strat:'Prop · multi',        cat:'Prop',   notional: 184_000, gross:  3_240, perf:   972, fee_client:  9.20, fee_paid:  7.20, duration:'12m 18s' },
  { id:'RT-92834', t:'13:58:02', strat:'Basis · BNC × OKX',   cat:'MN-Arb', notional: 240_000, gross:    184, perf:    37, fee_client: 12.00, fee_paid:  8.20, duration:'5m 04s' },
];

// Bot telemetry
const BOT_TELEMETRY = [
  { id:'basis-bot-bnc-01', cat:'MN-Arb', status:'active',  uptime:'42d 11h', hb_ms:  200, orders_min: 48, fills_min: 32, errors_1h:  4, p50: 12, p99:   84, cpu:0.18, mem:0.42, last:'14:32:18 · fill' },
  { id:'basis-bot-byb-01', cat:'MN-Arb', status:'active',  uptime:'28d 02h', hb_ms:  240, orders_min: 32, fills_min: 24, errors_1h:  2, p50: 14, p99:   92, cpu:0.16, mem:0.38, last:'14:31:48 · fill' },
  { id:'x-arb-bot-bnc-01', cat:'X-Arb',  status:'active',  uptime:'21d 02h', hb_ms:  180, orders_min: 84, fills_min: 58, errors_1h:  8, p50: 18, p99:  142, cpu:0.32, mem:0.54, last:'14:32:14 · fill' },
  { id:'x-arb-bot-kra-01', cat:'X-Arb',  status:'active',  uptime:'18d 14h', hb_ms:  320, orders_min: 52, fills_min: 38, errors_1h:  6, p50: 24, p99:  184, cpu:0.28, mem:0.48, last:'14:32:09 · fill' },
  { id:'prop-bot-01',      cat:'Prop',   status:'warning', uptime:'02d 14h', hb_ms: 8200, orders_min:  4, fills_min:  2, errors_1h: 38, p50: 84, p99: 1240, cpu:0.74, mem:0.84, last:'14:31:48 · error' },
];

// Venue exposure rows (grouped by venue in UI)
const VENUE_SUB_ROWS = [
  { venue:'Binance', acct:'Master',           acct_type:'master',  inst:'spot + perp',     capital: 6_240_000, used: 5_000_000, status:'healthy' },
  { venue:'Binance', acct:'Sub-A01',          acct_type:'sub',     inst:'futures',         capital: 4_240_000, used: 3_400_000, status:'healthy' },
  { venue:'Binance', acct:'Sub-A02',          acct_type:'sub',     inst:'futures',         capital: 3_760_000, used: 3_680_000, status:'degraded' },
  { venue:'Binance', acct:'Firm-Revenue-01',  acct_type:'revenue', inst:'spot · USDC',     capital: 1_240_000, used:   120_000, status:'healthy' },
  { venue:'OKX',     acct:'Master',           acct_type:'master',  inst:'spot + perp',     capital: 3_440_000, used: 2_720_000, status:'healthy' },
  { venue:'OKX',     acct:'Sub-A12',          acct_type:'sub',     inst:'futures',         capital: 5_120_000, used: 4_140_000, status:'healthy' },
  { venue:'OKX',     acct:'Sub-A14',          acct_type:'sub',     inst:'spot',            capital: 4_280_000, used: 3_160_000, status:'healthy' },
  { venue:'OKX',     acct:'Firm-Revenue-OK',  acct_type:'revenue', inst:'spot · USDC',     capital:   620_400, used:    24_000, status:'healthy' },
  { venue:'Bybit',   acct:'Master',           acct_type:'master',  inst:'spot + perp',     capital: 4_180_000, used: 3_560_000, status:'healthy' },
  { venue:'Bybit',   acct:'Sub-A02',          acct_type:'sub',     inst:'futures',         capital: 4_840_000, used: 4_560_000, status:'healthy' },
  { venue:'Bybit',   acct:'Firm-Revenue-BY',  acct_type:'revenue', inst:'spot · USDC',     capital:   240_000, used:     8_000, status:'healthy' },
  { venue:'Deribit', acct:'Master',           acct_type:'master',  inst:'options',         capital: 2_880_500, used: 2_560_500, status:'healthy' },
  { venue:'Coinbase',acct:'Prime',            acct_type:'master',  inst:'prime · spot',    capital: 2_320_000, used: 1_840_000, status:'healthy' },
  { venue:'Coinbase',acct:'Firm-Revenue-CB',  acct_type:'revenue', inst:'spot · USDC',     capital:   160_000, used:     4_000, status:'healthy' },
  { venue:'Kraken',  acct:'Master',           acct_type:'master',  inst:'spot · margin',   capital: 2_840_990, used: 2_300_990, status:'healthy' },
];

// Active workflows
const ACTIVE_OPS = [
  { id:'sg-9842', kind:'Client deposit',     size: 240_000, ccy:'USDC', chain:'Ethereum', strategy:'X-Arb',  step:'KYT screening · 3/5',         duration:'00:14:08', actor:'INV-1842' },
  { id:'sg-9841', kind:'Strategy rebalance', size: 680_000, ccy:'USDT', chain:'TRON',     strategy:'Prop',   step:'Hedging on Bybit · 4/6',      duration:'00:24:38', actor:'prop-bot-01' },
  { id:'sg-9840', kind:'Fee distribution',   size:  84_000, ccy:'USDC', chain:'Internal', strategy:'MN-Arb', step:'Move to firm sub-acct · 2/4', duration:'00:50:42', actor:'firm-pnl' },
  { id:'sg-9839', kind:'Client withdrawal',  size: 124_000, ccy:'USDC', chain:'Ethereum', strategy:'X-Arb',  step:'Provider check · 4/7',        duration:'01:14:41', actor:'INV-1842' },
];

// Detailed recon breaks — covers trading sub-accts, revenue sub-accts, all instrument types
const RECON_BREAKS_FULL = [
  { id:'RB-1284', venue:'Binance', acct:'Master',          acct_type:'master',  inst:'spot · USDT',    asset:'USDT', expected: 8_420_400,    actual: 8_420_242,    unit_dec:2, diff:    -158,    diff_usd:   -158, age:'00:14:42', first_seen:'2026-05-12 14:17:18', severity:'low',    status:'investigating', cause:'Pending T+0 settlement · 3 trades in last 5min' },
  { id:'RB-1283', venue:'Bybit',   acct:'Sub-A02',         acct_type:'sub',     inst:'PERP · ETH',     asset:'ETH',  expected: 280.0,        actual: 279.984,      unit_dec:4, diff:  -0.016,    diff_usd:    -55, age:'00:48:12', first_seen:'2026-05-12 13:43:48', severity:'low',    status:'auto-retry · 3/5',    cause:'Funding-tick window lag · self-resolves' },
  { id:'RB-1282', venue:'OKX',     acct:'Sub-A14',         acct_type:'sub',     inst:'spot · USDC',    asset:'USDC', expected: 1_240_000,    actual: 1_241_420,    unit_dec:2, diff:    1420,    diff_usd:   1420, age:'02:14:08', first_seen:'2026-05-12 12:17:52', severity:'medium', status:'pending-ops',         cause:'Unexplained credit · refund?' },
  { id:'RB-1281', venue:'Deribit', acct:'Master',          acct_type:'master',  inst:'options · BTC',  asset:'BTC',  expected: 41.92,        actual: 41.84,        unit_dec:4, diff:   -0.08,    diff_usd:  -5382, age:'04:18:42', first_seen:'2026-05-12 10:13:18', severity:'high',   status:'escalated · OPS',     cause:'Options settlement discrepancy at expiry · root cause TBD' },
  { id:'RB-1280', venue:'Binance', acct:'Firm-Revenue-01', acct_type:'revenue', inst:'spot · USDC',    asset:'USDC', expected: 1_242_000,    actual: 1_241_850,    unit_dec:2, diff:    -150,    diff_usd:   -150, age:'05:08:14', first_seen:'2026-05-12 09:24:46', severity:'low',    status:'investigating',       cause:'Sweep timing variance · last sweep 2 days ago' },
  { id:'RB-1279', venue:'Bybit',   acct:'Sub-A02',         acct_type:'sub',     inst:'PERP · BTC',     asset:'BTC',  expected: 2.184,        actual: 2.182,        unit_dec:4, diff:  -0.002,    diff_usd:   -135, age:'06:42:11', first_seen:'2026-05-12 07:50:49', severity:'low',    status:'auto-cleared',        cause:'Self-resolved at hour close · funding tick' },
  { id:'RB-1278', venue:'Coinbase',acct:'Prime',           acct_type:'master',  inst:'prime · USDC',   asset:'USDC', expected: 1_840_000,    actual: 1_839_816,    unit_dec:2, diff:    -184,    diff_usd:   -184, age:'00:24:18', first_seen:'2026-05-12 14:08:42', severity:'low',    status:'investigating',       cause:'Custody snapshot lag · prime endpoint slow' },
  { id:'RB-1277', venue:'OKX',     acct:'Firm-Revenue-OK', acct_type:'revenue', inst:'spot · USDC',    asset:'USDC', expected:   621_240,    actual:   620_400,    unit_dec:2, diff:    -840,    diff_usd:   -840, age:'08:18:42', first_seen:'2026-05-12 06:14:18', severity:'medium', status:'pending-ops',         cause:'Mgmt fee crystallisation gap · investigating' },
  { id:'RB-1276', venue:'Binance', acct:'Sub-A01',         acct_type:'sub',     inst:'PERP · SOL',     asset:'SOL',  expected: 8420.0,       actual: 8419.6,       unit_dec:4, diff:    -0.4,    diff_usd:    -71, age:'01:18:42', first_seen:'2026-05-12 13:13:18', severity:'low',    status:'auto-retry · 1/5',    cause:'In-flight order overshoot · resolves on fill' },
];

// Revenue breakdown per CEX sub-account (by revenue type)
const FIRM_REV_BREAKDOWN = [
  { venue:'Binance',  account:'Firm-Revenue-01', perf:   824_000, mgmt: 184_000, spread: 142_000, funding: 74_000, rebates: 14_400, lp:  1_600, currency:'USDC', last_sweep:'2026-05-08 06:00', status:'active' },
  { venue:'OKX',      account:'Firm-Revenue-OK', perf:   412_000, mgmt:  98_000, spread:  64_000, funding: 38_400, rebates:  7_200, lp:    800, currency:'USDC', last_sweep:'2026-05-05 06:00', status:'active' },
  { venue:'Bybit',    account:'Firm-Revenue-BY', perf:   164_000, mgmt:  42_000, spread:  18_000, funding: 14_000, rebates:  1_800, lp:    200, currency:'USDC', last_sweep:'2026-05-08 06:00', status:'active' },
  { venue:'Coinbase', account:'Firm-Revenue-CB', perf:    98_000, mgmt:  28_000, spread:  12_000, funding: 12_000, rebates:  9_000, lp:  1_000, currency:'USDC', last_sweep:'2026-05-08 06:00', status:'active' },
];
const REV_TYPES = [
  { key:'perf',    label:'Performance fees', color:'#B06CFF' },
  { key:'mgmt',    label:'Management fees',  color:'#4EB5FF' },
  { key:'spread',  label:'Txn fee spread',   color:'#FF8330' },
  { key:'funding', label:'Funding',          color:'#68DA98' },
  { key:'rebates', label:'Maker rebates',    color:'#FFB060' },
  { key:'lp',      label:'LP rewards',       color:'#7DF6C8' },
];

// Withdrawal audit results — keyed by intent id
const WITHDRAWAL_AUDITS = {
  'FI-W-08841': { status:'pass', summary:'All 7 checks passed', checks:[
    { k:'KYT score',           v:'11 · low risk',                             s:'pass' },
    { k:'Sanctions screen',    v:'cleared · Chainalysis',                     s:'pass' },
    { k:'Balance sufficient',  v:'$3.99M available · $124K request',          s:'pass' },
    { k:'Lock check',          v:'all FIFO lots unlocked',                    s:'pass' },
    { k:'Daily limit',         v:'$124K / $500K daily limit',                 s:'pass' },
    { k:'Destination address', v:'verified · matches profile (6 prior tx)',   s:'pass' },
    { k:'Recent activity',     v:'no abnormal patterns',                      s:'pass' },
  ]},
  'FI-W-08842': { status:'pass', summary:'All 7 checks passed', checks:[
    { k:'KYT score',           v:'8 · low risk',                              s:'pass' },
    { k:'Sanctions screen',    v:'cleared · Chainalysis',                     s:'pass' },
    { k:'Balance sufficient',  v:'$4.12M available · $18K request',           s:'pass' },
    { k:'Lock check',          v:'2 lots locked · sufficient unlocked',       s:'pass' },
    { k:'Daily limit',         v:'$18K / $500K daily limit',                  s:'pass' },
    { k:'Destination address', v:'verified · matches profile',                s:'pass' },
    { k:'Recent activity',     v:'no abnormal patterns',                      s:'pass' },
  ]},
  'FI-W-08843': { status:'warn', summary:'1 warning · review before approve', checks:[
    { k:'KYT score',           v:'14 · low risk',                             s:'pass' },
    { k:'Sanctions screen',    v:'cleared',                                   s:'pass' },
    { k:'Balance sufficient',  v:'$5.42M available · $240K request',          s:'pass' },
    { k:'Lock check',          v:'all FIFO lots unlocked',                    s:'pass' },
    { k:'Daily limit',         v:'$240K / $500K daily limit',                 s:'pass' },
    { k:'Destination address', v:'new address · 24h cool-down active',        s:'warn' },
    { k:'Recent activity',     v:'no abnormal patterns',                      s:'pass' },
  ]},
  'FI-W-08844': { status:'pass', summary:'All 7 checks passed', checks:[
    { k:'KYT score',           v:'9 · low risk',                              s:'pass' },
    { k:'Sanctions screen',    v:'cleared',                                   s:'pass' },
    { k:'Balance sufficient',  v:'$1.72M available · $8.4K request',          s:'pass' },
    { k:'Lock check',          v:'all FIFO lots unlocked',                    s:'pass' },
    { k:'Daily limit',         v:'$8.4K / $500K daily limit',                 s:'pass' },
    { k:'Destination address', v:'verified · matches profile',                s:'pass' },
    { k:'Recent activity',     v:'no abnormal patterns',                      s:'pass' },
  ]},
  'FI-W-08846': { status:'fail', summary:'1 fail · 2 warnings · cannot auto-approve', checks:[
    { k:'KYT score',           v:'18 · low risk',                             s:'pass' },
    { k:'Sanctions screen',    v:'cleared',                                   s:'pass' },
    { k:'Balance sufficient',  v:'$1.84M available · $412K request',          s:'pass' },
    { k:'Lock check',          v:'$412K locked in strategy · pending unlock', s:'warn' },
    { k:'Daily limit',         v:'$412K · EXCEEDS $200K policy limit',        s:'fail' },
    { k:'Destination address', v:'new address · 24h cool-down active',        s:'warn' },
    { k:'Recent activity',     v:'2 large outflows in 24h',                   s:'pass' },
  ]},
};

const REJECT_REASON_TEMPLATES = [
  'KYT score above threshold',
  'Daily withdrawal limit exceeded',
  'Destination address requires 24h cool-down',
  'Suspicious recent activity — manual review required',
  'Insufficient unlocked balance · funds in strategy lock',
  'Address not on approved whitelist',
];

/* ─── Helpers ──────────────────────────────────────────────── */

function dailyPnLSpark(seed, days=14, mean=2000, vol=3000, negTail=false) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const r = (Math.sin((seed+i)*0.7) + Math.cos((seed+i)*0.31))*0.45 + (((seed*97 + i*41) % 100)/100 - 0.5)*0.6;
    let v = mean + r*vol;
    if (negTail && i >= days-3) v = -Math.abs(v) * 1.6;
    out.push(Math.round(v));
  }
  return out;
}

function MiniBars({ values, w=120, h=32 }) {
  if (!values?.length) return null;
  const max = Math.max(...values.map(Math.abs)) || 1;
  const bw = w / values.length;
  const zero = h/2;
  return (
    <svg width={w} height={h} className="pms-spark" preserveAspectRatio="none">
      <line x1="0" y1={zero} x2={w} y2={zero} stroke="rgba(255,255,255,0.10)"/>
      {values.map((v,i) => {
        const bh = Math.abs(v)/max * (h/2 - 2);
        const y = v >= 0 ? zero - bh : zero;
        const c = v >= 0 ? 'var(--pms-pos)' : 'var(--pms-neg)';
        return <rect key={i} x={i*bw + 0.5} y={y} width={Math.max(1, bw-1)} height={Math.max(1,bh)} fill={c} opacity="0.9"/>;
      })}
    </svg>
  );
}

function BarChart({ values, dates, height=240 }) {
  const W = 800, H = height;
  const PADL = 56, PADR = 14, PADT = 12, PADB = 22;
  const innerW = W - PADL - PADR, innerH = H - PADT - PADB;
  const maxAbs = Math.max(...values.map(Math.abs)) || 1;
  const max = maxAbs, min = -maxAbs;
  const range = max - min || 1;
  const bw = innerW / values.length;
  const yAt = (v) => PADT + innerH - ((v - min)/range)*innerH;
  const zero = yAt(0);
  const yTicks = [];
  for (let i=0; i<=4; i++) {
    const v = min + (range*i/4);
    yTicks.push({ y: yAt(v), label: fmt.usd(v, {compact:true}) });
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pms-chart" preserveAspectRatio="none">
      {yTicks.map((t,i) => (
        <g key={i}>
          <line x1={PADL} x2={W-PADR} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.05)"/>
          <text x={PADL-8} y={t.y+3} textAnchor="end" fill="var(--fg-muted)" fontSize="9" fontFamily="var(--pms-mono)">{t.label}</text>
        </g>
      ))}
      <line x1={PADL} x2={W-PADR} y1={zero} y2={zero} stroke="rgba(255,255,255,0.18)" strokeDasharray="2 4"/>
      {values.map((v,i) => {
        const x = PADL + i*bw + 1;
        const y = v >= 0 ? yAt(v) : zero;
        const h2 = Math.abs(yAt(v) - zero);
        const c = v >= 0 ? 'var(--pms-pos)' : 'var(--pms-neg)';
        return <rect key={i} x={x} y={y} width={Math.max(1, bw-2)} height={Math.max(1, h2)} fill={c} opacity="0.85"/>;
      })}
      {dates && (() => {
        const n = 6, ticks = [];
        for (let i=0; i<=n; i++) {
          const idx = Math.round((dates.length-1)*i/n);
          const x = PADL + idx*bw + bw/2;
          ticks.push(<text key={i} x={x} y={H-6} textAnchor="middle" fill="var(--fg-muted)" fontSize="9" fontFamily="var(--pms-mono)">{(dates[idx]||'').slice(5)}</text>);
        }
        return ticks;
      })()}
    </svg>
  );
}

function ChainBadge({ chain }) {
  const ch = (chain||'').toLowerCase();
  const c = ch === 'ethereum' ? '#8AA0FF'
          : ch === 'tron'     ? '#FF5C5E'
          : ch === 'solana'   ? '#7DF6C8'
          : ch === 'bitcoin'  ? '#FFB060'
          : 'var(--fg-3)';
  return <span className="pms-chain" style={{borderColor: c, color: c}}>{chain}</span>;
}

function AcctTypePill({ type }) {
  const lbl = type === 'master' ? 'MASTER' : type === 'revenue' ? 'REVENUE' : 'SUB';
  return <span className={`pms-acct-pill ${type}`} style={ type==='revenue' ? {background:'rgba(104,218,152,0.10)', color:'var(--pms-pos)', borderColor:'rgba(104,218,152,0.25)'} : undefined }>{lbl}</span>;
}

// Shared time-range selector for the two charts
function ChartRangeSeg({ value, onChange }) {
  const opts = ['7D','30D','90D'];
  return (
    <div className="pms-seg" style={{height:24}}>
      {opts.map(o => (
        <button key={o} className={value===o?'active':''} onClick={()=>onChange(o)} style={{padding:'0 10px', fontSize:10}}>{o}</button>
      ))}
    </div>
  );
}

// Compact filled-area sparkline tuned for the DD tile
function DdSpark({ series, w=200, h=28 }) {
  if (!series?.length) return null;
  const min = Math.min(...series, -1);
  const max = 0;
  const range = max - min || 1;
  const step = w / (series.length - 1);
  const pts = series.map((v,i) => [i*step, h - ((v-min)/range)*h]);
  const linePath = `M ${pts.map(p=>p.join(',')).join(' L ')}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width={w} height={h} className="pms-spark" preserveAspectRatio="none" style={{display:'block', width:'100%'}}>
      <line x1="0" y1={h-1} x2={w} y2={h-1} stroke="rgba(255,255,255,0.06)"/>
      <path d={areaPath} fill="rgba(255,112,114,0.18)"/>
      <path d={linePath} fill="none" stroke="var(--pms-neg)" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

function AuditBadge({ audit, onClick }) {
  if (!audit) return <span className="pms-audit-badge pending" onClick={onClick}><span className="icon">…</span>RUN AUDIT</span>;
  const cls = audit.status;
  const icon = cls === 'pass' ? '✓' : cls === 'warn' ? '!' : '×';
  const label = cls === 'pass' ? 'AUDIT OK' : cls === 'warn' ? 'AUDIT · WARN' : 'AUDIT · FAIL';
  return (
    <span className={`pms-audit-badge ${cls}`} onClick={onClick} title={audit.summary}>
      <span className="icon">{icon}</span>{label}
    </span>
  );
}

/* ─── Today's narrative tile ─── */
function TodayNarrative({ pnl, breach, withdrawCount, reconHigh, reconHighUsd, navStartIdx, onJump }) {
  const ts = NOW.toISOString().slice(0,16).replace('T',' ') + ' UTC';
  return (
    <div className="pms-narrative">
      <div className="pms-narrative-meta">
        <span className="l">Today</span>
        <span className="h">{NOW.toISOString().slice(0,10)}</span>
        <span className="t">{NOW.toISOString().slice(11,16)} UTC</span>
      </div>
      <div className="pms-narrative-text">
        Firm earned <strong className={pnl >= 0 ? 'good' : 'hot'}>{fmt.signedUsd(pnl)}</strong>{' '}
        across <strong>{STRAT_CATS.reduce((s,c)=>s+c.strategies.length,0)} strategies</strong> today.
        {breach && <> Prop strategy is <strong className="hot">paused</strong> after hitting drawdown limit (<strong className="hot">−4.18%</strong> vs −5.00% cap).</>}{' '}
        <strong className="hot">{withdrawCount} client withdrawal{withdrawCount===1?'':'s'}</strong> awaiting approval{' '}
        and <strong className="hot">{reconHigh} high-severity recon break{reconHigh===1?'':'s'}</strong> ({fmt.signedUsd(reconHighUsd,{dec:0})} variance) need ops attention.
      </div>
      <div className="pms-narrative-actions">
        <a className="pms-narrative-action urgent" onClick={()=>onJump('compliance')}>
          <span className="ic">⚠</span>Resolve breach
        </a>
        <a className="pms-narrative-action" onClick={()=>onJump('compliance')}>
          <span className="ic">✓</span>Review {withdrawCount} withdrawals
        </a>
        <a className="pms-narrative-action" onClick={()=>onJump('compliance')}>
          <span className="ic">⚖</span>View {reconHigh} recon break{reconHigh===1?'':'s'}
        </a>
      </div>
    </div>
  );
}

/* ─── Global filter bar ─── */
function GlobalFilters({ filters, setFilters, allStrats, venues }) {
  const reset = () => setFilters({ strategy:'all', venue:'all' });
  const activeCount = (filters.strategy !== 'all' ? 1 : 0) + (filters.venue !== 'all' ? 1 : 0);
  return (
    <div className="pms-filterbar">
      <div className="pms-filterbar-group">
        <label>Strategy</label>
        <select className={filters.strategy!=='all'?'active':''} value={filters.strategy} onChange={e=>setFilters({...filters, strategy:e.target.value})}>
          <option value="all">All categories</option>
          <optgroup label="Categories">
            {STRAT_CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </optgroup>
          <optgroup label="Individual strategies">
            {allStrats.map(s => <option key={s.id} value={'s:'+s.id}>{s.label}</option>)}
          </optgroup>
        </select>
      </div>
      <div className="pms-filterbar-sep"/>
      <div className="pms-filterbar-group">
        <label>Venue</label>
        <select className={filters.venue!=='all'?'active':''} value={filters.venue} onChange={e=>setFilters({...filters, venue:e.target.value})}>
          <option value="all">All venues</option>
          {venues.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div className="pms-filterbar-active-count">
        {activeCount > 0 && (
          <>
            <span>{activeCount} active filter{activeCount===1?'':'s'}</span>
            <button className="pms-btn ghost text-xs" onClick={reset}>Clear all</button>
          </>
        )}
        {activeCount === 0 && <span className="muted" style={{color:'var(--fg-3)'}}>No filters · showing firm-wide</span>}
      </div>
    </div>
  );
}

/* ─── Jump-to-section nav ─── */
const SECTIONS = [
  { id:'top',         label:'Overview' },
  { id:'strategies',  label:'Strategies' },
  { id:'activity',    label:'Activity' },
  { id:'ops',         label:'Ops & venues' },
  { id:'compliance',  label:'Compliance' },
  { id:'revenue',     label:'Revenue' },
];
/* ─── Tab bar (replaces content, not scrolls) ─── */
const TABS = [
  { id:'pulse',      label:'Pulse',       ico:'◉' },
  { id:'strategies', label:'Strategies',  ico:'▦' },
  { id:'activity',   label:'Activity',    ico:'⇆' },
  { id:'ops',        label:'Ops & venues',ico:'⊟' },
  { id:'compliance', label:'Compliance',  ico:'✓' },
  { id:'revenue',    label:'Revenue',     ico:'¤' },
];
function TabBar({ active, onSelect, counts, alerts }) {
  return (
    <div className="pms-tabbar">
      {TABS.map(t => (
        <button key={t.id} className={`pms-tab ${active===t.id?'active':''}`} onClick={()=>onSelect(t.id)}>
          <span className="ico">{t.ico}</span>
          <span>{t.label}</span>
          {counts[t.id] != null && (
            <span className={`count ${alerts[t.id] || ''}`}>{counts[t.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Pulse-tab section preview wrapper ─── */
function PulseSection({ title, sub, count, onViewAll, tabName, children }) {
  return (
    <div className="pms-card" style={{marginTop:'var(--pms-gap)'}}>
      <div className="pms-card-head">
        {title}
        <div className="label-meta">
          <span style={{color:'var(--fg-3)'}}>{sub}</span>
          {count != null && <span className="pms-mono text-xs" style={{color:'var(--fg-2)'}}>· {count}</span>}
          <button className="pms-viewall" onClick={onViewAll}>
            <span>View all in {tabName}</span>
            <span className="arr">›</span>
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function SectionHead({ id, title, sub, count, anchorRef }) {
  return (
    <div className="pms-section-head" id={'sec-'+id} ref={anchorRef}>
      <h2>{title}</h2>
      {count != null && <span className="count">{count}</span>}
      <span className="sub">{sub}</span>
      <span className="line"/>
    </div>
  );
}

/* ─── Hover-enabled charts ─── */
function HoverLineChart({ data, accessor, height=220, color, fill, formatY=v=>fmt.usd(v,{compact:true}) }) {
  const PADL = 56, PADR = 14, W = 800;
  const innerW = W - PADL - PADR;
  const wrapRef = React.useRef(null);
  const [hover, setHover] = React.useState(null);

  const onMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const vx = x * (W / rect.width);
    const ix = Math.max(0, Math.min(innerW, vx - PADL));
    const idx = Math.round((ix / innerW) * (data.length - 1));
    const dataVx = PADL + (idx / Math.max(1, data.length - 1)) * innerW;
    const left = (dataVx / W) * 100;
    setHover({ idx, left });
  };

  // Y position for the hover dot (compute in viewBox coords, convert to %)
  let dotTop = 0;
  if (hover) {
    const values = data.map(accessor);
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const innerH = height - 12 - 24;
    const yVB = 12 + innerH - ((accessor(data[hover.idx])-min)/range)*innerH;
    dotTop = (yVB / height) * 100;
  }

  return (
    <div className="pms-chart-wrap" ref={wrapRef} onMouseMove={onMove} onMouseLeave={()=>setHover(null)}>
      <LineChart data={data} accessor={accessor} height={height} color={color} fill={fill}/>
      {hover && (
        <>
          <div className="pms-chart-cross" style={{left:`${hover.left}%`, height: `${height - 24}px`}}/>
          <div className="pms-chart-dot" style={{left:`${hover.left}%`, top:`${dotTop}%`}}/>
          <div className={`pms-chart-tooltip ${hover.left > 75 ? 'flip-x' : ''}`} style={{left:`${hover.left}%`, top: 8}}>
            <div className="k">{data[hover.idx]?.date || ''}</div>
            <div className="v">{formatY(accessor(data[hover.idx]))}</div>
            {data[hover.idx]?.drawdown_pct != null && (
              <div className="d">DD <span style={{color:'var(--pms-neg)'}}>{data[hover.idx].drawdown_pct.toFixed(2)}%</span></div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function HoverBarChart({ values, dates, height=220 }) {
  const PADL = 56, PADR = 14, W = 800;
  const innerW = W - PADL - PADR;
  const wrapRef = React.useRef(null);
  const [hover, setHover] = React.useState(null);

  const onMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const vx = x * (W / rect.width);
    const ix = Math.max(0, Math.min(innerW, vx - PADL));
    const idx = Math.min(values.length - 1, Math.floor((ix / innerW) * values.length));
    const bw = innerW / values.length;
    const dataVx = PADL + (idx + 0.5) * bw;
    const left = (dataVx / W) * 100;
    setHover({ idx, left });
  };

  return (
    <div className="pms-chart-wrap" ref={wrapRef} onMouseMove={onMove} onMouseLeave={()=>setHover(null)}>
      <BarChart values={values} dates={dates} height={height}/>
      {hover && (
        <>
          <div className="pms-chart-cross" style={{left:`${hover.left}%`, height:`${height - 24}px`}}/>
          <div className={`pms-chart-tooltip ${hover.left > 75 ? 'flip-x' : ''}`} style={{left:`${hover.left}%`, top: 8}}>
            <div className="k">{dates[hover.idx] || ''}</div>
            <div className="v" style={{color: values[hover.idx] >= 0 ? 'var(--pms-pos)' : 'var(--pms-neg)'}}>
              {fmt.signedUsd(values[hover.idx], {compact:true})}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */

function OverviewPage({ ccy, onOpenPool }) {
  const navData = window.NAV_HISTORY;
  const dailyPnL = navData.map((d,i) => ({
    date: d.date,
    day_pnl: d.pnl - (navData[i-1]?.pnl ?? 0),
  })).slice(1);
  // True firm drawdown (NAV-vs-peak hits 0 at peak; use the firm aggregate)
  const ddCurr = window.PORTFOLIO_TOTAL?.drawdown ?? navData[navData.length-1].drawdown_pct;
  const dd7 = Math.min(ddCurr, ...navData.slice(-7).map(d=>d.drawdown_pct));
  const dd30 = Math.min(ddCurr, ...navData.slice(-30).map(d=>d.drawdown_pct));
  // 14-day drawdown series for the DD tile sparkline
  const ddSeries = navData.slice(-14).map((d,i,arr) => {
    const v = d.drawdown_pct;
    return i === arr.length-1 ? ddCurr : (v >= -0.05 ? v - Math.abs(Math.sin(i*0.8))*1.6 - 0.4 : v);
  });
  // 14-day daily trade counts (synth — small variation around avg)
  const allStrats = STRAT_CATS.flatMap(c => c.strategies.map(s => ({ ...s, cat: c })));
  const totalAUM = allStrats.reduce((s,x)=>s+x.nav, 0);
  const trades24h = allStrats.reduce((s,x)=>s+x.trades_24h, 0);
  const tradesSeries = Array.from({length:14}, (_,i) => {
    const v = 900 + Math.sin(i*0.7)*180 + Math.cos(i*0.31)*120 + ((i*97)%50);
    return Math.round(Math.max(420, v));
  });
  tradesSeries[tradesSeries.length-1] = trades24h;

  // Time-range selector for the two charts
  const [chartRange, setChartRange] = React.useState('90D');
  const rangeDays = chartRange === '7D' ? 7 : chartRange === '30D' ? 30 : 90;
  const navSlice = navData.slice(-rangeDays);
  const dailyPnLSlice = dailyPnL.slice(-rangeDays);

  // Modal state
  const [auditFor, setAuditFor] = React.useState(null);
  const [rejectFor, setRejectFor] = React.useState(null);
  const [rejectChips, setRejectChips] = React.useState([]);
  const [rejectReason, setRejectReason] = React.useState('');
  const [rejectNotify, setRejectNotify] = React.useState(true);

  React.useEffect(() => {
    if (rejectFor) { setRejectChips([]); setRejectReason(''); setRejectNotify(true); }
  }, [rejectFor]);

  // Global filters
  const [filters, setFilters] = React.useState({ strategy:'all', venue:'all' });
  const venueList = [...new Set(VENUE_SUB_ROWS.map(v=>v.venue))];

  // Strategy filter — resolves "all" | catId | "s:strategyId"
  const stratMatch = React.useCallback((catId, stratId) => {
    if (filters.strategy === 'all') return true;
    if (filters.strategy.startsWith('s:')) return filters.strategy === 's:' + stratId;
    return filters.strategy === catId;
  }, [filters.strategy]);
  const stratNameToCat = (name) => name==='MN-Arb'?'mn-arb' : name==='X-Arb'?'x-arb' : 'prop';
  const blotterStratToCat = (s) => s==='basis'?'mn-arb' : s==='x-arb'?'x-arb' : 'prop';
  const venueMatch = (v) => filters.venue === 'all' || filters.venue === v;

  // Filtered datasets
  const filteredCats = STRAT_CATS.map(c => ({
    ...c,
    strategies: c.strategies.filter(s => stratMatch(c.id, s.id))
  })).filter(c => c.strategies.length > 0);
  const filteredAllStrats = filteredCats.flatMap(c => c.strategies.map(s => ({ ...s, cat: c })));
  const filteredBlotter = (window.BLOTTER || []).filter(o => stratMatch(blotterStratToCat(o.strat), null));
  const filteredRoundtrips = ROUNDTRIPS.filter(r => stratMatch(stratNameToCat(r.cat), null));
  const filteredTelemetry = BOT_TELEMETRY.filter(b => stratMatch(stratNameToCat(b.cat), null));
  const filteredOps = ACTIVE_OPS.filter(op => stratMatch(stratNameToCat(op.strategy), null));
  const filteredWithdrawApprovals = ((window.FUND_INTENTS || []).filter(i =>
    i.dir==='withdraw' && (i.stage==='W2_APPROVAL' || i.stage==='W4_PROVIDER_CHECK')
  )).filter(w => stratMatch(stratNameToCat(w.strategy), null));
  const filteredVenueRows = VENUE_SUB_ROWS.filter(v => venueMatch(v.venue));
  const filteredRecon = RECON_BREAKS_FULL.filter(r => venueMatch(r.venue));
  const filteredRevenue = FIRM_REV_BREAKDOWN.filter(r => venueMatch(r.venue));

  // Tab state — sync with URL hash
  const [tab, setTab] = React.useState(() => {
    const h = (window.location.hash || '').replace('#','').replace('tab-','');
    return TABS.find(t => t.id === h) ? h : 'pulse';
  });
  const goToTab = (id) => {
    setTab(id);
    history.replaceState(null, '', '#tab-' + id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const isPulse = tab === 'pulse';
  const showSection = (id) => tab === 'pulse' || tab === id;

  const withdrawApprovals = (window.FUND_INTENTS || []).filter(i =>
    i.dir==='withdraw' && (i.stage==='W2_APPROVAL' || i.stage==='W4_PROVIDER_CHECK')
  );

  // Recon — venue-grouped
  const reconByVenue = React.useMemo(() => {
    const groups = new Map();
    RECON_BREAKS_FULL.forEach(r => {
      if (!groups.has(r.venue)) groups.set(r.venue, []);
      groups.get(r.venue).push(r);
    });
    return [...groups.entries()];
  }, []);
  const totalDiffUsd = RECON_BREAKS_FULL.reduce((s,r)=>s+r.diff_usd, 0);
  const hiSev = RECON_BREAKS_FULL.filter(r=>r.severity==='high').length;
  const medSev = RECON_BREAKS_FULL.filter(r=>r.severity==='medium').length;

  // Firm revenue totals
  const revTotalsByType = REV_TYPES.reduce((acc,t) => {
    acc[t.key] = FIRM_REV_BREAKDOWN.reduce((s,r)=>s+r[t.key],0);
    return acc;
  }, {});
  const revGrandTotal = Object.values(revTotalsByType).reduce((s,v)=>s+v,0);

  // Venue exposure — grouped by venue
  const venuesGrouped = React.useMemo(() => {
    const m = new Map();
    VENUE_SUB_ROWS.forEach(r => {
      if (!m.has(r.venue)) m.set(r.venue, []);
      m.get(r.venue).push(r);
    });
    return [...m.entries()];
  }, []);

  // Counts + alert badges for tabs
  const tabCounts = {
    strategies: filteredAllStrats.length,
    activity: filteredBlotter.length,
    ops: filteredOps.length,
    compliance: filteredRecon.filter(r=>r.severity==='high').length + filteredWithdrawApprovals.length,
    revenue: filteredRevenue.length,
  };
  const tabAlerts = {
    ops: filteredOps.length > 3 ? 'warn' : '',
    compliance: (filteredRecon.filter(r=>r.severity==='high').length + filteredWithdrawApprovals.length) > 0 ? 'alert' : '',
  };

  return (
    <>
      <GlobalFilters filters={filters} setFilters={setFilters} allStrats={allStrats} venues={venueList}/>
      <TabBar active={tab} onSelect={goToTab} counts={tabCounts} alerts={tabAlerts}/>

      <div>
        <div className="pms-page-head">
          <div>
            <h1>Firm overview</h1>
            <div className="sub">Aggregated AUM across {STRAT_CATS.length} strategy categories · {allStrats.length} strategies / bots · 6 venues · {PORTFOLIO_TOTAL.clients} clients</div>
          </div>
          <div className="pms-page-actions">
            <button className="pms-btn ghost">Export CSV</button>
            <button className="pms-btn">Snapshot now</button>
            <button className="pms-btn primary">+ Move funds</button>
          </div>
        </div>

        <TodayNarrative
          pnl={PNL_24H.gross}
          breach={true}
          withdrawCount={withdrawApprovals.length}
          reconHigh={hiSev}
          reconHighUsd={RECON_BREAKS_FULL.filter(r=>r.severity==='high').reduce((s,r)=>s+r.diff_usd,0)}
          onJump={goToTab}
        />
      </div>

      {/* KPI tiles — v2 redesign with consistent rhythm + per-tile color identity */}
      <div className="pms-kpis firm">
        {/* AUM */}
        <div className="pms-kpi-v2" data-tone="purple">
          <div className="pms-kpi-v2-head">
            <span className="l">Assets under management</span>
          </div>
          <div className="pms-kpi-v2-hero">
            <div className="pms-kpi-v2-value">{ccyFmt(totalAUM, ccy)}</div>
            <div className="pms-kpi-v2-chips">
              {[{k:'1D',v:1.84},{k:'7D',v:2.42},{k:'30D',v:4.18}].map(d => (
                <span key={d.k} className={`pms-kpi-v2-chip ${d.v>=0?'pos':'neg'}`}>
                  <span className="k">{d.k}</span>
                  <span><span className="arr">{d.v>=0?'▲':'▼'}</span>{Math.abs(d.v).toFixed(2)}%</span>
                </span>
              ))}
            </div>
          </div>
          <div className="pms-kpi-v2-viz">
            <div className="pms-kpi-v2-viz-label">
              <span>Asset mix</span>
              <span className="r">{AUM_ASSET_MIX.length} buckets</span>
            </div>
            <div className="pms-assetmix-bar">
              {AUM_ASSET_MIX.map(a => (
                <span key={a.label} style={{width: (a.value/totalAUM*100)+'%', background: a.color}} title={`${a.label} · ${fmt.usd(a.value,{compact:true})}`}></span>
              ))}
            </div>
            <div className="pms-assetmix-legend">
              {AUM_ASSET_MIX.map(a => (
                <span key={a.label}>
                  <span className="sw" style={{background: a.color}}></span>
                  <span style={{color:'var(--fg-2)'}}>{a.label}</span>
                  <span style={{color:'var(--fg-1)'}}>{(a.value/totalAUM*100).toFixed(0)}%</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* P&L 24h — wide tile */}
        <div className="pms-kpi-v2 is-wide" data-tone={PNL_24H.gross>=0?'green':'red'}>
          <div className="pms-kpi-v2-head">
            <span className="l">P&amp;L · 24h</span>
            <span className="sep">·</span>
            <span className="muted text-xs" style={{color:'var(--fg-3)'}}>gross trading + fee revenue</span>
          </div>
          <div className="pms-kpi-v2-hero">
            <div className={`pms-kpi-v2-value ${PNL_24H.gross>=0?'pms-pos':'pms-neg'}`}>{fmt.signedUsd(PNL_24H.gross)}</div>
            <div className="pms-kpi-v2-chips">
              <span className={`pms-kpi-v2-chip pos`}><span className="k">1D</span><span><span className="arr">▲</span>1.84%</span></span>
              <span className="pms-kpi-v2-chip pos"><span className="k">7D</span><span>+$284K</span></span>
              <span className="pms-kpi-v2-chip pos"><span className="k">30D</span><span>+$1.49M</span></span>
            </div>
          </div>
          <div className="pms-kpi-v2-viz">
            <div className="pms-kpi-v2-viz-label">
              <span>Distribution</span>
              <span className="r">{fmt.signedUsd(PNL_24H.firm_total,{dec:0})} to firm · {fmt.signedUsd(PNL_24H.to_clients,{dec:0})} to investors</span>
            </div>
            <div className="pms-kpi-breakdown">
              {[
                { l:'To investors',     v:PNL_24H.to_clients,  c:'rgba(176,108,255,0.65)', sub:'after firm cut' },
                { l:'Performance fee',  v:PNL_24H.firm_perf,   c:'rgba(104,218,152,0.85)', sub:'accrued · 20–30%' },
                { l:'Management fee',   v:PNL_24H.firm_mgmt,   c:'rgba(78,181,255,0.85)',  sub:'2% / yr pro-rata' },
                { l:'Txn fee spread',   v:PNL_24H.firm_spread, c:'rgba(255,196,84,0.85)',  sub:'charged − paid to venue' },
              ].map(r => {
                const pct = r.v / PNL_24H.gross * 100;
                return (
                  <div className="pms-kpi-bd-row" key={r.l}>
                    <span className="l">{r.l}</span>
                    <div className="bar"><span style={{width:Math.min(100,pct)+'%', background:r.c}}></span></div>
                    <span className="v pms-mono">{fmt.signedUsd(r.v)}</span>
                    <span className="p muted">{pct.toFixed(1)}%</span>
                    <span className="sub">{r.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawdown */}
        <div className={`pms-kpi-v2 ${Math.abs(ddCurr) >= 4 ? 'breaching' : ''}`} data-tone="red">
          {Math.abs(ddCurr) >= 4 && <span className="pms-breach-dot" title="Approaching drawdown limit"/>}
          <div className="pms-kpi-v2-head">
            <span className="l">Drawdown · current</span>
          </div>
          <div className="pms-kpi-v2-hero">
            <div className="pms-kpi-v2-value pms-neg">{ddCurr.toFixed(2)}%</div>
            <div className="pms-kpi-v2-chips">
              <span className="pms-kpi-v2-chip neg"><span className="k">7D MAX</span><span>{dd7.toFixed(2)}%</span></span>
              <span className="pms-kpi-v2-chip neg"><span className="k">30D MAX</span><span>{dd30.toFixed(2)}%</span></span>
            </div>
          </div>
          <div className="pms-kpi-v2-viz">
            <div className="pms-kpi-v2-viz-label">
              <span>vs −5% firm limit</span>
              <span className="r" style={{color: Math.abs(ddCurr)/5 > 0.7 ? 'var(--pms-warn)' : 'var(--fg-1)'}}>{(Math.abs(ddCurr)/5*100).toFixed(0)}%</span>
            </div>
            <div className="pms-bar" style={{height:6}}>
              <span style={{width:`${Math.min(100, Math.abs(ddCurr)/5*100)}%`, background:'var(--pms-neg)'}}></span>
            </div>
            <div style={{marginTop:10}}>
              <div className="pms-kpi-v2-viz-label" style={{marginBottom:4}}>
                <span>14-day trend</span>
                <span className="r" style={{color:'var(--pms-neg)'}}>worst {Math.min(...ddSeries).toFixed(2)}%</span>
              </div>
              <DdSpark series={ddSeries}/>
            </div>
          </div>
        </div>

        {/* Trades */}
        <div className="pms-kpi-v2" data-tone="blue">
          <div className="pms-kpi-v2-head">
            <span className="l">Trades · 24h</span>
          </div>
          <div className="pms-kpi-v2-hero">
            <div className="pms-kpi-v2-value">{trades24h.toLocaleString()}</div>
            <div className="pms-kpi-v2-chips">
              <span className="pms-kpi-v2-chip"><span className="k">7D PEAK</span><span>1,284</span></span>
              <span className="pms-kpi-v2-chip"><span className="k">30D PEAK</span><span>1,840</span></span>
            </div>
          </div>
          <div className="pms-kpi-v2-viz">
            <div className="pms-kpi-v2-viz-label">
              <span>By strategy</span>
              <span className="r">{allStrats.length} bots</span>
            </div>
            <div style={{display:'flex', width:'100%', height:8, borderRadius:4, overflow:'hidden', background:'rgba(255,255,255,0.05)'}}>
              {allStrats.map((s,i) => (
                <span key={s.id} style={{width:`${s.trades_24h/trades24h*100}%`, background:s.cat.color}} title={`${s.label} · ${s.trades_24h}`}></span>
              ))}
            </div>
            <div style={{marginTop:10}}>
              <div className="pms-kpi-v2-viz-label" style={{marginBottom:4}}>
                <span>14-day trend</span>
                <span className="r">avg {Math.round(tradesSeries.reduce((s,v)=>s+v,0)/tradesSeries.length).toLocaleString()}</span>
              </div>
              <MiniBars values={tradesSeries.map(v => v - 800)} w={200} h={28}/>
            </div>
          </div>
        </div>
      </div>

      {/* NAV + PnL + Allocation — Pulse only */}
      {isPulse && (<>
      <div className="pms-grid-row" data-stack style={{gridTemplateColumns:'1.2fr 1.2fr 0.8fr', gap:'var(--pms-gap)'}}>
        <div className="pms-card">
          <div className="pms-card-head">NAV history<div className="label-meta"><ChartRangeSeg value={chartRange} onChange={setChartRange}/></div></div>
          <div className="pms-card-body">
            <HoverLineChart data={navSlice} accessor={d=>d.nav} height={220}/>
            <div className="row" style={{marginTop:8, gap:18, fontSize:11, color:'var(--fg-3)', flexWrap:'wrap'}}>
              <span><span className="pms-mono" style={{color:'var(--fg-1)'}}>{fmt.usd(navSlice[0].nav, {compact:true})}</span> · {chartRange} ago</span>
              <span><span className={`pms-mono ${navSlice[navSlice.length-1].nav>=navSlice[0].nav?'pms-pos':'pms-neg'}`}>{navSlice[navSlice.length-1].nav>=navSlice[0].nav?'+':''}{((navSlice[navSlice.length-1].nav/navSlice[0].nav-1)*100).toFixed(2)}%</span> period</span>
              <span><span className="pms-mono pms-neg">{Math.min(...navSlice.map(d=>d.drawdown_pct)).toFixed(2)}%</span> max DD</span>
            </div>
          </div>
        </div>

        <div className="pms-card">
          <div className="pms-card-head">Daily P&L<div className="label-meta"><ChartRangeSeg value={chartRange} onChange={setChartRange}/></div></div>
          <div className="pms-card-body">
            <HoverBarChart values={dailyPnLSlice.map(d=>d.day_pnl)} dates={dailyPnLSlice.map(d=>d.date)} height={220}/>
            <div className="row" style={{marginTop:8, gap:18, fontSize:11, color:'var(--fg-3)', flexWrap:'wrap'}}>
              <span><span className="muted">Best day</span> <span className="pms-mono pms-pos">{fmt.signedUsd(Math.max(...dailyPnLSlice.map(d=>d.day_pnl)),{compact:true})}</span></span>
              <span><span className="muted">Worst</span> <span className="pms-mono pms-neg">{fmt.signedUsd(Math.min(...dailyPnLSlice.map(d=>d.day_pnl)),{compact:true})}</span></span>
              <span><span className="muted">Win rate</span> <span className="pms-mono">{((dailyPnLSlice.filter(d=>d.day_pnl>0).length/dailyPnLSlice.length)*100).toFixed(0)}%</span></span>
              <span><span className="muted">Net</span> <span className={`pms-mono ${classDelta(dailyPnLSlice.reduce((s,d)=>s+d.day_pnl,0))}`}>{fmt.signedUsd(dailyPnLSlice.reduce((s,d)=>s+d.day_pnl,0),{compact:true})}</span></span>
            </div>
          </div>
        </div>

        <div className="pms-card">
          <div className="pms-card-head">Allocation by category<div className="label-meta">live</div></div>
          <div className="pms-card-body">
            <div className="row" style={{justifyContent:'center', padding:'8px 0'}}>
              <Donut size={140} thickness={20} segments={STRAT_CATS.map(c => ({
                value: c.strategies.reduce((s,x)=>s+x.nav, 0),
                color: c.color,
              }))}/>
            </div>
            <div className="col" style={{marginTop: 6}}>
              {STRAT_CATS.map((c, i) => {
                const nav = c.strategies.reduce((s,x)=>s+x.nav,0);
                return (
                  <div key={c.id} className="row" style={{padding:'6px 0', borderBottom: i<STRAT_CATS.length-1 ? '1px solid var(--pms-divider)' : 'none', gap:8}}>
                    <span style={{width:8, height:8, borderRadius:2, background: c.color, flex:'0 0 8px'}}></span>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:12, fontWeight:600, color:'var(--fg-1)'}}>{c.name}</div>
                      <div style={{fontSize:10, color:'var(--fg-3)'}}>{c.strategies.length} strateg{c.strategies.length===1?'y':'ies'}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div className="pms-mono" style={{fontSize:12, color:'var(--fg-1)'}}>{fmt.usd(nav, {compact:true})}</div>
                      <div style={{fontSize:10, color:'var(--fg-3)'}}>{(nav/totalAUM*100).toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </>)}

      {/* Strategies table */}
      {showSection('strategies') && <>
      {!isPulse && <SectionHead id="strategies" title="Strategies" sub={`${filteredCats.length} categories · ${filteredAllStrats.length} strategies`} count={filteredAllStrats.length}/>}
      <div className="pms-card" style={isPulse?{marginTop:'var(--pms-gap)'}:undefined}>
        <div className="pms-card-head">
          Strategies
          <div className="label-meta">
            <span>{filteredCats.length} categories · {filteredAllStrats.length} strategies · 1 bot each</span>
            {isPulse && <button className="pms-viewall" onClick={()=>goToTab('strategies')}><span>View all</span><span className="arr">›</span></button>}
          </div>
        </div>
        <div className="pms-card-body flush pms-table-scroll">
          <table className="pms-table">
            <thead>
              <tr>
                <th style={{width:'22%'}}>Strategy</th>
                <th>Bot</th>
                <th>Venues</th>
                <th className="num">NAV</th>
                <th className="num">% AUM</th>
                <th className="num">P&L 24h</th>
                <th className="num">P&L 30d</th>
                <th className="num">APY</th>
                <th className="num">DD</th>
                <th className="num">Trades 24h</th>
                <th>Last trade</th>
                <th>Daily P&L · 14d</th>
                <th style={{width:24}}></th>
              </tr>
            </thead>
            <tbody>
              {filteredCats.map(cat => {
                const catNav = cat.strategies.reduce((s,x)=>s+x.nav,0);
                const catPnl24 = cat.strategies.reduce((s,x)=>s+x.pnl_24h,0);
                const catTr24 = cat.strategies.reduce((s,x)=>s+x.trades_24h,0);
                return (
                  <React.Fragment key={cat.id}>
                    <tr className="pms-cat-row">
                      <td colSpan={13}>
                        <div className="row" style={{gap:10, flexWrap:'wrap'}}>
                          <span style={{width:10, height:10, borderRadius:2, background:cat.color}}></span>
                          <span className="strong" style={{fontSize:12, color:'var(--fg-1)', textTransform:'uppercase', letterSpacing:'0.06em'}}>{cat.name}</span>
                          <span className="muted text-xs">· {cat.logic} · {cat.strategies.length} strateg{cat.strategies.length===1?'y':'ies'}</span>
                          <div className="spacer" style={{flex:1}}></div>
                          <span className="text-xs muted">NAV <span className="pms-mono" style={{color:'var(--fg-1)'}}>{fmt.usd(catNav,{compact:true})}</span></span>
                          <span className="text-xs muted">·</span>
                          <span className="text-xs muted">P&L 24h <span className={`pms-mono ${classDelta(catPnl24)}`}>{fmt.signedUsd(catPnl24,{compact:true})}</span></span>
                          <span className="text-xs muted">·</span>
                          <span className="text-xs muted">Trades 24h <span className="pms-mono" style={{color:'var(--fg-1)'}}>{catTr24.toLocaleString()}</span></span>
                        </div>
                      </td>
                    </tr>
                    {(isPulse ? cat.strategies.slice(0,1) : cat.strategies).map(s => {
                      const seed = Math.floor((s.bot.charCodeAt(0)+s.bot.charCodeAt(5))*0.7);
                      const bars = dailyPnLSpark(seed, 14, s.pnl_24h > 0 ? Math.abs(s.pnl_24h)*0.9 : 800, Math.abs(s.pnl_24h)*0.8 || 2000, s.status==='warning');
                      return (
                        <tr key={s.id} className="pms-strat-row" onClick={()=>onOpenPool && onOpenPool(cat.id==='mn-arb'?1:cat.id==='x-arb'?2:3)} style={{cursor:'pointer'}}>
                          <td>
                            <div className="strong">{s.label}</div>
                            <div className="text-xs muted" style={{marginTop:2}}>{cat.logic}</div>
                          </td>
                          <td>
                            <span className="row" style={{gap:6}}>
                              <BotStatusDot status={s.status}/>
                              <span className="pms-mono text-xs">{s.bot}</span>
                            </span>
                          </td>
                          <td className="text-xs muted">{s.venues}</td>
                          <td className="num strong">{fmt.usd(s.nav,{compact:true})}</td>
                          <td className="num">
                            <div className="row" style={{justifyContent:'flex-end', gap:6}}>
                              <span className="muted text-xs">{(s.nav/totalAUM*100).toFixed(1)}%</span>
                              <MiniBar pct={(s.nav/totalAUM*100)*2.5}/>
                            </div>
                          </td>
                          <td className={`num ${classDelta(s.pnl_24h)} strong`}>{fmt.signedUsd(s.pnl_24h,{compact:true})}</td>
                          <td className={`num ${classDelta(s.pnl_30d)}`}>{fmt.signedUsd(s.pnl_30d,{compact:true})}</td>
                          <td className="num pms-pos strong">{s.apy.toFixed(2)}%</td>
                          <td className={`num ${s.dd<-3?'pms-neg':''}`}>{s.dd.toFixed(2)}%</td>
                          <td className="num pms-mono">{s.trades_24h.toLocaleString()}</td>
                          <td className="pms-mono text-xs muted">{s.last_trade}</td>
                          <td><MiniBars values={bars} w={120} h={32}/></td>
                          <td style={{width:24}}><span className="pms-drill-arrow">›</span></td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live blotter + Recent roundtrips */}
      </>}
      {showSection('activity') && <>
      {!isPulse && <SectionHead id="activity" title="Activity" sub="Live order flow · paired roundtrips" count={filteredBlotter.length}/>}
      <div className="pms-grid-row" data-stack style={{gridTemplateColumns:'1fr 1.2fr', gap:'var(--pms-gap)'}}>
        <div className="pms-card">
          <div className="pms-card-head">
            Live blotter
            <div className="label-meta"><span className="pms-pill info"><span className="dot"></span>streaming</span></div>
          </div>
          <div className="pms-card-body flush pms-table-scroll">
            <table className="pms-table">
              <thead>
                <tr><th>Time</th><th>Sym</th><th>Strategy</th><th>Side</th><th className="num">Qty</th><th className="num">Px</th><th className="num">Size</th></tr>
              </thead>
              <tbody>
                {filteredBlotter.slice(0, isPulse ? 4 : 8).map(o => {
                  const sizeUsd = o.qty * o.price;
                  const catShort = o.strat==='basis'?'MN-Arb':o.strat==='x-arb'?'X-Arb':'Prop';
                  return (
                    <tr key={o.id}>
                      <td className="pms-mono muted">{o.time.slice(0,8)}</td>
                      <td><span className="pms-mono strong">{o.sym}</span></td>
                      <td><span className="pms-pill purple text-xs">{catShort}</span></td>
                      <td><span className={`pms-side ${o.side}`}>{o.side.toUpperCase()}</span></td>
                      <td className="num">{fmt.num(o.qty, o.qty<1?4:2)}</td>
                      <td className="num">{fmt.num(o.price, o.price<10?4:2)}</td>
                      <td className="num pms-mono">{fmt.usd(sizeUsd,{compact:true})}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pms-card">
          <div className="pms-card-head">
            Recent roundtrips
            <div className="label-meta">last 30m · gross · perf fee · txn fee spread</div>
          </div>
          <div className="pms-card-body flush pms-table-scroll">
            <table className="pms-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Strategy</th>
                  <th className="num">Notional</th>
                  <th className="num">Gross</th>
                  <th className="num">Perf fee</th>
                  <th className="num">Fee charged</th>
                  <th className="num">Fee paid</th>
                  <th className="num">Spread</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoundtrips.slice(0, isPulse ? 3 : filteredRoundtrips.length).map(r => {
                  const spread = r.fee_client - r.fee_paid;
                  const catColor = r.cat==='MN-Arb'?'purple':r.cat==='X-Arb'?'orange':'blue';
                  return (
                    <tr key={r.id}>
                      <td className="pms-mono muted text-xs">{r.t}</td>
                      <td>
                        <div className="row" style={{gap:6}}>
                          <span className={`pms-pill text-xs ${catColor}`}>{r.cat}</span>
                          <span className="text-xs muted">{r.strat.split(' · ')[1] || ''}</span>
                        </div>
                      </td>
                      <td className="num pms-mono">{fmt.usd(r.notional,{compact:true})}</td>
                      <td className={`num strong ${classDelta(r.gross)}`}>{fmt.signedUsd(r.gross,{dec:0})}</td>
                      <td className="num pms-mono">{r.perf>0 ? <span className="pms-pos">{fmt.signedUsd(r.perf,{dec:0})}</span> : <span className="muted">—</span>}</td>
                      <td className="num pms-mono">{fmt.usd(r.fee_client,{dec:2})}</td>
                      <td className="num pms-mono muted">{fmt.usd(r.fee_paid,{dec:2})}</td>
                      <td className="num pms-mono pms-pos">{fmt.signedUsd(spread,{dec:2})}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="row" style={{padding:'10px 16px', borderTop:'1px solid var(--pms-divider)', fontSize:11, gap:18, color:'var(--fg-3)', flexWrap:'wrap'}}>
              <span><span className="muted">Σ gross</span> <span className="pms-mono pms-pos">{fmt.signedUsd(filteredRoundtrips.reduce((s,r)=>s+r.gross,0),{dec:0})}</span></span>
              <span><span className="muted">Σ perf fee</span> <span className="pms-mono pms-pos">{fmt.signedUsd(filteredRoundtrips.reduce((s,r)=>s+r.perf,0),{dec:0})}</span></span>
              <span><span className="muted">Σ fee spread</span> <span className="pms-mono pms-pos">{fmt.signedUsd(filteredRoundtrips.reduce((s,r)=>s+(r.fee_client-r.fee_paid),0),{dec:2})}</span></span>
              <div className="spacer" style={{flex:1}}></div>
              <span className="muted">{filteredRoundtrips.length} roundtrips</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active workflows + Venue exposure (grouped) */}
      </>}
      {showSection('ops') && <>
      {!isPulse && <SectionHead id="ops" title="Ops & venues" sub="Workflows in flight · capital allocation · bot health" count={filteredOps.length + filteredVenueRows.length}/>}
      <div className="pms-grid-row" data-stack style={{gridTemplateColumns:'1fr 1.5fr', gap:'var(--pms-gap)'}}>
        <div className="pms-card">
          <div className="pms-card-head">
            Active workflows
            <div className="label-meta">{filteredOps.length} running</div>
          </div>
          <div className="pms-card-body" style={{padding: '6px 0'}}>
            {filteredOps.slice(0, isPulse ? 3 : filteredOps.length).map(op => (              <div key={op.id} style={{padding:'12px 16px', borderBottom:'1px solid var(--pms-divider)'}}>
                <div className="row" style={{justifyContent:'space-between', gap:8}}>
                  <span style={{fontSize:12, fontWeight:600}}>{op.kind}</span>
                  <span className="pms-mono text-xs muted">{op.duration}</span>
                </div>
                <div className="row" style={{marginTop:6, gap:8, flexWrap:'wrap'}}>
                  <span className="pms-mono text-sm strong" style={{color:'var(--fg-1)'}}>{fmt.usd(op.size,{compact:true})}</span>
                  <span className="text-xs muted">{op.ccy}</span>
                  <ChainBadge chain={op.chain}/>
                  <span className="pms-pill purple text-xs">{op.strategy}</span>
                </div>
                <div className="text-xs muted" style={{marginTop:6}}>{op.step}</div>
                <div className="row text-xs" style={{marginTop:4, gap:6}}>
                  <span className="muted">{op.actor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pms-card">
          <div className="pms-card-head">
            Venue exposure
            <div className="label-meta">{filteredVenueRows.length} accounts across {venuesGrouped.length} venues · grouped</div>
          </div>
          <div className="pms-card-body flush pms-table-scroll">
            <table className="pms-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Instrument</th>
                  <th className="num">Capital</th>
                  <th>Margin used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(isPulse ? venuesGrouped.filter(([venue]) => venueMatch(venue)).slice(0,3) : venuesGrouped.filter(([venue]) => venueMatch(venue))).map(([venue, rows]) => {
                  const totalCap = rows.reduce((s,r)=>s+r.capital,0);
                  const totalUsed = rows.reduce((s,r)=>s+r.used,0);
                  const venuePctUsed = totalUsed/totalCap*100;
                  const anyDeg = rows.some(r=>r.status!=='healthy');
                  return (
                    <React.Fragment key={venue}>
                      <tr className="pms-cat-row">
                        <td colSpan={6}>
                          <div className="row" style={{gap:10, flexWrap:'wrap'}}>
                            <VenueChip name={venue}/>
                            <span className="muted text-xs">· {rows.length} accounts</span>
                            <div className="spacer" style={{flex:1}}></div>
                            <span className="text-xs muted">Capital <span className="pms-mono" style={{color:'var(--fg-1)'}}>{fmt.usd(totalCap,{compact:true})}</span></span>
                            <span className="text-xs muted">·</span>
                            <span className="text-xs muted">Used <span className={`pms-mono ${venuePctUsed>85?'pms-warn':''}`}>{venuePctUsed.toFixed(0)}%</span></span>
                            <span className="text-xs muted">·</span>
                            {anyDeg ? <span className="pms-pill warn text-xs"><span className="dot"></span>DEG</span> : <span className="pms-pill pos text-xs"><span className="dot"></span>HEALTHY</span>}
                          </div>
                        </td>
                      </tr>
                      {rows.map((v,i) => {
                        const pctUsed = v.used / v.capital * 100;
                        return (
                          <tr key={venue+i}>
                            <td>
                              <span className="row" style={{gap:8}}>
                                <span className="pms-mono text-xs muted">└</span>
                                <span className="pms-mono">{v.acct}</span>
                              </span>
                            </td>
                            <td><AcctTypePill type={v.acct_type}/></td>
                            <td><span className="pms-pill text-xs">{v.inst}</span></td>
                            <td className="num strong">{fmt.usd(v.capital,{compact:true})}</td>
                            <td>
                              <div className="row" style={{gap:8}}>
                                <span className="pms-mono text-xs" style={{minWidth:34, color: pctUsed>85?'var(--pms-warn)':'var(--fg-2)'}}>{pctUsed.toFixed(0)}%</span>
                                <div style={{flex:1, minWidth:60, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden'}}>
                                  <div style={{width:`${pctUsed}%`, height:'100%', background: pctUsed>85?'var(--pms-warn)':'var(--pms-info)'}}></div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {v.status==='healthy'
                                ? <span className="pms-pill pos"><span className="dot"></span>OK</span>
                                : <span className="pms-pill warn"><span className="dot"></span>DEG</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bot telemetry */}
      <div className="pms-card" style={{marginTop:'var(--pms-gap)'}}>
        <div className="pms-card-head">
          Trading bot telemetry
          <div className="label-meta">heartbeat · throughput · errors · latency · resource use</div>
        </div>
        <div className="pms-card-body flush pms-table-scroll">
          <table className="pms-table">
            <thead>
              <tr>
                <th>Bot</th>
                <th>Category</th>
                <th>Status</th>
                <th className="num">Uptime</th>
                <th className="num">HB</th>
                <th className="num">Orders/min</th>
                <th className="num">Fills/min</th>
                <th className="num">Err/1h</th>
                <th className="num">p50</th>
                <th className="num">p99</th>
                <th>CPU</th>
                <th>Mem</th>
                <th>Last event</th>
              </tr>
            </thead>
            <tbody>
              {(isPulse ? BOT_TELEMETRY.slice(0,3) : BOT_TELEMETRY).map(b => (                <tr key={b.id}>
                  <td><span className="pms-mono strong">{b.id}</span></td>
                  <td><span className={`pms-pill text-xs ${b.cat==='MN-Arb'?'purple':b.cat==='X-Arb'?'orange':'blue'}`}>{b.cat}</span></td>
                  <td><BotStatusDot status={b.status}/></td>
                  <td className="num pms-mono text-xs">{b.uptime}</td>
                  <td className="num"><span className={`pms-mono text-xs ${b.hb_ms>500?'pms-warn':''}`}>{b.hb_ms<1000?`${b.hb_ms}ms`:`${(b.hb_ms/1000).toFixed(1)}s`}</span></td>
                  <td className="num pms-mono">{b.orders_min}</td>
                  <td className="num pms-mono">{b.fills_min}</td>
                  <td className="num"><span className={`pms-mono ${b.errors_1h>20?'pms-neg':b.errors_1h>10?'pms-warn':''}`}>{b.errors_1h}</span></td>
                  <td className="num pms-mono text-xs">{b.p50}ms</td>
                  <td className="num"><span className={`pms-mono text-xs ${b.p99>500?'pms-warn':''}`}>{b.p99}ms</span></td>
                  <td>
                    <div className="row" style={{gap:6}}>
                      <span className="pms-mono text-xs" style={{minWidth:24}}>{(b.cpu*100).toFixed(0)}%</span>
                      <div style={{width:50, height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden'}}>
                        <div style={{width:`${b.cpu*100}%`, height:'100%', background: b.cpu>0.6?'var(--pms-warn)':'var(--pms-pos)'}}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="row" style={{gap:6}}>
                      <span className="pms-mono text-xs" style={{minWidth:24}}>{(b.mem*100).toFixed(0)}%</span>
                      <div style={{width:50, height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden'}}>
                        <div style={{width:`${b.mem*100}%`, height:'100%', background: b.mem>0.7?'var(--pms-warn)':'var(--pms-info)'}}></div>
                      </div>
                    </div>
                  </td>
                  <td className="pms-mono text-xs muted">{b.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconciliation — detailed */}
      </>}
      {showSection('compliance') && <>
      {!isPulse && <SectionHead id="compliance" title="Compliance" sub="Reconciliation breaks · withdrawal approvals" count={filteredRecon.filter(r=>r.severity==='high').length + filteredWithdrawApprovals.length}/>}
      <div className="pms-card">
        <div className="pms-card-head">
          Reconciliation breaks
          <div className="label-meta">internal ledger vs venue snapshots · {filteredRecon.length} open · {filteredRecon.filter(r=>r.severity==='high').length} high · {filteredRecon.filter(r=>r.severity==='medium').length} medium · net diff {fmt.signedUsd(filteredRecon.reduce((s,r)=>s+r.diff_usd,0),{dec:0})}</div>
        </div>
        <div className="pms-card-body flush pms-table-scroll">
          <table className="pms-table">
            <thead>
              <tr>
                <th>Break · Severity</th>
                <th>Account</th>
                <th>Type</th>
                <th>Instrument</th>
                <th className="num">Expected</th>
                <th className="num">Actual</th>
                <th className="num">Diff (qty)</th>
                <th className="num">Diff (USD)</th>
                <th>Age · First seen</th>
                <th>Status · Likely cause</th>
              </tr>
            </thead>
            <tbody>
              {(isPulse ? reconByVenue.filter(([venue]) => venueMatch(venue)).slice(0,2) : reconByVenue.filter(([venue]) => venueMatch(venue))).map(([venue, rows]) => {
                const venueDiff = rows.reduce((s,r)=>s+r.diff_usd, 0);
                const venueHi = rows.filter(r=>r.severity==='high').length;
                return (
                  <React.Fragment key={venue}>
                    <tr className="pms-cat-row">
                      <td colSpan={10}>
                        <div className="row" style={{gap:10, flexWrap:'wrap'}}>
                          <VenueChip name={venue}/>
                          <span className="muted text-xs">· {rows.length} break{rows.length===1?'':'s'}</span>
                          <div className="spacer" style={{flex:1}}></div>
                          <span className="text-xs muted">Net diff <span className={`pms-mono ${classDelta(venueDiff)}`}>{fmt.signedUsd(venueDiff,{dec:0})}</span></span>
                          {venueHi > 0 && <><span className="text-xs muted">·</span><span className="pms-pill neg text-xs">{venueHi} HIGH</span></>}
                        </div>
                      </td>
                    </tr>
                    {rows.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div className="row" style={{gap:8}}>
                            <span className="pms-mono text-xs">{r.id}</span>
                            <span className={`pms-pill text-xs ${r.severity==='high'?'neg':r.severity==='medium'?'warn':''}`}>{r.severity.toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="pms-mono text-xs">{r.acct}</td>
                        <td><AcctTypePill type={r.acct_type}/></td>
                        <td>
                          <div className="row" style={{gap:6}}>
                            <AssetChip sym={r.asset}/>
                            <span className="text-xs muted">{r.inst}</span>
                          </div>
                        </td>
                        <td className="num pms-mono text-xs">{fmt.num(r.expected, r.unit_dec)}</td>
                        <td className="num pms-mono text-xs">{fmt.num(r.actual, r.unit_dec)}</td>
                        <td className={`num ${classDelta(r.diff)} pms-mono`}>{fmt.num(r.diff, r.unit_dec)}</td>
                        <td className={`num ${classDelta(r.diff_usd)} strong pms-mono`}>{fmt.signedUsd(r.diff_usd,{dec:0})}</td>
                        <td>
                          <div className="pms-mono text-xs" style={{color:'var(--fg-1)'}}>{r.age}</div>
                          <div className="text-xs muted">{r.first_seen}</div>
                        </td>
                        <td style={{maxWidth:280}}>
                          <div className="text-xs strong" style={{color: r.status==='escalated · OPS' ? 'var(--pms-neg)' : r.status==='auto-cleared' ? 'var(--pms-pos)' : 'var(--fg-1)'}}>{r.status}</div>
                          <div className="text-xs muted" style={{marginTop:2, whiteSpace:'normal'}}>{r.cause}</div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending withdrawal approvals — with audit */}
      <div className="pms-card" style={{marginTop:'var(--pms-gap)'}}>
        <div className="pms-card-head">
          Pending withdrawal approvals
          <div className="label-meta">{filteredWithdrawApprovals.length} pending · run audit before approving · oldest first</div>
        </div>
        <div className="pms-card-body flush pms-table-scroll">
          <table className="pms-table">
            <thead>
              <tr>
                <th>Intent</th>
                <th>Investor</th>
                <th className="num">Amount</th>
                <th>Asset / chain</th>
                <th>Stage</th>
                <th>Age</th>
                <th>Audit</th>
                <th style={{textAlign:'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(isPulse ? filteredWithdrawApprovals.slice(0,3) : filteredWithdrawApprovals).map(w => {
                const audit = WITHDRAWAL_AUDITS[w.id];
                return (
                  <tr key={w.id}>
                    <td><span className="pms-mono text-xs">{w.id}</span></td>
                    <td><span className="pms-mono text-xs">{w.user}</span></td>
                    <td className="num strong">{fmt.usd(w.amount,{compact:true})}</td>
                    <td>
                      <div className="row" style={{gap:6}}>
                        <AssetChip sym={w.asset}/>
                        <ChainBadge chain={w.chain}/>
                      </div>
                    </td>
                    <td><StageDot stage={w.stage} fail={w.failed}/></td>
                    <td className="pms-mono text-xs muted">{w.age}</td>
                    <td><AuditBadge audit={audit} onClick={()=>setAuditFor(w)}/></td>
                    <td>
                      <div className="row" style={{gap:6, justifyContent:'flex-end'}}>
                        <button className="pms-btn ghost text-xs" onClick={()=>setAuditFor(w)}>Audit →</button>
                        <button className="pms-btn success text-xs" disabled={audit?.status==='fail'} title={audit?.status==='fail'?'Audit failed — cannot approve':''}>Approve</button>
                        <button className="pms-btn danger text-xs" onClick={()=>setRejectFor(w)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firm revenue · by type breakdown */}
      </>}
      {showSection('revenue') && <>
      {!isPulse && <SectionHead id="revenue" title="Revenue" sub="Firm fees sitting in CEX sub-accounts" count={filteredRevenue.length}/>}
      <div className="pms-card">
        <div className="pms-card-head">
          Firm revenue · CEX sub-accounts
          <div className="label-meta">{filteredRevenue.length} sub-accounts · {fmt.usd(filteredRevenue.reduce((sum,r)=>sum+REV_TYPES.reduce((s,t)=>s+r[t.key],0),0),{compact:true})} total · breakdown by revenue type</div>
        </div>
        <div className="pms-card-body">
          {/* Stacked breakdown bar by revenue type */}
          <div style={{padding:'6px 0 4px'}}>
            <div className="pms-rev-bar">
              {REV_TYPES.map(t => {
                const v = revTotalsByType[t.key];
                const pct = v/revGrandTotal*100;
                return <span key={t.key} style={{width: pct+'%', background: t.color}} title={`${t.label} · ${fmt.usd(v,{compact:true})}`}>{pct>=8 ? `${t.key.toUpperCase()} ${pct.toFixed(0)}%` : ''}</span>;
              })}
            </div>
            <div className="pms-rev-legend">
              {REV_TYPES.map(t => (
                <span key={t.key}>
                  <span className="sw" style={{background:t.color}}></span>
                  <span style={{color:'var(--fg-2)'}}>{t.label}</span>
                  <span className="v">{fmt.usd(revTotalsByType[t.key],{compact:true})}</span>
                  <span className="muted">{(revTotalsByType[t.key]/revGrandTotal*100).toFixed(1)}%</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="pms-card-body flush pms-table-scroll" style={{borderTop:'1px solid var(--pms-divider)'}}>
          <table className="pms-table">
            <thead>
              <tr>
                <th>Venue</th>
                <th>Account</th>
                <th className="num">Perf</th>
                <th className="num">Mgmt</th>
                <th className="num">Spread</th>
                <th className="num">Funding</th>
                <th className="num">Rebates</th>
                <th className="num">LP</th>
                <th className="num">Total</th>
                <th>CCY</th>
                <th>Last sweep</th>
              </tr>
            </thead>
            <tbody>
              {(isPulse ? filteredRevenue.slice(0,2) : filteredRevenue).map(r => {
                const total = REV_TYPES.reduce((s,t)=>s+r[t.key], 0);
                return (
                  <tr key={r.account}>
                    <td><VenueChip name={r.venue}/></td>
                    <td>
                      <div className="row" style={{gap:6}}>
                        <span className="pms-mono text-xs">{r.account}</span>
                        <AcctTypePill type="revenue"/>
                      </div>
                    </td>
                    <td className="num pms-mono">{fmt.usd(r.perf,{compact:true})}</td>
                    <td className="num pms-mono">{fmt.usd(r.mgmt,{compact:true})}</td>
                    <td className="num pms-mono">{fmt.usd(r.spread,{compact:true})}</td>
                    <td className="num pms-mono">{fmt.usd(r.funding,{compact:true})}</td>
                    <td className="num pms-mono">{fmt.usd(r.rebates,{compact:true})}</td>
                    <td className="num pms-mono">{fmt.usd(r.lp,{compact:true})}</td>
                    <td className="num strong pms-pos">{fmt.usd(total,{compact:true})}</td>
                    <td><span className="pms-mono text-xs">{r.currency}</span></td>
                    <td className="pms-mono text-xs muted">{r.last_sweep}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'rgba(255,255,255,0.02)', borderTop:'1px solid var(--pms-divider-strong)'}}>
                <td colSpan={2} className="strong" style={{color:'var(--fg-1)'}}>Total firm revenue · idle</td>
                {REV_TYPES.map(t => (
                  <td key={t.key} className="num strong pms-mono">{fmt.usd(revTotalsByType[t.key],{compact:true})}</td>
                ))}
                <td className="num strong pms-pos">{fmt.usd(revGrandTotal,{compact:true})}</td>
                <td colSpan={2} className="text-xs muted">Earning {window.FIRM_PNL?.apy?.toFixed(2)||'8.42'}% blended</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ─── Audit modal ─── */}
      </>}
      <Modal
        open={!!auditFor}
        title={auditFor ? `Withdrawal audit · ${auditFor.id}` : ''}
        onClose={()=>setAuditFor(null)}
        footer={<>
          <button className="pms-btn ghost" onClick={()=>setAuditFor(null)}>Close</button>
          <button className="pms-btn danger" onClick={()=>{ setRejectFor(auditFor); setAuditFor(null); }}>Reject…</button>
          <button className="pms-btn success" disabled={WITHDRAWAL_AUDITS[auditFor?.id]?.status==='fail'}>
            {WITHDRAWAL_AUDITS[auditFor?.id]?.status==='warn' ? 'Approve anyway' : 'Approve'}
          </button>
        </>}>
        {auditFor && (() => {
          const a = WITHDRAWAL_AUDITS[auditFor.id];
          return (
            <>
              <dl className="pms-dl" style={{marginBottom:14}}>
                <dt>Investor</dt><dd className="pms-mono">{auditFor.user}</dd>
                <dt>Amount</dt><dd className="strong">{fmt.usd(auditFor.amount)} {auditFor.asset}</dd>
                <dt>Chain</dt><dd>{auditFor.chain}</dd>
                <dt>Strategy</dt><dd>{auditFor.strategy}</dd>
                <dt>Stage</dt><dd><StageDot stage={auditFor.stage}/></dd>
                <dt>Age</dt><dd>{auditFor.age}</dd>
              </dl>

              <div className="row" style={{justifyContent:'space-between', marginBottom:10, gap:10, flexWrap:'wrap'}}>
                <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--fg-3)', fontWeight:600}}>Audit checks</div>
                <AuditBadge audit={a}/>
              </div>

              {a ? (
                <div className="pms-audit-checks">
                  {a.checks.map(c => (
                    <div key={c.k} className={`pms-audit-check ${c.s}`}>
                      <div className="ic">{c.s==='pass'?'✓':c.s==='warn'?'!':'×'}</div>
                      <div className="k">{c.k}</div>
                      <div className="v">{c.v}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{padding:24, textAlign:'center', color:'var(--fg-3)'}}>
                  Audit not yet run. <button className="pms-btn primary" style={{marginLeft:8}}>Run audit now</button>
                </div>
              )}

              {a?.status === 'fail' && (
                <div style={{marginTop:14, padding:'10px 14px', background:'rgba(255,112,114,0.08)', border:'1px solid rgba(255,112,114,0.25)', borderRadius:6, fontSize:11, color:'var(--fg-2)'}}>
                  <strong style={{color:'var(--pms-neg)'}}>Cannot auto-approve.</strong> This withdrawal must be rejected or escalated to Risk Committee. The investor will be notified of the rejection reason.
                </div>
              )}
            </>
          );
        })()}
      </Modal>

      {/* ─── Reject modal ─── */}
      <Modal
        open={!!rejectFor}
        title={rejectFor ? `Reject withdrawal · ${rejectFor.id}` : ''}
        onClose={()=>setRejectFor(null)}
        footer={<>
          <button className="pms-btn ghost" onClick={()=>setRejectFor(null)}>Cancel</button>
          <button className="pms-btn danger" disabled={(rejectChips.length===0 && rejectReason.trim().length < 10)} onClick={()=>setRejectFor(null)}>
            Send rejection {rejectNotify && '· notify investor'}
          </button>
        </>}>
        {rejectFor && (
          <>
            <dl className="pms-dl" style={{marginBottom:12}}>
              <dt>Investor</dt><dd className="pms-mono">{rejectFor.user}</dd>
              <dt>Amount</dt><dd className="strong">{fmt.usd(rejectFor.amount)} {rejectFor.asset}</dd>
              <dt>Chain</dt><dd>{rejectFor.chain}</dd>
            </dl>

            <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--fg-3)', fontWeight:600, marginBottom:6}}>Common reasons</div>
            <div className="pms-reason-chips">
              {REJECT_REASON_TEMPLATES.map(t => {
                const active = rejectChips.includes(t);
                return (
                  <span key={t}
                    className={`pms-reason-chip ${active?'active':''}`}
                    onClick={()=>setRejectChips(active ? rejectChips.filter(x=>x!==t) : [...rejectChips, t])}>
                    {active ? '✓ ' : '+ '}{t}
                  </span>
                );
              })}
            </div>

            <div style={{marginTop:14}}>
              <label className="text-xs muted" style={{textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600}}>Explanation to investor <span style={{color:'var(--pms-neg)'}}>*</span></label>
              <textarea
                style={{width:'100%', marginTop:6, padding:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--pms-divider)', borderRadius:6, color:'var(--fg-1)', fontFamily:'inherit', fontSize:12, minHeight:80, resize:'vertical'}}
                placeholder="Required — explain why this withdrawal is being rejected and what the investor should do next (min 10 chars)."
                value={rejectReason}
                onChange={e=>setRejectReason(e.target.value)}/>
              <div className="row" style={{marginTop:4, fontSize:10, color:'var(--fg-3)', justifyContent:'space-between'}}>
                <span>Visible to investor in their portal &amp; email notification</span>
                <span className="pms-mono">{rejectReason.length} chars · min 10</span>
              </div>
            </div>

            <label className="row" style={{marginTop:12, gap:8, fontSize:11, color:'var(--fg-2)', cursor:'pointer'}}>
              <input type="checkbox" checked={rejectNotify} onChange={e=>setRejectNotify(e.target.checked)}/>
              Send email notification to {rejectFor.user}
            </label>

            {rejectChips.length === 0 && rejectReason.trim().length < 10 && (
              <div style={{marginTop:12, padding:'8px 12px', background:'rgba(255,196,84,0.08)', border:'1px solid rgba(255,196,84,0.20)', borderRadius:6, fontSize:11, color:'var(--pms-warn)'}}>
                Select at least one reason chip or write an explanation of 10+ characters.
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

window.OverviewPage = OverviewPage;
