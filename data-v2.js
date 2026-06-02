/* PMS v2 — additional data for refresh: fund flow, investors, firm PnL, bot triage, fee policy, audit, sub-accounts */

// ── Roles ───────────────────────────────────────────────────────
const ROLES = ['PM','RISK','OPS','COMPLIANCE','SALES','ADMIN'];
const ROLE_LABEL = { PM:'Portfolio Manager', RISK:'Risk', OPS:'Operations', COMPLIANCE:'Compliance', SALES:'Sales', ADMIN:'Admin' };

// ── Fund-flow intents (deposits + withdrawals in flight) ────────
const DEPOSIT_STAGES = ['D0_CREATED','D1_TX_SUBMITTED','D2_SCANNED','D3_CONFIRMED','D4_CREDITED','D5_SETTLED'];
const WITHDRAW_STAGES = ['W0_CREATED','W1_KYT','W2_APPROVAL','W3_LOCK_CHECK','W4_PROVIDER_CHECK','W5_EXECUTING','W6_ON_CHAIN','W7_SETTLED'];

const FUND_INTENTS = [
  // Deposits
  { id:'FI-D-04210', dir:'deposit',  user:'INV-1842', amount: 240000, asset:'USDC', chain:'Ethereum', strategy:'X-Arb',  stage:'D2_SCANNED',     age:'00:04:18', kyt:14,  conf:3,  provider:'OK',     unlock_eta:'+24h' },
  { id:'FI-D-04211', dir:'deposit',  user:'INV-2841', amount:  84000, asset:'USDT', chain:'TRON',     strategy:'MN-Arb', stage:'D3_CONFIRMED',   age:'00:18:42', kyt:8,   conf:14, provider:'OK',     unlock_eta:'+24h' },
  { id:'FI-D-04212', dir:'deposit',  user:'INV-1240', amount: 480000, asset:'USDC', chain:'Solana',   strategy:'Prop',   stage:'D4_CREDITED',    age:'00:42:08', kyt:22,  conf:32, provider:'OK',     unlock_eta:'+23h 18m' },
  { id:'FI-D-04213', dir:'deposit',  user:'INV-3210', amount:  18400, asset:'USDT', chain:'TRON',     strategy:'MN-Arb', stage:'D1_TX_SUBMITTED',age:'00:01:42', kyt:'…',  conf:0,  provider:'OK',     unlock_eta:'+24h' },
  { id:'FI-D-04214', dir:'deposit',  user:'INV-4821', amount: 120000, asset:'USDC', chain:'Ethereum', strategy:'X-Arb',  stage:'D5_SETTLED',     age:'02:18:09', kyt:6,   conf:42, provider:'OK',     unlock_eta:'unlocked' },
  { id:'FI-D-04215', dir:'deposit',  user:'INV-5132', amount:  42000, asset:'USDC', chain:'Solana',   strategy:'MN-Arb', stage:'D0_CREATED',     age:'00:00:12', kyt:'—', conf:0,  provider:'OK',     unlock_eta:'+24h' },
  // Withdrawals
  { id:'FI-W-08841', dir:'withdraw', user:'INV-1842', amount: 124000, asset:'USDC', chain:'Ethereum', strategy:'X-Arb',  stage:'W2_APPROVAL',    age:'00:08:42', kyt:11,  conf:0,  provider:'PENDING',unlock_eta:'ready' },
  { id:'FI-W-08842', dir:'withdraw', user:'INV-2841', amount:  18000, asset:'USDT', chain:'TRON',     strategy:'MN-Arb', stage:'W3_LOCK_CHECK',  age:'00:14:18', kyt:8,   conf:0,  provider:'OK',     unlock_eta:'+8h 12m' },
  { id:'FI-W-08843', dir:'withdraw', user:'INV-1240', amount: 240000, asset:'USDC', chain:'Solana',   strategy:'Prop',   stage:'W5_EXECUTING',   age:'00:24:08', kyt:14,  conf:0,  provider:'OK',     unlock_eta:'ready' },
  { id:'FI-W-08844', dir:'withdraw', user:'INV-3210', amount:   8400, asset:'USDT', chain:'TRON',     strategy:'MN-Arb', stage:'W6_ON_CHAIN',    age:'00:42:11', kyt:9,   conf:2,  provider:'OK',     unlock_eta:'ready' },
  { id:'FI-W-08845', dir:'withdraw', user:'INV-7184', amount:  84000, asset:'USDC', chain:'Ethereum', strategy:'X-Arb',  stage:'W1_KYT',         age:'00:02:38', kyt:'…', conf:0,  provider:'OK',     unlock_eta:'ready' },
  { id:'FI-W-08846', dir:'withdraw', user:'INV-9201', amount: 412000, asset:'USDC', chain:'Ethereum', strategy:'Prop',   stage:'W4_PROVIDER_CHECK',age:'00:18:21',kyt:18,  conf:0,  provider:'WAIT',   unlock_eta:'ready' },
  { id:'FI-W-08847', dir:'withdraw', user:'INV-4821', amount:  24000, asset:'USDC', chain:'Solana',   strategy:'MN-Arb', stage:'W7_SETTLED',     age:'01:18:09', kyt:6,   conf:48, provider:'OK',     unlock_eta:'unlocked' },
  // Failed branch
  { id:'FI-W-08848', dir:'withdraw', user:'INV-6612', amount:  92000, asset:'USDT', chain:'TRON',     strategy:'X-Arb',  stage:'W2_APPROVAL',    age:'02:42:18', kyt:62,  conf:0,  provider:'REJECT', unlock_eta:'—', failed:true, reason:'KYT score above threshold' },
];

