/* PMS — mock data: pools, positions, blotter, transfers, sagas, bots, history */

const NOW = new Date('2026-05-01T14:32:00Z');

// ── Strategies / Bots (1:1) operating on N CEX Pools ─────────────
// Each entry is a Bot↔Strategy unit; cex_pools are the per-venue
// account allocations the bot manages.
const POOLS = [
  {
    id: 1,
    name: "Market-Neutral Arb",
    bot_id: "basis-bot-01",
    strategy: "delta_neutral_basis",
    risk: "Low",
    nav: 18_420_500,
    nav_per_share: 1.0842,
    pnl_24h: 12840,
    pnl_24h_pct: 0.0697,
    pnl_30d: 184320,
    pnl_30d_pct: 1.024,
    pnl_ytd: 1_120_440,
    pnl_ytd_pct: 6.48,
    drawdown_pct: -0.21,
    apy: 8.34,
    sharpe: 3.92,
    bots: 1,
    bot_status: "active",
    venues: ["Binance","OKX","Bybit","Deribit"],
    fees: { perf: 20, mgmt: 2 },
    aum_pct: 42.1,
    cex_pools: [
      { venue:"Binance", account:"Master",  capital: 6_240_000, pnl_24h: 4820, status:"healthy" },
      { venue:"OKX",     account:"Sub-A12", capital: 5_120_000, pnl_24h: 3120, status:"healthy" },
      { venue:"Bybit",   account:"Master",  capital: 4_180_000, pnl_24h: 2480, status:"healthy" },
      { venue:"Deribit", account:"Master",  capital: 2_880_500, pnl_24h: 2420, status:"healthy" },
    ],
  },
  {
    id: 2,
    name: "Cross-Exchange Arb",
    bot_id: "x-arb-bot-01",
    strategy: "triangular_xex",
    risk: "Moderate",
    nav: 12_840_990,
    nav_per_share: 1.1632,
    pnl_24h: 28480,
    pnl_24h_pct: 0.222,
    pnl_30d: 412330,
    pnl_30d_pct: 3.31,
    pnl_ytd: 1_842_100,
    pnl_ytd_pct: 16.74,
    drawdown_pct: -1.84,
    apy: 16.74,
    sharpe: 2.41,
    bots: 1,
    bot_status: "active",
    venues: ["Binance","OKX","Kraken","Coinbase"],
    fees: { perf: 25, mgmt: 2 },
    aum_pct: 29.4,
    cex_pools: [
      { venue:"Binance",  account:"Sub-A01", capital: 4_240_000, pnl_24h: 9840, status:"healthy" },
      { venue:"OKX",      account:"Master",  capital: 3_440_000, pnl_24h: 7820, status:"healthy" },
      { venue:"Kraken",   account:"Master",  capital: 2_840_990, pnl_24h: 6120, status:"healthy" },
      { venue:"Coinbase", account:"Prime",   capital: 2_320_000, pnl_24h: 4700, status:"healthy" },
    ],
  },
  {
    id: 3,
    name: "Proprietary Trading",
    bot_id: "prop-bot-01",
    strategy: "directional_quant",
    risk: "High",
    nav: 12_490_700,
    nav_per_share: 1.4218,
    pnl_24h: -64210,
    pnl_24h_pct: -0.512,
    pnl_30d: 894220,
    pnl_30d_pct: 7.71,
    pnl_ytd: 3_240_870,
    pnl_ytd_pct: 35.10,
    drawdown_pct: -4.18,
    apy: 35.10,
    sharpe: 1.88,
    bots: 1,
    bot_status: "warning",
    venues: ["Binance","Bybit","Deribit"],
    fees: { perf: 30, mgmt: 2 },
    aum_pct: 28.5,
    cex_pools: [
      { venue:"Binance", account:"Master",  capital: 5_240_000, pnl_24h:-28210, status:"healthy" },
      { venue:"Bybit",   account:"Sub-A02", capital: 4_840_000, pnl_24h:-22810, status:"healthy" },
      { venue:"Deribit", account:"Master",  capital: 2_410_700, pnl_24h:-13190, status:"degraded" },
    ],
  },
];

const PORTFOLIO_TOTAL = {
  aum: POOLS.reduce((s,p)=>s+p.nav,0),
  pnl_24h: POOLS.reduce((s,p)=>s+p.pnl_24h,0),
  pnl_30d: POOLS.reduce((s,p)=>s+p.pnl_30d,0),
  pnl_ytd: POOLS.reduce((s,p)=>s+p.pnl_ytd,0),
  drawdown: -2.14,
  clients: 487,
  open_positions: 142,
  active_bots: 2,
  total_bots: 3,
};

