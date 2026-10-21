/* KYC review queue + split-view review screen, wallet whitelisting queue, quarantine. */

function KycReviewQueue({ S, onOpen }) {
  const rows = S.orgs.filter(o => ['submitted', 'in_review', 'second_approval', 'info_requested'].includes(o.status))
    .map(o => ({ ...o, age: -kycDays(o.submittedAt) })).sort((a, b) => b.age - a.age);
  const n = st => rows.filter(r => st.includes(r.status)).length;
  const STAGE = { submitted: '1st review · unassigned', in_review: '1st review', second_approval: '2nd approval', info_requested: 'Waiting on client' };
  return (
    <>
      <div className="pms-page-head"><div><h1>KYC review</h1><div className="sub">Manual review in-house · split view: documents left, checklist and decision right · high-risk cases need a second officer</div></div></div>
      <div className="kyc-filters">
        {[['To review', n(['submitted', 'in_review']), 'info'], ['2nd approval', n(['second_approval']), 'purple'], ['Waiting on client', n(['info_requested']), 'warn'], ['Oldest case', rows.length ? Math.max(...rows.map(r => r.age)) + 'd' : '—', '']].map(([l, v, k]) =>
          <div key={l} className="kyc-filter static"><span className="l">{l}</span><span className={`n ${k}`}>{v}</span></div>)}
      </div>
      <div className="pms-card">
        <div className="pms-card-head">Cases<div className="label-meta">oldest first · SLA 3 days</div></div>
        <SortableTable rowKey={r => r.id} onRowClick={r => r.status !== 'info_requested' && onOpen(r.id)}
          columns={[
            { key: 'name', label: 'Organization', render: r => <div className="kyc-org"><b>{r.name}</b><span className="pms-mono">{r.id}{r.migrated ? ' · migrated' : ' · new'}</span></div> },
            { key: 'type', label: 'Type', render: r => <span className="text-xs">{r.sub || KYC_TYPE[r.type]}</span> },
            { key: 'stage', label: 'Stage', render: r => <span className={`pms-pill ${KYC_ST[r.status].k}`}>{STAGE[r.status]}</span> },
            { key: 'risk', label: 'Risk', render: r => r.risk ? <span className={`pms-pill ${KYC_RISK[r.risk]}`}>{r.risk}</span> : <span className="muted">not set</span> },
            { key: 'age', label: 'Waiting', num: true, sortValue: r => r.age, render: r => <span className={`pms-mono ${r.age > 3 && r.status !== 'info_requested' ? 'pms-warn strong' : ''}`}>{r.age}d</span> },
            { key: 'rev', label: 'Reviewer', render: r => <span className="text-xs">{r.status === 'second_approval' ? <>1st: {r.reviewer} · <b>needs 2nd</b></> : r.reviewer || <span className="muted">unassigned</span>}</span> },
            { key: 'go', label: '', render: r => r.status === 'info_requested' ? <span className="text-xs muted">{r.requested}</span> : <span className="pms-link text-xs">Review →</span> },
          ]}
          rows={rows}/>
      </div>
    </>
  );
}