// Sankey flow magnitudes — $ amounts flowing between adjacent stages
const DEPOSIT_FLOWS = [
  { from:'D0_CREATED',     to:'D1_TX_SUBMITTED', amount: 484400 },
  { from:'D1_TX_SUBMITTED',to:'D2_SCANNED',      amount: 442400 },
  { from:'D2_SCANNED',     to:'D3_CONFIRMED',    amount: 410000 },
  { from:'D3_CONFIRMED',   to:'D4_CREDITED',     amount: 384200 },
  { from:'D4_CREDITED',    to:'D5_SETTLED',      amount: 360000 },
  // Drop-offs
  { from:'D1_TX_SUBMITTED',to:'D_FAIL',          amount:  42000, failed:true },
  { from:'D2_SCANNED',     to:'D_FAIL',          amount:  32400, failed:true },
];
const WITHDRAW_FLOWS = [
  { from:'W0_CREATED',          to:'W1_KYT',             amount: 1042400 },
  { from:'W1_KYT',              to:'W2_APPROVAL',        amount:  892400 },
  { from:'W2_APPROVAL',         to:'W3_LOCK_CHECK',      amount:  812400 },
  { from:'W3_LOCK_CHECK',       to:'W4_PROVIDER_CHECK',  amount:  742000 },
  { from:'W4_PROVIDER_CHECK',   to:'W5_EXECUTING',       amount:  694800 },
  { from:'W5_EXECUTING',        to:'W6_ON_CHAIN',        amount:  680000 },
  { from:'W6_ON_CHAIN',         to:'W7_SETTLED',         amount:  672000 },
  // Drop-offs
  { from:'W1_KYT',              to:'W_FAIL', amount: 150000, failed:true },
  { from:'W2_APPROVAL',         to:'W_FAIL', amount:  80000, failed:true },
  { from:'W4_PROVIDER_CHECK',   to:'W_FAIL', amount:  47200, failed:true },
];