// ── Positions ───────────────────────────────────────────────────
const POSITIONS = [
  { sym:"BTC", base:"BTCUSDT", venue:"Binance", side:"long",  qty:42.184, mark:67284.21, entry:64120.50, notional:2839116, upnl:133472, upnl_pct:4.93, pool:1, exposure:15.41, lev:1.0 },
  { sym:"BTC", base:"BTC-PERP", venue:"OKX",     side:"short", qty:-41.92, mark:67280.10, entry:67492.31, notional:-2820377, upnl:8896, upnl_pct:0.31, pool:1, exposure:-15.31, lev:3.0 },
  { sym:"ETH", base:"ETHUSDT", venue:"Binance", side:"long",  qty:284.5,  mark:3492.12,  entry:3210.04, notional:993459, upnl:80279, upnl_pct:8.79, pool:2, exposure:5.39, lev:1.0 },
  { sym:"ETH", base:"ETH-PERP", venue:"Bybit",   side:"short", qty:-280.0, mark:3491.80,  entry:3498.90, notional:-977704, upnl:1988, upnl_pct:0.20, pool:2, exposure:-5.31, lev:5.0 },
  { sym:"SOL", base:"SOLUSDT", venue:"OKX",     side:"long",  qty:8420.0, mark:178.42,   entry:162.18,  notional:1502297, upnl:136706, upnl_pct:10.01, pool:3, exposure:8.16, lev:2.0 },
  { sym:"SOL", base:"SOL-PERP", venue:"Bybit",   side:"long",  qty:1240.0, mark:178.36,   entry:172.20,  notional:221166, upnl:7638, upnl_pct:3.58, pool:3, exposure:1.20, lev:3.0 },
  { sym:"USDT",base:"USDT",    venue:"Binance", side:"long",  qty:8420400, mark:1.0001, entry:1.0000, notional:8421242, upnl:842, upnl_pct:0.01, pool:1, exposure:45.74, lev:1.0 },
  { sym:"USDT",base:"USDT",    venue:"OKX",     side:"long",  qty:6240200, mark:1.0001, entry:1.0000, notional:6240824, upnl:624, upnl_pct:0.01, pool:1, exposure:33.90, lev:1.0 },
  { sym:"USDC",base:"USDC",    venue:"Coinbase",side:"long",  qty:1840000, mark:0.9999, entry:1.0000, notional:1839816, upnl:-184, upnl_pct:-0.01, pool:2, exposure:14.32, lev:1.0 },
  { sym:"AVAX",base:"AVAXUSDT",venue:"Binance", side:"long",  qty:6420.0, mark:42.18,    entry:38.40,   notional:270796, upnl:24268, upnl_pct:9.84, pool:3, exposure:1.47, lev:1.0 },
  { sym:"LINK",base:"LINKUSDT",venue:"OKX",     side:"long",  qty:8420.0, mark:18.42,    entry:17.18,   notional:155096, upnl:10440, upnl_pct:7.22, pool:3, exposure:0.84, lev:1.0 },
  { sym:"ARB", base:"ARBUSDT", venue:"Binance", side:"short", qty:-12400, mark:1.184,    entry:1.218,   notional:-14681, upnl:421, upnl_pct:2.79, pool:2, exposure:-0.08, lev:2.0 },
];

