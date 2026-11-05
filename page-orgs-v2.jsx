/* Organizations v2 — built on the pm-system KYC/KYB brief (M9c).
   Rows key on refs; names are encrypted, so the primary wallet address stands in.
   Sub-tabs: List · KYC queue · Wallet whitelisting · Quarantine. */

const K2 = window.KYC2;
const K2_TONE = { neutral: '', info: 'info', warning: 'warn', critical: 'neg', success: 'pos' };
const K2_ORG = { draft: ['neutral', 'Draft'], submitted: ['info', 'Submitted'], in_review: ['info', 'In review'], info_requested: ['warning', 'Info requested'], second_approval: ['warning', '2nd approval'], approved: ['success', 'Approved'], rejected: ['critical', 'Rejected'], frozen: ['critical', 'Frozen'], dissolved: ['neutral', 'Dissolved'] };
const K2_WAL = { pending_kyc: ['neutral', 'Awaiting KYC'], awaiting_email: ['info', 'Awaiting signatory email'], awaiting_connect: ['info', 'Awaiting sign-in'], review: ['info', 'In review'], cooldown: ['warning', 'Cooling down'], active: ['success', 'Active'], frozen: ['critical', 'Frozen'], removed: ['neutral', 'Removed'] };
const K2_SIG = { awaiting: ['warning', 'Awaiting'], verified: ['success', 'Verified'] };
const K2_EMAIL = { 'n/a': ['neutral', 'n/a'], awaiting: ['warning', 'Awaiting'], confirmed: ['success', 'Confirmed'] };
const K2_HIST = { unreviewed: ['neutral', 'Unreviewed'], clean: ['success', 'Clean'], flagged: ['critical', 'Flagged'] };
const K2_RISK = { low: ['success', 'Low'], medium: ['warning', 'Medium'], high: ['critical', 'High'] };
const K2_MODE = { off: ['neutral', 'Off', 'Only freezes refuse.'], shadow: ['info', 'Shadow', 'Only freezes refuse; other refusals are counted.'], enforce_new: ['warning', 'Enforce new', 'Full rules, except legacy accounts never approved are only counted.'], enforce: ['success', 'Enforce', 'Full rules.'], invalid: ['critical', 'Invalid', 'Setting missing or bad; enforced as enforce.'] };
const K2_TYPE = { individual: 'Individual', company: 'Company', fund: 'Fund / SPV', trust: 'Trust / Foundation' };
const K2_KIND = { initial: ['neutral', 'Initial'], annual: ['info', 'Annual re-KYC'], forced: ['warning', 'Forced re-KYC'] };
const K2_ROLE = { ubo: 'UBO', director: 'Director', signatory: 'Signatory', trustee: 'Trustee', settlor: 'Settlor', protector: 'Protector', beneficiary: 'Beneficiary', council_member: 'Council member', founder: 'Founder', account_holder: 'Account holder' };
const K2_DOC = { passport: 'Passport / national ID', proof_of_address: 'Proof of address', liveness: 'Liveness capture', source_of_wealth: 'Source of wealth', tax_self_cert: 'Tax self-certification', certificate_of_incorporation: 'Certificate of incorporation', articles: 'Memorandum & articles', register_of_directors: 'Register of directors', ubo_register: 'UBO register', board_resolution: 'Board resolution (signatories)', source_of_funds: 'Source of funds', certificate_of_registration: 'Certificate of registration', offering_memorandum: 'Offering memorandum', administrator_confirmation: 'Administrator confirmation', trust_deed: 'Trust deed / charter', register_of_trustees: 'Register of trustees', settlor_id: 'Settlor ID' };
const K2_DOCST = { missing: ['neutral', 'Missing'], uploaded: ['info', 'Uploaded'], verified: ['success', 'Verified'], expired: ['critical', 'Expired'], rejected: ['critical', 'Rejected'] };
const K2_CHK = { pending: ['neutral', 'Pending'], ok: ['success', 'OK'], failed: ['critical', 'Failed'], 'n/a': ['neutral', 'n/a'] };
const K2_EVENT = { 'org.migrated': 'Migrated from legacy wallet', 'org.submitted': 'Case submitted', 'org.claimed': 'Case claimed', 'org.first_approval': 'First approval', 'org.approved': 'Approved', 'org.info_requested': 'Info requested', 'org.rejected': 'Rejected', 'org.frozen': 'Organization frozen', 'org.unfrozen': 'Organization unfrozen', 'org.rekyc_forced': 'Re-KYC forced', 'org.dissolved_into': 'Draft dissolved into this organization', 'org.dissolved': 'Dissolved', 'wallet.linked': 'Wallet linked', 'wallet.frozen': 'Wallet frozen', 'wallet.unfrozen': 'Wallet unfrozen', 'wallet.removed': 'Wallet removed', 'wallet.cooldown_started': 'Wallet approved · cooldown', 'wallet.activated': 'Wallet activated' };
const K2_CODE = c => c ? c.replace(/_/g, ' ').replace(/^./, s => s.toUpperCase()) : '—';

