/* Organizations — KYC'd entities that own whitelisted wallets.
   Hub: Organizations · KYC review · Wallet whitelisting · Quarantine.
   Review + approve actions require the `kyc.approve` scope. */

const KYC_TODAY = new Date('2026-10-21T12:00:00Z');
const KYC_ST = { draft: { l: 'Onboarding', k: '' }, submitted: { l: 'Submitted', k: 'info' }, in_review: { l: 'In review', k: 'info' }, info_requested: { l: 'Awaiting client', k: 'warn' }, second_approval: { l: '2nd approval', k: 'purple' }, approved: { l: 'Approved', k: 'pos' }, rejected: { l: 'Rejected', k: 'neg' }, frozen: { l: 'Frozen', k: 'neg' } };
const KYC_WST = { pending_kyc: { l: 'Waits for KYC', k: '' }, awaiting_email: { l: 'Awaiting signatory email', k: 'warn' }, awaiting_connect: { l: 'Awaiting wallet sign-in', k: 'warn' }, review: { l: 'In review', k: 'info' }, cooldown: { l: 'Cool-down', k: 'purple' }, active: { l: 'Whitelisted', k: 'pos' }, frozen: { l: 'Frozen', k: 'neg' }, removed: { l: 'Removed', k: 'neg' } };
const KYC_TYPE = { individual: 'Individual', company: 'Company', fund: 'Fund / SPV', trust: 'Trust / Foundation' };
const KYC_RISK = { low: 'pos', medium: 'warn', high: 'neg' };
const kycShort = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '—';
const kycDays = d => d ? Math.round((new Date(d + 'T12:00:00Z') - KYC_TODAY) / 864e5) : null;
const kycDate = d => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const kycAccess = (o, ws) => o.status === 'frozen' ? 'frozen' : o.status === 'approved' && ws.some(w => w.org === o.id && ['active', 'cooldown'].includes(w.status)) ? 'trading' : 'view';
const KYC_ACCESS = { trading: { l: 'Trading', k: 'pos' }, view: { l: 'View only', k: '' }, frozen: { l: 'Frozen', k: 'neg' } };
const kycTierLimits = () => { try { return JSON.parse(localStorage.getItem('pms.tierLimits') || '{}'); } catch (e) { return {}; } };

function KycPill({ map, v }) { const m = map[v] || { l: v, k: '' }; return <span className={`pms-pill ${m.k}`}>{m.l}</span>; }
function KycCheck({ st }) {
  const M = { ok: ['✓', 'pos'], pending: ['…', 'info'], missing: ['—', ''], expired: ['!', 'neg'], awaiting: ['…', 'warn'], verified: ['✓', 'pos'], confirmed: ['✓', 'pos'], 'n/a': ['n/a', ''], clean: ['clean', 'pos'], flagged: ['flagged', 'neg'] };
  const [t, k] = M[st] || [st, ''];
  return <span className={`kyc-chk ${k}`}>{t}</span>;
}

// ─── shared store ──────────────────────────────────────────────
function useKycStore() {
  const [orgs, setOrgs] = React.useState(() => window.KYC_ORGS.map(o => ({ ...o })));
  const [wallets, setWallets] = React.useState(() => window.KYC_WALLETS.map(w => ({ ...w })));
  const [quar, setQuar] = React.useState(() => window.KYC_QUARANTINE.map(q => ({ ...q })));
  const [log, setLog] = React.useState([]);
  const note = (org, text) => setLog(l => [{ org, text, at: new Date().toISOString().slice(11, 16) + ' UTC', by: 'Emily Chen' }, ...l]);
  const patchOrg = (id, p) => setOrgs(os => os.map(o => o.id === id ? { ...o, ...p } : o));
  const patchWallet = (id, p) => setWallets(ws => ws.map(w => w.id === id ? { ...w, ...p } : w));
  return { orgs, wallets, quar, log, note, patchOrg, patchWallet, setWallets, setQuar };
}

