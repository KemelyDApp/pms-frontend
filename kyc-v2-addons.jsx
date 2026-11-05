/* v2 add-ons — KYC pieces dropped into shared pages when window.PMS_V2 is set:
   Admin › Config KYC group, Fund flow KYC pills + refusal, Overview shadow counts. */

const K2_SETTING_ROWS = [
  ['whitelist_cooldown_hours', 'Wallet cooldown', 48, '0–168', 'h', 'Wallet waiting period after approval.'],
  ['kyc_review_interval_months', 'Review interval', 12, '1–60', 'mo', 'Sets next_review_at.'],
  ['kyc_review_sla_days', 'Review deadline', 3, '1–30', 'd', 'Queue deadline from submitted_at.'],
  ['signatory_confirm_ttl_hours', 'Signatory link TTL', 72, '1–168', 'h', 'Used from M9d.'],
];

function K2ConfigCard() {
  const S = window.KYC2;
  const [modal, setModal] = React.useState(null);
  const [mode, setMode] = React.useState(S.settings.kyc_gating_mode);
  const [next, setNext] = React.useState('');
  const [totp, setTotp] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [ovs, setOvs] = React.useState(S.overrides);
  const [rm, setRm] = React.useState(null);
  const open = () => { setNext(''); setTotp(''); setSent(false); setModal('mode'); };
  return (
    <div className="pms-card" style={{ marginBottom: 12 }}>
      <div className="pms-card-head">KYC<div className="label-meta">read-only until M9c adds a write path · keys cannot be deleted or renamed (409 kyc_setting_protected)</div></div>
      <div className="pms-card-body" style={{ padding: 0 }}>
        <div className="pms-cfg-row k2-cfg">
          <div className="k"><b>Gating mode</b><span className="pms-mono">kyc_gating_mode</span><div className="d">{K2_MODE[mode][2]} Freezes refuse in every mode.</div></div>
          <div className="v"><K2Pill map={K2_MODE} v={mode}/><span className="text-xs muted">default off</span></div>
          <div className="act"><button className="cred-act" onClick={open}>Change…</button></div>
        </div>
        {K2_SETTING_ROWS.map(([k, l, def, range, u, d]) => (
          <div className="pms-cfg-row k2-cfg" key={k}>
            <div className="k"><b>{l}</b><span className="pms-mono">{k}</span><div className="d">{d}</div></div>
            <div className="v"><span className="pms-mono strong">{S.settings[k]} {u}</span><span className="text-xs muted">default {def} · allowed {range}</span></div>
            <div className="act"><span className="pms-pill k2-ghost" title="pm-system's service account only reads settings (inbound issue #4)">view only</span></div>
          </div>
        ))}
      </div>
      <div className="pms-card-head k2-subhead">Per-organization overrides<div className="label-meta">key kyc_gating_mode:org:&lt;numeric id&gt; · deleting restores the global mode</div></div>
      <div className="pms-card-body flush">
        {ovs.length === 0 ? <div className="k2-state empty"><span className="ic">∅</span><span>No overrides.</span></div> : <table className="pms-table">
          <thead><tr><th>Key</th><th>Organization</th><th>Mode</th><th>Set by</th><th></th></tr></thead>
          <tbody>{ovs.map(o => <tr key={o.key}><td className="pms-mono text-xs">{o.key}</td><td className="pms-mono">{o.org}</td><td><K2Pill map={K2_MODE} v={o.mode}/></td><td className="pms-mono text-xs muted">{o.set_by} · {o.set_at}</td><td className="num"><button className="cred-act" onClick={() => setRm(o)}>Remove override</button></td></tr>)}</tbody>
        </table>}
        <div className="kyc-note" style={{ margin: '0 12px 12px' }}>Using an enforcing override locks the legacy backfill on this host for good, even if you remove it later.</div>
      </div>

      {modal === 'mode' && <Modal open title="Change gating mode" onClose={() => setModal(null)}
        footer={sent ? <button className="pms-btn primary" onClick={() => setModal(null)}>Close</button> : <><button className="pms-btn ghost" onClick={() => setModal(null)}>Cancel</button><button className="pms-btn danger" disabled={!next || next === mode || totp.length !== 6} onClick={() => setSent(true)}>Request change</button></>}>
        {sent ? <div className="pms-form-done"><div className="ic">✓</div><div className="t">Waiting for a second admin</div><div className="s">The change to <b>{K2_MODE[next][1]}</b> applies once another admin approves it with their own code.</div></div> : (
        <div className="pms-form-body">
          <div className="pms-confirm-banner warn"><span className="ic">⚠</span><div>Changes which client actions KYC refuses on every host. Needs <b>dual approval</b> and a fresh code. Written under its own scope, never under kyc.approve.</div></div>
          <div className="k2-modes">{['off', 'shadow', 'enforce_new', 'enforce'].map(m => <button key={m} className={`${next === m ? 'on' : ''} ${mode === m ? 'cur' : ''}`} disabled={mode === m} onClick={() => setNext(m)}><K2Pill map={K2_MODE} v={m}/><span>{K2_MODE[m][2]}</span>{mode === m && <em>current</em>}</button>)}</div>
          <FormField label="Authenticator code" required><FormInput value={totp} onChange={v => setTotp(v.replace(/\D/g, '').slice(0, 6))} placeholder="000000" mono/></FormField>
        </div>)}
      </Modal>}
      <ConfirmModal open={!!rm} title={`Remove override · ${rm?.org}`} tone="warn" confirmLabel="Remove override" onClose={() => setRm(null)} onConfirm={() => setOvs(x => x.filter(o => o !== rm))}
        body={<>{rm?.org} returns to the global mode <b>{K2_MODE[mode][1]}</b>.{rm?.stamped && ' This enforcing override already stamped intents, so the legacy backfill stays locked on this host.'}</>}/>
    </div>
  );
}

