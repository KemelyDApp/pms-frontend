/* v2 — KYC queue, review panel, wallet whitelisting, quarantine (view-only until M9e). */

const K2_CHECKLIST = (type) => [
  { id: 'entity', title: type === 'individual' ? 'Identity' : 'Entity verification', items: type === 'individual'
    ? ['ID document is genuine, valid and matches the applicant', 'Liveness capture matches the ID photo', 'Proof of address is under 3 months old', 'Tax residency self-certification is complete']
    : ['Registration documents match the public registry', 'Registered address verified (document under 3 months)', 'Directors and signatories match the board resolution', type === 'trust' ? 'Trustees, settlor, protector and beneficiaries identified' : 'All UBOs ≥ 25% identified; ownership chart complete'] },
  ...(type === 'individual' ? [] : [{ id: 'people', title: 'People', items: ['Every UBO, director and signatory has ID, liveness and proof of address checked'] }]),
  { id: 'screen', title: 'Screening', items: ['Sanctions lists checked for the entity and every person', 'PEP check done; any PEP documented with enhanced due diligence', 'Adverse media search has no material findings'] },
  { id: 'sof', title: 'Source of funds', items: ['Source of funds / wealth is plausible and evidenced'] },
  { id: 'wallet', title: 'Wallet', items: ['Primary wallet sign-in signature verified', 'Wallet is self-hosted', 'On-chain history reviewed: no mixer, darknet or sanctioned exposure'] },
];
const K2_REDO = ['entity1', 'entity2', 'screen0', 'screen1', 'screen2']; // screening + proof of address are re-done on a re-KYC
const K2_QREASON = { sender_unverified: 'Sender not verified', sender_not_whitelisted: 'Sending wallet not approved', sender_other_org_wallet: 'Sent from another wallet of the organization', no_organization: 'No organization', org_not_approved: 'Organization not approved or closed', org_frozen: 'Organization frozen', wallet_frozen: 'Wallet frozen' };
const K2_QST = { held: ['warning', 'Held'], whitelisting: ['info', 'Whitelisting sender'], released: ['success', 'Released'], returned: ['neutral', 'Returned to sender'] };

function K2Queue({ S, onOpen }) {
  const sla = S.settings.kyc_review_sla_days;
  const rows = S.orgs.filter(o => ['submitted', 'in_review', 'second_approval'].includes(o.kyc_status)).map(o => ({ ...o, wait: -k2Days(o.submitted_at) })).sort((a, b) => b.wait - a.wait);
  const breached = rows.filter(r => r.wait > sla).length;
  const claim = r => { S.patchOrg(r.ref, { kyc_status: 'in_review', claimed_by: K2.ME }); S.log(r.ref, 'org.claimed', 'submitted', 'in_review'); };
  return (
    <>
      <div className="pms-page-head"><div><h1>KYC queue</h1><div className="sub">Submitted cases, oldest first · review deadline {sla} days from submission · high risk needs a second officer</div></div></div>
      <div className="kyc-filters">
        {[['To review', rows.filter(r => r.kyc_status !== 'second_approval').length, 'info'], ['2nd approval', rows.filter(r => r.kyc_status === 'second_approval').length, 'warn'], ['Past deadline', breached, breached ? 'neg' : ''], ['Unclaimed', rows.filter(r => !r.claimed_by).length, '']].map(([l, v, k]) =>
          <div key={l} className="kyc-filter static"><span className="l">{l}</span><span className={`n ${k}`}>{v}</span></div>)}
      </div>
      <div className="pms-card">
        <div className="pms-card-head">Cases<div className="label-meta">info-requested cases leave the queue until the client resubmits</div></div>
        {!k2Live() ? <K2State what="cases"/> : rows.length === 0 ? <K2State kind="empty" what="cases"/> : (
        <div className="pms-card-body flush"><table className="pms-table">
          <thead><tr><th>Organization</th><th>Type</th><th>Stage</th><th>Risk</th><th className="num">Waiting</th><th>Reviewer</th><th className="num"></th></tr></thead>
          <tbody>{rows.map(r => { const pw = k2Primary(r, S); const over = r.wait - sla; return (
            <tr key={r.ref} className="clickable" onClick={() => onOpen(r.ref)}>
              <td><div className="kyc-org"><b className="pms-mono">{r.ref}</b>{pw && <K2Addr a={pw.address}/>}</div></td>
              <td className="text-xs">{K2_TYPE[r.type]}</td>
              <td><span className="k2-chg"><K2Pill map={K2_ORG} v={r.kyc_status}/>{r.review_kind !== 'initial' && <K2Pill map={K2_KIND} v={r.review_kind}/>}</span></td>
              <td>{r.risk_tier ? <K2Pill map={K2_RISK} v={r.risk_tier}/> : <span className="muted text-xs">not set</span>}</td>
              <td className="num">{over > 0 ? <span className="pms-pill neg">{r.wait}d · {over}d overdue</span> : <span className="pms-mono">{r.wait}d</span>}</td>
              <td className="pms-mono text-xs">{r.claimed_by ? k2Officer(r.claimed_by) : <span className="muted">Unclaimed</span>}{r.first_approver && <div className="muted">1st: {k2Officer(r.first_approver)}</div>}</td>
              <td className="num" onClick={e => e.stopPropagation()}>{!r.claimed_by ? <button className="cred-act primary" onClick={() => claim(r)}>Claim</button> : <button className="cred-act" onClick={() => onOpen(r.ref)}>Open</button>}</td>
            </tr>); })}</tbody>
        </table></div>)}
      </div>
    </>
  );
}