// ── Orders / executions blotter ─────────────────────────────────
const BLOTTER = [
  { time:"14:32:18.412", id:"OXJ-92841", venue:"Binance", sym:"BTCUSDT", side:"buy",  type:"LIMIT",  qty:0.842, price:67284.20, status:"FILLED", strat:"basis", fees:0.84 },
  { time:"14:32:14.220", id:"OXJ-92840", venue:"OKX",     sym:"BTC-PERP",side:"sell", type:"LIMIT",  qty:0.842, price:67292.40, status:"FILLED", strat:"basis", fees:0.91 },
  { time:"14:32:09.118", id:"OXJ-92839", venue:"Bybit",   sym:"ETH-PERP",side:"sell", type:"MARKET", qty:4.20,  price:3491.80,  status:"FILLED", strat:"x-arb", fees:0.62 },
  { time:"14:32:02.811", id:"OXJ-92838", venue:"Coinbase",sym:"ETH-USD", side:"buy",  type:"LIMIT",  qty:4.18,  price:3489.10,  status:"FILLED", strat:"x-arb", fees:0.58 },
  { time:"14:31:58.412", id:"OXJ-92837", venue:"OKX",     sym:"SOLUSDT", side:"buy",  type:"LIMIT",  qty:248.0, price:178.42,   status:"PARTIAL",strat:"prop",  fees:1.84, filled:142.0 },
  { time:"14:31:54.190", id:"OXJ-92836", venue:"Binance", sym:"BTCUSDT", side:"sell", type:"LIMIT",  qty:0.424, price:67288.10, status:"FILLED", strat:"basis", fees:0.42 },
  { time:"14:31:48.014", id:"OXJ-92835", venue:"Bybit",   sym:"SOL-PERP",side:"buy",  type:"MARKET", qty:84.0,  price:178.40,   status:"FILLED", strat:"prop",  fees:0.18 },
  { time:"14:31:42.908", id:"OXJ-92834", venue:"Binance", sym:"AVAXUSDT",side:"buy",  type:"LIMIT",  qty:120.0, price:42.18,    status:"FILLED", strat:"prop",  fees:0.12 },
  { time:"14:31:36.412", id:"OXJ-92833", venue:"OKX",     sym:"BTC-PERP",side:"buy",  type:"LIMIT",  qty:0.624, price:67280.20, status:"WORKING",strat:"basis", fees:0,  filled:0 },
  { time:"14:31:30.118", id:"OXJ-92832", venue:"Binance", sym:"ETHUSDT", side:"buy",  type:"LIMIT",  qty:8.40,  price:3490.20,  status:"FILLED", strat:"x-arb", fees:0.24 },
  { time:"14:31:24.410", id:"OXJ-92831", venue:"Kraken",  sym:"LINK-USD",side:"buy",  type:"LIMIT",  qty:240.0, price:18.42,    status:"FILLED", strat:"prop",  fees:0.08 },
  { time:"14:31:18.812", id:"OXJ-92830", venue:"Binance", sym:"BTCUSDT", side:"sell", type:"LIMIT",  qty:0.124, price:67290.00, status:"CANCELED",strat:"basis", fees:0 },
  { time:"14:31:12.108", id:"OXJ-92829", venue:"Deribit", sym:"BTC-PERP",side:"buy",  type:"LIMIT",  qty:0.842, price:67278.40, status:"FILLED", strat:"basis", fees:0.34 },
  { time:"14:31:06.412", id:"OXJ-92828", venue:"Binance", sym:"BTCUSDT", side:"buy",  type:"LIMIT",  qty:0.218, price:67282.30, status:"FILLED", strat:"basis", fees:0.21 },
];

// ── Pending transfer approvals ──────────────────────────────────
// Single-sig allowed under $1k; 2-of-2 multi-sig required above.
const TRANSFERS_PENDING = [
  { id:"TXR-04829", from:"Binance Master", to:"Hot Wallet (ETH)", asset:"USDT", chain:"TRON",     amount:480000, threshold:1000, sig:"2-of-2", requestor:"basis-bot-01", reason:"Roundtrip settlement", initiated:"14:28:09", risk:"low" },
  { id:"TXR-04830", from:"OKX Sub-A12",    to:"Cold Storage",     asset:"USDC", chain:"Ethereum", amount:1240000, threshold:1000, sig:"2-of-2", requestor:"ops-emily",   reason:"Excess capital sweep", initiated:"14:18:42", risk:"medium" },
  { id:"TXR-04831", from:"Hot Wallet",     to:"Bybit Master",     asset:"USDT", chain:"TRON",     amount:240000, threshold:1000, sig:"2-of-2", requestor:"x-arb-bot-01",reason:"Redeploy to Bybit",    initiated:"14:14:12", risk:"low" },
  { id:"TXR-04832", from:"Firm Sub-Acct",  to:"External 0x84..fA", asset:"USDC", chain:"Ethereum", amount:84000,  threshold:1000, sig:"2-of-2", requestor:"firm-pnl",    reason:"Performance fee withdrawal", initiated:"13:48:21", risk:"high" },
  { id:"TXR-04833", from:"Pool 3 Master",  to:"Coinbase Prime",   asset:"USDT", chain:"Solana",   amount:680000, threshold:1000, sig:"2-of-2", requestor:"prop-bot-01", reason:"Strategy rebalance",   initiated:"13:32:58", risk:"medium" },
  { id:"TXR-04834", from:"Binance Master", to:"Pool 1 Master",    asset:"BTC",  chain:"Bitcoin",  amount:840,    threshold:1000, sig:"single", requestor:"basis-bot-01",reason:"Dust sweep",           initiated:"13:18:04", risk:"low" },
];