function K2Pill({ map, v, suffix, title }) { const m = map[v] || ['neutral', v || '—']; return <span className={`pms-pill ${K2_TONE[m[0]]}`} title={title}>{m[1]}{suffix}</span>; }
const k2Short = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '—';
const k2Days = (d, from = K2.TODAY) => d ? Math.round((new Date(d.slice(0, 10) + 'T12:00:00Z') - new Date(from + 'T12:00:00Z')) / 864e5) : null;
const k2Date = d => d ? new Date(d.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const k2Officer = u => !u ? '—' : u === 'client' ? 'Client' : u === 'system' ? 'System' : u + (u === K2.ME ? ' (you)' : '');
const k2Mask = n => n.split(' ').map(p => p[0] + '•••').join(' ');
const k2Mode = (o, S) => (S.overrides.find(x => x.org === o.ref) || {}).mode || S.settings.kyc_gating_mode;

function K2Addr({ a, full }) { return <span className="pms-mono k2-addr" title={a}>{full ? a : k2Short(a)}</span>; }
function K2State({ kind, what = 'items', can = true }) {
  const M = { loading: ['Loading ' + what + '…', ''], error: ['Could not load ' + what + '.', 'Retry'], empty: ['No ' + what + ' match these filters.', ''], noaccess: ['You do not have access to ' + what + '.', ''] };
  const st = can ? (window.PMS_KYC_STATE && window.PMS_KYC_STATE !== 'live' ? window.PMS_KYC_STATE : kind) : 'noaccess';
  if (!st) return null;
  const [t, a] = M[st];
  return <div className={`k2-state ${st}`}>{st === 'loading' ? <span className="k2-spin"></span> : <span className="ic">{st === 'error' ? '!' : st === 'noaccess' ? '⊘' : '∅'}</span>}<span>{t}</span>{a && <button className="cred-act">{a}</button>}</div>;
}
const k2Live = () => !window.PMS_KYC_STATE || window.PMS_KYC_STATE === 'live';

// ─── store ─────────────────────────────────────────────────────
function useK2Store() {
  const [orgs, setOrgs] = React.useState(() => K2.orgs.map(o => ({ ...o, people: o.people.map(p => ({ ...p })), docs: o.docs.map(d => ({ ...d })) })));
  const [wallets, setWallets] = React.useState(() => K2.wallets.map(w => ({ ...w })));
  const [quar] = React.useState(() => K2.quarantine.map(q => ({ ...q })));
  const [activity, setActivity] = React.useState(() => JSON.parse(JSON.stringify(K2.activity)));
  const now = () => '2026-10-24 ' + new Date().toISOString().slice(11, 16);
  const log = (org, event, from, to, subject) => setActivity(a => ({ ...a, [org]: [{ at: now(), event, actor: K2.ME, from, to, subject }, ...(a[org] || [])] }));
  const patchOrg = (ref, p) => setOrgs(os => os.map(o => o.ref === ref ? { ...o, ...p } : o));
  const patchWallet = (ref, p) => setWallets(ws => ws.map(w => w.ref === ref ? { ...w, ...p } : w));
  return { orgs, wallets, quar, activity, log, patchOrg, patchWallet, setWallets, settings: K2.settings, overrides: K2.overrides };
}
const k2Primary = (o, S) => S.wallets.find(w => w.ref === o.primary_wallet_ref);

function OrgsHub({ sub, setSub, can }) {
  const S = useK2Store();
  const [openOrg, setOpenOrg] = React.useState(null);
  const [review, setReview] = React.useState(null);
  const queue = S.orgs.filter(o => ['submitted', 'in_review', 'second_approval'].includes(o.kyc_status)).length;
  const wq = S.wallets.filter(w => w.status === 'review').length;
  const qn = S.quar.filter(q => q.status === 'held').length;
  const tabs = [
    { id: 'list', label: 'List' },
    { id: 'review', label: 'KYC queue', scope: 'kyc.approve', badge: queue ? { v: queue, kind: 'warn' } : null },
    { id: 'wallets', label: 'Wallet whitelisting', scope: 'kyc.approve', badge: wq ? { v: wq } : null },
    { id: 'quarantine', label: 'Quarantine', badge: qn ? { v: qn, kind: 'warn' } : null },
  ];
  const openReview = r => { setReview(r); setOpenOrg(null); setSub('review'); };
  const openProfile = r => { setOpenOrg(r); setReview(null); setSub('list'); };
  return (
    <Hub tabs={tabs} sub={sub} setSub={v => { setSub(v); setOpenOrg(null); setReview(null); }} can={can}>
      {cur => (
        <div className="kyc k2">
          {cur === 'list' && (openOrg ? <K2Profile S={S} r={openOrg} can={can} onBack={() => setOpenOrg(null)} onReview={openReview} onOpen={openProfile}/> : <K2List S={S} onOpen={setOpenOrg}/>)}
          {cur === 'review' && (review ? <K2Review S={S} r={review} onBack={() => setReview(null)} onProfile={openProfile}/> : <K2Queue S={S} onOpen={setReview}/>)}
          {cur === 'wallets' && <K2Wallets S={S} onProfile={openProfile}/>}
          {cur === 'quarantine' && <K2Quarantine S={S} can={can} onProfile={openProfile}/>}
        </div>
      )}
    </Hub>
  );
}

// ─── list ──────────────────────────────────────────────────────
function K2List({ S, onOpen }) {
  const [f, setF] = React.useState('all');
  const [empties, setEmpties] = React.useState(false);
  const [order, setOrder] = React.useState('submitted_desc');
  const [open, setOpen] = React.useState({});
  const due = o => o.kyc_status === 'approved' && k2Days(o.next_review_at) <= 30;
  const FILTERS = [
    { id: 'all', l: 'All', test: () => true },
    { id: 'review', l: 'Needs review', test: o => ['submitted', 'in_review', 'second_approval'].includes(o.kyc_status), k: 'info' },
    { id: 'client', l: 'Waiting on client', test: o => ['draft', 'info_requested'].includes(o.kyc_status), k: 'warn' },
    { id: 'approved', l: 'Approved', test: o => o.kyc_status === 'approved', k: 'pos' },
    { id: 'due', l: 'Re-KYC ≤ 30d', test: due, k: 'warn' },
    { id: 'frozen', l: 'Frozen', test: o => o.kyc_status === 'frozen', k: 'neg' },
  ];
  const base = S.orgs.filter(o => empties || !(o.empty && o.migrated && o.kyc_status === 'draft'));
  const sorter = { submitted_desc: (a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''), submitted_asc: (a, b) => (a.submitted_at || 'z').localeCompare(b.submitted_at || 'z'), ref: (a, b) => a.id - b.id, review: (a, b) => (a.next_review_at || 'z').localeCompare(b.next_review_at || 'z') }[order];
  const rows = base.filter(FILTERS.find(x => x.id === f).test).sort(sorter);
  const mig = S.orgs.filter(o => o.migrated), migOk = mig.filter(o => o.kyc_status === 'approved').length;
  return (
    <>
      <div className="pms-page-head"><div><h1>Organizations</h1><div className="sub">Each organization is KYC'd once and owns one or more whitelisted EVM wallets. Names are encrypted, so rows show the primary wallet.</div></div></div>
      <div className="kyc-banner info"><b>Migration</b><span><span className="strong">{migOk} of {mig.length}</span> migrated organizations approved · the rest stay view-only in the client app until approved</span><span className="bar"><i style={{ width: (migOk / mig.length * 100) + '%' }}></i></span></div>
      <div className="kyc-filters k2-tiles">
        {FILTERS.map(x => { const n = base.filter(x.test).length; return <button key={x.id} className={`kyc-filter ${f === x.id ? 'active' : ''}`} onClick={() => setF(x.id)}><span className="l">{x.l}</span><span className={`n ${n && x.k ? x.k : ''}`}>{n}</span></button>; })}
      </div>
      <div className="pms-card">
        <div className="pms-card-head">{FILTERS.find(x => x.id === f).l}<div className="label-meta">{rows.length} organizations</div><span className="spacer"></span>
          <FilterToggle label="Show empty drafts" checked={empties} onChange={setEmpties}/>
          <div className="pms-ff-select k2-order"><select value={order} onChange={e => setOrder(e.target.value)}><option value="submitted_desc">Newest submitted</option><option value="submitted_asc">Oldest submitted</option><option value="review">Next review</option><option value="ref">Ref</option></select></div>
        </div>
        {!k2Live() ? <K2State what="organizations"/> : rows.length === 0 ? <K2State kind="empty" what="organizations"/> : (
        <div className="pms-card-body flush"><table className="pms-table k2-list">
          <thead><tr><th style={{ width: 28 }}></th><th>Organization</th><th>Type</th><th>KYC status</th><th>Risk</th><th className="num">Wallets</th><th>Submitted</th><th>Next review</th><th></th></tr></thead>
          <tbody>{rows.map(o => { const pw = k2Primary(o, S); const ws = S.wallets.filter(w => w.org === o.ref); const d = k2Days(o.next_review_at); return (
            <React.Fragment key={o.ref}>
              <tr className={`clickable ${o.kyc_status === 'dissolved' ? 'dim' : ''}`} onClick={() => onOpen(o.ref)}>
                <td><button className={`k2-exp ${open[o.ref] ? 'on' : ''}`} disabled={!ws.length} onClick={e => { e.stopPropagation(); setOpen({ ...open, [o.ref]: !open[o.ref] }); }}>›</button></td>
                <td><div className="kyc-org"><b className="pms-mono">{o.ref}</b>{pw ? <K2Addr a={pw.address}/> : <span>no primary wallet</span>}</div></td>
                <td className="text-xs">{o.sub === 'foundation' ? 'Foundation' : K2_TYPE[o.type]}</td>
                <td><K2Pill map={K2_ORG} v={o.kyc_status}/>{o.review_kind !== 'initial' && ['submitted', 'in_review', 'info_requested'].includes(o.kyc_status) && <span className="k2-sub"><K2Pill map={K2_KIND} v={o.review_kind}/></span>}</td>
                <td>{o.risk_tier ? <K2Pill map={K2_RISK} v={o.risk_tier}/> : <span className="muted">—</span>}</td>
                <td className="num pms-mono">{o.wallet_count}</td>
                <td className="pms-mono text-xs muted">{k2Date(o.submitted_at)}</td>
                <td>{o.next_review_at ? (o.kyc_status === 'approved' && d <= 30 ? <span className="pms-pill warn">{d}d · {k2Date(o.next_review_at)}</span> : <span className="pms-mono text-xs muted">{k2Date(o.next_review_at)}</span>) : <span className="muted">—</span>}</td>
                <td>{o.migrated && <span className="pms-pill k2-ghost">migrated</span>}</td>
              </tr>
              {open[o.ref] && ws.map(w => <tr key={w.ref} className="k2-subrow"><td></td><td colSpan={3}><span className="pms-mono text-xs muted">{w.ref}</span> <K2Addr a={w.address} full/>{w.is_primary && <span className="pms-pill k2-ghost">primary</span>}</td><td colSpan={2}><K2Pill map={K2_WAL} v={w.status}/></td><td colSpan={3} className="text-xs muted">{w.status === 'cooldown' ? 'ends ' + w.cooldown_ends_at + ' UTC' : ''}</td></tr>)}
            </React.Fragment>); })}</tbody>
        </table></div>)}
      </div>
    </>
  );
}

// ─── profile ───────────────────────────────────────────────────
const K2_STEPS = ['Draft', 'Submitted', 'Claimed', 'Entity', 'People', 'Screening', 'Source of funds', 'Wallet', 'Decision', 'Approved'];
function k2Tracker(o, S) {
  const t = (S.ticks || K2.ticks)[o.ref] || '';
  const tickGroups = t.startsWith('all') ? ['entity', 'people', 'screen', 'sof', 'wallet'] : ['entity', 'people', 'screen', 'sof', 'wallet'].filter(g => { const ids = t.split(':')[0].split(','); return ids.filter(x => x.startsWith(g)).length >= (g === 'entity' ? 4 : 1); });
  const st = o.kyc_status;
  let cur = 0, tone = '';
  if (st === 'draft') cur = 0;
  else if (st === 'submitted') cur = 2;
  else if (st === 'info_requested') { cur = 1; tone = 'warn'; }
  else if (st === 'in_review') { const order = ['entity', 'people', 'screen', 'sof', 'wallet']; const i = order.findIndex(g => !tickGroups.includes(g) && !(g === 'people' && o.type === 'individual')); cur = i < 0 ? 8 : 3 + i; }
  else if (st === 'second_approval') { cur = 8; tone = 'warn'; }
  else if (st === 'rejected') { cur = 8; tone = 'neg'; }
  else if (st === 'dissolved') cur = -1;
  else cur = 10;
  return K2_STEPS.map((l, i) => ({ l: i === 8 && st === 'second_approval' ? '2nd approval' : l, s: cur < 0 ? 'locked' : i === 4 && o.type === 'individual' ? 'skip' : i < cur ? 'done' : i === cur ? 'cur' : 'locked', tone: i === cur ? tone : '' }));
}

function k2OrgRules(o, S) {
  const ws = S.wallets.filter(w => w.org === o.ref);
  return {
    freeze: ['frozen', 'dissolved'].includes(o.kyc_status) ? 'Only an organization that is not frozen or dissolved can be frozen.' : null,
    unfreeze: o.kyc_status !== 'frozen' ? 'Only a frozen organization can be unfrozen.' : null,
    rekyc: o.kyc_status !== 'approved' ? 'Only an approved organization can be sent to re-KYC.' : o.claimed_by && o.review_kind !== 'initial' ? 'A review is already open.' : null,
    dissolve: !(o.kyc_status === 'draft' && o.empty) ? 'Only an empty draft can be dissolved.' : null,
    link: o.kyc_status !== 'approved' ? 'Wallets can be linked to an approved organization only.' : null,
    walletRule: w => ({
      freeze: w.status === 'removed' ? 'This wallet is removed.' : w.frozen_self ? 'Already frozen.' : null,
      unfreeze: w.status !== 'frozen' ? 'Not frozen.' : o.kyc_status === 'frozen' ? 'Unfreeze the organization first.' : null,
      remove: w.status === 'removed' ? 'This wallet is already removed.' : w.is_primary && !ws.some(x => x.ref !== w.ref && x.status === 'active') ? 'Another active wallet is needed before the primary can be removed.' : null,
    }),
  };
}
function K2Btn({ rule, onClick, children, tone = '' }) { return <span title={rule || ''} className="k2-btnwrap"><button className={`pms-btn ${tone}`} disabled={!!rule} onClick={onClick}>{children}</button></span>; }
function K2Mini({ rule, onClick, children }) { return <span title={rule || ''} className="k2-btnwrap"><button className="cred-act" disabled={!!rule} onClick={onClick}>{children}</button></span>; }

function K2Profile({ S, r, can, onBack, onReview, onOpen }) {
  const o = S.orgs.find(x => x.ref === r);
  const ws = S.wallets.filter(w => w.org === r);
  const pw = k2Primary(o, S);
  const ops = can('kyc.approve');
  const [tab, setTab] = React.useState('overview');
  const [op, setOp] = React.useState(null);
  const [link, setLink] = React.useState(false);
  const R = k2OrgRules(o, S);
  const mode = k2Mode(o, S);
  const act = S.activity[r] || [];
  const expired = o.docs.some(d => d.status === 'expired');
  const steps = k2Tracker(o, S);
  const reviewable = ['submitted', 'in_review', 'second_approval'].includes(o.kyc_status);
  const TABS = [['overview', 'Overview'], ['people', 'People', o.people.length], ...(ops ? [['docs', 'Documents', o.docs.length, expired]] : []), ['wallets', 'Wallets', ws.length], ['inv', 'Investments'], ['activity', 'Activity', act.length]];
  return (
    <>
      <button className="kyc-back" onClick={onBack}>← Organizations</button>
      <div className="kyc-head">
        <div className="kyc-head-main">
          <div className="kyc-head-t"><h1 className="pms-mono">{o.ref}</h1><K2Pill map={K2_ORG} v={o.kyc_status}/>{o.risk_tier && <K2Pill map={K2_RISK} v={o.risk_tier} suffix=" risk"/>}{o.review_kind !== 'initial' && <K2Pill map={K2_KIND} v={o.review_kind}/>}{o.migrated && <span className="pms-pill k2-ghost">migrated</span>}</div>
          <div className="kyc-head-m">
            <span>Primary wallet {pw ? <K2Addr a={pw.address} full/> : <b>none</b>}</span>
            <span>{o.sub === 'foundation' ? 'Foundation' : K2_TYPE[o.type]}</span>
            <span>Next review <b className={o.kyc_status === 'approved' && k2Days(o.next_review_at) <= 30 ? 'pms-warn' : ''}>{k2Date(o.next_review_at)}</b></span>
            <span>Gating <K2Pill map={K2_MODE} v={mode} title={K2_MODE[mode][2]}/>{S.overrides.some(x => x.org === r) && <span className="muted"> override</span>}</span>
          </div>
        </div>
        {ops && <div className="pms-page-actions k2-ops">
          {reviewable && <button className="pms-btn primary" onClick={() => onReview(r)}>{o.kyc_status === 'second_approval' ? 'Open 2nd approval' : 'Open review'}</button>}
          {o.kyc_status === 'frozen' ? <K2Btn rule={R.unfreeze} onClick={() => setOp({ k: 'unfreeze' })}>Unfreeze</K2Btn> : <K2Btn rule={R.freeze} tone="danger" onClick={() => setOp({ k: 'freeze' })}>Freeze</K2Btn>}
          <K2Btn rule={R.rekyc} tone="ghost" onClick={() => setOp({ k: 'rekyc' })}>Force re-KYC</K2Btn>
          {o.kyc_status === 'draft' && <K2Btn rule={R.dissolve} tone="ghost" onClick={() => setOp({ k: 'dissolve' })}>Dissolve draft</K2Btn>}
        </div>}
      </div>
      {o.kyc_status === 'frozen' && <div className="kyc-banner neg"><b>Frozen</b><span>{K2_CODE(o.freeze_code)} · deposit check, deposit address, invest and withdraw are refused in every mode. On-chain deposits are held, never refused.</span></div>}
      {o.kyc_status === 'info_requested' && <div className="kyc-banner warn"><b>Waiting on client</b><span>Reason: {K2_CODE(o.info_reason)}. The case left the queue until the client resubmits.</span></div>}
      {o.kyc_status === 'dissolved' && <div className="kyc-banner"><b>Dissolved</b><span>Wallets moved into <button className="pms-link" onClick={() => onOpen(o.dissolved_into)}>{o.dissolved_into}</button>.</span></div>}

      <div className="kyc-steps">
        {steps.map((s, i) => <div key={i} className={`kyc-step ${s.s} ${s.tone}`}><span className="d">{s.s === 'done' ? '✓' : s.s === 'skip' ? '–' : i + 1}</span><span className="l">{s.l}</span></div>)}
      </div>

      <div className="k2-tabbar">
        {TABS.map(([k, l, n, alert]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}{n != null && <span className={`c ${alert ? 'neg' : ''}`}>{n}</span>}</button>)}
        {!ops && <span className="pms-hub-locked">Documents hidden by role</span>}
      </div>

      {tab === 'overview' && <K2Overview o={o} S={S} mode={mode} ws={ws}/>}
      {tab === 'people' && (
        <div className="pms-card"><div className="pms-card-head">People<div className="label-meta">{ops ? 'names decrypted for kyc.approve' : 'names masked · ownership and PEP need kyc.approve'}</div></div>
          {o.people.length === 0 ? <K2State kind="empty" what="people"/> : <div className="pms-card-body flush"><table className="pms-table">
            <thead><tr><th>Person</th><th>Role</th>{ops && <th className="num">Ownership</th>}{ops && <th>PEP</th>}<th>ID</th><th>Liveness</th><th>Address</th><th>Screening</th></tr></thead>
            <tbody>{o.people.map(p => <tr key={p.id}><td><div className="kyc-org"><b>{ops ? p.name : k2Mask(p.name)}</b><span className="pms-mono">{p.id}</span></div></td><td className="text-xs">{K2_ROLE[p.role]}</td>
              {ops && <td className="num pms-mono">{p.ownership_pct != null ? p.ownership_pct + '%' : '—'}</td>}{ops && <td>{p.pep ? <span className="pms-pill neg">PEP</span> : <span className="muted text-xs">No</span>}</td>}
              {p.checks.map((c, k) => <td key={k}><K2Pill map={K2_CHK} v={c}/></td>)}</tr>)}</tbody>
          </table></div>}</div>
      )}
      {tab === 'docs' && ops && (
        <div className="pms-card"><div className="pms-card-head">Documents<div className="label-meta">metadata only · no file name is stored · files open through short-lived links (M9d)</div></div>
          {o.docs.length === 0 ? <K2State kind="empty" what="documents"/> : <div className="pms-card-body flush"><table className="pms-table">
            <thead><tr><th>Type</th><th>Status</th><th>Issued</th><th>Expires</th><th>Reviewed</th><th>File</th></tr></thead>
            <tbody>{o.docs.map(d => <tr key={d.doc_type}><td>{K2_DOC[d.doc_type]}<div className="pms-mono text-xs muted">{d.doc_type}</div></td><td><K2Pill map={K2_DOCST} v={d.status}/></td><td className="pms-mono text-xs">{k2Date(d.issued_at)}</td>
              <td className={`pms-mono text-xs ${d.status === 'expired' ? 'pms-neg' : ''}`}>{k2Date(d.expires_at)}</td><td className="pms-mono text-xs muted">{k2Date(d.reviewed_at)}</td>
              <td className="text-xs muted">{d.status === 'missing' ? '—' : `${d.mime.split('/')[1].toUpperCase()} · ${d.size_kb} KB`}</td></tr>)}</tbody>
          </table></div>}
          {expired && <div className="kyc-note" style={{ margin: 12 }}>An expired document raises this flag only. Access does not change unless compliance forces a re-KYC.</div>}
        </div>
      )}
      {tab === 'wallets' && (
        <div className="pms-card"><div className="pms-card-head">Wallets<div className="label-meta">EVM only in v1 · self-hosted only</div><span className="spacer"></span>
          {ops && <K2Mini rule={R.link} onClick={() => setLink(true)}>+ Link wallet</K2Mini>}</div>
          <div className="pms-card-body flush"><table className="pms-table">
            <thead><tr><th>Wallet</th><th>Status</th><th>Signature</th><th>Signatory email</th><th>On-chain history</th><th>Source</th>{ops && <th className="num"></th>}</tr></thead>
            <tbody>{ws.map(w => { const wr = R.walletRule(w); return (
              <tr key={w.ref} className={w.status === 'removed' ? 'dim' : ''}>
                <td><div className="kyc-org"><b className="pms-mono">{w.ref}{w.is_primary && <span className="pms-pill k2-ghost" style={{ marginLeft: 6 }}>primary</span>}</b><K2Addr a={w.address} full/></div></td>
                <td><K2Pill map={K2_WAL} v={w.status}/>{w.status === 'cooldown' && <div className="text-xs muted" style={{ marginTop: 3 }}>ends {w.cooldown_ends_at} UTC</div>}{w.status === 'frozen' && <div className="text-xs muted" style={{ marginTop: 3 }}>{w.frozen_self ? 'frozen on its own' : 'with organization (needs frozen_by)'}</div>}</td>
                <td><K2Pill map={K2_SIG} v={w.signature_status}/></td><td><K2Pill map={K2_EMAIL} v={w.signatory_email_status}/></td><td><K2Pill map={K2_HIST} v={w.onchain_history}/></td>
                <td className="text-xs muted">{{ main_app: 'Client app connect', ops_link: 'Linked by ops', quarantine: 'Quarantined deposit' }[w.source]}</td>
                {ops && <td className="num"><div className="kyc-acts">
                  {w.status === 'frozen' ? <K2Mini rule={wr.unfreeze} onClick={() => setOp({ k: 'wunfreeze', w })}>Unfreeze</K2Mini> : <K2Mini rule={wr.freeze} onClick={() => setOp({ k: 'wfreeze', w })}>Freeze</K2Mini>}
                  <K2Mini rule={wr.remove} onClick={() => setOp({ k: 'remove', w })}>Remove</K2Mini>
                </div></td>}
              </tr>); })}</tbody>
          </table></div></div>
      )}
      {tab === 'inv' && <div className="pms-card"><div className="pms-card-head">Investments</div><div className="k2-state empty"><span className="ic">∅</span><span>Not available yet. Organization-level totals need pms-backend to read other users' client operations (inbound issue #12).</span></div></div>}
      {tab === 'activity' && (
        <div className="pms-card"><div className="pms-card-head">Activity<div className="label-meta">audit events · statuses, refs and codes only</div></div>
          {act.length === 0 ? <K2State kind="empty" what="events"/> : <div className="pms-card-body flush"><table className="pms-table">
            <thead><tr><th>Time (UTC)</th><th>Event</th><th>Actor</th><th>Status change</th><th>Subject</th></tr></thead>
            <tbody>{act.map((e, i) => <tr key={i}><td className="pms-mono text-xs muted">{e.at}</td><td>{K2_EVENT[e.event] || e.event}<div className="pms-mono text-xs muted">{e.event}</div></td><td className="pms-mono text-xs">{k2Officer(e.actor)}</td>
              <td>{e.to ? <span className="k2-chg">{e.from && <><K2Pill map={e.event.startsWith('wallet') ? K2_WAL : K2_ORG} v={e.from}/><span className="muted">→</span></>}<K2Pill map={e.event.startsWith('wallet') ? K2_WAL : K2_ORG} v={e.to}/></span> : <span className="muted">—</span>}</td>
              <td className="pms-mono text-xs">{e.subject || o.ref}</td></tr>)}</tbody>
          </table></div>}</div>
      )}

      <K2OpsModal op={op} o={o} S={S} mode={mode} onClose={() => setOp(null)}/>
      <K2LinkModal open={link} o={o} S={S} onClose={() => setLink(false)}/>
    </>
  );
}

function K2Overview({ o, S, mode, ws }) {
  const frozen = o.kyc_status === 'frozen';
  const enforcing = mode === 'enforce' || (mode === 'enforce_new' && !(o.migrated && !o.approved_at));
  const counted = !frozen && (mode === 'shadow' || (mode === 'enforce_new' && o.migrated && !o.approved_at));
  const ok = o.kyc_status === 'approved' && ws.some(w => w.status === 'active');
  const verdict = a => frozen ? ['critical', 'Refused · freeze'] : (enforcing && !ok) ? ['critical', 'Refused'] : counted && !ok ? ['info', 'Allowed · counted'] : ['success', 'Allowed'];
  const V = { a: ['success', 'Allowed'] };
  return (
    <div className="kyc-grid2">
      <div className="pms-card"><div className="pms-card-head">KYC case</div><div className="pms-card-body kyc-dl">
        <div><span>Status</span><K2Pill map={K2_ORG} v={o.kyc_status}/></div>
        <div><span>Review kind</span><K2Pill map={K2_KIND} v={o.review_kind}/></div>
        <div><span>Submitted</span><b className="pms-mono">{k2Date(o.submitted_at)}</b></div>
        <div><span>Claimed by</span><b className="pms-mono">{k2Officer(o.claimed_by)}</b></div>
        {o.first_approver && <div><span>First approval</span><b className="pms-mono">{k2Officer(o.first_approver)} · {o.first_at}</b></div>}
        <div><span>Approved</span><b className="pms-mono">{k2Date(o.approved_at)}</b></div>
        <div><span>Next review</span><b className="pms-mono">{k2Date(o.next_review_at)}{o.next_review_at ? ` · ${k2Days(o.next_review_at)}d` : ''}</b></div>
        <div><span>Risk tier</span>{o.risk_tier ? <K2Pill map={K2_RISK} v={o.risk_tier}/> : <b>Set at review</b>}</div>
      </div></div>
      <div className="pms-card"><div className="pms-card-head">Client app access<div className="label-meta">under gating mode <K2Pill map={K2_MODE} v={mode}/></div></div><div className="pms-card-body kyc-dl">
        {[['Deposit check', 'a'], ['Deposit address', 'a'], ['Invest / change strategy', 'a'], ['Withdraw to own wallet', 'a']].map(([k]) => { const v = verdict(k); return <div key={k}><span>{k}</span><K2Pill map={{ x: v }} v="x"/></div>; })}
        <div><span>On-chain deposit</span>{frozen ? <K2Pill map={{ x: ['warning', 'Held'] }} v="x"/> : <K2Pill map={V} v="a"/>}</div>
        <div className="kyc-note">{K2_MODE[mode][2]} A freeze refuses in every mode, <span className="pms-mono">off</span> included. A withdrawal always goes to the requesting wallet; nobody types a destination.</div>
      </div></div>
    </div>
  );
}

// ─── ops actions ───────────────────────────────────────────────
const K2_OPS = {
  freeze: { title: 'Freeze organization', tone: 'danger', codes: 'freeze', cta: 'Freeze', always: true, bots: true },
  unfreeze: { title: 'Unfreeze organization', tone: 'warn', codes: 'unfreeze', cta: 'Unfreeze' },
  rekyc: { title: 'Force re-KYC', tone: 'danger', codes: 'rekyc', cta: 'Force re-KYC', client: true },
  dissolve: { title: 'Dissolve draft', tone: 'warn', codes: 'dissolve', cta: 'Dissolve' },
  wfreeze: { title: 'Freeze wallet', tone: 'danger', codes: 'wallet_freeze', cta: 'Freeze wallet', always: true, bots: true },
  wunfreeze: { title: 'Unfreeze wallet', tone: 'warn', codes: 'wallet_unfreeze', cta: 'Unfreeze wallet' },
  remove: { title: 'Remove wallet', tone: 'danger', codes: 'remove', cta: 'Remove wallet' },
};
function K2OpsModal({ op, o, S, mode, onClose }) {
  const [code, setCode] = React.useState('');
  const [text, setText] = React.useState('');
  const [totp, setTotp] = React.useState('');
  const [target, setTarget] = React.useState('');
  const [res, setRes] = React.useState(null);
  React.useEffect(() => { setCode(''); setText(''); setTotp(''); setTarget(''); setRes(null); }, [op]);
  if (!op) return null;
  const D = K2_OPS[op.k], w = op.w;
  const ws = S.wallets.filter(x => x.org === o.ref);
  const enforcing = ['enforce', 'enforce_new'].includes(mode);
  const cancels = D.always ? 'Cancels unclaimed withdrawals and strategy changes in every mode.' : ['remove', 'rekyc'].includes(op.k) ? (enforcing ? `Cancels unclaimed withdrawals and strategy changes (mode ${K2_MODE[mode][1]} enforces).` : `Cancels nothing under mode ${K2_MODE[mode][1]}; would cancel where the mode enforces.`) : 'Cancels nothing. Unfreezing reopens nothing.';
  const ok = code && totp.length === 6 && (op.k !== 'dissolve' || target) && (!D.client || text.trim().length >= 5);
  const subj = w ? w.ref : o.ref;
  const run = () => {
    if (totp === '000000') { setRes({ busy: true }); return; }
    const changed = [];
    if (op.k === 'freeze') { S.patchOrg(o.ref, { kyc_status: 'frozen', frozen_prev: o.kyc_status, freeze_code: code }); ws.filter(x => ['active', 'cooldown', 'review'].includes(x.status)).forEach(x => { S.patchWallet(x.ref, { status: 'frozen', prev: x.status }); changed.push(x.ref); }); S.log(o.ref, 'org.frozen', o.kyc_status, 'frozen'); }
    if (op.k === 'unfreeze') { S.patchOrg(o.ref, { kyc_status: o.frozen_prev || 'approved', freeze_code: null }); ws.filter(x => x.status === 'frozen' && !x.frozen_self).forEach(x => { S.patchWallet(x.ref, { status: x.prev || 'active' }); changed.push(x.ref); }); S.log(o.ref, 'org.unfrozen', 'frozen', o.frozen_prev || 'approved'); }
    if (op.k === 'rekyc') { S.patchOrg(o.ref, { kyc_status: 'info_requested', review_kind: 'forced', info_reason: code }); S.log(o.ref, 'org.rekyc_forced', 'approved', 'info_requested'); }
    if (op.k === 'dissolve') { ws.forEach(x => { S.patchWallet(x.ref, { org: target, is_primary: false }); changed.push(x.ref); }); S.patchOrg(o.ref, { kyc_status: 'dissolved', dissolved_into: target }); S.log(o.ref, 'org.dissolved', 'draft', 'dissolved'); S.log(target, 'org.dissolved_into', null, null, o.ref); }
    if (op.k === 'wfreeze') { S.patchWallet(w.ref, { status: 'frozen', prev: w.status, frozen_self: true }); changed.push(w.ref); S.log(o.ref, 'wallet.frozen', w.status, 'frozen', w.ref); }
    if (op.k === 'wunfreeze') { S.patchWallet(w.ref, { status: w.prev || 'active', frozen_self: false }); changed.push(w.ref); S.log(o.ref, 'wallet.unfrozen', 'frozen', w.prev || 'active', w.ref); }
    if (op.k === 'remove') { S.patchWallet(w.ref, { status: 'removed' }); changed.push(w.ref); S.log(o.ref, 'wallet.removed', w.status, 'removed', w.ref); }
    const cancel = D.always || (['remove', 'rekyc'].includes(op.k) && enforcing);
    setRes({ changed, wd: cancel && o.kyc_status !== 'draft' ? ['FI-W-08851 · PENDING_APPROVAL → REJECTED'] : [], sc: cancel && o.kyc_status !== 'draft' ? ['SC-2210 · CREATED → FAILED'] : [], claimed: cancel && o.kyc_status !== 'draft' ? ['FI-W-08850 · claimed, will finish'] : [] });
  };
  const impact = op.k === 'freeze' ? [{ k: 'Wallets frozen', v: ws.filter(x => ['active', 'cooldown', 'review'].includes(x.status)).map(x => x.ref).join(', ') || 'none' }, { k: 'Open positions', v: 'keep running' }]
    : op.k === 'unfreeze' ? [{ k: 'Status restored to', v: K2_ORG[o.frozen_prev || 'approved'][1] }, { k: 'Wallets restored', v: ws.filter(x => x.status === 'frozen' && !x.frozen_self).map(x => x.ref).join(', ') || 'none' }, { k: 'Stay frozen (own freeze)', v: ws.filter(x => x.frozen_self).map(x => x.ref).join(', ') || 'none' }]
    : op.k === 'rekyc' ? [{ k: 'Status', v: 'Approved → Info requested' }, { k: 'Review kind', v: 'Forced' }]
    : op.k === 'remove' ? [{ k: 'Wallet', v: w.ref }, { k: 'Re-adding', v: 'full link flow + new cooldown' }]
    : w ? [{ k: 'Wallet', v: w.ref }] : null;
  return (
    <Modal open title={`${D.title} · ${subj}`} onClose={onClose}
      footer={res ? <button className="pms-btn primary" onClick={onClose}>{res.busy ? 'Close' : 'Done'}</button> : <><button className="pms-btn ghost" onClick={onClose}>Cancel</button><button className={`pms-btn ${D.tone === 'danger' ? 'danger' : 'primary'}`} disabled={!ok} onClick={run}>{D.cta}</button></>}>
      {res ? (res.busy ? <div className="cred-err warn"><b>Busy. Try again.</b> <span>The server is busy; retry. Nothing changed.</span></div> : (
        <div className="k2-result">
          <div className="cred-done-h"><span className="ic">✓</span><div><b>{D.title} done</b><span>Audit event written · {subj}</span></div></div>
          {[['Wallets changed', res.changed], ['Withdrawals cancelled', res.wd], ['Strategy changes cancelled', res.sc], ['Claimed withdrawals left alone', res.claimed]].map(([k, v]) => <div key={k} className="k2-res-row"><span>{k}</span><b className="pms-mono">{v.length ? v.join(' · ') : 'none'}</b></div>)}
        </div>)) : (
        <div className="pms-form-body">
          <div className={`pms-confirm-banner ${D.tone === 'danger' ? 'danger' : 'warn'}`}><span className="ic">⚠</span><div>
            <b>{cancels}</b>{op.k !== 'unfreeze' && op.k !== 'wunfreeze' && op.k !== 'dissolve' && ' A cancel turns CREATED and PENDING_APPROVAL withdrawals into REJECTED, APPROVED ones into FAILED, and CREATED strategy changes into FAILED. Claimed withdrawals always finish.'}
            {D.bots && <div style={{ marginTop: 6 }}>Bots may already have acted on a withdrawal this cancels: waited, or closed part of a position.</div>}
            <div className="text-xs muted" style={{ marginTop: 6 }}>Exact counts need a preview read that no plan has yet.</div>
          </div></div>
          {impact && <div className="pms-confirm-impact">{impact.map(x => <div key={x.k} className="row"><span className="k">{x.k}</span><span className="v">{x.v}</span></div>)}</div>}
          {op.k === 'dissolve' && <>
            <FormField label="Target organization" required hint="Every wallet moves there, keeps its W-ref, and none becomes primary."><FormSelect value={target} onChange={setTarget} options={[{ v: '', l: 'Choose…' }, ...S.orgs.filter(x => x.ref !== o.ref && !['dissolved', 'rejected'].includes(x.kyc_status)).map(x => ({ v: x.ref, l: `${x.ref} · ${K2_ORG[x.kyc_status][1]} · ${k2Short(k2Primary(x, S)?.address)}` }))]}/></FormField>
            <div className="pms-confirm-impact">{ws.map(x => <div key={x.ref} className="row"><span className="k pms-mono">{x.ref} · {k2Short(x.address)}</span><span className="v">→ {target || '?'}</span></div>)}</div>
          </>}
          <FormField label="Reason code" required hint="Draft list · no catalogue exists yet"><FormSelect value={code} onChange={setCode} options={[{ v: '', l: 'Choose a reason…' }, ...K2.REASON_CODES[D.codes].map(c => ({ v: c, l: K2_CODE(c) }))]}/></FormField>
          <FormField label={D.client ? 'Message · visible to the client' : 'Reason text (internal)'} required={D.client} hint="At least 5 characters · stored encrypted · off on prod until encrypted backups exist">
            <FormTextarea value={text} onChange={setText} rows={2} placeholder={D.client ? 'What the client must refresh…' : 'Optional context for the audit log'}/>
          </FormField>
          <FormField label="Authenticator code" required hint="Fresh TOTP · try 000000 to see the busy state"><FormInput value={totp} onChange={v => setTotp(v.replace(/\D/g, '').slice(0, 6))} placeholder="000000" mono/></FormField>
        </div>)}
    </Modal>
  );
}

function K2LinkModal({ open, o, S, onClose }) {
  const [addr, setAddr] = React.useState('');
  const [label, setLabel] = React.useState('');
  const [kind, setKind] = React.useState('self');
  const [absorb, setAbsorb] = React.useState(false);
  React.useEffect(() => { if (open) { setAddr(''); setLabel(''); setKind('self'); setAbsorb(false); } }, [open]);
  const a = addr.trim();
  const valid = /^0x[0-9a-fA-F]{40}$/.test(a);
  const used = valid && S.wallets.find(w => w.address.toLowerCase() === a.toLowerCase());
  const usedOrg = used && S.orgs.find(x => x.ref === used.org);
  const emptyDraft = usedOrg && usedOrg.kyc_status === 'draft' && usedOrg.empty;
  const ok = valid && kind === 'self' && label.length <= 64 && (!used || (emptyDraft && absorb));
  const demo = S.wallets.find(w => S.orgs.find(x => x.ref === w.org && x.empty && x.kyc_status === 'draft'));
  const submit = () => {
    if (used && emptyDraft) { S.patchWallet(used.ref, { org: o.ref, is_primary: false, status: 'awaiting_email', source: 'ops_link', signatory_email_status: 'awaiting' }); S.patchOrg(usedOrg.ref, { kyc_status: 'dissolved', dissolved_into: o.ref }); S.log(o.ref, 'org.dissolved_into', null, null, usedOrg.ref); }
    else { const n = S.wallets.length + 1; S.setWallets(x => [...x, { ref: 'W-' + String(n).padStart(4, '0'), org: o.ref, address: a, chain_family: 'evm', status: 'awaiting_email', is_primary: false, source: 'ops_link', signature_status: 'awaiting', signatory_email_status: 'awaiting', onchain_history: 'unreviewed', cooldown_ends_at: null }]); }
    S.log(o.ref, 'wallet.linked', null, 'awaiting_email');
  };
  return (
    <FormModal open={open} title={`Link wallet · ${o.ref}`} onClose={onClose} submitLabel="Link wallet" canSubmit={ok} onSubmit={submit}
      subtitle="For an approved organization that asked to add a wallet. A wallet that connects to the client app on its own starts a new organization."
      note="Wallet linked · it waits in Awaiting signatory email until the email step ships (M9d).">
      <FormRow>
        <FormField label="Chain"><FormSelect value="evm" onChange={() => {}} options={[{ v: 'evm', l: 'EVM (only chain in v1)' }]}/></FormField>
        <FormField label="Label" hint={`${label.length}/64`} error={label.length > 64 ? 'Max 64 characters' : null}><FormInput value={label} onChange={setLabel} placeholder="e.g. Treasury Safe"/></FormField>
      </FormRow>
      <FormField label="Wallet address" required error={a && !valid ? 'Enter a 0x… address with 40 hex characters' : used && !emptyDraft ? `Wallet belongs to ${used.org}` : null}
        hint={!a && demo ? <button className="pms-link text-xs" onClick={() => setAddr(demo.address)}>Try an address held by empty draft {demo.org}</button> : null}>
        <FormInput value={addr} onChange={setAddr} placeholder="0x…" mono/>
      </FormField>
      {used && emptyDraft && <label className="k2-absorb"><input type="checkbox" checked={absorb} onChange={e => setAbsorb(e.target.checked)}/><span>Wallet belongs to <b className="pms-mono">{used.org}</b>, an empty draft. Dissolve it into <b className="pms-mono">{o.ref}</b> to free the address.</span></label>}
      <FormField label="Wallet type" required error={kind === 'exchange' ? 'Exchange-hosted wallets cannot be whitelisted.' : null}>
        <FormSeg value={kind} onChange={setKind} options={[{ v: 'self', l: 'Self-hosted' }, { v: 'exchange', l: 'Exchange-hosted' }]}/>
      </FormField>
      <div className="kyc-flow">{['Signatory confirms by email (M9d)', 'Wallet signs in on the client app', 'Compliance approves', `${S.settings.whitelist_cooldown_hours}h cooldown, then active`].map((s, i) => <div key={i}><span>{i + 1}</span>{s}</div>)}</div>
    </FormModal>
  );
}

Object.assign(window, { OrgsHub, K2Pill, K2Addr, K2State, K2Btn, K2Mini, k2Short, k2Days, k2Date, k2Officer, k2Mask, k2Mode, k2Primary, k2Live, K2_TONE, K2_ORG, K2_WAL, K2_SIG, K2_EMAIL, K2_HIST, K2_RISK, K2_MODE, K2_TYPE, K2_KIND, K2_ROLE, K2_DOC, K2_DOCST, K2_CHK, K2_CODE });
