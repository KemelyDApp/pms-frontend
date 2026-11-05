/* v3 Organizations — mirrors pages/Investors (Organizations · KYC review · Wallet whitelisting · Quarantine) + profile + KYC case.
   Data reuses data-kyc-v2.js (window.KYC2). */
const KS = { draft: ['neutral', 'Draft'], submitted: ['info', 'Submitted'], in_review: ['info', 'In review'], info_requested: ['warning', 'Info requested'], second_approval: ['accent', '2nd approval'], approved: ['positive', 'Approved'], rejected: ['negative', 'Rejected'], frozen: ['negative', 'Frozen'], dissolved: ['neutral', 'Dissolved'] };
const WS_ = { pending_kyc: ['neutral', 'Pending KYC'], awaiting_email: ['info', 'Awaiting email'], awaiting_connect: ['info', 'Awaiting sign-in'], review: ['accent', 'In review'], cooldown: ['warning', 'Cool-down'], active: ['positive', 'Whitelisted'], frozen: ['negative', 'Frozen'], removed: ['neutral', 'Removed'] };
const RISK_T = { low: 'positive', medium: 'warning', high: 'negative' };
const OTYPE = { individual: 'Individual', company: 'Company', fund: 'Fund / SPV', trust: 'Trust' };
const SRC = { main_app: 'Main app sign-in', ops_link: 'Linked by ops', quarantine: 'Quarantined deposit' };
const KTag = ({ s, sm = true }) => <RoundTag tone={KS[s][0]} sm={sm}>{KS[s][1]}</RoundTag>;
const WTag = ({ s }) => <RoundTag tone={WS_[s][0]} sm>{WS_[s][1]}</RoundTag>;
const kDate = d => d ? new Date(d.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : NO;
const kDays = d => Math.round((new Date(d.slice(0, 10)) - new Date('2026-11-05')) / 864e5);
function KycCheck({ status }) {
  const ok = ['verified', 'confirmed', 'clean', 'ok'].includes(status), bad = ['flagged', 'failed', 'expired'].includes(status), na = status === 'n/a';
  return <span title={status} style={{ display: 'inline-grid', placeItems: 'center', width: 18, height: 18, borderRadius: 5, fontSize: 11, fontWeight: 800, background: ok ? 'rgba(104,218,152,.14)' : bad ? 'rgba(255,112,114,.14)' : 'rgba(255,255,255,.05)', color: ok ? 'var(--system-success-500)' : bad ? 'var(--system-error-500)' : 'var(--neutral-80)' }}>{ok ? '✓' : bad ? '✕' : na ? '–' : '…'}</span>;
}
const useKycAccess = () => { const { preview } = usePreviewRole(); return can(preview, 'kyc.approve'); };
const NO_KYC = 'Needs kyc.approve and a firm-wide resource scope';
const OrgHead = ({ title, sub, acts }) => <div className="page-head"><div><h1>{title}</h1><p className="page-head__sub">{sub}</p></div>{acts && <div className="page-head__acts">{acts}</div>}</div>;
const orgWallet = o => KYC2.wallets.find(w => w.ref === o.primary_wallet_ref);

function KycControlConfirm({ open, title, desc, codes, onClose, preview = true }) {
  const [code, setCode] = useState(''), [rc, setRc] = useState(''), [done, setDone] = useState(false);
  useEffect(() => { setCode(''); setRc(''); setDone(false); }, [open]);
  return <PmsModal open={open} title={title} onClose={onClose} foot={done ? <PmsButton variant="primary" onClick={onClose}>Done</PmsButton> : <><PmsButton variant="ghost" onClick={onClose}>Cancel</PmsButton><PmsButton variant="danger" disabled={!rc || code.length !== 6} onClick={() => setDone(true)}>Confirm</PmsButton></>}>
    {done ? <div className="note note--info"><b>Applied.</b> Result: status changed · 2 wallets updated · cancelled: 1 withdrawal, 0 strategy changes. The profile is read again.</div> : <>
      <div className="note note--warn">{desc}</div>
      {preview && <div className="note"><b style={{ color: 'var(--neutral-90)' }}>Cascade preview</b> · kyc.cascade_preview<dl className="dl" style={{ marginTop: 8 }}><dt>Withdrawals cancelled</dt><dd>1 (PENDING_APPROVAL → REJECTED)</dd><dt>Strategy changes cancelled</dt><dd>0</dd><dt>Claimed withdrawals</dt><dd>finish as normal</dd></dl></div>}
      <Field label="Reason" req hint="Closed list from the contract"><Select value={rc} onChange={setRc} options={[{ v: '', l: 'Choose a reason…' }, ...codes.map(c => ({ v: c, l: c }))]}/></Field>
      <Field label="Authenticator code" req hint="Fresh code on every frame · 10 per user / 30 firm-wide per hour"><TotpCodeInput value={code} onChange={setCode}/></Field></>}
  </PmsModal>;
}

const ACC = { trading: ['positive', 'Trading'], view_only: ['warning', 'View only'], frozen: ['negative', 'Frozen'], removed: ['neutral', 'Removed'] };
const AccTag = ({ a }) => <RoundTag tone={ACC[a][0]} sm>{ACC[a][1]}</RoundTag>;
const AK = { DEPOSIT: ['positive', 'deposit'], WITHDRAW: ['negative', 'withdrawal'], STRATEGY_CHANGE: ['accent', 'strategy change'], PNL: ['info', 'p&l'], MANAGEMENT_FEE: ['warning', 'mgmt fee'], PERFORMANCE_FEE: ['warning', 'perf fee'], SIGN_IN: ['neutral', 'sign-in'], WALLET_LINKED: ['neutral', 'wallet linked'], DEPOSIT_HELD: ['warning', 'deposit held'], DEPOSIT_BLOCKED: ['negative', 'deposit blocked'], FROZEN: ['negative', 'frozen'] };
const ACT_GROUP = { money: ['DEPOSIT', 'WITHDRAW', 'STRATEGY_CHANGE', 'DEPOSIT_HELD'], fees: ['PNL', 'MANAGEMENT_FEE', 'PERFORMANCE_FEE'], access: ['SIGN_IN', 'WALLET_LINKED', 'DEPOSIT_BLOCKED', 'FROZEN'] };
const AllocBar = ({ alloc, w = 90 }) => alloc.length ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'flex', width: w, height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,.06)' }}>{alloc.map(([sid, , p]) => <span key={sid} title={V3.STRATS.find(s => s.id === sid).name + ' ' + p + '%'} style={{ width: p + '%', background: stratColor(sid) }}></span>)}</span><span className="muted" style={{ fontSize: 10.5 }}>{alloc.length}</span></span> : <span className="muted">{NO}</span>;
const invAmt = e => e.amount == null ? <span className="muted">{NO}</span> : e.dir === 'in' ? <span className="pos">{fmtSigned(e.amount)}</span> : e.dir === 'out' ? <span className="neg">{fmtSigned(-e.amount)}</span> : <span>{fmtUsd(e.amount)}</span>;