// ── Sagas ───────────────────────────────────────────────────────
const SAGAS = [
  { id:"sg-9842", workflow:"Client deposit",  pool:"Cross-Ex Arb", step:"3/5 — Confirming on-chain TX", started:"14:18:42", duration:"00:14:08", status:"RUNNING", actor:"User #2841" },
  { id:"sg-9841", workflow:"Pool rebalance",  pool:"Prop Trading",  step:"4/6 — Hedging on Bybit", started:"14:08:12", duration:"00:24:38", status:"RUNNING", actor:"prop-bot-02" },
  { id:"sg-9840", workflow:"Fee distribution",pool:"Market-Neutral",step:"2/4 — Moving fees to firm sub-account", started:"13:42:08", duration:"00:50:42", status:"RUNNING", actor:"firm-pnl" },
  { id:"sg-9839", workflow:"Client withdrawal",pool:"Cross-Ex Arb",step:"1/5 — KYT screening", started:"13:18:09", duration:"01:14:41", status:"RUNNING", actor:"User #1842" },
];

// ── Bots (1:1 with strategies) ──────────────────────────────────
const BOTS = [
  { id:"basis-bot-01", strategy:"Market-Neutral Arb",  pool:1, status:"active",  uptime:"42d 11h", pnl_24h: 12840, allocated: 18_420_500, last_trade:"14:32:18", venues:"Binance×OKX×Bybit×Deribit" },
  { id:"x-arb-bot-01", strategy:"Cross-Exchange Arb",  pool:2, status:"active",  uptime:"21d 02h", pnl_24h: 28480, allocated: 12_840_990, last_trade:"14:32:14", venues:"Binance×OKX×Kraken×Coinbase" },
  { id:"prop-bot-01",  strategy:"Proprietary Trading", pool:3, status:"warning", uptime:"02d 14h", pnl_24h:-64210, allocated: 12_490_700, last_trade:"14:31:48", venues:"Binance×Bybit×Deribit" },
];

// ── Risk limits ─────────────────────────────────────────────────
const RISK_LIMITS = [
  { name:"Pool 3 — Drawdown",        used:4.18, limit:5.00, unit:"%",    severity:"high" },
  { name:"BTC net delta",            used:0.10, limit:5.00, unit:"%",    severity:"low" },
  { name:"ETH net delta",            used:0.08, limit:5.00, unit:"%",    severity:"low" },
  { name:"SOL net delta",            used:9.36, limit:10.00,unit:"%",    severity:"high" },
  { name:"VaR 95% / 1d",             used:184320, limit:240000, unit:"$", severity:"medium" },
  { name:"Pool 2 — Leverage",        used:2.4, limit:4.00, unit:"x",     severity:"low" },
  { name:"Counterparty — Bybit",     used:18.4, limit:25.0, unit:"%",    severity:"medium" },
  { name:"Counterparty — Deribit",   used:8.2,  limit:15.0, unit:"%",    severity:"low" },
];

// ── Reconciliation breaks ───────────────────────────────────────
const RECON_BREAKS = [
  { id:"RB-1284", venue:"Binance", asset:"USDT", expected: 8420400, actual: 8420242,  diff: -158,    pct: -0.000019, age:"00:14:42", severity:"low" },
  { id:"RB-1283", venue:"Bybit",   asset:"ETH",  expected: 280.0,   actual: 279.984,  diff: -0.016,  pct: -0.0057,   age:"00:48:12", severity:"low" },
  { id:"RB-1282", venue:"OKX",     asset:"USDC", expected: 1240000, actual: 1241420,  diff: 1420,    pct: 0.00114,   age:"02:14:08", severity:"medium" },
  { id:"RB-1281", venue:"Deribit", asset:"BTC",  expected: 41.92,   actual: 41.84,    diff: -0.08,   pct: -0.19,     age:"04:18:42", severity:"high" },
];

// ── Counterparty / venue exposure ───────────────────────────────
const VENUES = [
  { name:"Binance",  type:"CEX", capital: 14_240_000, pct: 32.5, sub_accts: 8,  api_keys: 8, status:"healthy",  rating:"A+", margin: 0.42 },
  { name:"OKX",      type:"CEX", capital: 12_840_000, pct: 29.3, sub_accts: 6,  api_keys: 6, status:"healthy",  rating:"A",  margin: 0.38 },
  { name:"Bybit",    type:"CEX", capital:  6_420_000, pct: 14.6, sub_accts: 4,  api_keys: 4, status:"healthy",  rating:"A",  margin: 0.51 },
  { name:"Deribit",  type:"CEX", capital:  3_840_000, pct:  8.7, sub_accts: 2,  api_keys: 2, status:"degraded", rating:"A-", margin: 0.62 },
  { name:"Coinbase", type:"CEX", capital:  3_240_000, pct:  7.4, sub_accts: 2,  api_keys: 2, status:"healthy",  rating:"A",  margin: 0.18 },
  { name:"Kraken",   type:"CEX", capital:  1_840_000, pct:  4.2, sub_accts: 2,  api_keys: 2, status:"healthy",  rating:"A",  margin: 0.24 },
  { name:"Hot Wallet (ETH)", type:"Self-Custody", capital:  840_000, pct: 1.9, sub_accts: 1, api_keys: 0, status:"healthy", rating:"—", margin: 0 },
  { name:"Cold Storage",     type:"Self-Custody", capital:  490_000, pct: 1.1, sub_accts: 1, api_keys: 0, status:"healthy", rating:"—", margin: 0 },
];

