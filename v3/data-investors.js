/* Investors = wallets. Each whitelisted wallet of an Organization is one investor account
   with its own balance, allocation and activity. Derived from KYC2.wallets (sample data). */
(function () {
  const K = window.KYC2, S = window.V3.STRATS;
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const orgOf = ref => K.orgs.find(o => o.ref === ref);
  const FUNDED = ['active', 'frozen', 'pending_kyc'];
  const access = (o, w) => w.status === 'removed' ? 'removed' : (w.status === 'frozen' || o.kyc_status === 'frozen') ? 'frozen' : (o.kyc_status === 'approved' && w.status === 'active') ? 'trading' : 'view_only';
  const day = n => { const d = new Date('2026-11-05T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
  const hhmm = () => String(Math.floor(rnd() * 24)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0');

  const list = K.wallets.map((w, i) => {
    const o = orgOf(w.org), acc = access(o, w);
    const funded = FUNDED.includes(w.status) && (w.status !== 'pending_kyc' || o.migrated);
    const balance = funded ? Math.round((120000 + rnd() * 2200000) / 1000) * 1000 : 0;
    const lockedPct = acc === 'frozen' ? 1 : 0.15 + rnd() * 0.35;
    const k = funded ? 1 + Math.floor(rnd() * 3) : 0;
    const picks = S.slice().sort(() => rnd() - 0.5).slice(0, k);
    let left = 100; const alloc = picks.map((s, j) => { const p = j === k - 1 ? left : Math.round(left * (0.45 + rnd() * 0.3)); left -= p; return [s.id, s.name, p]; });
    const pnl30 = funded ? Math.round(balance * (rnd() * 0.035 - 0.006)) : 0;
    const pnlItd = funded ? Math.round(balance * (0.04 + rnd() * 0.12)) : 0;
    const inv = { id: 4201 + i, ref: 'INV-' + (4201 + i), wallet: w.ref, address: w.address, org: o.ref, orgId: o.id, orgStatus: o.kyc_status, walletStatus: w.status, is_primary: w.is_primary, source: w.source,
      access: acc, balance, withdrawable: acc === 'frozen' ? 0 : Math.round(balance * (1 - lockedPct)), locked: acc === 'frozen' ? balance : Math.round(balance * lockedPct), pnl30, pnlItd, alloc,
      deposited: funded ? Math.round((balance - pnlItd) / 1000) * 1000 : 0 };

    // activity: money + access events, newest first
    const ev = [];
    const push = (d, kind, amount, dir, strat, ref, status, note) => ev.push({ at: day(d) + ' ' + hhmm(), kind, amount, dir, asset: kind === 'DEPOSIT' || kind === 'WITHDRAW' || kind === 'DEPOSIT_HELD' ? (rnd() > 0.4 ? 'USDC' : 'USDT') : 'USDT', chain: ['DEPOSIT', 'WITHDRAW', 'DEPOSIT_HELD'].includes(kind) ? 'Ethereum' : null, strat, ref, status, note });
    if (funded) {
      const s0 = alloc[0][0];
      push(0, 'PNL', Math.abs(Math.round(pnl30 / 22)) || 420, pnl30 >= 0 ? 'in' : 'out', s0, 'pnl-' + day(0), 'SUCCESS');
      if (acc === 'trading' && rnd() > 0.5) push(1, 'WITHDRAW', Math.round(balance * 0.04 / 1000) * 1000, 'out', s0, '0x' + (i * 7919).toString(16).padStart(4, '0') + '…' + (i * 31).toString(16).padStart(4, '0'), 'PENDING');
      push(4, 'MANAGEMENT_FEE', Math.round(balance * 0.02 / 12), 'out', s0, 'mgmt-2026-10', 'SUCCESS');
      push(5, 'PERFORMANCE_FEE', Math.round(Math.max(pnlItd, 0) * 0.04), 'out', s0, 'perf-2026-10', 'SUCCESS');
      if (alloc[1]) push(9, 'STRATEGY_CHANGE', Math.round(balance * alloc[1][2] / 100 / 1000) * 1000, 'move', alloc[1][0], 'sc-' + (300 + i), 'SUCCESS', S.find(s => s.id === s0).name + ' → ' + alloc[1][1]);
      push(14, 'DEPOSIT', Math.round(balance * 0.3 / 1000) * 1000, 'in', s0, '0x' + (i * 4421).toString(16).padStart(4, '0') + '…' + (i * 97).toString(16).padStart(4, '0'), 'SUCCESS');
      push(40, 'DEPOSIT', Math.round(balance * 0.7 / 1000) * 1000, 'in', s0, '0x' + (i * 1907).toString(16).padStart(4, '0') + '…' + (i * 13).toString(16).padStart(4, '0'), 'SUCCESS');
    }
    if (acc === 'view_only' && w.status === 'pending_kyc') push(2, 'DEPOSIT_BLOCKED', null, null, null, 'org_not_approved', 'BLOCKED');
    if (w.source === 'quarantine') push(3, 'DEPOSIT_HELD', 48000, 'in', null, 'Q-00' + (i % 9 + 1), 'HELD');
    if (acc === 'frozen') push(6, 'FROZEN', null, null, null, w.frozen_self ? 'wallet' : 'organization', 'BLOCKED');
    push(1, 'SIGN_IN', null, null, null, 'main app', 'SUCCESS');
    push(funded ? 60 : 8, 'WALLET_LINKED', null, null, null, w.source, 'SUCCESS');
    ev.sort((a, b) => b.at.localeCompare(a.at));
    inv.activity = ev.map((e, j) => ({ ...e, id: inv.ref + '-' + j, inv: inv.ref, invId: inv.id, address: w.address }));
    inv.last = inv.activity[0];
    return inv;
  });
  window.V3INV = { list, byId: id => list.find(x => String(x.id) === String(id)), byOrg: ref => list.filter(x => x.org === ref) };
})();