function K2Review({ S, r, onBack, onProfile }) {
  const o = S.orgs.find(x => x.ref === r);
  const second = o.kyc_status === 'second_approval';
  const mine = o.claimed_by === K2.ME || second;
  const lockedOut = second && o.first_approver === K2.ME;
  const sections = K2_CHECKLIST(o.type);
  const allIds = sections.flatMap(s => s.items.map((_, i) => s.id + i));
  const seed = () => {
    const t = K2.ticks[r];
    const m = {};
    if (t) { const [ids, who, at] = [t.split(':')[0], t.split(':')[1], t.split(':').slice(2).join(':')]; (ids === 'all' ? allIds : ids.split(',')).forEach(k => { m[k] = { by: who, at }; }); }
    if (o.review_kind !== 'initial') allIds.filter(k => !K2_REDO.includes(k)).forEach(k => { m[k] = { by: 'U-0004', at: '2025-10-30 10:00', prev: true }; });
    return m;
  };
  const [ticks, setTicks] = React.useState(seed);
  const pep = o.people.some(p => p.pep);
  const [risk, setRisk] = React.useState(pep ? 'high' : o.risk_tier || '');
  const [left, setLeft] = React.useState('docs');
  const [doc, setDoc] = React.useState(0);
  const [modal, setModal] = React.useState(null);
  const [save, setSave] = React.useState({ st: 'idle', rev: o.revision });
  const timer = React.useRef();
  const tick = k => {
    if (!mine) return;
    setTicks(t => { const n = { ...t }; if (n[k]) delete n[k]; else n[k] = { by: K2.ME, at: '2026-10-24 ' + new Date().toISOString().slice(11, 16) }; return n; });
    setSave(s => ({ ...s, st: 'saving' })); clearTimeout(timer.current); timer.current = setTimeout(() => setSave(s => s.st === 'stale' ? s : { st: 'saved', rev: s.rev + 1 }), 600);
  };
  const missing = sections.flatMap(s => s.items.map((t, i) => !ticks[s.id + i] && s.title)).filter(Boolean);
  const done = allIds.length - missing.length;
  const ready = !missing.length && risk && mine && !lockedOut && save.st !== 'stale';
  const pw = k2Primary(o, S);
  const approve = () => {
    if (risk === 'high' && !second) { S.patchOrg(r, { kyc_status: 'second_approval', risk_tier: risk, first_approver: K2.ME, first_at: '2026-10-24 ' + new Date().toISOString().slice(11, 16) }); S.log(r, 'org.first_approval', 'in_review', 'second_approval'); }
    else {
      S.patchOrg(r, { kyc_status: 'approved', risk_tier: risk, approved_at: K2.TODAY, next_review_at: '2027-10-24' });
      if (pw && pw.status === 'pending_kyc') S.patchWallet(pw.ref, { status: 'cooldown', cooldown_ends_at: '2026-10-26 ' + new Date().toISOString().slice(11, 16) });
      S.log(r, 'org.approved', o.kyc_status, 'approved');
    }
    onProfile(r);
  };
  const d = o.docs[doc];
  const disabledWhy = !mine ? `Claimed by ${k2Officer(o.claimed_by) || 'nobody'} · claim it from the queue` : lockedOut ? 'You gave the first approval; a different officer must approve' : save.st === 'stale' ? 'Reload first' : missing.length ? `${missing.length} left · ${[...new Set(missing)].join(', ')}` : !risk ? 'Choose a risk tier' : '';
  return (
    <>
      <button className="kyc-back" onClick={onBack}>← KYC queue</button>
      <div className="kyc-head">
        <div className="kyc-head-main">
          <div className="kyc-head-t"><h1 className="pms-mono">{o.ref}</h1><K2Pill map={K2_ORG} v={o.kyc_status}/><K2Pill map={K2_KIND} v={o.review_kind}/><span className="pms-pill">{K2_TYPE[o.type]}</span></div>
          <div className="kyc-head-m"><span>Primary wallet {pw && <K2Addr a={pw.address} full/>}</span><span>Submitted <b>{k2Date(o.submitted_at)}</b></span><span>Claimed by <b className="pms-mono">{k2Officer(o.claimed_by)}</b></span><button className="pms-link text-xs" onClick={() => onProfile(r)}>Open profile →</button></div>
        </div>
        <span className={`k2-save ${save.st}`}>{save.st === 'saving' ? 'Saving…' : save.st === 'saved' ? `Saved · rev ${save.rev}` : save.st === 'stale' ? '' : `rev ${save.rev}`}</span>
      </div>
      {save.st === 'stale' && <div className="kyc-banner neg"><b>Changed by someone else</b><span>Your save carried revision {save.rev}; the server has a newer one.</span><button className="cred-act primary" onClick={() => { setTicks(seed()); setSave({ st: 'idle', rev: save.rev + 2 }); }}>Reload</button></div>}
      {second && <div className="kyc-banner purple"><b>Second approval</b><span>First approval by <span className="pms-mono">{k2Officer(o.first_approver)}</span> at {o.first_at}. Their ticks are pre-filled; untick anything you disagree with.{lockedOut && ' You gave the first approval, so you cannot approve again.'}</span></div>}
      {!mine && <div className="kyc-banner warn"><b>Read only</b><span>This case is claimed by <span className="pms-mono">{k2Officer(o.claimed_by)}</span>.</span></div>}
      {o.review_kind !== 'initial' && <div className="kyc-banner info"><b>{K2_KIND[o.review_kind][1]}</b><span>Unchanged items are pre-ticked from the last review. Screening and proof of address must be re-done.</span></div>}

      <div className="kyc-split">
        <div className="pms-card kyc-split-l">
          <div className="pms-card-head"><div className="pms-seg">{[['docs', `Documents · ${o.docs.length}`], ['people', `People · ${o.people.length}`]].map(([k, l]) => <button key={k} className={left === k ? 'active' : ''} onClick={() => setLeft(k)}>{l}</button>)}</div></div>
          {left === 'docs' ? (o.docs.length ? (
            <div className="kyc-docs">
              <div className="kyc-doclist">{o.docs.map((x, i) => <button key={x.doc_type} className={i === doc ? 'active' : ''} onClick={() => setDoc(i)}><K2Pill map={K2_DOCST} v={x.status}/><span>{K2_DOC[x.doc_type]}</span></button>)}</div>
              <div className="kyc-viewer">
                <div className="kyc-viewer-bar"><b>{K2_DOC[d.doc_type]}</b><span className="muted text-xs pms-mono">{d.status === 'missing' ? 'not uploaded' : `${d.mime} · ${d.size_kb} KB · expires ${k2Date(d.expires_at)}`}</span></div>
                <div className={`kyc-page ${d.status}`}>{d.status === 'missing' ? 'Not uploaded' : d.status === 'expired' ? 'Expired document' : <><span>{K2_DOC[d.doc_type]}</span><span className="muted">opens through a short-lived link · never cached</span></>}</div>
              </div>
            </div>) : <K2State kind="empty" what="documents"/>
          ) : (
            <div className="pms-card-body flush"><table className="pms-table">
              <thead><tr><th>Person</th><th>Role</th><th className="num">Own.</th><th>PEP</th><th>ID</th><th>Liveness</th><th>Address</th><th>Screening</th></tr></thead>
              <tbody>{o.people.map(p => <tr key={p.id}><td className="strong">{p.name}</td><td className="text-xs">{K2_ROLE[p.role]}</td><td className="num pms-mono">{p.ownership_pct != null ? p.ownership_pct + '%' : '—'}</td><td>{p.pep ? <span className="pms-pill neg">PEP</span> : <span className="muted text-xs">No</span>}</td>{p.checks.map((c, k) => <td key={k}><K2Pill map={K2_CHK} v={c}/></td>)}</tr>)}</tbody>
            </table></div>
          )}
        </div>

        <div className="pms-card kyc-split-r">
          <div className="pms-card-head">Checklist<div className="label-meta">hover a tick for who and when</div><span className="spacer"></span><span className="kyc-prog"><i style={{ width: (done / allIds.length * 100) + '%' }}></i></span></div>
          <div className="kyc-checklist">
            {sections.map(s => (
              <div key={s.id} className="kyc-sec">
                <div className="kyc-sec-h">{s.title}</div>
                {s.items.map((t, i) => { const k = s.id + i, v = ticks[k]; return (
                  <label key={k} className={`kyc-item ${v ? 'on' : ''} ${!mine ? 'ro' : ''}`} title={v ? `Ticked by ${k2Officer(v.by)} · ${v.at} UTC${v.prev ? ' · carried from last review' : ''}` : 'Not ticked'}>
                    <input type="checkbox" checked={!!v} disabled={!mine} onChange={() => tick(k)}/>
                    <span className="box">{v ? '✓' : ''}</span><span>{t}{o.review_kind !== 'initial' && K2_REDO.includes(k) && <span className="pms-pill warn k2-redo">re-do</span>}</span>
                  </label>); })}
              </div>
            ))}
            <div className="kyc-sec">
              <div className="kyc-sec-h">Risk tier</div>
              <div className="pms-seg kyc-risk">{['low', 'medium', 'high'].map(x => <button key={x} disabled={!mine || (pep && x !== 'high')} className={risk === x ? 'active ' + x : ''} onClick={() => setRisk(x)}>{x}</button>)}</div>
              <div className="text-xs muted" style={{ marginTop: 6 }}>{pep ? 'Locked to High: a person on this case is a PEP.' : 'High needs a second officer. Risk-tier limits are deferred.'}</div>
            </div>
          </div>
          <div className="kyc-decide">
            <button className="pms-btn ghost" disabled={!mine || lockedOut} onClick={() => setModal('info')}>Request info</button>
            <button className="pms-btn danger" disabled={!mine || lockedOut} onClick={() => setModal('reject')}>Reject</button>
            <span className="spacer"></span>
            <span className="k2-count">{done} of {allIds.length}</span>
            <span title={disabledWhy}><button className="pms-btn primary" disabled={!ready} onClick={approve}>{risk === 'high' && !second ? 'Approve · send to 2nd officer' : second ? 'Give 2nd approval' : 'Approve'}</button></span>
          </div>
          {!ready && <div className="kyc-hint">{disabledWhy}</div>}
          <div className="kyc-hint"><button className="pms-link text-xs" onClick={() => setSave({ ...save, st: 'stale' })}>Simulate a stale revision (409)</button></div>
        </div>
      </div>
      <K2DecisionModal kind={modal} o={o} onClose={() => setModal(null)} onDone={(code) => {
        if (modal === 'info') { S.patchOrg(r, { kyc_status: 'info_requested', info_reason: code }); S.log(r, 'org.info_requested', o.kyc_status, 'info_requested'); }
        else { S.patchOrg(r, { kyc_status: 'rejected', reject_code: code }); if (pw) S.patchWallet(pw.ref, { status: 'removed' }); S.log(r, 'org.rejected', o.kyc_status, 'rejected'); S.log(r, 'wallet.removed', pw?.status, 'removed', pw?.ref); }
        onBack();
      }}/>
    </>
  );
}