// ── Investors ───────────────────────────────────────────────────
const INVESTORS = [
  { id:'INV-1842', name:'Stratton Capital Partners',  kyc:'institutional', strategies:3, deposits:8_420_000, withdrawals:1_240_000, balance:9_180_000, hwm:9_240_000, locked: 480_000, withdrawable: 8_700_000, last_op:'14:18:42' },
  { id:'INV-2841', name:'Halberd Family Office',      kyc:'institutional', strategies:2, deposits:4_240_000, withdrawals:  480_000, balance:4_120_000, hwm:4_120_000, locked: 124_000, withdrawable: 3_996_000, last_op:'13:42:08' },
  { id:'INV-1240', name:'Polaris Macro Fund',         kyc:'institutional', strategies:3, deposits:6_180_000, withdrawals:2_240_000, balance:5_420_000, hwm:5_840_000, locked: 720_000, withdrawable: 4_700_000, last_op:'14:24:18' },
  { id:'INV-3210', name:'Vector Quant',               kyc:'institutional', strategies:1, deposits:1_840_000, withdrawals:  240_000, balance:1_720_000, hwm:1_720_000, locked:  18_400, withdrawable: 1_701_600, last_op:'12:08:41' },
  { id:'INV-4821', name:'Brightline Holdings',        kyc:'professional',  strategies:2, deposits:  840_000, withdrawals:  120_000, balance:  784_000, hwm:  812_000, locked:   8_400, withdrawable:   775_600, last_op:'11:42:18' },
  { id:'INV-5132', name:'M. Whitlow (HNW)',           kyc:'professional',  strategies:1, deposits:  240_000, withdrawals:        0, balance:  248_400, hwm:  248_400, locked:  42_000, withdrawable:   206_400, last_op:'10:18:42' },
  { id:'INV-7184', name:'Quill & Stark LLP',          kyc:'institutional', strategies:2, deposits:  420_000, withdrawals:   42_000, balance:  392_000, hwm:  410_000, locked:  84_000, withdrawable:   308_000, last_op:'09:28:14' },
  { id:'INV-9201', name:'Caldera DAO Treasury',       kyc:'institutional', strategies:3, deposits:2_140_000, withdrawals:  412_000, balance:1_840_000, hwm:1_920_000, locked: 412_000, withdrawable: 1_428_000, last_op:'14:32:08' },
  { id:'INV-6612', name:'B. Reyes (HNW)',             kyc:'professional',  strategies:1, deposits:  140_000, withdrawals:        0, balance:  148_200, hwm:  148_200, locked:  92_000, withdrawable:    56_200, last_op:'08:14:08', flag:'kyt-review' },
];

// FIFO deposit batches per investor (for Gantt-style unlock timeline)
const INVESTOR_LOTS = {
  'INV-1842': [
    { lot:'L-2841', strategy:'X-Arb',  deposited:'2026-03-12', amount:2_400_000, provider_locked:0,       strategy_locked:0,       available_now:2_400_000 },
    { lot:'L-2912', strategy:'X-Arb',  deposited:'2026-04-04', amount:1_840_000, provider_locked:0,       strategy_locked:0,       available_now:1_840_000 },
    { lot:'L-2998', strategy:'MN-Arb', deposited:'2026-04-21', amount:1_240_000, provider_locked:0,       strategy_locked:240_000, available_now:1_000_000 },
    { lot:'L-3041', strategy:'X-Arb',  deposited:'2026-05-04', amount:1_140_000, provider_locked:0,       strategy_locked:0,       available_now:1_140_000 },
    { lot:'L-3088', strategy:'Prop',   deposited:'2026-05-11', amount:1_800_000, provider_locked:240_000, strategy_locked:0,       available_now:1_560_000 },
    { lot:'L-3092', strategy:'MN-Arb', deposited:'2026-05-12', amount:1_000_000, provider_locked:240_000, strategy_locked:0,       available_now:  760_000 },
  ],
};

// ── Firm PnL ────────────────────────────────────────────────────
const FIRM_PNL = {
  perf_fees_ytd:    1_840_400,
  mgmt_fees_ytd:      284_200,
  rebates_ytd:         48_400,
  funding_ytd:         84_200,
  liquidity_ytd:       18_400,
  undeployed:         420_400,
  deployed:         1_840_000,
  apy:              8.42,
  total_balance:    2_260_400,
  revenue_accounts: [
    { venue:'Binance',  account:'Firm-Revenue-01',  balance: 1_240_000, ccy:'USDC', last_sweep:'2026-05-08 06:00' },
    { venue:'OKX',      account:'Firm-Revenue-OK',  balance:   620_400, ccy:'USDC', last_sweep:'2026-05-05 06:00' },
    { venue:'Bybit',    account:'Firm-Revenue-BY',  balance:   240_000, ccy:'USDC', last_sweep:'2026-05-08 06:00' },
    { venue:'Coinbase', account:'Firm-Revenue-CB',  balance:   160_000, ccy:'USDC', last_sweep:'2026-05-08 06:00' },
  ],
  deployments: [
    { name:'Binance Earn · Flexible',  balance: 1_240_000, apy: 4.82, status:'active' },
    { name:'OKX Simple Earn · USDC',   balance:   480_000, apy: 5.14, status:'active' },
    { name:'LP · Curve 3pool',         balance:   120_000, apy:11.84, status:'active' },
  ],
};