// ── API keys / admin ────────────────────────────────────────────
const API_KEYS = [
  { id:"key-04821", venue:"Binance", account:"Master",     created:"2025-11-12", rotated:"2026-04-18", status:"active",  perms:"read,trade,withdraw", masked:"a4f2…48xq" },
  { id:"key-04822", venue:"Binance", account:"Sub-A01",    created:"2025-11-12", rotated:"2026-04-18", status:"active",  perms:"read,trade",          masked:"b9e1…29hk" },
  { id:"key-04823", venue:"OKX",     account:"Master",     created:"2025-11-14", rotated:"2026-03-12", status:"rotate-soon", perms:"read,trade,withdraw", masked:"f1d4…22pl" },
  { id:"key-04824", venue:"OKX",     account:"Sub-A12",    created:"2025-12-01", rotated:"2026-04-02", status:"active",  perms:"read,trade",          masked:"c3a9…91vm" },
  { id:"key-04825", venue:"Bybit",   account:"Master",     created:"2026-01-04", rotated:"2026-04-02", status:"active",  perms:"read,trade",          masked:"e8f7…14qz" },
  { id:"key-04826", venue:"Deribit", account:"Master",     created:"2026-01-04", rotated:"2025-10-12", status:"expired", perms:"read,trade",          masked:"d1c2…78rt" },
];

const USERS = [
  { name:"Emily Chen",    email:"emily.chen@kemely.fund",    role:"PM",    last:"online now",  twofa:true,  pools:["MN-Arb","X-Arb","Prop"] },
  { name:"Marcus Holm",   email:"marcus.holm@kemely.fund",   role:"PM",    last:"2m ago",      twofa:true,  pools:["X-Arb","Prop"] },
  { name:"Yuki Tanaka",   email:"yuki.tanaka@kemely.fund",   role:"Risk",  last:"online now",  twofa:true,  pools:["all"] },
  { name:"Aaron Doukas",  email:"aaron.doukas@kemely.fund",  role:"Ops",   last:"14m ago",     twofa:true,  pools:["all"] },
  { name:"Lina Pereira",  email:"lina.pereira@kemely.fund",  role:"Compliance",   last:"online now",  twofa:true,  pools:["MN-Arb"] },
  { name:"David Whitlow", email:"david.whitlow@kemely.fund", role:"Admin", last:"1h ago",      twofa:true,  pools:["all"] },
  { name:"Sarah Kim",     email:"sarah.kim@kemely.fund",     role:"Sales",        last:"32m ago",     twofa:true,  pools:["all"] },
];

// ── Time series history (~90d) ──────────────────────────────────
function buildHistory() {
  const days = 90;
  const navHistory = [];
  let nav = 38_400_000;
  let peak = nav;
  for (let i = days; i >= 0; i--) {
    const d = new Date(NOW); d.setDate(d.getDate() - i);
    // Trend: roughly +12% over 90d, with vol
    const drift = 0.0012;
    const noise = (Math.sin(i*0.45) * 0.004) + (Math.cos(i*0.27) * 0.0028) + (Math.random()-0.5)*0.0035;
    nav = nav * (1 + drift + noise);
    peak = Math.max(peak, nav);
    navHistory.push({
      date: d.toISOString().slice(0,10),
      nav,
      drawdown_pct: (nav - peak) / peak * 100,
      pnl: nav - 38_400_000,
    });
  }
  return navHistory;
}
const NAV_HISTORY = buildHistory();

// expose globally
Object.assign(window, {
  POOLS, PORTFOLIO_TOTAL, POSITIONS, BLOTTER, TRANSFERS_PENDING,
  SAGAS, BOTS, RISK_LIMITS, RECON_BREAKS, VENUES, API_KEYS, USERS,
  NAV_HISTORY, NOW,
});