function K2DecisionModal({ kind, o, onClose, onDone, codes, title, effect }) {
  const [code, setCode] = React.useState('');
  const [msg, setMsg] = React.useState('');
  React.useEffect(() => { setCode(''); setMsg(''); }, [kind]);
  if (!kind) return null;
  const isInfo = kind === 'info';
  const list = codes || K2.REASON_CODES[isInfo ? 'request_info' : 'reject'];
  return (
    <Modal open title={title || `${isInfo ? 'Request information' : 'Reject'} · ${o.ref}`} onClose={onClose}
      footer={<><button className="pms-btn ghost" onClick={onClose}>Cancel</button><button className={`pms-btn ${isInfo ? 'primary' : 'danger'}`} disabled={!code || msg.trim().length < 5} onClick={() => { onDone(code, msg); onClose(); }}>{isInfo ? 'Send request' : 'Reject'}</button></>}>
      <div className="pms-form-body">
        <div className={`pms-confirm-banner ${isInfo ? 'warn' : 'danger'}`}><span className="ic">⚠</span><div>{effect || (isInfo ? 'Sets Info requested. The case leaves the queue until the client resubmits.' : 'Sets Rejected and removes the primary wallet.')}</div></div>
        <FormField label="Reason" required hint="Draft codes · no catalogue exists yet"><div className="k2-chips">{list.map(c => <button key={c} className={code === c ? 'on' : ''} onClick={() => setCode(c)}>{K2_CODE(c)}</button>)}</div></FormField>
        <FormField label="Visible to the client" required hint="At least 5 characters · stored encrypted · off on prod until encrypted backups exist"><FormTextarea value={msg} onChange={setMsg} rows={3} placeholder={isInfo ? 'What the client needs to upload or correct…' : 'Why the application was rejected…'}/></FormField>
      </div>
    </Modal>
  );
}