// ── Bot triage detail ───────────────────────────────────────────
const BOT_WALLETS = {
  'prop-bot-01': [
    { wallet:'Binance · SPOT · USDT',  free: 1_240_000, required: 1_400_000, deficit: 160_000, status:'short' },
    { wallet:'Binance · PERP · USDT',  free:   840_000, required:   840_000, deficit: 0,       status:'ok' },
    { wallet:'Bybit · SPOT · USDT',    free:   620_000, required:   420_000, deficit: 0,       status:'ok' },
    { wallet:'Bybit · PERP · USDT',    free:   240_000, required:   480_000, deficit: 240_000, status:'short' },
    { wallet:'Deribit · PERP · USDC',  free:   140_000, required:   140_000, deficit: 0,       status:'ok' },
  ],
};
const BOT_ERRORS = {
  'prop-bot-01': [
    { source:'venue.binance', code:'INSUFFICIENT_MARGIN',  count: 8, consecutive:3, last:'14:32:08', message:'Account margin level below 1.10' },
    { source:'orchestrator',  code:'POSITION_LOCK_TIMEOUT', count: 4, consecutive:0, last:'14:18:42', message:'Lock held 18s, expected <5s' },
    { source:'venue.bybit',   code:'RATE_LIMIT',           count: 24,consecutive:0, last:'14:29:02', message:'429 from /v5/order' },
    { source:'data-recorder', code:'GAP_DETECTED',         count: 2, consecutive:0, last:'14:08:18', message:'Trade tape gap 4.2s' },
  ],
};
const BOT_LOCKS = {
  'prop-bot-01': [
    { ccy:'USDT', open_leg_notional: 4_240_000, locked_orders: 18, locked_amount: 480_000, oldest_lock:'00:18:42' },
    { ccy:'USDC', open_leg_notional:   840_000, locked_orders: 4,  locked_amount:  84_000, oldest_lock:'00:04:08' },
    { ccy:'BTC',  open_leg_notional:   240_000, locked_orders: 2,  locked_amount:  24_000, oldest_lock:'00:01:42' },
  ],
};

// ── Audit log ───────────────────────────────────────────────────
const AUDIT_LOG = [
  { t:'2026-05-12 14:18:42', actor:'emily.chen@kemely.fund',   role:'PM',         action:'transfer.approve',   target:'TXR-04829',  ip:'10.4.2.18',  result:'ok' },
  { t:'2026-05-12 14:08:12', actor:'yuki.tanaka@kemely.fund',  role:'RISK',       action:'drawdown_limit.edit',target:'Pool 3',     ip:'10.4.2.21',  result:'ok',   diff:'limit: −5.00% (no change)' },
  { t:'2026-05-12 13:42:08', actor:'firm-pnl (system)',        role:'SYSTEM',     action:'fee.distribute',     target:'Pool 1',     ip:'—',          result:'ok',   diff:'+$184,320 perf fee' },
  { t:'2026-05-12 13:18:09', actor:'aaron.doukas@kemely.fund', role:'OPS',        action:'bot.pause',          target:'prop-bot-01',ip:'10.4.2.42',  result:'ok' },
  { t:'2026-05-12 12:48:42', actor:'lina.pereira@kemely.fund', role:'COMPLIANCE', action:'investor.flag',      target:'INV-6612',   ip:'10.4.2.18',  result:'ok',   diff:'kyt-review' },
  { t:'2026-05-12 12:18:09', actor:'david.whitlow@kemely.fund',role:'ADMIN',      action:'api_key.rotate',     target:'key-04823',  ip:'10.4.2.10',  result:'ok' },
  { t:'2026-05-12 11:42:18', actor:'marcus.holm@kemely.fund',  role:'PM',         action:'fee_policy.edit',    target:'Pool 2',     ip:'10.4.2.31',  result:'ok',   diff:'perf: 25→25, mgmt: 2→2, hurdle: 4%→5%' },
  { t:'2026-05-12 10:18:08', actor:'sarah.kim@kemely.fund',    role:'SALES',      action:'investor.view',      target:'INV-1842',   ip:'10.4.2.51',  result:'ok' },
];

