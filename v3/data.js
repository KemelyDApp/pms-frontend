/* v3 mock data — shaped on apps/pm-system/src/types/*. Values are illustrative. */
(function () {
  const rnd = s => { let x = s; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
  const ROLES = [
    { id: 'admin', name: 'admin', scopes: '*', locked: true, member_count: 2 },
    { id: 'pm', name: 'portfolio manager', scopes: ['strategies', 'research', 'trading', 'fundflow', 'investors', 'recon', 'finance'], locked: false, member_count: 3 },
    { id: 'ops', name: 'operations', scopes: ['strategies', 'research', 'trading', 'fundflow', 'fundflow.approve', 'recon', 'admin.health'], locked: false, member_count: 2 },
    { id: 'compliance', name: 'compliance', scopes: ['investors', 'kyc.approve', 'fundflow', 'fundflow.approve', 'recon', 'admin.audit'], locked: false, member_count: 1 },
  ];
  const SCOPES = [
    ['strategies', 'Strategies', false], ['strategies.write', 'Strategies · write', true], ['research', 'TradeSim Hub', false], ['trading', 'Trading', false],
    ['investors', 'Organizations & investors', false], ['kyc.approve', 'KYC approve', true], ['fundflow', 'Fund flow', false], ['fundflow.approve', 'Fund flow · approve', true],
    ['recon', 'Reconciliation', false], ['finance', 'Finance', false], ['admin', 'Admin', true, ['admin.users', 'admin.settings', 'admin.health', 'admin.audit']],
    ['admin.users', 'Users & roles', true], ['admin.settings', 'Settings', true], ['admin.health', 'System health', false], ['admin.audit', 'Audit log', false],
  ].map(([id, label, step_up, implies]) => ({ id, label, step_up, implies }));
  const hasScope = (scopes, need) => {
    if (!need) return true;
    if (scopes === '*') return true;
    const list = Array.isArray(need) ? need : [need];
    return list.some(n => scopes.includes(n) || (n.startsWith('admin.') && scopes.includes('admin')));
  };

  const STRATS = [
    { id: 1, name: 'Funding Arb · Binance', category: 'Funding arbitrage', nav: 8420000, apy: 18.4, pnl: 61240, dd: -1.12, dd_limit: 3, bot_status: 'active', bot_id: 'fa-bnb-01' },
    { id: 2, name: 'Funding Arb · OKX', category: 'Funding arbitrage', nav: 5110000, apy: 16.9, pnl: 34810, dd: -0.84, dd_limit: 3, bot_status: 'active', bot_id: 'fa-okx-01' },
    { id: 3, name: 'Basis Carry · Bybit', category: 'Spot–perp basis', nav: 3260000, apy: 12.1, pnl: -4120, dd: -2.71, dd_limit: 3, bot_status: 'warning', bot_id: 'bc-byb-01' },
    { id: 4, name: 'Cross-venue MM', category: 'Market making', nav: 2140000, apy: 9.7, pnl: 9930, dd: -0.43, dd_limit: 2, bot_status: 'idle', bot_id: null },
  ];
  const series = (n, start, drift, vol, seed) => { const r = rnd(seed); let v = start; const out = []; for (let i = n - 1; i >= 0; i--) { v = v * (1 + drift + (r() - 0.5) * vol); const d = new Date(Date.UTC(2026, 10, 5) - i * 864e5); out.push({ date: d.toISOString().slice(0, 10), value: Math.round(v) }); } return out; };
  const pnlSeries = (n, seed) => { const r = rnd(seed); const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(Date.UTC(2026, 10, 5) - i * 864e5); out.push({ date: d.toISOString().slice(0, 10), value: Math.round((r() - 0.32) * 42000) }); } return out; };
  const SPAN_DAYS = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 };
  const metrics = span => {
    const d = SPAN_DAYS[span], k = d / 7;
    const nav = series(Math.max(d, 2) * (d === 1 ? 12 : 1), 18200000, 0.0018 / (d === 1 ? 12 : 1), 0.006, 7 + d);
    const pnl = pnlSeries(Math.max(d, 2), 11 + d);
    const gross = pnl.reduce((s, p) => s + p.value, 0);
    return {
      span,
      performance: { total_aum: { value: 18930000, delta_pct: +(0.9 * k).toFixed(1) }, gross_pnl: { value: gross, delta_abs: Math.round(gross * 0.18) }, win_rate: { value: 68 }, nav_series: nav, pnl_series: pnl, strategies_in_dd: { value: 1 }, dd_limit_label: '3%' },
      strategies: { rows: STRATS.map(s => ({ ...s, pnl: Math.round(s.pnl * k) })), active_sagas: { value: 7 }, sagas_in_error: { value: 1 }, venues_degraded: { value: 1 } },
      trading: { total_trades: { value: Math.round(412 * k), delta_pct: 6 }, fill_rate: { value: 97.4 }, gross_notional: { value: 12640000 }, open_positions: { value: 23 }, unrealized_pnl: { value: 18420 }, trades_per_strategy: STRATS.map((s, i) => ({ strategy_id: s.id, label: s.name, value: Math.round([188, 131, 64, 29][i] * k) })) },
      investors: { total_investors: { value: 46 }, combined_balance: { value: 17840000 }, withdrawable: { value: 9120000 }, locked_total: { value: 8720000 }, investors_below_hwm: { value: 4 } },
      organizations: { by_status: { draft: 4, submitted: 2, in_review: 1, info_requested: 1, second_approval: 1, approved: 31, rejected: 1, frozen: 1, dissolved: 1 }, needs_review: 4, waiting_on_client: 5, review_due_30d: 3, sla_breached: 1, quarantine_held: 2, gating_mode: 'shadow', org_overrides: 1, would_block_today: 3, would_block_7d: 17, gate_top_7d: [{ point: 'deposit_check', code: 'kyc_not_approved', outcome: 'would_block', n: 9 }, { point: 'withdraw', code: 'wallet_not_active', outcome: 'would_block', n: 5 }] },
      fundflow: { settled_in_period: { value: Math.round(1840000 * k), delta_pct: 12 }, deposits_in_flight: { value: 3 }, withdrawals_in_flight: { value: 2 }, notional_in_flight: { value: 612000 }, avg_settle_hrs: { value: 2.4 }, awaiting_approval: { count: 2, amount: 268000 } },
      recon: { open: { total: 14, by_severity: { info: 6, warn: 5, fail: 2, critical: 1 }, actionable: 3, last_full_run_at: '2026-11-05T15:40:00Z' } },
      finance: { revenue_by_type: [{ type: 'PERFORMANCE_FEE', label: 'Performance fees', value: Math.round(41200 * k) }, { type: 'MANAGEMENT_FEE', label: 'Management fees', value: Math.round(7300 * k) }, { type: 'TXN_FEE_SPREAD', label: 'Txn fee spread', value: Math.round(2140 * k) }], revenue_in_period: { value: Math.round(50640 * k), delta_pct: 8 }, firm_balance: { value: 384200 } },
      keys: { keys_attention: { value: 2 }, team_members: { value: 8, roles: 4 } },
      audit: { privileged_actions_24h: { count: 37, anomalies: 1 }, audit_events_today: { value: 214 } },
      health: { services_degraded: { value: 1 } },
    };
  };
  const ATTENTION = [
    { kind: 'recon_fail', tone: 'crit', scope: 'recon', count: 3, title: 'Reconciliation breaks need action', subtitle: '1 critical · 2 FAIL', link: { page: 'recon', sub: null } },
    { kind: 'dd_breach', tone: 'crit', scope: 'strategies', count: 1, title: 'Strategy near drawdown limit', subtitle: 'Basis Carry · Bybit −2.71% / 3%', link: { page: 'strategies', sub: 'list' } },
    { kind: 'awaiting_approval', tone: 'warn', scope: 'fundflow.approve', count: 2, title: 'Transfers awaiting approval', subtitle: null, amount: 268000, link: { page: 'fundflow', sub: 'approvals' } },
    { kind: 'flag', tone: 'warn', scope: 'kyc.approve', count: 4, title: 'KYC cases to review', subtitle: '1 needs 2nd approval · 1 past SLA', link: { page: 'investors', sub: 'kyc' } },
    { kind: 'service_error', tone: 'warn', scope: 'admin.health', count: 1, title: 'Service degraded', subtitle: 'xbridge-connector · 14m', link: { page: 'admin', sub: 'admin' } },
    { kind: 'key_expiring', tone: 'info', scope: 'admin', count: 2, title: 'API keys to rotate', subtitle: 'oldest 212 days', link: { page: 'admin', sub: 'admin' } },
  ];
  const NOTIFS = [
    { id: 1, level: 'critical', title: 'Recon FAIL · balance drift', body: 'Binance · sub-acct fa-bnb-01 · USDT −93.15', age: 240, read: false, link: '/recon' },
    { id: 2, level: 'critical', title: 'Drawdown near limit', body: 'Basis Carry · Bybit at −2.71% of 3%', age: 600, read: false, link: '/strategies/3' },
    { id: 3, level: 'warning', title: 'Transfer awaiting approval', body: 'TR-0418 · $212,000 USDC → Binance', age: 900, read: false, link: '/fundflow/approvals' },
    { id: 4, level: 'warning', title: 'KYC case past SLA', body: 'ORG-0005 · submitted 4 days ago', age: 3600, read: false, link: '/investors/kyc' },
    { id: 5, level: 'info', title: 'Full reconciliation finished', body: '412 checks · 3 new findings', age: 4600, read: true, link: '/recon' },
    { id: 6, level: 'info', title: 'Role updated', body: 'compliance · +admin.audit · 1 user affected', age: 9200, read: true, link: '/admin/roles' },
  ];
  const TSHUB = { recorder: { status: 'ok', streams: 14, shards: [22, 24] }, loops: { ok: 5, total: 6, bad: 'delistings_scan stale 18m' }, best: { pair: 'Binance BTCUSDT', score: 2.84 }, carry: { pair: 'OKX ETH-USDT', pct: 14.2 }, sims: 18400, window: '24h' };
  const NAV_BADGES = { organizations: { value: 4, kind: 'warn' }, fundflow: { value: 2, kind: 'warn' }, recon: { value: 3, kind: 'neg' } };
  window.V3 = { ROLES, SCOPES, hasScope, STRATS, metrics, ATTENTION, NOTIFS, TSHUB, NAV_BADGES, series, pnlSeries, rnd,
    USER: { display_name: 'emily chen', address: '0x7a3fC21e9B0d44A1c8E2f5B6a9D03e1C4b52E8f1', role: 'admin', totp_enabled: true, wallet: 'MetaMask' } };
})();