function OrgsHub({ sub, setSub, can }) {
  const S = useKycStore();
  const [openOrg, setOpenOrg] = React.useState(null);
  const [review, setReview] = React.useState(null);
  const [ledger, setLedger] = React.useState(null);
  const queue = S.orgs.filter(o => ['submitted', 'in_review', 'second_approval'].includes(o.status)).length;
  const wq = S.wallets.filter(w => ['awaiting_email', 'awaiting_connect', 'review'].includes(w.status)).length;
  const qn = S.quar.filter(q => q.status !== 'returned').length;
  const tabs = [
    { id: 'orgs', label: 'Organizations' },
    { id: 'review', label: 'KYC review', scope: 'kyc.approve', badge: queue ? { v: queue, kind: 'warn' } : null },
    { id: 'wallets', label: 'Wallet whitelisting', scope: 'kyc.approve', badge: wq ? { v: wq } : null },
    { id: 'quarantine', label: 'Quarantine', badge: qn ? { v: qn, kind: 'warn' } : null },
  ];
  const openReview = id => { setReview(id); setOpenOrg(null); setSub('review'); };
  const openProfile = id => { setOpenOrg(id); setReview(null); setSub('orgs'); };
  if (ledger) { const inv = (window.INVESTORS || []).find(i => i.id === ledger); if (inv) return <InvestorDetailPage inv={inv} onClose={() => setLedger(null)}/>; }
  return (
    <Hub tabs={tabs} sub={sub} setSub={v => { setSub(v); setOpenOrg(null); setReview(null); }} can={can}>
      {cur => (
        <div className="kyc">
          {cur === 'orgs' && (openOrg
            ? <OrgProfile S={S} id={openOrg} can={can} onBack={() => setOpenOrg(null)} onReview={openReview} onLedger={setLedger}/>
            : <OrgsList S={S} onOpen={setOpenOrg}/>)}
          {cur === 'review' && (review
            ? <KycReviewScreen S={S} id={review} onBack={() => setReview(null)} onProfile={openProfile}/>
            : <KycReviewQueue S={S} onOpen={setReview}/>)}
          {cur === 'wallets' && <WalletQueue S={S} onProfile={openProfile}/>}
          {cur === 'quarantine' && <QuarantineView S={S} can={can} onProfile={openProfile} onWallets={() => setSub('wallets')}/>}
        </div>
      )}
    </Hub>
  );
}

// ─── list ──────────────────────────────────────────────────────
function OrgsList({ S, onOpen }) {
  const [f, setF] = React.useState('all');
  const { orgs, wallets } = S;
  const due = o => o.status === 'approved' && kycDays(o.nextReview) <= 30;
  const FILTERS = [
    { id: 'all', l: 'All', test: () => true },
    { id: 'review', l: 'Needs review', test: o => ['submitted', 'in_review', 'second_approval'].includes(o.status), k: 'info' },
    { id: 'client', l: 'Waiting on client', test: o => ['draft', 'info_requested'].includes(o.status), k: 'warn' },
    { id: 'approved', l: 'Approved', test: o => o.status === 'approved', k: 'pos' },
    { id: 'due', l: 'Re-KYC ≤ 30 days', test: due, k: 'warn' },
    { id: 'frozen', l: 'Frozen', test: o => o.status === 'frozen', k: 'neg' },
  ];
  const rows = orgs.filter(FILTERS.find(x => x.id === f).test);
  const mig = orgs.filter(o => o.migrated), migDone = mig.filter(o => ['approved', 'frozen'].includes(o.status)).length;
  return (
    <>
      <div className="pms-page-head">
        <div><h1>Organizations</h1><div className="sub">KYC'd entities and people · each Organization owns one or more whitelisted wallets · onboarding happens in the main app, review happens here</div></div>
      </div>
      <div className="kyc-banner info">
        <b>Migration</b><span>{mig.length} legacy investors became Organizations · {migDone} KYC complete · {mig.length - migDone} still view-only in the main app until approved</span>
        <span className="bar"><i style={{ width: (migDone / mig.length * 100) + '%' }}></i></span>
      </div>
      <div className="kyc-filters">
        {FILTERS.map(x => {
          const n = orgs.filter(x.test).length;
          return <button key={x.id} className={`kyc-filter ${f === x.id ? 'active' : ''}`} onClick={() => setF(x.id)}><span className="l">{x.l}</span><span className={`n ${n && x.k ? x.k : ''}`}>{n}</span></button>;
        })}
      </div>
      <div className="pms-card">
        <div className="pms-card-head">{FILTERS.find(x => x.id === f).l}<div className="label-meta">click a row to open the profile</div></div>
        <SortableTable rowKey={r => r.id} onRowClick={r => onOpen(r.id)}
          columns={[
            { key: 'name', label: 'Organization', render: r => <div className="kyc-org"><b>{r.name}</b><span className="pms-mono">{r.id}{r.migrated ? ' · migrated' : ' · new'}</span></div> },
            { key: 'type', label: 'Type', render: r => <div className="kyc-org"><span style={{ color: 'var(--fg-1)', fontSize: 11.5 }}>{r.sub || KYC_TYPE[r.type]}</span><span>{r.juris}</span></div> },
            { key: 'status', label: 'KYC', render: r => <KycPill map={KYC_ST} v={r.status}/> },
            { key: 'risk', label: 'Risk', render: r => r.risk ? <span className={`pms-pill ${KYC_RISK[r.risk]}`}>{r.risk}</span> : <span className="muted">—</span> },
            { key: 'w', label: 'Wallets', num: true, sortValue: r => wallets.filter(w => w.org === r.id).length, render: r => { const ws = wallets.filter(w => w.org === r.id && w.status !== 'removed'); return <span className="pms-mono">{ws.filter(w => w.status === 'active').length}<span className="muted"> / {ws.length}</span></span>; } },
            { key: 'access', label: 'Main app', render: r => <KycPill map={KYC_ACCESS} v={kycAccess(r, wallets)}/> },
            { key: 'balance', label: 'Balance', num: true, sortValue: r => r.balance, render: r => r.balance ? <span className="strong">{fmt.usd(r.balance, { compact: true })}</span> : <span className="muted">—</span> },
            { key: 'next', label: 'Next review', sortValue: r => r.nextReview || 'z', render: r => { const d = kycDays(r.nextReview); return r.nextReview ? <span className={`pms-mono text-xs ${d <= 30 ? 'pms-warn' : 'muted'}`}>{kycDate(r.nextReview)}{d <= 30 ? ` · ${d}d` : ''}</span> : <span className="muted">—</span>; } },
          ]}
          rows={rows}/>
      </div>
    </>
  );
}