// ── System health (for new Admin Health sub-tab) ────────────────
const SERVICES = [
  { svc:'backend-fastapi',  status:'healthy', p50: 12, p99: 84,  uptime:'99.99%', cpu:0.18, mem:0.42, last_error:'—' },
  { svc:'orchestrator',     status:'healthy', p50:  8, p99: 42,  uptime:'99.98%', cpu:0.24, mem:0.38, last_error:'—' },
  { svc:'risk-core',        status:'healthy', p50:  4, p99: 18,  uptime:'99.99%', cpu:0.12, mem:0.28, last_error:'—' },
  { svc:'transfer-service', status:'healthy', p50: 14, p99: 92,  uptime:'99.97%', cpu:0.16, mem:0.34, last_error:'2026-05-10 04:12 · 502 from KYT provider' },
  { svc:'data-recorder',    status:'healthy', p50:  6, p99: 28,  uptime:'99.99%', cpu:0.38, mem:0.62, last_error:'—' },
  { svc:'kafka',            status:'healthy', p50:  2, p99: 12,  uptime:'100%',   cpu:0.32, mem:0.48, last_error:'—' },
  { svc:'pms',              status:'healthy', p50: 18, p99: 142, uptime:'99.99%', cpu:0.14, mem:0.32, last_error:'—' },
  { svc:'xbridge-connector',status:'degraded',p50:420, p99: 2400,uptime:'99.42%', cpu:0.74, mem:0.84, last_error:'2026-05-12 13:18 · Deribit feed lag 18s' },
];

// ── Saga timeline (recent events for a bot) ─────────────────────
const BOT_SAGAS = {
  'prop-bot-01': [
    { t:'14:32:18', kind:'order.fill',       desc:'BUY 0.42 BTC/USDT @ 67,820 · partial 0.18' },
    { t:'14:32:08', kind:'error',            desc:'INSUFFICIENT_MARGIN on Binance · margin 1.08'},
    { t:'14:31:48', kind:'order.submit',     desc:'SELL 0.42 BTC/USDT @ market · Bybit' },
    { t:'14:31:12', kind:'lock.acquire',     desc:'Position lock USDT held 18.4s' },
    { t:'14:30:42', kind:'rebalance',        desc:'Reallocated 240k USDT Bybit→Binance' },
    { t:'14:29:02', kind:'error',            desc:'RATE_LIMIT 429 from Bybit /v5/order' },
    { t:'14:28:42', kind:'order.fill',       desc:'SELL 1,240 USDT @ 1.0001 · Coinbase' },
    { t:'14:28:18', kind:'kill.signal',      desc:'Risk Committee pre-pause notice' },
    { t:'14:27:02', kind:'order.cancel',     desc:'CXL 3 working orders on Bybit' },
    { t:'14:26:42', kind:'wallet.deficit',   desc:'Bybit PERP USDT short 240k' },
  ],
};