const K2_WSTAGES = ['awaiting_email', 'awaiting_connect', 'review', 'cooldown', 'active'];
function K2Wallets({ S, onProfile }) {
  const [rej, setRej] = React.useState(null);
  const rows = S.wallets.filter(w => ['awaiting_email', 'awaiting_connect', 'review', 'cooldown'].includes(w.status));
  const org = r => S.orgs.find(o => o.ref === r);
  const approve = w => {
    const o = org(w.org);
    if (o.risk_tier === 'high' && !w.first_approver) { S.patchWallet(w.ref, { first_approver: K2.ME }); return; }
    S.patchWallet(w.ref, { status: 'cooldown', cooldown_ends_at: '2026-10-26 ' + new Date().toISOString().slice(11, 16) }); S.log(w.org, 'wallet.cooldown_started', 'review', 'cooldown', w.ref);
  };
  return (
    <>
      <div className="pms-page-head"><div><h1>Wallet whitelisting</h1><div className="sub">Extra wallets ops linked to approved organizations · approve only when all three conditions pass · high-risk organizations need two officers</div></div></div>
      <div className="pms-card">
        <div className="pms-card-head">In progress<div className="label-meta">{rows.length} wallets</div></div>
        {!k2Live() ? <K2State what="wallets"/> : rows.length === 0 ? <K2State kind="empty" what="wallets"/> : (
        <div className="pms-card-body flush"><table className="pms-table k2-wq">
          <thead><tr><th>Wallet</th><th>Organization</th><th>Stage</th><th>Conditions</th><th>On-chain history</th><th className="num"></th></tr></thead>
          <tbody>{rows.map(w => { const o = org(w.org); const si = K2_WSTAGES.indexOf(w.status);
            const conds = [['Signatory email', w.signatory_email_status === 'confirmed', K2_EMAIL[w.signatory_email_status][1]], ['Signature', w.signature_status === 'verified', K2_SIG[w.signature_status][1]], ['On-chain history', w.onchain_history === 'clean', K2_HIST[w.onchain_history][1]]];
            const pass = conds.every(c => c[1]);
            const four = o.risk_tier === 'high', mineFirst = w.first_approver === K2.ME;
            return (
            <tr key={w.ref}>
              <td><div className="kyc-org"><b className="pms-mono">{w.ref}</b><K2Addr a={w.address} full/></div></td>
              <td><button className="pms-link pms-mono text-xs" onClick={() => onProfile(o.ref)}>{o.ref}</button><div style={{ marginTop: 3 }}><K2Pill map={K2_RISK} v={o.risk_tier}/></div></td>
              <td><div className="k2-stages">{K2_WSTAGES.map((s, i) => <span key={s} className={i < si ? 'done' : i === si ? 'cur' : ''} title={K2_WAL[s][1]}>{K2_WAL[s][1]}</span>)}</div>{w.status === 'cooldown' && <div className="text-xs muted" style={{ marginTop: 4 }}>ends {w.cooldown_ends_at} UTC</div>}{w.status === 'awaiting_email' && <div className="text-xs muted" style={{ marginTop: 4 }}>email step ships with M9d</div>}</td>
              <td><div className="k2-conds">{conds.map(([k, ok, l]) => <div key={k} className={ok ? 'ok' : 'no'}><span>{ok ? '✓' : '✕'}</span>{k}<em>{l}</em></div>)}</div></td>
              <td><div className="pms-seg k2-hist">{['clean', 'flagged'].map(h => <button key={h} className={w.onchain_history === h ? 'active ' + h : ''} onClick={() => { S.patchWallet(w.ref, { onchain_history: h }); }}>{K2_HIST[h][1]}</button>)}</div><div className="text-xs muted" style={{ marginTop: 3 }}>needs a contract addition</div></td>
              <td className="num"><div className="kyc-acts">
                {w.status === 'review' && <>
                  <button className="cred-act" onClick={() => setRej(w)}>Reject</button>
                  <span title={!pass ? 'All three conditions must pass' : mineFirst ? 'You gave the first approval; a different officer must approve' : ''}>
                    <button className="cred-act primary" disabled={!pass || mineFirst} onClick={() => approve(w)}>{four && !w.first_approver ? 'Approve (1 of 2)' : four ? 'Approve (2 of 2)' : 'Approve'}</button></span>
                </>}
                {w.status !== 'review' && <span className="text-xs muted">{w.status === 'cooldown' ? 'cooling down' : 'waiting'}</span>}
              </div>{mineFirst && w.status === 'review' && <div className="text-xs pms-warn" style={{ marginTop: 4 }}>1st approval: you · needs a 2nd officer</div>}</td>
            </tr>); })}</tbody>
        </table></div>)}
      </div>
      <K2DecisionModal kind={rej ? 'reject' : null} o={{ ref: rej?.ref }} title={`Reject wallet · ${rej?.ref}`} codes={K2.REASON_CODES.wallet_reject} effect="Sets the wallet to Removed. The reason is shown to the client."
        onClose={() => setRej(null)} onDone={() => { S.patchWallet(rej.ref, { status: 'removed' }); S.log(rej.org, 'wallet.removed', 'review', 'removed', rej.ref); }}/>
    </>
  );
}

