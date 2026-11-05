/* KYC / KYB data — v2, shaped on the pm-system brief (M9c reads).
   Rows key on refs (ORG-0001, W-0001, Q-0001). No organization has a display name:
   names are encrypted, so every screen falls back to the primary wallet address.
   Statuses, wallet fields and quarantine fields follow the backend reads. */
(function () {
  const TODAY = '2026-10-24';
  const rnd = s => { let x = s * 9301 + 49297; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
  const evm = seed => { const r = rnd(seed); let o = '0x'; for (let i = 0; i < 40; i++) { const c = '0123456789abcdef'[Math.floor(r() * 16)]; o += /[a-f]/.test(c) && r() > 0.5 ? c.toUpperCase() : c; } return o; };
  const ref = (p, n) => p + '-' + String(n).padStart(4, '0');

  const OFFICERS = { 'U-0001': 'Emily Chen', 'U-0004': 'Sarah Okafor', 'U-0007': 'Marco Ruiz' };
  const ME = 'U-0001';

  // [n, type, status, risk, submitted, approved, nextReview, migrated, extra]
  const SEED = [
    [1, 'fund', 'approved', 'medium', '2026-03-10', '2026-03-14', '2027-03-14', true],
    [2, 'company', 'approved', 'low', '2025-11-02', '2025-11-08', '2026-11-08', true],
    [3, 'fund', 'in_review', null, '2026-10-19', null, null, true, { claimed_by: 'U-0004', pep: true }],
    [4, 'company', 'approved', 'low', '2025-11-14', '2025-11-20', '2026-11-20', true],
    [5, 'company', 'info_requested', 'high', '2026-10-09', null, null, true, { info_reason: 'document_expired' }],
    [6, 'individual', 'approved', 'low', '2026-06-18', '2026-06-21', '2027-06-21', true],
    [7, 'company', 'second_approval', 'high', '2026-10-14', null, null, true, { claimed_by: 'U-0004', first_approver: 'U-0004', first_at: '2026-10-20 15:42', pep: true }],
    [8, 'trust', 'frozen', 'high', '2026-01-24', '2026-01-30', '2027-01-30', true, { frozen_prev: 'approved', freeze_code: 'adverse_media', sub: 'foundation' }],
    [9, 'individual', 'draft', null, null, null, null, true, { draft_progress: 2 }],
    [10, 'company', 'submitted', null, '2026-10-22', null, null, false],
    [11, 'individual', 'in_review', null, '2026-10-21', null, null, false, { claimed_by: 'U-0001' }],
    [12, 'trust', 'draft', null, null, null, null, false, { draft_progress: 3 }],
    [13, 'individual', 'draft', null, null, null, null, true, { empty: true }],
    [14, 'company', 'draft', null, null, null, null, true, { empty: true }],
    [15, 'company', 'rejected', null, '2026-09-28', null, null, false, { reject_code: 'ownership_unclear' }],
    [16, 'company', 'submitted', 'medium', '2026-10-20', '2025-10-30', '2026-10-30', true, { review_kind: 'annual' }],
    [17, 'individual', 'dissolved', null, null, null, null, true, { dissolved_into: 'ORG-0001' }],
    [18, 'fund', 'approved', 'high', '2026-07-01', '2026-07-04', '2027-07-04', false, { review_kind: 'forced_done' }],
  ];

  const ROLES_BY_TYPE = {
    individual: [['account_holder', 100]],
    company: [['director', null], ['ubo', 62], ['ubo', 26], ['signatory', null]],
    fund: [['director', null], ['director', null], ['ubo', 40], ['signatory', null]],
    trust: [['trustee', null], ['settlor', null], ['protector', null], ['beneficiary', 40], ['signatory', null]],
  };
  const FOUNDATION_ROLES = [['council_member', null], ['founder', null], ['beneficiary', 40], ['signatory', null]];
  const PEOPLE_NAMES = ['Daniel Hart', 'Priya Raman', 'Lukas Meier', 'Amara Osei', 'Tomás Ibarra', 'Hannah Cole', 'Wei Zhang', 'Sofia Brandt', 'Omar Haddad', 'Julia Novak', 'Ravi Patel', 'Elena Rossi'];

  const DOC_TYPES = {
    individual: ['passport', 'proof_of_address', 'liveness', 'source_of_wealth', 'tax_self_cert'],
    company: ['certificate_of_incorporation', 'articles', 'register_of_directors', 'ubo_register', 'proof_of_address', 'board_resolution', 'source_of_funds'],
    fund: ['certificate_of_registration', 'offering_memorandum', 'administrator_confirmation', 'register_of_directors', 'ubo_register', 'board_resolution', 'source_of_funds'],
    trust: ['trust_deed', 'certificate_of_registration', 'register_of_trustees', 'settlor_id', 'proof_of_address', 'source_of_funds'],
  };
  const MIME = ['application/pdf', 'application/pdf', 'image/jpeg', 'application/pdf', 'image/png'];

  const orgs = SEED.map(([n, type, kyc_status, risk_tier, submitted_at, approved_at, next_review_at, migrated, x = {}]) => {
    const o = { id: n, ref: ref('ORG', n), type, sub: x.sub || null, kyc_status, risk_tier, submitted_at, approved_at, next_review_at, migrated,
      claimed_by: x.claimed_by || null, first_approver: x.first_approver || null, first_at: x.first_at || null,
      review_kind: x.review_kind === 'annual' ? 'annual' : x.review_kind === 'forced' ? 'forced' : 'initial',
      frozen_prev: x.frozen_prev || null, freeze_code: x.freeze_code || null, reject_code: x.reject_code || null, info_reason: x.info_reason || null,
      dissolved_into: x.dissolved_into || null, empty: !!x.empty, revision: 7 + n };
    const roles = type === 'trust' && o.sub === 'foundation' ? FOUNDATION_ROLES : ROLES_BY_TYPE[type];
    const checked = ['approved', 'frozen', 'second_approval', 'rejected'].includes(kyc_status);
    o.people = o.empty || kyc_status === 'dissolved' ? [] : roles.map(([role, pct], i) => ({
      id: ref('P', n * 10 + i), role, ownership_pct: pct, name: PEOPLE_NAMES[(n * 3 + i) % PEOPLE_NAMES.length],
      pep: !!x.pep && i === 1,
      checks: ['check_id', 'check_liveness', 'check_address', 'check_screening'].map((c, k) =>
        kyc_status === 'draft' ? (i < (x.draft_progress || 0) && k < 2 ? 'ok' : 'pending')
        : checked ? (role === 'beneficiary' && k === 1 ? 'n/a' : 'ok')
        : k === 3 && x.pep && i === 1 ? 'failed' : k === 2 && i === 2 ? 'pending' : 'ok'),
    }));
    const docs = DOC_TYPES[type];
    o.docs = o.empty || kyc_status === 'dissolved' ? [] : docs.map((d, k) => {
      let status = 'verified';
      if (kyc_status === 'draft') status = k < (x.draft_progress || 0) ? 'uploaded' : 'missing';
      else if (['submitted', 'in_review'].includes(kyc_status)) status = k === docs.length - 1 ? 'uploaded' : k === 0 ? 'verified' : 'uploaded';
      else if (kyc_status === 'info_requested' && /ubo_register|proof_of_address/.test(d)) status = 'expired';
      const issued = status === 'missing' ? null : `202${k % 2 ? 5 : 6}-0${(k % 8) + 1}-1${k % 9}`;
      return { doc_type: d, status, issued_at: issued, expires_at: /passport|proof_of_address|ubo_register/.test(d) && issued ? (status === 'expired' ? '2026-09-30' : '2027-0' + ((k % 8) + 1) + '-1' + (k % 9)) : null,
        reviewed_at: ['verified', 'expired'].includes(status) ? (approved_at || submitted_at) : null, mime: MIME[k % MIME.length], size_kb: 180 + ((n * 37 + k * 91) % 2400) };
    });
    if (n === 4) o.docs[4] = { ...o.docs[4], status: 'expired', expires_at: '2026-10-12' };
    return o;
  });

  // Wallets — EVM only in v1. source: main_app | ops_link | quarantine
  // [org, status, primary, source, sig, email, history, cooldown_ends_at]
  const WS = [
    [1, 'active', 1, 'main_app', 'verified', 'n/a', 'clean'], [1, 'active', 0, 'ops_link', 'verified', 'confirmed', 'clean'], [1, 'cooldown', 0, 'ops_link', 'verified', 'confirmed', 'clean', '2026-10-25 18:00'],
    [2, 'active', 1, 'main_app', 'verified', 'n/a', 'clean'], [2, 'awaiting_email', 0, 'ops_link', 'awaiting', 'awaiting', 'unreviewed'],
    [3, 'pending_kyc', 1, 'main_app', 'verified', 'n/a', 'unreviewed'],
    [4, 'active', 1, 'main_app', 'verified', 'n/a', 'clean'], [4, 'awaiting_connect', 0, 'ops_link', 'awaiting', 'confirmed', 'unreviewed'],
    [5, 'pending_kyc', 1, 'main_app', 'verified', 'n/a', 'clean'],
    [6, 'active', 1, 'main_app', 'verified', 'n/a', 'clean'], [6, 'removed', 0, 'ops_link', 'awaiting', 'n/a', 'unreviewed'], [6, 'review', 0, 'ops_link', 'verified', 'confirmed', 'unreviewed'],
    [7, 'pending_kyc', 1, 'main_app', 'verified', 'n/a', 'clean'], [18, 'review', 0, 'ops_link', 'verified', 'confirmed', 'clean'],
    [8, 'frozen', 1, 'main_app', 'verified', 'n/a', 'flagged'], [8, 'frozen', 0, 'ops_link', 'verified', 'confirmed', 'clean'],
    [9, 'pending_kyc', 1, 'main_app', 'verified', 'n/a', 'unreviewed'],
    [10, 'pending_kyc', 1, 'main_app', 'verified', 'n/a', 'unreviewed'],
    [11, 'pending_kyc', 1, 'main_app', 'verified', 'n/a', 'unreviewed'],
    [12, 'pending_kyc', 1, 'main_app', 'verified', 'n/a', 'unreviewed'],
    [13, 'pending_kyc', 1, 'main_app', 'verified', 'n/a', 'unreviewed'],
    [14, 'pending_kyc', 1, 'main_app', 'verified', 'n/a', 'unreviewed'],
    [15, 'removed', 1, 'main_app', 'verified', 'n/a', 'unreviewed'],
    [16, 'active', 1, 'main_app', 'verified', 'n/a', 'clean'],
    [1, 'active', 0, 'ops_link', 'verified', 'confirmed', 'clean'],
    [18, 'active', 1, 'main_app', 'verified', 'n/a', 'clean'], [18, 'frozen', 0, 'ops_link', 'verified', 'confirmed', 'clean'],
    [2, 'review', 0, 'quarantine', 'verified', 'confirmed', 'clean'],
  ];
  const wallets = WS.map(([org, status, primary, source, sig, email, hist, cool], i) => ({
    ref: ref('W', i + 1), org: ref('ORG', org), address: evm(i + 11), chain_family: 'evm', status, is_primary: !!primary, source,
    signature_status: sig, signatory_email_status: email, onchain_history: hist, cooldown_ends_at: cool || null,
    frozen_self: org === 18 && status === 'frozen', first_approver: null,
  }));
  wallets[13].first_approver = 'U-0001'; // high-risk org: you gave the 1st wallet approval
  orgs.forEach(o => {
    const ws = wallets.filter(w => w.org === o.ref);
    o.wallet_count = ws.filter(w => w.status !== 'removed').length;
    o.primary_wallet_ref = ws.find(w => w.is_primary)?.ref || null;
  });
  orgs.find(o => o.ref === 'ORG-0017').primary_wallet_ref = null;

  // Quarantine — only `held` occurs before M9e
  const quarantine = [
    { ref: 'Q-0001', received_at: '2026-10-23 09:12', tx_hash: '0x' + evm(301).slice(2) + evm(302).slice(2, 26), network_code: 'ETH', coin: 'USDC', amount: 250000, verified_amount: 250000, observed_from_address: evm(303), observed_via: 'chain_scan', sender_verified: true, to_deposit_address: evm(401), org: 'ORG-0002', status: 'held', reason: 'sender_not_whitelisted' },
    { ref: 'Q-0002', received_at: '2026-10-22 16:40', tx_hash: '0x' + evm(311).slice(2) + evm(312).slice(2, 26), network_code: 'ARB', coin: 'USDT', amount: 18400, verified_amount: 18400, observed_from_address: evm(313), observed_via: 'kafka', sender_verified: false, to_deposit_address: evm(402), org: 'ORG-0009', status: 'held', reason: 'org_not_approved' },
    { ref: 'Q-0003', received_at: '2026-10-21 11:05', tx_hash: '0x' + evm(321).slice(2) + evm(322).slice(2, 26), network_code: 'ETH', coin: 'ETH', amount: 4.2, verified_amount: 4.2, observed_from_address: evm(323), observed_via: 'chain_scan', sender_verified: true, to_deposit_address: evm(401), org: null, status: 'held', reason: 'no_organization' },
    { ref: 'Q-0004', received_at: '2026-10-20 08:31', tx_hash: '0x' + evm(331).slice(2) + evm(332).slice(2, 26), network_code: 'ETH', coin: 'USDC', amount: 92000, verified_amount: 92000, observed_from_address: wallets[14].address, observed_via: 'kafka', sender_verified: false, to_deposit_address: evm(403), org: 'ORG-0008', status: 'held', reason: 'org_frozen' },
  ];

  // Activity — codes, refs and status changes only. No free text.
  const ev = (at, event, actor, from, to, subject) => ({ at, event, actor, from, to, subject });
  const activity = {
    'ORG-0001': [ev('2026-10-23 14:10', 'wallet.cooldown_started', 'U-0004', 'review', 'cooldown', 'W-0003'), ev('2026-10-02 10:00', 'org.dissolved_into', 'U-0001', null, null, 'ORG-0017'), ev('2026-03-14 11:20', 'org.approved', 'U-0004', 'in_review', 'approved'), ev('2026-03-10 09:02', 'org.submitted', 'client', 'draft', 'submitted'), ev('2026-10-01 00:00', 'org.migrated', 'system', null, 'draft')],
    'ORG-0003': [ev('2026-10-20 08:14', 'org.claimed', 'U-0004', 'submitted', 'in_review'), ev('2026-10-19 17:40', 'org.submitted', 'client', 'draft', 'submitted'), ev('2026-10-01 00:00', 'org.migrated', 'system', null, 'draft')],
    'ORG-0005': [ev('2026-10-11 10:12', 'org.info_requested', 'U-0004', 'in_review', 'info_requested'), ev('2026-10-09 15:20', 'org.submitted', 'client', 'draft', 'submitted')],
    'ORG-0007': [ev('2026-10-20 15:42', 'org.first_approval', 'U-0004', 'in_review', 'second_approval'), ev('2026-10-15 09:30', 'org.claimed', 'U-0004', 'submitted', 'in_review'), ev('2026-10-14 12:05', 'org.submitted', 'client', 'draft', 'submitted')],
    'ORG-0008': [ev('2026-10-17 16:05', 'org.frozen', 'U-0004', 'approved', 'frozen'), ev('2026-10-17 16:05', 'wallet.frozen', 'U-0004', 'active', 'frozen', 'W-0015'), ev('2026-10-17 16:05', 'wallet.frozen', 'U-0004', 'active', 'frozen', 'W-0016'), ev('2026-01-30 10:00', 'org.approved', 'U-0007', 'second_approval', 'approved')],
    'ORG-0015': [ev('2026-10-02 12:00', 'org.rejected', 'U-0007', 'in_review', 'rejected'), ev('2026-10-02 12:00', 'wallet.removed', 'U-0007', 'pending_kyc', 'removed', 'W-0023')],
    'ORG-0018': [ev('2026-10-19 09:40', 'wallet.frozen', 'U-0001', 'active', 'frozen', 'W-0027'), ev('2026-07-04 10:00', 'org.approved', 'U-0004', 'in_review', 'approved')],
  };

  // Review ticks (who + when) for cases already in review
  const ticks = {
    'ORG-0007': 'all:U-0004:2026-10-20 15:30',
    'ORG-0003': 'entity0,entity1,entity2,entity3,people0,sof0:U-0004:2026-10-21 10:12',
  };

  // Settings (view-only until M9c). gating_mode: off | shadow | enforce_new | enforce
  const settings = {
    whitelist_cooldown_hours: 48, kyc_review_interval_months: 12, kyc_review_sla_days: 3, signatory_confirm_ttl_hours: 72, kyc_gating_mode: 'shadow',
  };
  const overrides = [{ key: 'kyc_gating_mode:org:8', org: 'ORG-0008', mode: 'enforce', set_by: 'U-0004', set_at: '2026-10-17 16:06', stamped: true }];
  const shadow = { day: '2026-10-23', deposit_check: 3, deposit_address: 1, invest: 4, withdraw: 2, subjects: 6 };

  // Draft reason-code lists — no catalogue exists yet (open question 2)
  const REASON_CODES = {
    freeze: ['sanctions_hit', 'adverse_media', 'law_enforcement_request', 'suspicious_activity', 'client_request'],
    unfreeze: ['investigation_closed', 'false_positive', 'client_request'],
    wallet_freeze: ['compromised_key', 'suspicious_activity', 'client_request'],
    wallet_unfreeze: ['investigation_closed', 'false_positive'],
    remove: ['client_request', 'compromised_key', 'ownership_unproven', 'exchange_hosted'],
    rekyc: ['document_expired', 'ownership_change', 'risk_change', 'adverse_media'],
    dissolve: ['duplicate_draft', 'merged_by_client'],
    request_info: ['document_expired', 'document_unreadable', 'missing_document', 'ubo_unclear'],
    reject: ['incomplete_documents', 'ownership_unclear', 'sanctions_hit', 'unsupported_jurisdiction', 'fraud_suspected'],
    wallet_reject: ['ownership_unproven', 'flagged_history', 'exchange_hosted'],
    return: ['no_organization', 'client_request', 'org_rejected'],
  };

  // Fund-flow KYC examples (v2 only): a held deposit and a KYC-cancelled withdrawal, detected by failure_reason prefix
  if (window.PMS_V2 && window.FUND_INTENTS) {
    window.FUND_INTENTS.push(
      { id: 'FI-D-04216', dir: 'deposit', user: 'INV-6612', amount: 18400, asset: 'USDT', chain: 'Arbitrum', strategy: 'MN-Arb', stage: 'D3_CONFIRMED', age: '01:42:10', kyt: 9, conf: 20, provider: 'OK', unlock_eta: '—', failure_reason: 'KYC hold (org_not_approved): funds held for review' },
      { id: 'FI-W-08849', dir: 'withdraw', user: 'INV-9201', amount: 412000, asset: 'USDC', chain: 'Ethereum', strategy: 'Prop', stage: 'W_FAIL', failed: true, age: '06:12:40', kyt: 18, conf: 0, provider: '—', unlock_eta: '—', failure_reason: 'Cancelled: account access changed (org_frozen); nothing was sent' },
    );
    const w = window.FUND_INTENTS.find(i => i.id === 'FI-W-08848'); if (w) w.kyc_refused = true;
  }

  Object.assign(window, {
    KYC2: { TODAY, ME, OFFICERS, orgs, wallets, quarantine, activity, ticks, settings, overrides, shadow, REASON_CODES },
    // keep v1 globals populated so the sidebar badge, bell and Overview keep counting
    KYC_ORGS: orgs.map(o => ({ ...o, id: o.ref, status: o.kyc_status, risk: o.risk_tier, nextReview: o.next_review_at, submittedAt: o.submitted_at })),
    KYC_WALLETS: wallets.map(w => ({ ...w, id: w.ref })),
    KYC_QUARANTINE: quarantine,
  });
})();