function KycReviewScreen({ S, id, onBack, onProfile }) {
  const o = S.orgs.find(x => x.id === id);
  const second = o.status === 'second_approval';
  const sections = window.KYC_CHECKLIST(o.type);
  const allIds = sections.flatMap(s => s.items.map((_, i) => s.id + i));
  const [checks, setChecks] = React.useState(() => second ? Object.fromEntries(allIds.map(k => [k, true])) : {});
  const [risk, setRisk] = React.useState(o.risk || '');
  const [left, setLeft] = React.useState('docs');
  const [doc, setDoc] = React.useState(0);
  const [modal, setModal] = React.useState(null);
  const [msg, setMsg] = React.useState('');
  const done = allIds.filter(k => checks[k]).length;
  const ready = done === allIds.length && risk;
  const primary = S.wallets.find(w => w.org === id && w.primary);
  const needsSecond = risk === 'high' && !second;
  const approve = () => {
    if (needsSecond) { S.patchOrg(id, { status: 'second_approval', risk, reviewer: 'Emily Chen', firstApproval: 'Emily Chen · 21 Oct 2026' }); S.note(id, 'First approval · high risk → waiting for a second officer'); }
    else {
      S.patchOrg(id, { status: 'approved', risk, approvedAt: '2026-10-21', nextReview: '2027-10-21' });
      if (primary) S.patchWallet(primary.id, { status: 'cooldown', coolLeft: 48 });
      S.note(id, `KYC approved${second ? ' (2nd approval)' : ''} · risk ${risk} · primary wallet in 48h cool-down`);
    }
    onProfile(id);
  };
  const d = o.docs[doc];
  return (
    <>
      <button className="kyc-back" onClick={onBack}>← KYC review</button>
      <div className="kyc-head">
        <div className="kyc-head-main">
          <div className="kyc-head-t"><h1>{o.name}</h1><KycPill map={KYC_ST} v={o.status}/><span className="pms-pill">{o.sub || KYC_TYPE[o.type]}</span></div>
          <div className="kyc-head-m"><span className="pms-mono">{o.id}</span><span>{o.juris}</span>{o.reg && <span>Reg. <b className="pms-mono">{o.reg}</b></span>}<span>Submitted <b>{kycDate(o.submittedAt)}</b></span><span>Primary wallet <b className="pms-mono">{kycShort(primary?.addr)}</b></span>
            <button className="pms-link text-xs" onClick={() => onProfile(id)}>Open profile →</button></div>
        </div>
      </div>
      {second && <div className="kyc-banner purple"><b>Second approval</b><span>First approval by {o.firstApproval}. High-risk cases need a second compliance officer. Checks below are the first reviewer's — re-verify anything you disagree with.</span></div>}

      <div className="kyc-split">
        <div className="pms-card kyc-split-l">
          <div className="pms-card-head"><div className="pms-seg">{[['docs', `Documents · ${o.docs.length}`], ['people', `People · ${o.people.length}`]].map(([k, l]) => <button key={k} className={left === k ? 'active' : ''} onClick={() => setLeft(k)}>{l}</button>)}</div></div>
          {left === 'docs' ? (
            <div className="kyc-docs">
              <div className="kyc-doclist">{o.docs.map((x, i) => <button key={x.name} className={i === doc ? 'active' : ''} onClick={() => setDoc(i)}><KycCheck st={x.st}/><span>{x.name}</span></button>)}</div>
              <div className="kyc-viewer">
                <div className="kyc-viewer-bar"><b>{d.name}</b><span className="muted text-xs">{d.st === 'missing' ? 'not uploaded' : 'uploaded via main app · ' + kycDate(o.submittedAt)}</span></div>
                <div className={`kyc-page ${d.st}`}>{d.st === 'missing' ? 'Not uploaded' : d.st === 'expired' ? 'Expired document — re-upload requested' : <><span>{d.name}</span><span className="muted">document preview</span></>}</div>
              </div>
            </div>
          ) : (
            <div className="pms-card-body flush"><table className="pms-table">
              <thead><tr><th>Name</th><th>Role</th><th className="num">Own.</th><th>ID + liveness</th><th>Address</th></tr></thead>
              <tbody>{o.people.map((p, i) => <tr key={i}><td className="strong">{p.name}</td><td className="text-xs">{p.role}</td><td className="num pms-mono">{p.pct ? p.pct + '%' : '—'}</td><td><KycCheck st={p.st}/></td><td><KycCheck st={p.st}/></td></tr>)}</tbody>
            </table></div>
          )}
        </div>

        <div className="pms-card kyc-split-r">
          <div className="pms-card-head">Checklist<div className="label-meta">{done} / {allIds.length} checks</div><span className="spacer"></span><span className="kyc-prog"><i style={{ width: (done / allIds.length * 100) + '%' }}></i></span></div>
          <div className="kyc-checklist">
            {sections.map(s => (
              <div key={s.id} className="kyc-sec">
                <div className="kyc-sec-h">{s.title}</div>
                {s.items.map((t, i) => { const k = s.id + i; return (
                  <label key={k} className={`kyc-item ${checks[k] ? 'on' : ''}`}>
                    <input type="checkbox" checked={!!checks[k]} onChange={e => setChecks({ ...checks, [k]: e.target.checked })}/>
                    <span className="box">{checks[k] ? '✓' : ''}</span><span>{t}</span>
                  </label>); })}
              </div>
            ))}
            <div className="kyc-sec">
              <div className="kyc-sec-h">Risk tier</div>
              <div className="pms-seg kyc-risk">{['low', 'medium', 'high'].map(r => <button key={r} className={`${risk === r ? 'active ' + r : ''}`} onClick={() => setRisk(r)}>{r}</button>)}</div>
              <div className="text-xs muted" style={{ marginTop: 6 }}>Sets deposit / withdrawal limits (Admin › Config). High risk requires a second officer.</div>
            </div>
          </div>
          <div className="kyc-decide">
            <button className="pms-btn ghost" onClick={() => setModal('info')}>Request info</button>
            <button className="pms-btn danger" onClick={() => setModal('reject')}>Reject</button>
            <span className="spacer"></span>
            <button className="pms-btn primary" disabled={!ready} onClick={approve}>{needsSecond ? 'Approve · send to 2nd officer' : second ? 'Give 2nd approval' : 'Approve'}</button>
          </div>
          {!ready && <div className="kyc-hint">{done < allIds.length ? `${allIds.length - done} checks left` : 'Choose a risk tier'} before approving.</div>}
        </div>
      </div>

      <FormModal open={modal === 'info'} title="Request information" onClose={() => setModal(null)} submitLabel="Send to client" canSubmit={msg.trim().length > 5}
        subtitle="The client sees this message in the main app and can re-upload. The case leaves your queue until they respond."
        onSubmit={() => { S.patchOrg(id, { status: 'info_requested', requested: msg.trim() }); S.note(id, 'Information requested · ' + msg.trim()); setMsg(''); onBack(); }} note="Request sent to the client.">
        <FormField label="Message to client" required><FormTextarea value={msg} onChange={setMsg} rows={4} placeholder="e.g. Please upload a certified register of shareholders dated within the last 12 months."/></FormField>
      </FormModal>
      <ConfirmModal open={modal === 'reject'} title={`Reject ${o.name}`} tone="danger" confirmLabel="Reject KYC" requireReason onClose={() => setModal(null)}
        onConfirm={r => { S.patchOrg(id, { status: 'rejected', rejectReason: r }); if (primary) S.patchWallet(primary.id, { status: 'removed', note: 'KYC rejected' }); S.note(id, 'KYC rejected · ' + r); onBack(); }}
        body={<>The reason is shown to the client in the main app. The primary wallet stays view-only and cannot be whitelisted.</>}/>
    </>
  );
}

function WalletQueue({ S, onProfile }) {
  const [rej, setRej] = React.useState(null);
  const rows = S.wallets.filter(w => ['awaiting_email', 'awaiting_connect', 'review', 'cooldown'].includes(w.status));
  const org = id => S.orgs.find(o => o.id === id);
  const confirmEmail = w => { S.patchWallet(w.id, { email: 'confirmed', status: w.sig === 'verified' ? 'review' : 'awaiting_connect' }); S.note(w.org, `Signatory confirmed wallet ${kycShort(w.addr)} by email`); };
  const approve = w => { S.patchWallet(w.id, { status: 'cooldown', coolLeft: 48 }); S.note(w.org, `Wallet ${kycShort(w.addr)} approved · 48h cool-down started`); };
  return (
    <>
      <div className="pms-page-head"><div><h1>Wallet whitelisting</h1><div className="sub">Extra wallets for approved Organizations · self-hosted only</div></div></div>
      <div className="kyc-flow row">
        {['Ops links the wallet', 'Signatory confirms by email', 'Wallet signs in on the main app', 'Compliance approves', '48h cool-down', 'Whitelisted'].map((s, i) => <div key={i}><span>{i + 1}</span>{s}</div>)}
      </div>
      <div className="pms-card">
        <div className="pms-card-head">In progress<div className="label-meta">{rows.length} wallets</div></div>
        <div className="pms-card-body flush"><table className="pms-table kyc-wq">
          <thead><tr><th>Wallet</th><th>Chain</th><th>Organization</th><th title="Signatory email · wallet sign-in signature · on-chain history">Checks · email / sign-in / history</th><th>Status</th><th className="num">Action</th></tr></thead>
          <tbody>{rows.map(w => { const o = org(w.org); return (
            <tr key={w.id}>
              <td className="pms-mono text-xs" title={w.addr}>{kycShort(w.addr)}<div className="muted" style={{ fontFamily: 'inherit' }}>{w.label}</div></td>
              <td><span className="pms-pill">{w.chain}</span></td>
              <td><button className="pms-link text-xs" onClick={() => onProfile(o.id)}>{o.name}</button><div className="text-xs muted">{w.source}</div></td>
              <td><span className="kyc-checks" title={`Email ${w.email} · Sign-in ${w.sig} · History ${w.history}`}><KycCheck st={w.email}/><KycCheck st={w.sig}/><KycCheck st={w.history}/></span></td>
              <td><KycPill map={KYC_WST} v={w.status}/>{w.status === 'cooldown' && <span className="text-xs muted"> · {w.coolLeft}h left</span>}</td>
              <td className="num"><div className="kyc-acts">
                {w.status === 'awaiting_email' && <button className="pms-btn ghost text-xs" onClick={() => confirmEmail(w)}>Mark email confirmed</button>}
                {w.status === 'awaiting_connect' && <span className="text-xs muted">waiting for sign-in</span>}
                {w.status === 'review' && <><button className="pms-btn ghost text-xs" onClick={() => setRej(w)}>Reject</button><button className="pms-btn primary text-xs" disabled={w.history !== 'clean'} onClick={() => approve(w)}>Approve</button></>}
              </div></td>
            </tr>); })}</tbody>
        </table></div>
      </div>
      <ConfirmModal open={!!rej} title="Reject wallet" tone="danger" confirmLabel="Reject wallet" requireReason onClose={() => setRej(null)}
        onConfirm={r => { S.patchWallet(rej.id, { status: 'removed', note: r }); S.note(rej.org, `Wallet ${kycShort(rej.addr)} rejected · ${r}`); }}
        body={<>The wallet <span className="pms-mono">{kycShort(rej?.addr)}</span> will not be whitelisted. The reason is shown to the client.</>}/>
    </>
  );
}

function QuarantineView({ S, can, onProfile, onWallets }) {
  const [ret, setRet] = React.useState(null);
  const org = id => S.orgs.find(o => o.id === id);
  const ST = { whitelisting: { l: 'Whitelisting started', k: 'info' }, held: { l: 'Held', k: 'warn' }, returned: { l: 'Returned', k: '' } };
  return (
    <>
      <div className="pms-page-head"><div><h1>Quarantine</h1><div className="sub">Deposits from wallets that are not whitelisted · held until the sender is whitelisted or the funds are returned</div></div></div>
      <div className="kyc-banner info"><b>Rule</b><span>If the receiving deposit address belongs to an approved Organization, whitelisting of the sender starts automatically. The funds credit once the sender finishes the 48h cool-down.</span></div>
      <div className="pms-card">
        <div className="pms-card-head">Held deposits<div className="label-meta">{fmt.usd(S.quar.filter(q => q.status !== 'returned').reduce((s, q) => s + (q.asset === 'ETH' ? q.amount * 2600 : q.amount), 0), { compact: true })} held</div></div>
        <div className="pms-card-body flush"><table className="pms-table">
          <thead><tr><th>Received</th><th className="num">Amount</th><th>Chain</th><th>Sender</th><th>Organization</th><th>Status</th><th></th></tr></thead>
          <tbody>{S.quar.map(q => { const o = q.org && org(q.org); return (
            <tr key={q.id} className={q.status === 'returned' ? 'dim' : ''}>
              <td className="pms-mono text-xs muted">{q.time}</td>
              <td className="num strong pms-mono">{q.asset === 'ETH' ? q.amount + ' ETH' : fmt.usd(q.amount) + ' ' + q.asset}</td>
              <td><span className="pms-pill">{q.chain}</span></td>
              <td className="pms-mono text-xs" title={q.from}>{kycShort(q.from)}</td>
              <td>{o ? <button className="pms-link text-xs" onClick={() => onProfile(o.id)}>{o.name}</button> : <span className="muted text-xs">no match</span>}</td>
              <td><KycPill map={ST} v={q.status}/>{q.note && <div className="text-xs muted" style={{ marginTop: 3 }}>{q.note}</div>}</td>
              <td className="num"><div className="kyc-acts">
                {q.status === 'whitelisting' && can('kyc.approve') && <button className="pms-btn ghost text-xs" onClick={onWallets}>Open in whitelisting →</button>}
                {q.status === 'held' && can('kyc.approve') && <button className="pms-btn ghost text-xs" onClick={() => setRet(q)}>Return to sender</button>}
              </div></td>
            </tr>); })}</tbody>
        </table></div>
      </div>
      <ConfirmModal open={!!ret} title="Return to sender" tone="danger" confirmLabel="Return funds" requireReason onClose={() => setRet(null)}
        onConfirm={r => S.setQuar(x => x.map(q => q.id === ret.id ? { ...q, status: 'returned', note: 'Returned · ' + r } : q))}
        body={<>Sends {ret && (ret.asset === 'ETH' ? ret.amount + ' ETH' : fmt.usd(ret.amount) + ' ' + ret.asset)} back to <span className="pms-mono">{kycShort(ret?.from)}</span>, minus network fees.</>}/>
    </>
  );
}

Object.assign(window, { KycReviewQueue, KycReviewScreen, WalletQueue, QuarantineView });