function K2Quarantine({ S, can, onProfile }) {
  const [ret, setRet] = React.useState(null);
  const m9e = !!window.PMS_M9E;
  const held = S.quar.filter(q => q.status === 'held');
  const fmtAmt = q => q.coin === 'ETH' ? q.amount + ' ETH' : fmt.usd(q.amount) + ' ' + q.coin;
  return (
    <>
      <div className="pms-page-head"><div><h1>Quarantine</h1><div className="sub">Deposits held because KYC refused the sender or the owner · view only until M9e</div></div></div>
      <div className="kyc-banner info"><b>Rule</b><span>Deposits are held here when the sender is not the wallet that requested them, or when the account's KYC does not allow the deposit. Held funds are not credited.</span></div>
      <div className="pms-card">
        <div className="pms-card-head">Held deposits<div className="label-meta">{held.length} held · a KYC hold without a transaction hash gets no row</div>{m9e && <><span className="spacer"></span><span className="pms-pill purple">M9e preview</span></>}</div>
        {!k2Live() ? <K2State what="quarantined deposits"/> : (
        <div className="pms-card-body flush"><table className="pms-table">
          <thead><tr><th>Ref</th><th>Received (UTC)</th><th className="num">Amount</th><th>Network</th><th>Sender</th><th>To deposit address</th><th>Organization</th><th>Status</th><th>Reason</th>{m9e && <th className="num"></th>}</tr></thead>
          <tbody>{S.quar.map(q => (
            <tr key={q.ref}>
              <td className="pms-mono strong">{q.ref}<div className="muted text-xs" title={q.tx_hash}>{k2Short(q.tx_hash)}</div></td>
              <td className="pms-mono text-xs muted">{q.received_at}</td>
              <td className="num pms-mono strong">{fmtAmt(q)}{q.verified_amount !== q.amount && <div className="text-xs muted">verified {q.verified_amount}</div>}</td>
              <td><span className="pms-pill">{q.network_code}</span></td>
              <td><K2Addr a={q.observed_from_address}/><div style={{ marginTop: 3 }}>{q.sender_verified ? <span className="pms-pill pos">Verified</span> : <span className="pms-pill warn">Unverified</span>} <span className="text-xs muted">{q.observed_via === 'kafka' ? 'via Kafka' : 'chain scan'}</span></div></td>
              <td><K2Addr a={q.to_deposit_address}/><div className="text-xs muted">shared per pool</div></td>
              <td>{q.org ? <button className="pms-link pms-mono text-xs" onClick={() => onProfile(q.org)}>{q.org}</button> : <span className="muted text-xs">none</span>}</td>
              <td><K2Pill map={K2_QST} v={q.status}/></td>
              <td className="text-xs">{K2_QREASON[q.reason]}</td>
              {m9e && <td className="num">{can('kyc.approve') && <span title={!q.sender_verified ? 'Sender is unverified; return is disabled' : ''}><button className="cred-act" disabled={!q.sender_verified} onClick={() => setRet(q)}>Return</button></span>}</td>}
            </tr>))}</tbody>
        </table></div>)}
        <div className="kyc-note" style={{ margin: 12 }}>pm-system cannot credit or fail a held deposit: both routes need <span className="pms-mono">admin:strict</span> and answer 409 <span className="pms-mono">kyc_quarantined</span> while a row exists. Release, sender whitelisting and return to sender arrive with M9e.</div>
      </div>
      <K2ReturnModal q={ret} onClose={() => setRet(null)}/>
    </>
  );
}

