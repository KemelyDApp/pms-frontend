/* KYC / KYB data model.
   Organization = the KYC'd legal entity or person. One Organization → many whitelisted wallets.
   Proof of wallet ownership = the sign-in signature when the wallet connects to the main app (self-hosted wallets only).
   Migration: every legacy investor (wallet) became its own Organization and must complete KYC; until approved it is view-only in the main app. */
(function () {
  const hx = (seed, n) => { let s = seed * 9301 + 49297, o = ''; for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; o += '0123456789abcdef'[Math.floor(s / 233280 * 16)]; } return o; };
  const addr = (seed, chain) => chain === 'Bitcoin' ? 'bc1q' + hx(seed, 38) : chain === 'Solana' ? ('7' + hx(seed, 43)).replace(/0/g, 'K') : '0x' + hx(seed, 40);
  const INV = window.INVESTORS || [];
  const invById = id => INV.find(i => i.id === id);

  const SEED = [
    { id: 'ORG-0101', inv: 'INV-1842', type: 'fund', juris: 'Cayman Islands', reg: 'MC-284113', lei: '5493001KJTIIGC8Y1R12', email: 'ops@strattoncap.com', status: 'approved', risk: 'medium', approvedAt: '2026-03-14', nextReview: '2027-03-14', migrated: true },
    { id: 'ORG-0102', inv: 'INV-2841', type: 'company', juris: 'Switzerland', reg: 'CHE-412.118.904', email: 'office@halberd-fo.ch', status: 'approved', risk: 'low', approvedAt: '2026-02-02', nextReview: '2027-02-02', migrated: true },
    { id: 'ORG-0103', inv: 'INV-1240', type: 'fund', juris: 'Cayman Islands', reg: 'MF-118204', email: 'compliance@polarismacro.com', status: 'in_review', risk: 'medium', submittedAt: '2026-10-19', reviewer: 'Sarah Okafor', migrated: true },
    { id: 'ORG-0104', inv: 'INV-3210', type: 'company', juris: 'Singapore', reg: '202114882K', email: 'admin@vectorquant.sg', status: 'approved', risk: 'low', approvedAt: '2025-11-08', nextReview: '2026-11-08', migrated: true },
    { id: 'ORG-0105', inv: 'INV-4821', type: 'company', juris: 'British Virgin Islands', reg: 'BVI-2048113', email: 'info@brightline.vg', status: 'info_requested', risk: 'high', submittedAt: '2026-10-09', requested: 'Certified UBO register — the copy provided is older than 12 months.', migrated: true },
    { id: 'ORG-0106', inv: 'INV-5132', type: 'individual', juris: 'United Kingdom', email: 'm.whitlow@proton.me', status: 'approved', risk: 'low', approvedAt: '2026-06-21', nextReview: '2027-06-21', migrated: true },
    { id: 'ORG-0107', inv: 'INV-7184', type: 'company', juris: 'United States (Delaware)', reg: 'DE-7718204', email: 'treasury@quillstark.com', status: 'second_approval', risk: 'high', submittedAt: '2026-10-14', reviewer: 'Sarah Okafor', firstApproval: 'Sarah Okafor · 20 Oct 2026', migrated: true },
    { id: 'ORG-0108', inv: 'INV-9201', type: 'trust', sub: 'Foundation', juris: 'Cayman Islands', reg: 'FC-41022', email: 'council@caldera.foundation', status: 'frozen', risk: 'high', approvedAt: '2026-01-30', nextReview: '2027-01-30', frozenReason: 'Adverse media — council member named in an exploit investigation (17 Oct 2026).', migrated: true },
    { id: 'ORG-0109', inv: 'INV-6612', type: 'individual', juris: 'Spain', email: 'breyes@gmail.com', status: 'draft', progress: 2, migrated: true },
    { id: 'ORG-0151', name: 'Northwind Digital Ltd', type: 'company', juris: 'Ireland', reg: 'IE-712204', email: 'finance@northwind.digital', status: 'submitted', submittedAt: '2026-10-21' },
    { id: 'ORG-0152', name: 'Kenji Tanaka', type: 'individual', juris: 'Japan', email: 'k.tanaka@icloud.com', status: 'in_review', risk: 'low', submittedAt: '2026-10-20', reviewer: 'Sarah Okafor' },
    { id: 'ORG-0153', name: 'Aster Ridge Trust', type: 'trust', juris: 'Jersey', email: 'trustees@asterridge.je', status: 'draft', progress: 3 },
  ];

  const KYC_DOC_REQ = {
    individual: ['Passport or national ID', 'Proof of address (< 3 months)', 'Liveness selfie', 'Source-of-wealth declaration', 'Tax residency self-certification'],
    company: ['Certificate of incorporation', 'Memorandum & articles', 'Register of directors', 'Register of shareholders / UBO chart', 'Proof of registered address (< 3 months)', 'Board resolution naming authorised signatories', 'Source-of-funds declaration'],
    fund: ['Certificate of registration', 'Offering memorandum / PPM', 'Fund administrator confirmation', 'Investment management agreement', 'Register of directors', 'Controlling persons / UBO chart', 'Board resolution naming authorised signatories', 'Source-of-funds declaration'],
    trust: ['Trust deed / foundation charter', 'Certificate of registration', 'Register of trustees / council', 'Settlor / founder ID', 'Protector & beneficiaries (≥ 25% or class)', 'Proof of address (< 3 months)', 'Source-of-funds declaration'],
  };
  const NAMES = ['Daniel Hart', 'Priya Raman', 'Lukas Meier', 'Amara Osei', 'Tomás Ibarra', 'Hannah Cole', 'Wei Zhang', 'Sofia Brandt', 'Omar Haddad', 'Julia Novak', 'Ravi Patel', 'Elena Rossi'];
  const peopleFor = (o, i) => {
    if (o.type === 'individual') return [{ name: o.name, role: 'Account holder', pct: 100 }];
    const n = k => NAMES[(i * 3 + k) % NAMES.length];
    if (o.type === 'trust') return [{ name: n(0), role: o.sub === 'Foundation' ? 'Council member' : 'Trustee' }, { name: n(1), role: o.sub === 'Foundation' ? 'Founder' : 'Settlor' }, { name: n(2), role: 'Beneficiary', pct: 40 }, { name: n(0), role: 'Authorised signatory' }];
    if (o.type === 'fund') return [{ name: n(0), role: 'Director' }, { name: n(1), role: 'Director' }, { name: n(2), role: 'Investment manager · controlling person' }, { name: n(1), role: 'Authorised signatory' }];
    return [{ name: n(0), role: 'Director & UBO', pct: 62 }, { name: n(1), role: 'UBO', pct: 26 }, { name: n(2), role: 'Director' }, { name: n(0), role: 'Authorised signatory' }];
  };

  const ORGS = SEED.map((s, i) => {
    const inv = s.inv ? invById(s.inv) : null;
    const o = { ...s, name: s.name || inv?.name || s.id, balance: inv?.balance || 0, strategies: inv?.strategies || 0 };
    if (o.type === 'individual' && inv) o.name = inv.name.replace(/ \(HNW\)/, '');
    const docs = KYC_DOC_REQ[o.type];
    o.docs = docs.map((d, k) => ({ name: d, st: o.status === 'draft' ? (k < o.progress ? 'ok' : 'missing') : o.status === 'info_requested' && /UBO|shareholders/.test(d) ? 'expired' : o.status === 'submitted' && k === docs.length - 1 ? 'pending' : 'ok' }));
    o.people = peopleFor(o, i).map(p => ({ ...p, st: ['approved', 'frozen', 'second_approval'].includes(o.status) ? 'ok' : o.status === 'draft' ? 'missing' : 'pending' }));
    return o;
  });

  // Wallets — one source of truth. Primary wallet = the one that connected to the main app and started onboarding.
  const W = [
    ['ORG-0101', 'EVM', 'Treasury Safe', 'active', 'Main app connect', 1], ['ORG-0101', 'EVM', 'Ops hot wallet', 'active', 'Linked by ops'], ['ORG-0101', 'EVM', 'New Safe (Q4)', 'cooldown', 'Linked by ops', 0, 31],
    ['ORG-0102', 'EVM', 'Main', 'active', 'Main app connect', 1], ['ORG-0102', 'Bitcoin', 'BTC cold', 'active', 'Linked by ops'], ['ORG-0102', 'EVM', 'Ledger #2', 'awaiting_email', 'Linked by ops'],
    ['ORG-0103', 'EVM', 'Fund wallet', 'pending_kyc', 'Main app connect', 1],
    ['ORG-0104', 'EVM', 'Main', 'active', 'Main app connect', 1], ['ORG-0104', 'EVM', 'Desk wallet', 'awaiting_connect', 'Linked by ops'],
    ['ORG-0105', 'EVM', 'Main', 'pending_kyc', 'Main app connect', 1],
    ['ORG-0106', 'EVM', 'Ledger', 'active', 'Main app connect', 1], ['ORG-0106', 'EVM', 'Exchange account', 'removed', 'Linked by ops', 0, 0, 'Exchange-hosted wallet — only self-hosted wallets can be whitelisted.'],
    ['ORG-0107', 'EVM', 'Firm Safe', 'pending_kyc', 'Main app connect', 1],
    ['ORG-0108', 'EVM', 'Treasury multisig', 'frozen', 'Main app connect', 1], ['ORG-0108', 'Solana', 'SOL ops', 'frozen', 'Linked by ops'],
    ['ORG-0109', 'EVM', 'MetaMask', 'pending_kyc', 'Main app connect', 1],
    ['ORG-0151', 'EVM', 'Primary', 'pending_kyc', 'Main app connect', 1],
    ['ORG-0152', 'EVM', 'Primary', 'pending_kyc', 'Main app connect', 1],
    ['ORG-0153', 'EVM', 'Primary', 'pending_kyc', 'Main app connect', 1],
    ['ORG-0106', 'EVM', 'Hardware #2', 'review', 'Linked by ops'],
    ['ORG-0101', 'EVM', 'Unknown sender', 'awaiting_email', 'Quarantined deposit'],
  ];
  const KYC_WALLETS = W.map(([org, chain, label, status, source, primary, cool, note], i) => ({
    id: 'W-' + (2400 + i), org, chain, label, status, source, primary: !!primary, coolLeft: cool || 0, note,
    addr: addr(i + 7, chain),
    sig: source === 'Main app connect' || ['review', 'active', 'cooldown', 'frozen'].includes(status) ? 'verified' : 'awaiting',
    email: source === 'Main app connect' || status === 'removed' ? 'n/a' : status === 'awaiting_email' ? 'awaiting' : 'confirmed',
    history: org === 'ORG-0108' ? 'flagged' : 'clean',
  }));

  const KYC_QUARANTINE = [
    { id: 'Q-118', time: '2026-10-21 09:12', amount: 250000, asset: 'USDC', chain: 'Ethereum', from: KYC_WALLETS[KYC_WALLETS.length - 1].addr, org: 'ORG-0101', status: 'whitelisting', walletId: KYC_WALLETS[KYC_WALLETS.length - 1].id },
    { id: 'Q-117', time: '2026-10-20 16:40', amount: 18400, asset: 'USDT', chain: 'TRON', from: 'T' + hx(91, 33), org: 'ORG-0109', status: 'held', note: 'Organization not yet KYC-approved' },
    { id: 'Q-116', time: '2026-10-19 11:05', amount: 4.2, asset: 'ETH', chain: 'Ethereum', from: addr(77, 'EVM'), org: null, status: 'returned', note: 'No matching Organization · returned to sender' },
  ];

  const KYC_CHECKLIST = (type) => [
    { id: 'entity', title: type === 'individual' ? 'Identity' : 'Entity verification', items: type === 'individual'
      ? ['ID document is genuine, valid and matches the applicant', 'Liveness selfie matches the ID photo', 'Proof of address is under 3 months old and matches the application']
      : ['Registration documents match the public registry', 'Registered address verified (document under 3 months)', 'Directors and authorised signatories match the board resolution', type === 'trust' ? 'Trustees / council, settlor and beneficiaries identified' : 'All UBOs ≥ 25% identified and the ownership chart is complete'] },
    ...(type === 'individual' ? [] : [{ id: 'people', title: 'People', items: ['Every UBO, director and signatory has a valid ID, liveness and proof of address'] }]),
    { id: 'screen', title: 'Screening', items: ['Sanctions lists checked (OFAC, EU, UN, UK HMT) — entity and all people', 'PEP check — none, or PEP documented with enhanced due diligence', 'Adverse media search — no material findings'] },
    { id: 'sof', title: 'Source of funds', items: ['Source of funds / wealth is plausible and evidenced'] },
    { id: 'wallet', title: 'Wallet', items: ['Main-app sign-in signature verified for the primary wallet', 'Wallet is self-hosted (not exchange-hosted)', 'On-chain history reviewed — no mixer, darknet or sanctioned exposure'] },
  ];

  Object.assign(window, { KYC_ORGS: ORGS, KYC_WALLETS, KYC_QUARANTINE, KYC_DOC_REQ, KYC_CHECKLIST });
})();