function InvestorTable({ rows, showOrg = true, compact }) {
  return <PmsTable onRow={r => navigate('/investors/' + r.id)} rows={rows} columns={[
    { key: 'ref', label: 'INVESTOR · WALLET', render: r => <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><b title={r.address}>{shortAddr(r.address)}</b>{r.is_primary && <RoundTag sm>primary</RoundTag>}</span><span className="muted" style={{ fontSize: 10.5 }}>{r.ref} · {SRC[r.source]}</span></span> },
    ...(showOrg ? [{ key: 'org', label: 'ORGANIZATION', render: r => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><a onClick={e => { e.stopPropagation(); navigate('/investors/orgs/' + r.orgId); }}>{r.org}</a><KTag s={r.orgStatus}/></span> }] : []),
    { key: 'access', label: 'ACCESS', render: r => <AccTag a={r.access}/> },
    { key: 'balance', label: 'BALANCE', num: true, sortable: true, render: r => r.balance ? fmtUsd(r.balance) : <span className="muted">{NO}</span> },
    ...(compact ? [] : [{ key: 'withdrawable', label: 'WITHDRAWABLE', num: true, render: r => r.balance ? <span className="muted">{fmtUsdCompact(r.withdrawable)}</span> : <span className="muted">{NO}</span> }]),
    { key: 'pnl30', label: 'P&L 30D', num: true, sortable: true, render: r => r.balance ? <span className={tone(r.pnl30)}>{fmtSigned(r.pnl30)}</span> : <span className="muted">{NO}</span> },
    { key: 'alloc', label: 'STRATEGIES', render: r => <AllocBar alloc={r.alloc}/> },
    { key: 'last', label: 'LAST ACTIVITY', render: r => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><RoundTag sm tone={AK[r.last.kind][0]}>{AK[r.last.kind][1]}</RoundTag><span className="muted" style={{ fontSize: 10.5 }}>{r.last.at.slice(5, 16)}</span></span> }]}/>;
}

function InvestorActivityTable({ rows, showInv = true, foot }) {
  return <PmsTable foot={foot} rows={rows} onRow={showInv ? e => navigate('/investors/' + e.invId) : undefined} columns={[
    { key: 'at', label: 'TIME (UTC)', render: e => <span className="muted">{e.at}</span> },
    ...(showInv ? [{ key: 'inv', label: 'INVESTOR', render: e => <span style={{ display: 'flex', flexDirection: 'column' }}><b title={e.address}>{shortAddr(e.address)}</b><span className="muted" style={{ fontSize: 10.5 }}>{e.inv}</span></span> }] : []),
    { key: 'kind', label: 'EVENT', render: e => <RoundTag tone={AK[e.kind][0]}>{AK[e.kind][1]}</RoundTag> },
    { key: 'amount', label: 'AMOUNT', num: true, render: invAmt },
    { key: 'asset', label: 'ASSET / CHAIN', render: e => e.amount == null || e.kind === 'STRATEGY_CHANGE' ? <span className="muted">{NO}</span> : <span>{e.asset}{e.chain && <span className="muted"> · {e.chain}</span>}</span> },
    { key: 'strat', label: 'STRATEGY / DETAIL', render: e => e.note ? <span style={{ fontSize: 11.5 }}>{e.note}</span> : e.strat ? <RoundTag tone="accent">{V3.STRATS.find(s => s.id === e.strat).name}</RoundTag> : <span className="muted">{String(e.ref).replace(/_/g, ' ')}</span> },
    { key: 'ref', label: 'REFERENCE', render: e => <span className="muted">{e.strat || e.kind === 'DEPOSIT_HELD' ? e.ref : NO}</span> },
    { key: 'status', label: 'STATUS', render: e => <span className={e.status === 'SUCCESS' ? 'pos' : e.status === 'BLOCKED' ? 'neg' : 'warn'}>{e.status.toLowerCase()}</span> }]}/>;
}

function ActivityFilters({ group, setGroup, inv, setInv, invs }) {
  return <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
    <Seg options={[{ v: 'all', l: 'All' }, { v: 'money', l: 'Money' }, { v: 'fees', l: 'P&L & fees' }, { v: 'access', l: 'Access' }]} value={group} onChange={setGroup}/>
    {invs && <div style={{ width: 200 }}><Select value={inv} onChange={setInv} options={[{ v: '', l: `All investors (${invs.length})` }, ...invs.map(i => ({ v: String(i.id), l: shortAddr(i.address) + ' · ' + i.ref }))]}/></div>}
  </span>;
}
const filterAct = (rows, group, inv) => rows.filter(e => (group === 'all' || ACT_GROUP[group].includes(e.kind)) && (!inv || String(e.invId) === inv));

function InvestorsListTab() {
  const L = V3INV.list.filter(i => i.access !== 'removed');
  const [f, setF] = useState('all'), [group, setGroup] = useState('all');
  const rows = L.filter(i => f === 'all' || i.access === f).sort((a, b) => b.balance - a.balance);
  const feed = filterAct(L.flatMap(i => i.activity), group, '').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  const sum = k => L.reduce((s, i) => s + i[k], 0);
  return <>
    <OrgHead title="Investors" sub="An investor is one wallet address · every investor belongs to an Organization, which carries the KYC · balances and activity are per wallet"
      acts={<PmsButton reason={NOT_SERVED + ' (export.csv · phase 2)'}><Icon n="download"/>Export</PmsButton>}/>
    <TopicSection>
      <div className="kpi-row"><KpiCard featured label="Investors" val={L.length} sub={`${new Set(L.map(i => i.org)).size} organizations`}/><KpiCard label="Combined balance" val={fmtUsdCompact(sum('balance'))} sub={`${fmtUsdCompact(sum('withdrawable'))} withdrawable`}/><KpiCard label="P&L · 30d" val={fmtSigned(sum('pnl30'))} tone={tone(sum('pnl30')) === 'pos' ? 'positive' : 'negative'}/><KpiCard label="Trading" val={L.filter(i => i.access === 'trading').length} tone="positive" sub="org approved + wallet whitelisted"/><KpiCard label="View only" val={L.filter(i => i.access === 'view_only').length} tone="warning" sub="no deposits, no trading"/><KpiCard label="Frozen" val={L.filter(i => i.access === 'frozen').length} tone="negative" sub="positions keep running"/></div>
      <PmsCard title="All investors" meta={<span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>click a row for wallet detail<Seg options={[{ v: 'all', l: 'All' }, { v: 'trading', l: 'Trading' }, { v: 'view_only', l: 'View only' }, { v: 'frozen', l: 'Frozen' }]} value={f} onChange={setF}/></span>} flush><InvestorTable rows={rows}/></PmsCard>
      <PmsCard title="Latest activity" meta={<ActivityFilters group={group} setGroup={setGroup}/>} flush><InvestorActivityTable rows={feed}/></PmsCard>
    </TopicSection>
  </>;
}