function K2ReturnModal({ q, onClose }) {
  const [code, setCode] = React.useState('');
  const [totp, setTotp] = React.useState('');
  React.useEffect(() => { setCode(''); setTotp(''); }, [q]);
  if (!q) return null;
  const fee = q.coin === 'ETH' ? 0.0012 : q.network_code === 'ARB' ? 0.1 : 1.2;
  const net = +(q.verified_amount - fee).toFixed(q.coin === 'ETH' ? 4 : 2);
  let thr = 1000; try { thr = JSON.parse(localStorage.getItem('pms.syscfg') || '{}').withdrawal_approval_threshold || 1000; } catch (e) {}
  const usd = q.coin === 'ETH' ? q.verified_amount * 2600 : q.verified_amount;
  return (
    <Modal open title={`Return to sender · ${q.ref}`} onClose={onClose}
      footer={<><button className="pms-btn ghost" onClick={onClose}>Cancel</button><button className="pms-btn danger" disabled={!code || totp.length !== 6} onClick={onClose}>{usd > thr ? 'Submit for 2nd approval' : 'Return funds'}</button></>}>
      <div className="pms-form-body">
        <div className="pms-confirm-banner warn"><span className="ic">⚠</span><div>M9e preview. Pays only the verified sender the verified amount minus the exchange withdraw fee.</div></div>
        <div className="pms-confirm-impact">
          <div className="row"><span className="k">Destination (verified sender)</span><span className="v">{k2Short(q.observed_from_address)}</span></div>
          <div className="row"><span className="k">Verified amount</span><span className="v">{q.verified_amount} {q.coin}</span></div>
          <div className="row"><span className="k">Exchange withdraw fee</span><span className="v">−{fee} {q.coin}</span></div>
          <div className="row"><span className="k">Sent</span><span className="v">{net} {q.coin}</span></div>
        </div>
        {usd > thr && <div className="kyc-note">Above the withdrawal approval threshold ({fmt.usd(thr)}): a second officer must approve.</div>}
        <FormField label="Reason code" required><FormSelect value={code} onChange={setCode} options={[{ v: '', l: 'Choose…' }, ...K2.REASON_CODES.return.map(c => ({ v: c, l: K2_CODE(c) }))]}/></FormField>
        <FormField label="Authenticator code" required hint="Fresh TOTP required"><FormInput value={totp} onChange={v => setTotp(v.replace(/\D/g, '').slice(0, 6))} placeholder="000000" mono/></FormField>
      </div>
    </Modal>
  );
}

Object.assign(window, { K2Queue, K2Review, K2Wallets, K2Quarantine, K2DecisionModal, K2_QREASON });