// Fund flow — detect KYC states from failure_reason prefixes until the contract adds a field
function k2IntentPill(r) {
  const f = r.failure_reason || '';
  const m = f.match(/\(([a-z_]+)\)/);
  const label = m ? (K2_QREASON[m[1]] || K2_CODE(m[1])) : '';
  if (f.startsWith('KYC hold (')) return <span className="pms-pill warn" title={f}>Held (KYC){label ? ' · ' + label : ''}</span>;
  if (f.startsWith('Cancelled: account access changed (') || f.startsWith('KYC refused at claim (')) return <span className="pms-pill neg" title={f}>Cancelled (KYC){label ? ' · ' + label : ''}</span>;
  return null;
}

function K2RefusalBlock({ intent, onReject }) {
  const [st, setSt] = React.useState('idle');
  if (intent.dir !== 'withdraw' || intent.stage !== 'W2_APPROVAL') return null;
  return (
    <div className="k2-refuse">
      {st === 'idle' && <div className="row" style={{ gap: 8 }}><span className="text-xs muted" style={{ flex: 1 }}>Client withdrawal awaiting approval.</span><button className="pms-btn danger" onClick={() => setSt('rejected')}>Reject</button><button className="pms-btn success" onClick={() => setSt(intent.kyc_refused ? 'refused' : 'approved')}>Approve</button></div>}
      {st === 'refused' && <div className="kyc-banner neg" style={{ margin: 0 }}><b>KYC does not allow this</b><span>The request stays Pending approval; approving again gets the same refusal. Reject this request.</span><button className="pms-btn danger" onClick={() => setSt('rejected')}>Reject</button></div>}
      {st === 'approved' && <div className="kyc-banner info" style={{ margin: 0 }}><b>Approved</b><span>Sent to the requesting wallet.</span></div>}
      {st === 'rejected' && <div className="kyc-banner" style={{ margin: 0 }}><b>Rejected</b><span>The client sees the rejection in the client app.</span></div>}
    </div>
  );
}

Object.assign(window, { K2ConfigCard, k2IntentPill, K2RefusalBlock });