function OrgsList() {
  const FILTERS = [['all', 'All', () => true, ''], ['review', 'Needs review', o => ['submitted', 'in_review', 'second_approval'].includes(o.kyc_status), 'info'], ['client', 'Waiting on client', o => ['draft', 'info_requested'].includes(o.kyc_status), 'warning'], ['approved', 'Approved', o => o.kyc_status === 'approved', 'positive'], ['due', 'Re-KYC ≤ 30d', o => o.kyc_status === 'approved' && o.next_review_at && kDays(o.next_review_at) <= 30, 'warning'], ['frozen', 'Frozen', o => o.kyc_status === 'frozen', 'negative']];
  const [f, setF] = useState('all'), [empty, setEmpty] = useState(false), [ni, setNi] = useState(false);
  const { preview } = usePreviewRole();
  const base = KYC2.orgs.filter(o => empty || !o.empty);
  const rows = base.filter(FILTERS.find(x => x[0] === f)[2]);
  const mig = KYC2.orgs.filter(o => o.migrated), ok = mig.filter(o => o.kyc_status === 'approved').length;
  return <>
    <OrgHead title="Organizations" sub="KYC’d entities and people · each Organization owns one or more whitelisted wallets · onboarding happens in the main app, review happens here"
      acts={<><PmsButton reason={NOT_SERVED + ' (export.csv · phase 2)'}><Icon n="download"/>Export</PmsButton><PmsButton variant="primary" reason={!can(preview, 'admin') ? 'Needs admin' : NOT_SERVED + ' (investor.create · phase 2)'} onClick={() => setNi(true)}>+ New Investor</PmsButton></>}/>
    <div className="pms-card" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 16px' }}><div style={{ flex: 1 }}><p className="kpi__label">migration</p><p className="muted" style={{ fontSize: 12, marginTop: 3 }}>{mig.length} legacy investors became Organizations · {ok} KYC approved · {mig.length - ok} still view-only in the main app until approved</p></div><div style={{ width: 260 }}><ProgressBar value={ok / mig.length * 100} color="#68DA98"/></div></div>
    <TopicSection>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 8 }}>{FILTERS.map(([id, l, t, tn]) => { const n = base.filter(t).length; return <button key={id} onClick={() => setF(id)} className="pms-card" style={{ padding: '10px 12px', textAlign: 'left', borderColor: f === id ? 'rgba(176,108,255,.45)' : undefined, background: f === id ? 'linear-gradient(rgba(176,108,255,.07),rgba(176,108,255,.07)),#16171F' : undefined }}><span className="kpi__label" style={{ letterSpacing: '.08em' }}>{l}</span><span className={`mono kpi__val--${n && tn ? tn : ''}`} style={{ fontSize: 20, fontWeight: 700, marginTop: 4, display: 'block' }}>{n}</span></button>; })}</div>
      <PmsCard title={FILTERS.find(x => x[0] === f)[1]} meta={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>click a row to open the profile <Switch label="Show empty drafts" checked={empty} onChange={setEmpty}/></span>} flush>
        <PmsTable onRow={o => navigate('/investors/orgs/' + o.id)} columns={[
          { key: 'ref', label: 'ORGANIZATION', render: o => { const w = orgWallet(o); return <span style={{ display: 'flex', flexDirection: 'column' }}><b>{o.ref}</b><span className="muted" style={{ fontSize: 10.5 }} title={w?.address}>{w ? shortAddr(w.address) : 'no wallet'} · {o.migrated ? 'migrated' : 'new'}</span></span>; } },
          { key: 'type', label: 'TYPE', sans: true, sortable: true, render: o => OTYPE[o.type] }, { key: 'kyc_status', label: 'KYC', render: o => <KTag s={o.kyc_status}/> },
          { key: 'risk_tier', label: 'RISK', render: o => o.risk_tier ? <RoundTag tone={RISK_T[o.risk_tier]} sm>{o.risk_tier}</RoundTag> : <span className="muted">{NO}</span> },
          { key: 'wallet_count', label: 'WALLETS', num: true }, { key: 'submitted_at', label: 'SUBMITTED', sortable: true, render: o => <span className="muted">{kDate(o.submitted_at)}</span> },
          { key: 'next_review_at', label: 'NEXT REVIEW', sortable: true, render: o => { if (!o.next_review_at) return <span className="muted">{NO}</span>; const d = kDays(o.next_review_at); return <span className={d <= 30 ? 'warn' : 'muted'}>{kDate(o.next_review_at)}{d <= 30 && ` · ${d}d left`}</span>; } }]} rows={rows}/>
      </PmsCard>
    </TopicSection>
    <PmsModal open={ni} title="New investor" onClose={() => setNi(false)} foot={<><PmsButton variant="ghost" onClick={() => setNi(false)}>Cancel</PmsButton><PmsButton variant="primary" reason={NOT_SERVED + ' (investor.create · phase 2)'}>Create</PmsButton></>}>
      <Field label="Wallet address" req><Input value="" onChange={() => {}} placeholder="0x…" mono/></Field><Field label="Display name"><Input value="" onChange={() => {}}/></Field><Field label="Note"><Textarea value="" onChange={() => {}}/></Field>
    </PmsModal>
  </>;
}