const TRANSFERS_INFLIGHT = [
  { id:"TXR-04825", from:"Hot Wallet (ETH)", to:"OKX Master",        asset:"USDC", chain:"Ethereum", amount: 620_000, sig:"2-of-2", broadcast:"14:24:08", confirmations:7,  required:12, eta:"~3m", txhash:"0x4f82…a91d", status:"confirming" },
  { id:"TXR-04826", from:"Binance Sub-A01",  to:"Hot Wallet (TRON)", asset:"USDT", chain:"TRON",     amount: 240_000, sig:"2-of-2", broadcast:"14:21:32", confirmations:18, required:20, eta:"~30s", txhash:"TGfa…921k", status:"confirming" },
  { id:"TXR-04827", from:"Cold Storage",     to:"Hot Wallet (BTC)",  asset:"BTC",  chain:"Bitcoin",  amount: 12.4,    sig:"2-of-2", broadcast:"14:18:04", confirmations:2,  required:6,  eta:"~24m", txhash:"4b3c…f81e", status:"confirming" },
  { id:"TXR-04828", from:"Coinbase Prime",   to:"Hot Wallet (SOL)",  asset:"USDC", chain:"Solana",   amount:  84_000, sig:"single",  broadcast:"14:12:18", confirmations:32, required:32, eta:"finalising", txhash:"5pHm…q83x", status:"finalising" },
];
const TRANSFERS_RECENT = [
  { id:"TXR-04820", from:"Bybit Master",     to:"Hot Wallet (TRON)", asset:"USDT", chain:"TRON",     amount: 480_000, sig:"2-of-2", settled:"13:48:09", duration:"4m 12s", status:"settled" },
  { id:"TXR-04819", from:"Hot Wallet",       to:"OKX Sub-A12",       asset:"USDC", chain:"Ethereum", amount: 320_000, sig:"2-of-2", settled:"13:32:14", duration:"6m 38s", status:"settled" },
  { id:"TXR-04818", from:"Firm Sub-Acct",    to:"External 0x21..b4", asset:"USDC", chain:"Ethereum", amount:  42_000, sig:"2-of-2", settled:"12:08:42", duration:"5m 04s", status:"settled" },
  { id:"TXR-04817", from:"Binance Master",   to:"Strategy 1 treasury", asset:"USDT", chain:"TRON",   amount: 180_000, sig:"2-of-2", settled:"11:42:18", duration:"3m 21s", status:"settled" },
  { id:"TXR-04816", from:"OKX Master",       to:"Hot Wallet (ETH)",   asset:"USDC", chain:"Ethereum", amount:  98_000, sig:"single",  settled:"10:18:04", duration:"2m 48s", status:"settled" },
  { id:"TXR-04815", from:"Hot Wallet",       to:"External 0x91..2d",  asset:"USDT", chain:"TRON",     amount: 240_000, sig:"2-of-2", settled:"08:42:31", duration:"failed @ confirm", status:"failed" },
];