// ─── profile ───────────────────────────────────────────────────
const KYC_STEPS = ['Wallet signed in', 'Entity details', 'People', 'Documents', 'Source of funds', 'Submitted', 'Compliance review', 'Approved', '48h cool-down', 'Trading'];
function kycStepIndex(o, ws) {
  if (o.status === 'draft') return 1 + (o.progress || 0);
  if (['submitted'].includes(o.status)) return 5;
  if (['in_review', 'info_requested', 'second_approval'].includes(o.status)) return 6;
  if (o.status === 'approved') return ws.some(w => w.org === o.id && w.status === 'active') ? 9 : 8;
  return 7;
}

function OrgProfile({ S, id, can, onBack, onReview, onLedger }) {
  const o = S.orgs.find(x => x.id === id);
  const ws = S.wallets.filter(w => w.org === id);
  const [tab, setTab] = React.useState('overview');
  const [modal, setModal] = React.useState(null);
  const [wTarget, setWTarget] = React.useState(null);
  const ops = can('kyc.approve');
  const access = kycAccess(o, S.wallets);
  const step = kycStepIndex(o, S.wallets);
  const lim = kycTierLimits()[o.risk] || {};
  const myLog = S.log.filter(l => l.org === id);
  const BASE_LOG = [
    o.status === 'frozen' && { at: '17 Oct 2026', by: 'Sarah Okafor', text: 'Organization frozen · ' + o.frozenReason },
    o.approvedAt && { at: kycDate(o.approvedAt), by: 'Sarah Okafor', text: `KYC approved · risk ${o.risk}` },
    o.firstApproval && { at: '20 Oct 2026', by: 'Sarah Okafor', text: 'First approval recorded · waiting for a second officer (high risk)' },
    o.requested && { at: kycDate(o.submittedAt), by: 'Sarah Okafor', text: 'Information requested · ' + o.requested },
    o.submittedAt && { at: kycDate(o.submittedAt), by: 'Client', text: 'KYC submitted from the main app' },
    o.migrated && { at: '01 Oct 2026', by: 'System', text: 'Migrated from legacy investor ' + o.inv + ' · KYC required' },
    { at: o.migrated ? '01 Oct 2026' : kycDate(o.submittedAt), by: 'Client', text: `Primary wallet ${kycShort(ws.find(w => w.primary)?.addr)} connected and signed in` },
  ].filter(Boolean);
  const doFreeze = reason => { S.patchOrg(id, { status: 'frozen', frozenReason: reason, prevStatus: o.status }); ws.forEach(w => ['active', 'cooldown', 'review'].includes(w.status) && S.patchWallet(w.id, { status: 'frozen', prev: w.status })); S.note(id, 'Organization frozen · ' + reason); };
  const doUnfreeze = reason => { S.patchOrg(id, { status: o.prevStatus || 'approved', frozenReason: null }); ws.forEach(w => w.status === 'frozen' && S.patchWallet(w.id, { status: w.prev || 'active' })); S.note(id, 'Organization unfrozen · ' + reason); };
  const doRekyc = reason => { S.patchOrg(id, { status: 'info_requested', requested: reason }); S.note(id, 'Re-KYC forced · ' + reason); };
  const reviewable = ['submitted', 'in_review', 'second_approval'].includes(o.status);
  return (
    <>
      <button className="kyc-back" onClick={onBack}>← Organizations</button>
      <div className="kyc-head">
        <div className="kyc-head-main">
          <div className="kyc-head-t"><h1>{o.name}</h1><KycPill map={KYC_ST} v={o.status}/>{o.risk && <span className={`pms-pill ${KYC_RISK[o.risk]}`}>{o.risk} risk</span>}<KycPill map={KYC_ACCESS} v={access}/></div>
          <div className="kyc-head-m">
            <span className="pms-mono">{o.id}</span><span>{o.sub || KYC_TYPE[o.type]}</span><span>{o.juris}</span>
            {o.reg && <span>Reg. <b className="pms-mono">{o.reg}</b></span>}{o.lei && <span>LEI <b className="pms-mono">{o.lei}</b></span>}
            <span>Registered email <b>{o.email}</b></span>
          </div>
        </div>
        {ops && <div className="pms-page-actions">
          {reviewable && <button className="pms-btn primary" onClick={() => onReview(id)}>{o.status === 'second_approval' ? 'Give 2nd approval' : 'Open review'}</button>}
          {['approved', 'frozen'].includes(o.status) && <button className="pms-btn ghost" onClick={() => setModal('rekyc')}>Force re-KYC</button>}
          {o.status === 'frozen' ? <button className="pms-btn" onClick={() => setModal('unfreeze')}>Unfreeze</button> : <button className="pms-btn danger" onClick={() => setModal('freeze')}>Freeze organization</button>}
        </div>}
      </div>
      {o.status === 'frozen' && <div className="kyc-banner neg"><b>Frozen</b><span>{o.frozenReason}</span><span className="muted">Withdrawals and new deposits blocked · existing positions keep running</span></div>}
      {o.status === 'info_requested' && <div className="kyc-banner warn"><b>Waiting on client</b><span>{o.requested}</span></div>}

      <div className="kyc-steps">
        {KYC_STEPS.map((s, i) => <div key={s} className={`kyc-step ${i < step ? 'done' : i === step ? 'cur' : ''} ${o.status === 'frozen' && i === step ? 'neg' : ''}`}><span className="d">{i < step ? '✓' : i + 1}</span><span className="l">{s}</span></div>)}
      </div>

      <div className="pms-seg kyc-tabs">
        {[['overview', 'Overview'], ['people', `People · ${o.people.length}`], ['docs', `Documents · ${o.docs.filter(d => d.st === 'ok').length}/${o.docs.length}`], ['wallets', `Wallets · ${ws.filter(w => w.status !== 'removed').length}`], ['inv', 'Investments'], ['activity', 'Activity']].map(([k, l]) =>
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'overview' && (
        <div className="kyc-grid2">
          <div className="pms-card"><div className="pms-card-head">KYC case</div><div className="pms-card-body kyc-dl">
            <div><span>Status</span><KycPill map={KYC_ST} v={o.status}/></div>
            <div><span>Submitted</span><b>{kycDate(o.submittedAt)}</b></div>
            <div><span>Reviewer</span><b>{o.reviewer || '—'}</b></div>
            <div><span>Approved</span><b>{kycDate(o.approvedAt)}</b></div>
            <div><span>Next annual review</span><b className={kycDays(o.nextReview) <= 30 ? 'pms-warn' : ''}>{kycDate(o.nextReview)}{o.nextReview ? ` · in ${kycDays(o.nextReview)}d` : ''}</b></div>
            <div><span>Risk tier</span>{o.risk ? <span className={`pms-pill ${KYC_RISK[o.risk]}`}>{o.risk}</span> : <b>Set at review</b>}</div>
            <div><span>Withdrawal limit</span><b className="pms-mono">{lim.wd ? fmt.usd(+lim.wd) + ' / month' : 'No limit set'}</b></div>
            <div><span>Deposit limit</span><b className="pms-mono">{lim.dep ? fmt.usd(+lim.dep) + ' / month' : 'No limit set'}</b></div>
          </div></div>
          <div className="pms-card"><div className="pms-card-head">Main-app access<div className="label-meta">what this Organization can do right now</div></div><div className="pms-card-body kyc-dl">
            {[['View balances & positions', true], ['Deposit', access === 'trading'], ['Trade / invest in strategies', access === 'trading'], ['Withdraw to whitelisted wallets', access === 'trading' && ws.some(w => w.status === 'active')], ['Existing positions keep running', access !== 'view' || o.balance > 0]].map(([k, ok]) =>
              <div key={k}><span>{k}</span><b className={ok ? 'pms-pos' : 'pms-neg'}>{ok ? '✓ allowed' : '✕ blocked'}</b></div>)}
            <div className="kyc-note">{access === 'view' ? 'View only until KYC is approved and a wallet is whitelisted.' : access === 'frozen' ? 'Frozen by compliance. Positions run; money cannot move in or out.' : ws.some(w => w.status === 'cooldown') ? 'A new wallet is in its 48h cool-down — withdrawals to it unlock when it ends.' : 'Fully enabled.'}</div>
          </div></div>
        </div>
      )}

      {tab === 'people' && (
        <div className="pms-card"><div className="pms-card-head">People<div className="label-meta">UBOs ≥ 25%, directors and authorised signatories · each is checked individually</div></div>
          <div className="pms-card-body flush"><table className="pms-table">
            <thead><tr><th>Name</th><th>Role</th><th className="num">Ownership</th><th>ID</th><th>Liveness</th><th>Proof of address</th><th>Sanctions / PEP</th></tr></thead>
            <tbody>{o.people.map((p, i) => <tr key={i}><td className="strong">{p.name}</td><td className="text-xs">{p.role}</td><td className="num pms-mono">{p.pct ? p.pct + '%' : '—'}</td>{[0, 1, 2, 3].map(k => <td key={k}><KycCheck st={p.st}/></td>)}</tr>)}</tbody>
          </table></div></div>
      )}

      {tab === 'docs' && (
        <div className="pms-card"><div className="pms-card-head">Documents<div className="label-meta">required for {KYC_TYPE[o.type]} · uploaded by the client in the main app</div></div>
          <div className="pms-card-body flush"><table className="pms-table">
            <thead><tr><th>Document</th><th>Status</th><th></th></tr></thead>
            <tbody>{o.docs.map(d => <tr key={d.name}><td>{d.name}</td><td><KycCheck st={d.st}/> <span className="text-xs muted">{{ ok: 'verified', pending: 'uploaded · not reviewed', missing: 'not uploaded', expired: 'expired · re-upload requested' }[d.st]}</span></td><td className="num">{d.st !== 'missing' && <button className="pms-btn ghost text-xs">View</button>}</td></tr>)}</tbody>
          </table></div></div>
      )}

      {tab === 'wallets' && (
        <div className="pms-card"><div className="pms-card-head">Wallets<div className="label-meta">self-hosted only · ownership proven by the main-app sign-in signature</div><span className="spacer"></span>
          {ops && ['approved'].includes(o.status) && <button className="pms-btn primary text-xs" onClick={() => setModal('link')}>+ Link wallet</button>}</div>
          <div className="pms-card-body flush"><table className="pms-table">
            <thead><tr><th>Wallet</th><th>Chain</th><th>Label</th><th>Added via</th><th>Signature</th><th>Signatory email</th><th>Status</th><th></th></tr></thead>
            <tbody>{ws.map(w => <tr key={w.id} className={w.status === 'removed' ? 'dim' : ''}>
              <td className="pms-mono text-xs" title={w.addr}>{kycShort(w.addr)}{w.primary && <span className="pms-pill" style={{ marginLeft: 6, fontSize: 9 }}>primary</span>}</td>
              <td><span className="pms-pill">{w.chain}</span></td><td className="text-xs">{w.label}</td><td className="text-xs muted">{w.source}</td>
              <td><KycCheck st={w.sig}/></td><td><KycCheck st={w.email}/></td>
              <td><KycPill map={KYC_WST} v={w.status}/>{w.status === 'cooldown' && <span className="text-xs muted"> · {w.coolLeft}h left</span>}{w.note && <div className="text-xs muted" style={{ marginTop: 3 }}>{w.note}</div>}</td>
              <td className="num">{ops && ['active', 'cooldown'].includes(w.status) && <div className="kyc-acts"><button className="pms-btn ghost text-xs" onClick={() => { setWTarget(w); setModal('wfreeze'); }}>Freeze</button><button className="pms-btn ghost text-xs" onClick={() => { setWTarget(w); setModal('wremove'); }}>Remove</button></div>}
                {ops && w.status === 'frozen' && o.status !== 'frozen' && <button className="pms-btn ghost text-xs" onClick={() => { S.patchWallet(w.id, { status: 'active' }); S.note(id, 'Wallet unfrozen · ' + kycShort(w.addr)); }}>Unfreeze</button>}</td>
            </tr>)}</tbody>
          </table></div></div>
      )}

      {tab === 'inv' && (
        <div className="pms-card"><div className="pms-card-head">Investments<span className="spacer"></span>{o.inv && <button className="pms-btn ghost text-xs" onClick={() => onLedger(o.inv)}>Open investor ledger →</button>}</div>
          <div className="pms-card-body kyc-dl">
            <div><span>Balance</span><b className="pms-mono">{o.balance ? fmt.usd(o.balance) : '—'}</b></div>
            <div><span>Strategies</span><b>{o.strategies || '—'}</b></div>
            <div><span>Legacy investor record</span><b className="pms-mono">{o.inv || 'none · new Organization'}</b></div>
            <div className="kyc-note">Balances roll up across every wallet owned by this Organization.</div>
          </div></div>
      )}

      {tab === 'activity' && (
        <div className="pms-card"><div className="pms-card-head">Activity<div className="label-meta">KYC and whitelisting events · audit log</div></div>
          <div className="pms-card-body kyc-tl">{[...myLog, ...BASE_LOG].map((e, i) => <div key={i}><span className="pms-mono muted">{e.at}</span><b>{e.by}</b><span>{e.text}</span></div>)}</div></div>
      )}

      <KycLinkWalletModal open={modal === 'link'} org={o} onClose={() => setModal(null)} onDone={w => { S.setWallets(x => [...x, w]); S.note(id, `Wallet ${kycShort(w.addr)} linked · confirmation email sent to ${o.email}`); }}/>
      <ConfirmModal open={modal === 'freeze'} title={`Freeze ${o.name}`} tone="danger" confirmLabel="Freeze organization" requireReason onClose={() => setModal(null)} onConfirm={doFreeze}
        body={<>All wallets of this Organization are frozen. <b>Withdrawals and new deposits are blocked; existing positions keep running.</b></>}
        impact={[{ k: 'Wallets frozen', v: ws.filter(w => ['active', 'cooldown', 'review'].includes(w.status)).length }, { k: 'Withdrawals', v: 'blocked' }, { k: 'New deposits', v: 'blocked' }, { k: 'Open positions', v: 'keep running' }, { k: 'Balance', v: fmt.usd(o.balance, { compact: true }) }]}/>
      <ConfirmModal open={modal === 'unfreeze'} title={`Unfreeze ${o.name}`} tone="warn" confirmLabel="Unfreeze" requireReason onClose={() => setModal(null)} onConfirm={doUnfreeze}
        body={<>Restores the previous KYC status and re-enables all wallets that were frozen with the Organization.</>}/>
      <ConfirmModal open={modal === 'rekyc'} title="Force re-KYC" tone="danger" confirmLabel="Request re-KYC" requireReason onClose={() => setModal(null)} onConfirm={doRekyc}
        body={<>The client must re-submit KYC in the main app. <b>Main-app access drops to view only until re-approved.</b> The reason is shown to the client.</>}
        impact={[{ k: 'Main app', v: 'view only' }, { k: 'Open positions', v: 'keep running' }, { k: 'Notified', v: o.email }]}/>
      <ConfirmModal open={modal === 'wfreeze'} title="Freeze wallet" tone="danger" confirmLabel="Freeze wallet" requireReason onClose={() => setModal(null)}
        onConfirm={r => { S.patchWallet(wTarget.id, { status: 'frozen', prev: wTarget.status }); S.note(id, `Wallet ${kycShort(wTarget.addr)} frozen · ${r}`); }}
        body={<>Withdrawals to and deposits from <span className="pms-mono">{kycShort(wTarget?.addr)}</span> are blocked. Other wallets of this Organization are not affected.</>}/>
      <ConfirmModal open={modal === 'wremove'} title="Remove from whitelist" tone="danger" confirmLabel="Remove wallet" requireReason onClose={() => setModal(null)}
        onConfirm={r => { S.patchWallet(wTarget.id, { status: 'removed', note: r }); S.note(id, `Wallet ${kycShort(wTarget.addr)} removed from whitelist · ${r}`); }}
        body={<>The wallet <span className="pms-mono">{kycShort(wTarget?.addr)}</span> is removed. Re-adding it requires the full linking flow and a new 48h cool-down.</>}/>
    </>
  );
}

function KycLinkWalletModal({ open, org, onClose, onDone }) {
  const [f, setF] = React.useState({ addr: '', chain: 'EVM', label: '', kind: 'self' });
  React.useEffect(() => { if (open) setF({ addr: '', chain: 'EVM', label: '', kind: 'self' }); }, [open]);
  const ok = f.addr.trim().length > 20 && f.kind === 'self';
  return (
    <FormModal open={open} title={`Link wallet to ${org.name}`} onClose={onClose} submitLabel="Link & send confirmation" canSubmit={ok}
      subtitle="Use this when an approved Organization asks to add another wallet. A wallet that connects to the main app on its own always starts a new onboarding."
      onSubmit={() => onDone({ id: 'W-' + Date.now().toString().slice(-4), org: org.id, chain: f.chain, label: f.label || 'Linked wallet', addr: f.addr.trim(), status: 'awaiting_email', source: 'Linked by ops', sig: 'awaiting', email: 'awaiting', history: 'clean' })}
      note={`Confirmation email sent to ${org.email}. The wallet then signs in on the main app, compliance approves, and a 48h cool-down starts.`}>
      <FormRow>
        <FormField label="Chain" required><FormSelect value={f.chain} onChange={v => setF({ ...f, chain: v })} options={['EVM', 'Solana', 'Bitcoin']}/></FormField>
        <FormField label="Label"><FormInput value={f.label} onChange={v => setF({ ...f, label: v })} placeholder="e.g. Treasury Safe"/></FormField>
      </FormRow>
      <FormField label="Wallet address" required><FormInput value={f.addr} onChange={v => setF({ ...f, addr: v })} placeholder="0x…" mono/></FormField>
      <FormField label="Wallet type" required error={f.kind === 'exchange' ? 'Exchange-hosted wallets cannot be whitelisted — they cannot sign the main-app sign-in.' : null}>
        <FormSeg value={f.kind} onChange={v => setF({ ...f, kind: v })} options={[{ v: 'self', l: 'Self-hosted' }, { v: 'exchange', l: 'Exchange-hosted' }]}/>
      </FormField>
      <div className="kyc-flow">
        {['Authorised signatory confirms by email from ' + org.email, 'Wallet connects and signs in on the main app', 'Compliance approves', '48h cool-down, then whitelisted'].map((s, i) => <div key={i}><span>{i + 1}</span>{s}</div>)}
      </div>
    </FormModal>
  );
}

Object.assign(window, { OrgsHub, KycPill, KycCheck, kycShort, kycDays, kycDate, kycAccess, KYC_ST, KYC_WST, KYC_TYPE, KYC_RISK, KYC_ACCESS });