function OrgProfile({ id }) {
  const o = KYC2.orgs.find(x => String(x.id) === id);
  const kyc = useKycAccess();
  const [tab, setTab] = useState('Overview'), [modal, setModal] = useState(null), [wa, setWa] = useState(null), [link, setLink] = useState(false);
  if (!o) return <p className="muted" style={{ fontSize: 12 }}>Organization {id} not found. <a onClick={() => navigate('/investors/orgs')}>Back to Organizations</a></p>;
  const ws = KYC2.wallets.filter(w => w.org === o.ref), pw = orgWallet(o), act = KYC2.activity[o.ref] || [];
  const invs = V3INV.byOrg(o.ref).filter(i => i.access !== 'removed'), invAct = invs.flatMap(i => i.activity).sort((a, b) => b.at.localeCompare(a.at));
  const tabs = ['Overview', `Investors · ${invs.length}`, `People · ${o.people.length}`, 'Documents', `Wallets · ${ws.length}`, `Activity · ${invAct.length + act.length}`];
  const [aSrc, setASrc] = useState('funds'), [group, setGroup] = useState('all'), [aInv, setAInv] = useState('');
  const isum = k => invs.reduce((s, i) => s + i[k], 0);
  const orgAlloc = Object.values(invs.reduce((m, i) => { i.alloc.forEach(([sid, n, p]) => { m[sid] = m[sid] || [sid, n, 0]; m[sid][2] += i.balance * p / 100; }); return m; }, {}));
  const t = tab.split(' ·')[0];
  const hint = kyc ? undefined : NO_KYC;
  const STEPS = ['Account', 'Entity', 'People', 'Documents', 'Wallet', 'Review', 'Approved'];
  const cur = { draft: 1, info_requested: 3, submitted: 5, in_review: 5, second_approval: 5, approved: 7, frozen: 7, rejected: 5, dissolved: 0 }[o.kyc_status];
  return <>
    <a className="muted" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/investors/orgs')}>← Organizations</a>
    <div className="page-head"><div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h1>{o.ref}</h1><KTag s={o.kyc_status} sm={false}/>{o.risk_tier && <RoundTag tone={RISK_T[o.risk_tier]}>{o.risk_tier} risk</RoundTag>}</div>
      <p className="page-head__sub"><span className="mono">#{o.id}</span> · {OTYPE[o.type]} · {o.migrated ? 'Migrated from a legacy investor' : 'New onboarding'}{pw && <> · Primary wallet <b className="mono" style={{ color: '#fff' }}>{pw.address}</b></>}</p></div>
      <div className="page-head__acts">
        {['submitted', 'in_review', 'second_approval'].includes(o.kyc_status) && <PmsButton variant="primary" reason={hint} onClick={() => navigate('/investors/kyc/' + o.id)}>{o.kyc_status === 'second_approval' ? 'Give 2nd approval' : 'Open review'}</PmsButton>}
        {o.kyc_status === 'approved' && <PmsButton variant="ghost" reason={hint} onClick={() => setModal('rekyc')}>Force re-KYC</PmsButton>}
        {o.kyc_status === 'frozen' ? <PmsButton reason={hint} onClick={() => setModal('unfreeze')}>Unfreeze</PmsButton> : o.kyc_status !== 'dissolved' && <PmsButton variant="danger" reason={hint} onClick={() => setModal('freeze')}>Freeze organization</PmsButton>}
      </div></div>
    {o.kyc_status === 'frozen' && <div className="note note--neg"><b>Frozen</b> · {o.freeze_code?.replace(/_/g, ' ')} · withdrawals and new deposits are blocked; existing positions keep running.</div>}
    {o.kyc_status === 'info_requested' && <div className="note note--warn"><b>Waiting on client</b> · {o.info_reason?.replace(/_/g, ' ')} · main-app access is view only until re-approved.</div>}
    <ol style={{ display: 'flex', gap: 6 }}>{STEPS.map((s, i) => <li key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ height: 4, borderRadius: 2, background: i < cur ? '#68DA98' : i === cur ? '#a84aff' : 'rgba(255,255,255,.08)' }}></span><span className={i <= cur ? '' : 'muted'} style={{ fontSize: 10.5, fontWeight: 600 }}>{s}</span></li>)}</ol>
    <div><Seg options={tabs} value={tab} onChange={setTab}/></div>
    {t === 'Overview' && <div className="grid12">
      <div style={{ gridColumn: '1 / 7' }}><PmsCard title="KYC case" meta={o.review_kind !== 'initial' ? o.review_kind : null}><dl className="dl">{[['Status', KS[o.kyc_status][1]], ['Submitted', kDate(o.submitted_at)], ['Reviewer', o.claimed_by || 'unassigned'], ['First approval', o.first_approver ? `${o.first_approver} · ${o.first_at}` : NO], ['Approved', kDate(o.approved_at)], ['Next review', kDate(o.next_review_at)]].map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl></PmsCard></div>
      <div style={{ gridColumn: '7 / -1' }}><PmsCard title="Investors" meta="one per wallet" actions={<a style={{ fontSize: 11.5 }} onClick={() => setTab(tabs[1])}>All {invs.length} →</a>}><dl className="dl"><dt>Combined balance</dt><dd>{fmtUsd(isum('balance'))}</dd><dt>P&L · 30d</dt><dd className={tone(isum('pnl30'))}>{fmtSigned(isum('pnl30'))}</dd><dt>Access</dt><dd>{Object.keys(ACC).filter(a => invs.some(i => i.access === a)).map(a => `${invs.filter(i => i.access === a).length} ${ACC[a][1].toLowerCase()}`).join(' · ') || NO}</dd><dt>Type</dt><dd>{OTYPE[o.type]}</dd><dt>Gating</dt><dd>global mode · shadow</dd></dl></PmsCard></div>
    </div>}
    {t === 'People' && <PmsCard title="People" meta={kyc ? null : 'names and details hidden for this role'} flush><PmsTable columns={[{ key: 'name', label: 'PERSON', sans: true, render: p => kyc ? p.name : p.name.split(' ').map(x => x[0] + '•••').join(' ') }, { key: 'role', label: 'ROLE', sans: true, render: p => p.role.replace(/_/g, ' ') }, ...(kyc ? [{ key: 'own', label: 'OWNERSHIP', num: true, render: p => p.ownership_pct != null ? p.ownership_pct + '%' : NO }, { key: 'pep', label: 'PEP', render: p => p.pep ? <RoundTag tone="negative" sm>PEP</RoundTag> : <span className="muted">no</span> }] : []), ...['ID', 'LIVENESS', 'ADDRESS', 'SCREENING'].map((l, k) => ({ key: l, label: l, center: true, render: p => <KycCheck status={p.checks[k]}/> }))]} rows={o.people}/></PmsCard>}
    {t === 'Documents' && <PmsCard title="Documents"><p className="muted" style={{ fontSize: 12 }}>Documents are not served in this release. They come with the KYC review slice.</p></PmsCard>}
    {t === 'Investors' && <>
      <div className="kpi-row"><KpiCard featured label="Investors" val={invs.length} sub={`${invs.filter(i => i.access === 'trading').length} trading`}/><KpiCard label="Combined balance" val={fmtUsdCompact(isum('balance'))} sub={`${fmtUsdCompact(isum('withdrawable'))} withdrawable · ${fmtUsdCompact(isum('locked'))} locked`}/><KpiCard label="P&L · 30d" val={fmtSigned(isum('pnl30'))} tone={isum('pnl30') >= 0 ? 'positive' : 'negative'}/><KpiCard label="P&L · ITD" val={fmtSigned(isum('pnlItd'))} tone="positive" sub={`${fmtUsdCompact(isum('deposited'))} net deposited`}/>
        <div className="pms-card" style={{ padding: '12px 16px', flex: '1.4 1 260px', minWidth: 0 }}><p className="kpi__label">Allocation · organization</p>{orgAlloc.length ? <><div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', margin: '10px 0 6px' }}>{orgAlloc.map(([sid, , v]) => <span key={sid} style={{ width: v / isum('balance') * 100 + '%', background: stratColor(sid) }}></span>)}</div><p className="muted" style={{ fontSize: 10.5 }}>{orgAlloc.map(([, n, v]) => `${n} ${Math.round(v / isum('balance') * 100)}%`).join(' · ')}</p></> : <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>No funded investors yet</p>}</div></div>
      {o.kyc_status !== 'approved' && o.kyc_status !== 'frozen' && <div className="note note--warn">KYC not approved · every investor of this Organization is <b>view only</b> in the main app: no deposits, no trading.</div>}
      <PmsCard title="Investors" meta="one wallet = one investor · click a row for balances and activity" actions={<PmsButton sm reason={!kyc ? NO_KYC : o.kyc_status !== 'approved' ? 'An approved organization only' : undefined} onClick={() => setLink(true)}>+ Link wallet</PmsButton>} flush><InvestorTable rows={invs} showOrg={false}/></PmsCard>
    </>}
    {t === 'Wallets' && <PmsCard title="Wallets" meta="self-hosted only" actions={<PmsButton sm reason={!kyc ? NO_KYC : o.kyc_status !== 'approved' ? 'An approved organization only' : undefined} onClick={() => setLink(true)}>+ Link wallet</PmsButton>} flush>
      <PmsTable columns={[{ key: 'address', label: 'WALLET', render: w => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><span title={w.address}>{shortAddr(w.address)}</span>{w.is_primary && <RoundTag sm>primary</RoundTag>}</span> }, { key: 'chain', label: 'CHAIN', render: () => <RoundTag sm>EVM · Ethereum</RoundTag> }, { key: 'source', label: 'ADDED VIA', sans: true, render: w => <span className="muted">{SRC[w.source]}</span> }, { key: 's', label: 'SIGNATURE', center: true, render: w => <KycCheck status={w.signature_status}/> }, { key: 'e', label: 'SIGNATORY EMAIL', center: true, render: w => <KycCheck status={w.signatory_email_status}/> }, { key: 'h', label: 'ON-CHAIN', center: true, render: w => <KycCheck status={w.onchain_history}/> },
        { key: 'status', label: 'STATUS', render: w => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><WTag s={w.status}/>{w.status === 'cooldown' && <span className="muted">31h left</span>}{w.status === 'frozen' && !w.frozen_self && <span className="muted">with the organization</span>}</span> },
        { key: 'a', label: '', render: w => <ActionsMenu items={[w.status === 'frozen' ? { label: 'Unfreeze', reason: hint, onClick: () => setWa(['Unfreeze', w]) } : { label: 'Freeze', reason: w.status === 'removed' ? 'Removed' : hint, onClick: () => setWa(['Freeze', w]) }, { label: 'On-chain mark', reason: hint, onClick: () => setWa(['Mark on-chain history', w]) }, { label: 'Remove', danger: true, reason: w.status === 'removed' ? 'Already removed' : hint, onClick: () => setWa(['Remove', w]) }]}/> }]} rows={ws.map(w => ({ ...w, id: w.ref }))}/></PmsCard>}
    {t === 'Activity' && <div><Seg options={[{ v: 'funds', l: `Investor activity · ${invAct.length}` }, { v: 'kyc', l: `KYC & wallets · ${act.length}` }]} value={aSrc} onChange={setASrc}/></div>}
    {t === 'Activity' && aSrc === 'funds' && <PmsCard title="Investor activity" meta={<ActivityFilters group={group} setGroup={setGroup} inv={aInv} setInv={setAInv} invs={invs}/>} flush><InvestorActivityTable rows={filterAct(invAct, group, aInv)}/></PmsCard>}
    {t === 'Activity' && aSrc === 'kyc' && <PmsCard title="KYC & wallet events" meta={kyc ? null : 'reasons hidden for this role'} flush><PmsTable columns={[{ key: 'at', label: 'TIME (UTC)', render: e => <span className="muted">{e.at}</span> }, { key: 'event', label: 'EVENT' }, { key: 'actor', label: 'ACTOR' }, { key: 'chg', label: 'CHANGE', render: e => e.to ? <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{e.from && <>{(KS[e.from] || WS_[e.from]) ? <RoundTag sm tone={(KS[e.from] || WS_[e.from])[0]}>{(KS[e.from] || WS_[e.from])[1]}</RoundTag> : e.from}<span className="muted">→</span></>}<RoundTag sm tone={(KS[e.to] || WS_[e.to])[0]}>{(KS[e.to] || WS_[e.to])[1]}</RoundTag></span> : NO }, { key: 'subject', label: 'SUBJECT', render: e => e.subject || o.ref }]} rows={act.map((e, i) => ({ ...e, id: i }))}/></PmsCard>}
    <KycControlConfirm open={modal === 'freeze'} title={`Freeze ${o.ref}`} desc={<>All wallets of this Organization are frozen. <b>Withdrawals and new deposits are blocked; existing positions keep running.</b></>} codes={KYC2.REASON_CODES.freeze} onClose={() => setModal(null)}/>
    <KycControlConfirm open={modal === 'unfreeze'} title={`Unfreeze ${o.ref}`} preview={false} desc="Restores the previous KYC status and re-enables all wallets that were frozen with the Organization." codes={KYC2.REASON_CODES.unfreeze} onClose={() => setModal(null)}/>
    <KycControlConfirm open={modal === 'rekyc'} title="Force re-KYC" desc={<>The client must re-submit KYC in the main app. <b>Main-app access drops to view only until re-approved.</b> The client gets no message about it yet.</>} codes={KYC2.REASON_CODES.rekyc} onClose={() => setModal(null)}/>
    <KycControlConfirm open={!!wa} title={wa ? `${wa[0]} · ${shortAddr(wa[1].address)}` : ''} preview={wa && wa[0] !== 'Mark on-chain history'} desc={wa && wa[0] === 'Mark on-chain history' ? 'Clean takes review_cleared only; flagged takes an exposure code. A mark cannot go back to unreviewed and does not freeze the wallet.' : 'Applies to this wallet only.'} codes={wa && wa[0] === 'Remove' ? KYC2.REASON_CODES.remove : KYC2.REASON_CODES.wallet_freeze} onClose={() => setWa(null)}/>
    <PmsModal open={link} title={`Link wallet · ${o.ref}`} onClose={() => setLink(false)} foot={<><PmsButton variant="ghost" onClick={() => setLink(false)}>Cancel</PmsButton><PmsButton variant="primary" onClick={() => setLink(false)}>Link wallet</PmsButton></>}>
      <Field label="Chain" hint="kyc.link_chains · the contract wallet's chain"><Select value="1" onChange={() => {}} options={[{ v: '1', l: 'Ethereum (1)' }, { v: '42161', l: 'Arbitrum (42161)' }]}/></Field>
      <Field label="Address" req hint="Self-hosted EVM · 0x and 40 hex · sent lower-cased"><Input value="" onChange={() => {}} placeholder="0x…" mono/></Field>
      <Field label="Label"><Select value="" onChange={() => {}} options={[{ v: '', l: 'None' }, 'treasury', 'operations', 'trading', 'cold_storage', 'other']}/></Field>
      <Field label="Authenticator code" req><TotpCodeInput value="" onChange={() => {}}/></Field>
      <div className="note">The wallet starts in Awaiting email. If the address belongs to an empty draft, the form offers to merge that draft first.</div>
    </PmsModal>
  </>;
}

function KycReviewTab() {
  const cases = KYC2.orgs.filter(o => ['submitted', 'in_review', 'second_approval'].includes(o.kyc_status)).map(o => ({ ...o, wait: -kDays(o.submitted_at) })).sort((a, b) => b.wait - a.wait);
  const sla = KYC2.settings.kyc_review_sla_days;
  return <>
    <OrgHead title="KYC review" sub="Organizations waiting for a compliance decision · high-risk cases need a second officer"/>
    <TopicSection><div className="kpi-row"><KpiCard tone="info" label="To review" val={cases.filter(c => c.kyc_status !== 'second_approval').length}/><KpiCard tone="accent" label="2nd approval" val={cases.filter(c => c.kyc_status === 'second_approval').length}/><KpiCard tone="warning" label="Waiting on client" val={KYC2.orgs.filter(o => ['draft', 'info_requested'].includes(o.kyc_status)).length}/><KpiCard tone={cases[0]?.wait > sla ? 'warning' : undefined} label="Oldest case" val={cases[0] ? cases[0].wait + 'd' : NO}/></div>
      <PmsCard title="Cases" meta={`oldest first · review deadline ${sla} days`} flush><PmsTable onRow={c => navigate('/investors/kyc/' + c.id)} columns={[
        { key: 'ref', label: 'ORGANIZATION', render: c => { const w = orgWallet(c); return <span style={{ display: 'flex', flexDirection: 'column' }}><b>{c.ref}</b><span className="muted" style={{ fontSize: 10.5 }}>{w ? shortAddr(w.address) : 'no wallet'} · {c.migrated ? 'migrated' : 'new'}</span></span>; } },
        { key: 'type', label: 'TYPE', sans: true, render: c => OTYPE[c.type] }, { key: 'kyc_status', label: 'STAGE', render: c => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><KTag s={c.kyc_status}/>{c.review_kind !== 'initial' && <span className="muted">{c.review_kind === 'annual' ? 'annual review' : 'forced re-KYC'}</span>}</span> },
        { key: 'risk_tier', label: 'RISK', render: c => c.risk_tier ? <RoundTag tone={RISK_T[c.risk_tier]} sm>{c.risk_tier}</RoundTag> : <span className="muted">not set</span> },
        { key: 'wait', label: 'WAITING', num: true, sortable: true, render: c => <span className={c.wait > sla ? 'warn' : ''}>{c.wait}d</span> },
        { key: 'rev', label: 'REVIEWER', render: c => <span style={{ display: 'flex', flexDirection: 'column' }}>{c.claimed_by || <span className="muted">unassigned</span>}{c.first_approver && <span className="muted" style={{ fontSize: 10.5 }}>1st: {c.first_approver}</span>}</span> },
        { key: 'go', label: '', num: true, render: () => <a>Open case →</a> }]} rows={cases}/></PmsCard></TopicSection>
  </>;
}
function KycCaseView({ id }) {
  const o = KYC2.orgs.find(x => String(x.id) === id);
  const [left, setLeft] = useState('Documents'), [reveal, setReveal] = useState(false), [ticks, setTicks] = useState({}), [risk, setRisk] = useState(o?.risk_tier || ''), [dec, setDec] = useState(null), [view, setView] = useState(null), [dlRef, setDlRef] = useState(null);
  const access = useKycAccess();
  if (!o) return <p className="muted" style={{ fontSize: 12 }}>No KYC case for {id}. <a onClick={() => navigate('/investors/kyc')}>Back to KYC review</a></p>;
  const mine = o.claimed_by === KYC2.ME || o.kyc_status === 'second_approval';
  const SECT = [['Entity verification', ['Registration documents match the public registry', 'Registered address verified (document under 3 months)', 'Directors and signatories match the board resolution', 'All UBOs ≥ 25% identified']], ['People', ['Every UBO, director and signatory has ID, liveness and proof of address checked']], ['Screening', ['Sanctions lists checked for the entity and every person', 'PEP check done; any PEP documented with EDD', 'Adverse media search has no material findings']], ['Source of funds', ['Source of funds / wealth is plausible and evidenced']], ['Wallet', ['Primary wallet sign-in signature verified', 'Wallet is self-hosted', 'On-chain history reviewed']]];
  const all = SECT.flatMap(([s, it]) => it.map((_, i) => s + i)), done = all.filter(k => ticks[k]).length;
  const rows = kycDocRows(o), limited = window.V3_DOCRESP === 'limit';
  const openDoc = (ref, refs, item) => setView({ ref, refs, item });
  const download = ref => { setDlRef(ref); setTimeout(() => setDlRef(null), 2500); };
  return <>
    <a className="muted" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/investors/kyc')}>← KYC review</a>
    <div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h1 style={{ fontSize: 24, fontWeight: 700 }}>{o.ref}</h1><KTag s={o.kyc_status} sm={false}/><RoundTag>{OTYPE[o.type]}</RoundTag>{o.review_kind !== 'initial' && <RoundTag>{o.review_kind === 'annual' ? 'Annual review' : 'Forced re-KYC'}</RoundTag>}
      {reveal ? <RoundTag tone="accent">names shown · 9:42 left</RoundTag> : <PmsButton sm variant="ghost" onClick={() => setReveal(true)}>Reveal names</PmsButton>}</div>
      <p className="page-head__sub" style={{ marginTop: 6 }}>{reveal && <b style={{ color: '#fff' }}>Halden Capital Partners Ltd</b>} Jurisdiction <b className="mono" style={{ color: '#fff' }}>KY</b> · LEI <b className="mono" style={{ color: '#fff' }}>{reveal ? '5493001KJTIIGC8Y1R12' : '•••'}</b> · Reviewer <b style={{ color: '#fff' }}>{o.claimed_by === KYC2.ME ? 'you' : o.claimed_by || 'unassigned'}</b> · As of 05 Nov 2026 17:08 · <a onClick={() => navigate('/investors/orgs/' + o.id)}>Open profile →</a></p></div>
    {o.kyc_status === 'second_approval' && <div className="note note--info"><b>Second approval</b> · First approval {o.first_at}. Checks below are the first reviewer’s — re-verify anything you disagree with.</div>}
    <div className="grid12">
      <div style={{ gridColumn: '1 / 9' }}><PmsCard title={<Seg options={['Documents', 'People', 'Record', 'Activity']} value={left} onChange={setLeft}/>} flush>
        {left === 'Documents' && <><PmsTable columns={[{ key: 'doc_type', label: 'DOCUMENT', sans: true, render: d => <div className="kdoc-cell"><span>{DOC_LABEL(d.doc_type)}</span><span className="mono muted">{d.ref}</span></div> }, { key: 'person', label: 'PERSON', render: d => d.person_masked ? (reveal ? d.person.name : d.person_masked) : <span className="muted">entity</span> }, { key: 'status', label: 'STATUS', render: d => <div className="kdoc-cell"><RoundTag sm tone={{ verified: 'positive', uploaded: 'info', expired: 'negative', missing: 'neutral' }[d.status]}>{d.status === 'missing' ? 'requested' : d.status}</RoundTag>{d.expires_at && <span className="muted">exp {kDate(d.expires_at)}</span>}</div> }, { key: 'f', label: 'FILE · UPLOADED', render: d => <div className="kdoc-cell"><span className="muted">{fileLabel(d)}</span><span className="muted">{d.uploaded_at ? kDate(d.uploaded_at) : NO}</span></div> }, { key: 'a', label: '', num: true, render: d => dlRef === d.ref ? <RoundTag sm tone="positive">downloading…</RoundTag> : <DocActions d={d} access={access} limited={limited} onOpen={r => openDoc(r)} onDownload={download}/> }]} rows={rows} empty="No documents uploaded yet"/>
          {rows.length > 0 && <div className="pt__foot"><span>{rows.length} documents · {rows.filter(r => r.has_file).length} with a file</span><span>{access ? 'Opening or downloading a document is logged.' : 'Documents need the KYC approve role.'}</span></div>}</>}
        {left === 'People' && <PmsTable columns={[{ key: 'name', label: 'PERSON', sans: true, render: p => reveal ? p.name : p.name.split(' ').map(x => x[0] + '•••').join(' ') }, { key: 'role', label: 'ROLE', render: p => p.role.replace(/_/g, ' ') }, { key: 'own', label: 'OWN.', num: true, render: p => p.ownership_pct != null ? p.ownership_pct + '%' : NO }, { key: 'pep', label: 'PEP', render: p => p.pep ? <RoundTag tone="negative" sm>PEP</RoundTag> : <span className="muted">no</span> }, ...['ID', 'LIVE', 'ADDR', 'SCREEN'].map((l, k) => ({ key: l, label: l, center: true, render: p => <KycCheck status={p.checks[k]}/> }))]} rows={o.people}/>}
        {left === 'Record' && <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}><dl className="dl"><dt>Notes</dt><dd>{reveal ? 'Fund administrator confirmed NAV source.' : 'hidden · reveal names to read'}</dd></dl><PmsButton sm variant="ghost" reason={!reveal ? 'Reveal names first' : location.protocol !== 'https:' ? 'HTTPS only (notes are x-secret-args)' : undefined}>Edit notes</PmsButton></div>}
        {left === 'Activity' && <PmsTable columns={[{ key: 'at', label: 'TIME', render: e => <span className="muted">{e.at}</span> }, { key: 'event', label: 'EVENT' }, { key: 'actor', label: 'ACTOR' }]} rows={(KYC2.activity[o.ref] || []).map((e, i) => ({ ...e, id: i }))}/>}
      </PmsCard></div>
      <div style={{ gridColumn: '9 / -1' }}><PmsCard title="Checklist" meta={`${done} of ${all.length} · saves on change`}>
        <div className="note" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>{o.claimed_by ? <>Claimed by <b className="mono" style={{ color: '#fff' }}>{o.claimed_by === KYC2.ME ? 'you' : o.claimed_by}</b>{o.claimed_by !== KYC2.ME && <span style={{ marginLeft: 'auto' }}><PmsButton sm>Take over</PmsButton></span>}</> : <>Unclaimed<span style={{ marginLeft: 'auto' }}><PmsButton sm variant="primary">Claim case</PmsButton></span></>}</div>
        {SECT.map(([s, it]) => <div key={s} style={{ marginBottom: 10 }}><p className="kpi__label" style={{ marginBottom: 6 }}>{s}</p>{it.map((x, i) => { const k = s + i; return <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0' }}><label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flex: 1, fontSize: 11.5, cursor: mine ? 'pointer' : 'default', color: ticks[k] ? '#fff' : 'var(--neutral-90)' }}><input type="checkbox" disabled={!mine} checked={!!ticks[k]} onChange={() => setTicks(t => ({ ...t, [k]: !t[k] }))} style={{ accentColor: '#a84aff', marginTop: 2 }}/>{x}</label><EvidenceLink refs={evidenceFor(k, rows)} access={access} onOpen={(r, refs) => openDoc(r, refs, { key: k, text: x })}/></div>; })}</div>)}
        <Field label="Risk tier" req><Seg options={['low', 'medium', 'high']} value={risk} onChange={x => mine && setRisk(x)}/></Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}><PmsButton variant="ghost" reason={!mine ? 'Claim the case first' : undefined} onClick={() => setDec('info')}>Request info</PmsButton><PmsButton variant="danger" reason={!mine ? 'Claim the case first' : undefined} onClick={() => setDec('reject')}>Reject</PmsButton><span style={{ flex: 1 }}></span><PmsButton variant="primary" reason={!mine ? 'Claim the case first' : done < all.length ? `${all.length - done} checks left` : !risk ? 'Choose a risk tier' : undefined} onClick={() => setDec('approve')}>{o.kyc_status === 'second_approval' ? 'Give 2nd approval' : risk === 'high' ? 'Approve (1 of 2)' : 'Approve'}</PmsButton></div>
      </PmsCard></div>
    </div>
    {view && <DocViewer key={view.ref + (view.item?.key || '')} view={view} rows={rows} SECT={SECT} ticks={ticks} setTicks={setTicks} mine={mine} onClose={() => setView(null)}/>}
    <KycControlConfirm open={!!dec} preview={dec === 'reject'} title={{ info: 'Request info', reject: 'Reject', approve: 'Approve' }[dec] + ' · ' + o.ref} desc={{ info: 'Sets Info requested; the client reads the code’s fixed sentence, then your message (HTTPS only).', reject: 'Rejected clients’ balances have no exit yet. Users with balance: 1 · allocations: 2.', approve: risk === 'high' ? 'High risk: this is the first approval; a second officer must approve.' : 'Approves the organization; the primary wallet starts its cool-down.' }[dec || 'info']} codes={dec === 'reject' ? KYC2.REASON_CODES.reject : dec === 'info' ? KYC2.REASON_CODES.request_info : ['review_complete']} onClose={() => setDec(null)}/>
  </>;
}
function WhitelistingTab() {
  const [view, setView] = useState('Queue'), [dec, setDec] = useState(null);
  const rows = KYC2.wallets.filter(w => view === 'Queue' ? ['awaiting_email', 'awaiting_connect', 'review', 'cooldown'].includes(w.status) : w.status === 'pending_kyc').map(w => ({ ...w, id: w.ref }));
  const ready = w => w.signatory_email_status === 'confirmed' && w.signature_status === 'verified' && w.onchain_history === 'clean';
  return <>
    <OrgHead title="Wallet whitelisting" sub="Wallets on their way to the whitelist · self-hosted only"/>
    <ol style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{['Ops links the wallet', 'Signatory confirms by email', 'Wallet signs in on the main app', 'Compliance approves', 'Cool-down', 'Whitelisted'].map((s, i) => <li key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', fontSize: 11 }}><span className="mono" style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(168,74,255,.2)', color: '#c68eff', display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 700 }}>{i + 1}</span>{s}</li>)}</ol>
    <div><Seg options={['Queue', 'Pending KYC']} value={view} onChange={setView}/></div>
    <TopicSection><PmsCard flush><PmsTable columns={[
      { key: 'address', label: 'WALLET', render: w => <span style={{ display: 'flex', flexDirection: 'column' }}><span title={w.address}>{shortAddr(w.address)}</span><span className="muted" style={{ fontSize: 10.5 }}>{w.ref}{w.is_primary && ' · primary'}</span></span> },
      { key: 'chain', label: 'CHAIN', render: () => <RoundTag sm>EVM</RoundTag> }, { key: 'org', label: 'ORGANIZATION', render: w => { const o = KYC2.orgs.find(x => x.ref === w.org); return <span style={{ display: 'flex', flexDirection: 'column' }}><a onClick={() => navigate('/investors/orgs/' + o.id)}>{w.org}</a><span className="muted" style={{ fontSize: 10.5 }}>{SRC[w.source]}</span></span>; } },
      { key: 'chk', label: 'EMAIL / SIGN-IN / HISTORY', render: w => <span style={{ display: 'inline-flex', gap: 4 }}><KycCheck status={w.signatory_email_status}/><KycCheck status={w.signature_status}/><KycCheck status={w.onchain_history}/></span> },
      { key: 'status', label: 'STATUS', render: w => <span style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}><WTag s={w.status}/>{w.first_approver && w.status === 'review' && <span className="muted" style={{ fontSize: 10.5 }}>1st approval 04 Nov</span>}</span> },
      { key: 'added', label: 'ADDED', render: () => <span className="muted">28 Oct 2026</span> },
      { key: 'action', label: 'ACTION', num: true, render: w => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{w.status === 'awaiting_email' && <PmsButton sm variant="ghost" onClick={() => setDec(['Resend email', w])}>Resend email</PmsButton>}{w.status === 'awaiting_connect' && <span className="muted">waiting for sign-in</span>}{w.status === 'review' && <PmsButton sm variant="primary" reason={!ready(w) ? 'Needs the email confirmed, the wallet signed in and a clean on-chain history' : undefined} onClick={() => setDec(['Approve', w])}>{w.first_approver ? '2nd approval' : 'Approve'}</PmsButton>}<ActionsMenu items={[{ label: 'Mark email confirmed', reason: NOT_SERVED }, { label: 'Reject', reason: location.protocol !== 'https:' ? 'HTTPS only' : undefined, onClick: () => setDec(['Reject', w]) }, { label: 'On-chain mark', onClick: () => setDec(['On-chain mark', w]) }, { label: 'Freeze', onClick: () => setDec(['Freeze', w]) }]}/></span> }]} rows={rows} empty="No wallets in this view"/></PmsCard></TopicSection>
    <KycControlConfirm open={!!dec} preview={dec && dec[0] === 'Reject'} title={dec ? `${dec[0]} · ${shortAddr(dec[1].address)}` : ''} desc={dec && dec[0] === 'Resend email' ? 'The email goes to the organization’s signatory. 20 per user per hour.' : dec && dec[0] === 'Approve' ? 'A high-risk organization’s first approval keeps the wallet in review until a second officer approves; the final one starts the cool-down.' : 'Applies to this wallet.'} codes={dec && dec[0] === 'Reject' ? KYC2.REASON_CODES.wallet_reject : ['review_complete']} onClose={() => setDec(null)}/>
  </>;
}
function QuarantineTab() {
  const kyc = useKycAccess();
  const [dec, setDec] = useState(null);
  const QR = { sender_not_whitelisted: 'Sender not whitelisted', org_not_approved: 'Organization not approved', no_organization: 'No organization', org_frozen: 'Organization frozen' };
  return <>
    <OrgHead title="Quarantine" sub="Deposits held by the KYC deposit policy · held until the sender is whitelisted, the deposit is released or the funds are returned"/>
    <div className="note note--info"><b>Rule</b> · If the receiving deposit address belongs to an approved Organization, whitelisting of the sender starts automatically. The funds credit once the sender finishes the cool-down.</div>
    <TopicSection><div className="kpi-row"><KpiCard tone="warning" label="Held" val={KYC2.quarantine.filter(q => q.status === 'held').length}/><KpiCard tone="info" label="Whitelisting" val="0"/><KpiCard label="Returning" val="0"/><KpiCard label="Resolved · 30d" val="6"/></div>
      <PmsCard title="Held deposits" flush><PmsTable columns={[
        { key: 'received_at', label: 'RECEIVED', render: q => <span className="muted">{q.received_at}</span> }, { key: 'amount', label: 'AMOUNT', num: true, render: q => <b>{q.coin === 'ETH' ? q.amount + ' ETH' : fmtUsd(q.amount) + ' ' + q.coin}</b> },
        { key: 'net', label: 'NETWORK', render: q => <RoundTag sm>{q.network_code}</RoundTag> },
        { key: 'sender', label: 'SENDER', render: q => <span style={{ display: 'flex', flexDirection: 'column' }}><span title={q.observed_from_address}>{shortAddr(q.observed_from_address)}</span><span className="muted" style={{ fontSize: 10.5 }}>{q.sender_verified ? 'verified' : 'unverified'} · via {q.observed_via.replace(/_/g, ' ')}</span></span> },
        { key: 'tx', label: 'TX', render: q => <span className="muted" title={q.tx_hash}>{shortAddr(q.tx_hash)}</span> },
        { key: 'org', label: 'ORGANIZATION', render: q => q.org ? <a onClick={() => navigate('/investors/orgs/' + KYC2.orgs.find(o => o.ref === q.org).id)}>{q.org}</a> : <span className="muted">no match</span> },
        { key: 'reason', label: 'REASON', sans: true, render: q => QR[q.reason] || q.reason }, { key: 'status', label: 'STATUS', render: () => <RoundTag tone="warning" sm>Held</RoundTag> },
        { key: 'a', label: '', num: true, render: q => <span style={{ display: 'inline-flex', gap: 6 }}><PmsButton sm variant="primary" reason={!kyc ? NO_KYC : !q.org ? 'No matched organization' : undefined} onClick={() => setDec(['Release', q])}>Release</PmsButton><ActionsMenu items={[{ label: 'Return to sender', reason: !kyc ? NO_KYC : !q.sender_verified ? 'Sender unverified' : undefined, onClick: () => setDec(['Return to sender', q]) }, { label: 'Re-open', reason: 'Off on every host (reopen_disabled)' }, { label: 'Close deposit', reason: 'Off on every host (close_disabled)' }]}/></span> }]} rows={KYC2.quarantine.map(q => ({ ...q, id: q.ref }))}/></PmsCard></TopicSection>
    <KycControlConfirm open={!!dec} preview={false} title={dec ? `${dec[0]} · ${dec[1].ref}` : ''} desc={dec && dec[0] === 'Release' ? 'Credits the exchange record’s amount. The backend re-verifies the sender first (up to 15 s).' : <>Return quote · sender {dec && shortAddr(dec[1].observed_from_address)} · gross {dec && dec[1].amount} {dec && dec[1].coin} · exchange fee 1.20 · <b>net 249,998.80</b> · approvals needed: 2</>} codes={dec && dec[0] === 'Release' ? ['review_cleared', 'error_corrected'] : KYC2.REASON_CODES.return} onClose={() => setDec(null)}/>
  </>;
}
function InvestorsPage({ segs }) {
  const kyc = useKycAccess();
  if (/^\d+$/.test(segs[0] || '')) return <section className="basic-page"><InvestorDetailsPage id={segs[0]}/></section>;
  let [t, id] = segs; t = t || 'orgs';
  if (!kyc && ['kyc', 'whitelisting'].includes(t)) t = 'orgs';
  const nr = KYC2.orgs.filter(o => ['submitted', 'in_review', 'second_approval'].includes(o.kyc_status)).length;
  const tabs = [{ id: 'orgs', label: 'Organizations' }, { id: 'accounts', label: 'Investors', badge: { v: String(V3INV.list.filter(i => i.access !== 'removed').length), kind: 'count' } }, kyc && { id: 'kyc', label: 'KYC review', badge: nr ? { v: String(nr), kind: 'warn' } : undefined }, kyc && { id: 'whitelisting', label: 'Wallet whitelisting' }, { id: 'quarantine', label: 'Quarantine', badge: { v: String(KYC2.quarantine.length), kind: 'warn' } }].filter(Boolean);
  return <section className="tab-page"><PmsTabs tabs={tabs} active={t} onChange={x => navigate('/investors/' + x)}/>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{t === 'orgs' ? (id ? <OrgProfile id={id}/> : <OrgsList/>) : t === 'accounts' ? <InvestorsListTab/> : t === 'kyc' ? (id ? <KycCaseView id={id}/> : <KycReviewTab/>) : t === 'whitelisting' ? <WhitelistingTab/> : <QuarantineTab/>}</div></section>;
}
Object.assign(window, { InvestorsPage, KycCheck, KTag, WTag, KS, WS_, SRC, OTYPE, AccTag, InvestorActivityTable, ActivityFilters, filterAct, InvestorTable, AllocBar, ACC });