// ── Reconciliation findings (mirrors the real reconciler admin panel) ──────────
// Detect & alert only — never auto-corrects. 5 reconcilers: balance, intent, fee, lock, hot_wallet.
// severity: 'FAIL' (drift / invariant broken) or 'INFO' (heartbeat / all-clear).
const RECON_RECONCILERS = [
  { key:'balance',    label:'Balance',    every:'5m', findings:1, note:'1 FAIL unresolved' },
  { key:'intent',     label:'Intent',     every:'2m', findings:0, note:'all clear' },
  { key:'fee',        label:'Fee',        every:'15m',findings:0, note:'all clear' },
  { key:'lock',       label:'Lock',       every:'1m', findings:0, note:'all clear' },
  { key:'hot_wallet', label:'Hot Wallet', every:'5m', findings:0, note:'all clear' },
];
const RECON_FINDINGS = [
  { id:'RC-3493', finding_no:61517, when:'2026-06-02 09:41:13', severity:'FAIL', reconciler:'balance', pool:1, title:'Balance DRIFT (books > wallet — money missing) on pool 1 / Binance', code:'balance:pool:1:Binance:USDT', backend:99.7894, external:6.6427, delta:93.1466, resolution:null,
    detail:{ wallets:{ SPOT:'4.11786456', USDT_FUTURE:'2.52490430' }, sub_account_email:'candlehunter1_virtual@l11o6g4znoemail.com', bot_position_locked:'0', provider_locked_estimate:'0' } },
  { id:'RC-3492', finding_no:61516, when:'2026-06-02 09:41:13', severity:'INFO', reconciler:'balance', pool:3, title:'Balance OK on pool 3 / OKX', code:'balance:pool:3:OKX:USDT', backend:0, external:0, delta:0, resolution:null },
  { id:'RC-3491', finding_no:61515, when:'2026-06-02 09:41:13', severity:'INFO', reconciler:'lock', pool:null, title:'Lock invariants OK', code:'lock:heartbeat:ok', backend:0, external:0, delta:0, resolution:null },
  { id:'RC-3490', finding_no:61514, when:'2026-06-02 09:41:13', severity:'INFO', reconciler:'hot_wallet', pool:null, title:'No hot wallets registered', code:'hot_wallet:no_wallets', backend:0, external:0, delta:0, resolution:null },
  { id:'RC-3489', finding_no:61513, when:'2026-06-02 09:42:13', severity:'INFO', reconciler:'intent', pool:null, title:'Intent invariants OK', code:'intent:heartbeat:ok', backend:0, external:0, delta:0, resolution:null },
  { id:'RC-3488', finding_no:61512, when:'2026-06-02 09:42:13', severity:'INFO', reconciler:'lock', pool:null, title:'Lock invariants OK', code:'lock:heartbeat:ok', backend:0, external:0, delta:0, resolution:null },
  { id:'RC-3487', finding_no:61511, when:'2026-06-02 09:43:13', severity:'INFO', reconciler:'lock', pool:null, title:'Lock invariants OK', code:'lock:heartbeat:ok', backend:0, external:0, delta:0, resolution:null },
  { id:'RC-3486', finding_no:61510, when:'2026-06-02 09:44:13', severity:'INFO', reconciler:'intent', pool:null, title:'Intent invariants OK', code:'intent:heartbeat:ok', backend:0, external:0, delta:0, resolution:null },
  { id:'RC-3402', finding_no:61404, when:'2026-06-02 08:12:01', severity:'FAIL', reconciler:'fee', pool:2, title:'Fee accrual mismatch on pool 2 / Bybit', code:'fee:pool:2:Bybit:USDT', backend:1420.50, external:1418.20, delta:2.30, resolution:'retry queued',
    detail:{ accrued_books:'1420.50', accrued_venue:'1418.20', last_sweep:'2026-06-01 23:55 UTC', bot_position_locked:'0' } },
];

// Privileged-action audit events (24h) — anomalies & failures flagged.
const PRIVILEGED_ACTIONS_24H = { count: 38, prev: 24, anomalies: 2 };
const PRIVILEGED_EVENTS = [
  { t:'2026-06-02 09:18:42', actor:'ops-emily',    role:'OPS',   action:'transfer.approve',     target:'TXR-04830', result:'ok',     flag:'anomaly', note:'6th approval in 1h (avg 2)' },
  { t:'2026-06-02 08:54:11', actor:'system',       role:'SYSTEM',action:'api_key.auth_failed',  target:'key-04826', result:'failed', flag:'failed',  note:'Expired key used · Deribit' },
  { t:'2026-06-02 08:42:08', actor:'prop-bot-01',  role:'BOT',   action:'bot.kill_switch',      target:'prop-bot-01',result:'ok',    flag:'anomaly', note:'Manual kill outside schedule' },
  { t:'2026-06-02 07:12:33', actor:'marcus-holm',  role:'PM',    action:'fee_policy.edit',      target:'pool 2',    result:'failed', flag:'failed',  note:'Rejected — perf > 30% cap' },
];

Object.assign(window, {
  RECON_RECONCILERS, RECON_FINDINGS, PRIVILEGED_ACTIONS_24H, PRIVILEGED_EVENTS,
  ROLES, ROLE_LABEL,
  DEPOSIT_STAGES, WITHDRAW_STAGES, FUND_INTENTS, DEPOSIT_FLOWS, WITHDRAW_FLOWS,
  INVESTORS, INVESTOR_LOTS,
  FIRM_PNL,
  BOT_WALLETS, BOT_ERRORS, BOT_LOCKS, BOT_SAGAS,
  TRANSFERS_INFLIGHT, TRANSFERS_RECENT,
  AUDIT_LOG, SERVICES,
});
