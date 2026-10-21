/* M8 — Exchange sub-account API keys through PMS.
   Admin › Users, keys & audit › API keys. Row action "Set key" / "Replace key" → command
   sub_account.credentials.set {sub_account_id, api_key, api_secret, api_passphrase?, ip_restricted, replace} + per-command TOTP.
   Secrets live only in uncontrolled inputs (refs) — never React state, stores, URL or logs — and are cleared on success/cancel/close/unmount. */

const CRED_COMMANDS_READY = true;
const CRED_ENV = () => { try { return JSON.parse(localStorage.getItem('pms.session') || '{}').env || 'test'; } catch (e) { return 'test'; } };
const CRED_EGRESS = { test: '203.0.113.24', prod: '203.0.113.41' };
const CRED_ROWS = {
  test: [
    { sub_account_id: 31, label: 'testcandlehunter1', exchange: 'Binance', has_key: true, has_passphrase: false, ip_restricted: true, created_at: '2026-07-02', status: 'active' },
    { sub_account_id: 32, label: 'testcandlehunterusdc2', exchange: 'Binance', has_key: true, has_passphrase: false, ip_restricted: true, created_at: '2026-04-18', status: 'rotate-soon' },
    { sub_account_id: 41, label: 'testcandlehunter-okx', exchange: 'OKX', has_key: false, has_passphrase: false, ip_restricted: false, created_at: null, status: 'missing' },
  ],
  prod: [
    { sub_account_id: 14, label: 'candlehunter1', exchange: 'Binance', has_key: true, has_passphrase: false, ip_restricted: true, created_at: '2026-08-11', status: 'active' },
    { sub_account_id: 15, label: 'candlehunterusdc2', exchange: 'Binance', has_key: true, has_passphrase: false, ip_restricted: true, created_at: '2026-03-02', status: 'rotate-soon' },
    { sub_account_id: 22, label: 'candlehunter-okx1', exchange: 'OKX', has_key: true, has_passphrase: true, ip_restricted: false, created_at: '2025-10-01', status: 'expired' },
  ],
};
const CRED_STATUS = { active: ['ACTIVE', 'pos'], 'rotate-soon': ['ROTATE SOON', 'warn'], expired: ['EXPIRED', 'neg'], missing: ['NO KEY', ''] };
// Fixed strings only — server message/details are never rendered.
const CRED_ERR = {
  invalid_totp: 'The code is wrong. Wait for the next code and try again.',
  totp_locked: 'Too many wrong codes. Two-factor is locked for a few minutes.',
  rate_limited: 'Too many key changes this hour (limit: 5 per user, 20 firm-wide).',
  not_connected: 'Not connected to PMS. Reconnect, then send again.',
  conflict: 'A key is already set. Confirm the replacement to continue.',
  forbidden: 'Only admins can set exchange keys.',
  not_found: 'This sub-account no longer exists or is inactive.',
  bad_request: 'The key could not be accepted. Check every field.',
  upstream_rejected: 'The backend refused the key. Nothing was stored.',
  upstream_unavailable: 'Outcome unknown. Check the key status before you retry.',
};
const CRED_KEEP_FIELDS = ['invalid_totp', 'totp_locked', 'rate_limited', 'not_connected'];
const credDate = d => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const CRED_SAFE = { autoComplete: 'off', spellCheck: false, autoCorrect: 'off', autoCapitalize: 'off', 'data-1p-ignore': 'true', 'data-lpignore': 'true', 'data-bwignore': 'true', 'data-form-type': 'other' };
const credValid = (v, min, max) => !!v && v.length >= min && v.length <= max && /^[\x21-\x7e](?:[\x20-\x7e]*[\x21-\x7e])?$/.test(v);

function ApiKeysCard({ can }) {
  const env = CRED_ENV();
  // F8 — every key stored before the audit-log fix (m075) had its API key (and OKX passphrase) readable in admin_action_log.
  const [rows, setRows] = React.useState(() => CRED_ROWS[env].map(r => ({ ...r, exposed: r.has_key })));
  const exposed = rows.filter(r => r.exposed);
  const [target, setTarget] = React.useState(null);
  const [notice, setNotice] = React.useState(null);
  const [audit, setAudit] = React.useState([]);
  const isAdmin = can ? can('admin') : true;
  const totpEnrolled = true, socketLive = true;
  const canSet = isAdmin && totpEnrolled && socketLive && CRED_COMMANDS_READY;
  const onDone = (row, res, replaced) => {
    setRows(rs => rs.map(r => r.sub_account_id === row.sub_account_id ? { ...r, has_key: true, has_passphrase: res.has_passphrase, ip_restricted: res.ip_restricted, created_at: res.created_at, status: 'active', exposed: false } : r));
    setNotice(`API key set for ${row.label} (${row.exchange})`);
    setAudit(a => [{ at: new Date().toISOString().slice(11, 16) + ' UTC', label: row.label, replaced, passphrase: res.has_passphrase, ip: res.ip_restricted }, ...a]);
  };
  return (
    <div className="pms-card">
      <div className="pms-card-head">API keys<div className="label-meta">exchange sub-accounts · {env.toUpperCase()} environment</div>
      </div>
      {exposed.length > 0 && <div className="cred-exposed"><span className="ic">!</span><b>Rotate {exposed.length} key{exposed.length > 1 ? 's' : ''}</b><span>Stored before the audit-log fix: the API key{exposed.some(r => /okx/i.test(r.exchange)) ? ' and OKX passphrase were' : ' was'} readable in the admin action log (never the secret). Create a new key on the exchange, then Replace.</span></div>}
      {notice && <div className="cred-notice"><span>✓</span>{notice}<span className="muted">· bots may keep the previous key for up to 30 min</span><button onClick={() => setNotice(null)}>×</button></div>}
      <div className="pms-card-body flush" style={{ overflowX: 'auto' }}>
        <table className="pms-table">
          <thead><tr><th>Sub-account</th><th>Exchange</th><th>Key</th><th title="As claimed when the key was stored — not checked against the exchange">IP restricted</th><th title="Time the key was stored in PMS, not when it was created on the exchange">Stored</th><th>Status</th><th className="num"></th></tr></thead>
          <tbody>{rows.map(r => {
            const [sl, sk] = CRED_STATUS[r.status];
            return (
              <tr key={r.sub_account_id} className={r.exposed ? 'cred-row-exposed' : ''}>
                <td><div className="kyc-org"><b>{r.label}</b><span className="pms-mono">sub-account #{r.sub_account_id}</span></div></td>
                <td><VenueChip name={r.exchange}/></td>
                <td>{r.has_key ? <span className="text-xs">Set{r.exchange === 'OKX' && <span className="muted"> · passphrase {r.has_passphrase ? '✓' : '✕'}</span>}</span> : <span className="muted text-xs">None</span>}</td>
                <td>{r.has_key ? (r.ip_restricted ? <span className="pms-pos text-xs">Yes</span> : <span className="pms-warn text-xs">No</span>) : <span className="muted">—</span>}</td>
                <td className="pms-mono text-xs muted">{credDate(r.created_at)}</td>
                <td><div className="cred-st"><span className={`pms-pill ${sk}`}>{sl}</span>{r.exposed && <span className="pms-pill warn" title={/okx/i.test(r.exchange) ? 'API key and passphrase were readable in the action log' : 'API key was readable in the action log'}>EXPOSED · ROTATE</span>}</div></td>
                <td className="num">{canSet
                  ? <button className={`cred-act ${r.has_key ? '' : 'primary'}`} onClick={() => { setNotice(null); setTarget(r); }}>{r.has_key ? 'Replace' : 'Set key'}</button>
                  : <span className="text-xs muted" title={!isAdmin ? 'Admin only' : !totpEnrolled ? 'Enroll 2FA first' : 'Socket offline'}>{!isAdmin ? 'Admin only' : !totpEnrolled ? 'Enroll 2FA' : 'Offline'}</span>}</td>
              </tr>);
          })}</tbody>
        </table>
      </div>
      {audit.length > 0 && <div className="cred-audit">{audit.map((a, i) => <div key={i}><span className="pms-mono muted">{a.at}</span><span className="pms-mono">sub_account.credentials.set</span><span>{a.label} · {a.replaced ? 'replaced' : 'set'} · passphrase {a.passphrase ? 'yes' : 'no'} · ip_restricted {a.ip ? 'yes' : 'no'}</span></div>)}</div>}
      {target && <SetKeyModal row={target} env={env} onClose={() => setTarget(null)} onDone={onDone}/>}
    </div>
  );
}

function SetKeyModal({ row, env, onClose, onDone }) {
  const keyRef = React.useRef(null), secRef = React.useRef(null), passRef = React.useRef(null);
  const okx = /okx/i.test(row.exchange);
  // Only validity flags live in state — never the values.
  const [ok, setOk] = React.useState({ key: false, sec: false, pass: !okx });
  const [ipr, setIpr] = React.useState(true);
  const [totp, setTotp] = React.useState('');
  const [step, setStep] = React.useState('form'); // form | confirm | sending | done
  const [err, setErr] = React.useState(null);
  const [res, setRes] = React.useState(null);
  const clear = () => { [keyRef, secRef, passRef].forEach(r => { if (r.current) r.current.value = ''; }); setOk({ key: false, sec: false, pass: !okx }); };
  React.useEffect(() => () => clear(), []);
  const close = () => { clear(); setTotp(''); onClose(); };
  const ready = ok.key && ok.sec && ok.pass && /^\d{6}$/.test(totp);
  const send = () => {
    setStep('sending'); setErr(null);
    setTimeout(() => {
      const code = totp === '000000' ? 'invalid_totp' : totp === '999999' ? 'upstream_unavailable' : totp === '111111' ? 'rate_limited' : null;
      if (code) {
        if (!CRED_KEEP_FIELDS.includes(code)) clear();
        setTotp(''); setErr(code); setStep('form'); return;
      }
      const result = { sub_account_id: row.sub_account_id, has_key: true, has_passphrase: okx, ip_restricted: ipr, created_at: '2026-10-21' };
      clear(); setTotp(''); setRes(result); setStep('done'); onDone(row, result, row.has_key);
    }, 900);
  };
  const submit = () => { if (!ready) return; if (row.has_key && step === 'form') { setStep('confirm'); return; } send(); };
  return (
    <Modal open={true} title={step === 'done' ? 'Key stored' : row.has_key ? 'Replace API key' : 'Set API key'} onClose={close}
      footer={step === 'done' ? <button className="pms-btn primary" onClick={close}>Done</button> : <>
        <button className="pms-btn ghost" onClick={step === 'confirm' ? () => setStep('form') : close}>{step === 'confirm' ? 'Back' : 'Cancel'}</button>
        <button className={`pms-btn ${step === 'confirm' ? 'danger' : 'primary'}`} disabled={!ready || step === 'sending'} onClick={submit}>
          {step === 'sending' ? 'Sending…' : step === 'confirm' ? 'Replace key' : row.has_key ? 'Continue' : 'Set key'}</button>
      </>}>
      <div className="cred-target">
        <div><span>Sub-account</span><b>{row.label}</b></div>
        <div><span>Exchange</span><b>{row.exchange}</b></div>
        <div><span>ID</span><b className="pms-mono">#{row.sub_account_id}</b></div>
        <div><span>Environment</span><b className={env === 'prod' ? 'pms-neg' : ''}>{env.toUpperCase()}</b></div>
      </div>

      {step === 'done' ? (
        <div className="cred-done">
          <div className="cred-done-h"><span className="ic">✓</span><div><b>Stored {credDate(res.created_at)}</b><span>{okx ? 'Key, secret and passphrase' : 'Key and secret'} saved encrypted · IP restricted: {res.ip_restricted ? 'yes' : 'no'}</span></div></div>
          <div className="kyc-flow">
            {['Key created on the exchange, allowlisted to ' + CRED_EGRESS[env] + ', withdrawals disabled', 'Pasted into PMS — done', 'Wait until the bots pick it up: up to 5 min for xbridge, 30 min for basis-bot, longer for an open user-data stream. Look for [secret-export] sub=' + row.sub_account_id + ' in the backend log', row.has_key ? 'Only then delete the old key on the exchange' : 'No old key to delete'].map((s, i) => <div key={i} className={i < 2 ? 'done' : ''}><span>{i < 2 ? '✓' : i + 1}</span>{s}</div>)}
          </div>
        </div>
      ) : (
        <>
          {step === 'confirm' && <div className="pms-confirm-banner danger"><span className="ic">⚠</span><div><b>This replaces the key set on {credDate(row.created_at)}.</b> Bots may keep the previous key for up to 30 minutes. Delete the old key on the exchange only after that.</div></div>}
          <div style={step === 'confirm' ? { display: 'none' } : null}>
          <div className="pms-confirm-banner warn"><span className="ic">⚠</span><div>The key must be <b>IP-allowlisted to {CRED_EGRESS[env]}</b> (this environment's egress address) and have <b>withdrawals disabled</b>.</div></div>
          {err && <div className={`cred-err ${err === 'upstream_unavailable' ? 'warn' : ''}`}>{CRED_ERR[err]}{CRED_KEEP_FIELDS.includes(err) ? <span> Your entries were kept.</span> : <span> Fields were cleared.</span>}</div>}
          <div className="pms-form-body">
            <FormField label="API key" required error={null}>
              <div className="pms-ff-input"><input ref={keyRef} type="text" className="pms-mono" placeholder="Paste the API key" {...CRED_SAFE} onInput={e => setOk(o => ({ ...o, key: credValid(e.target.value, 8, 256) }))}/></div>
            </FormField>
            <FormField label="API secret" required hint="8–256 printable characters, no spaces at either end">
              <div className="pms-ff-input"><input ref={secRef} type="password" className="pms-mono" placeholder="••••••••" {...CRED_SAFE} autoComplete="new-password" onInput={e => setOk(o => ({ ...o, sec: credValid(e.target.value, 8, 256) }))}/></div>
            </FormField>
            {okx && <FormField label="Passphrase" required hint="Required for OKX">
              <div className="pms-ff-input"><input ref={passRef} type="password" className="pms-mono" placeholder="••••••" {...CRED_SAFE} autoComplete="new-password" onInput={e => setOk(o => ({ ...o, pass: credValid(e.target.value, 1, 128) }))}/></div>
            </FormField>}
            <FormRow>
              <FormField label="IP restricted on the exchange"><FilterToggle label={ipr ? 'Yes, allowlisted' : 'No'} checked={ipr} onChange={setIpr}/></FormField>
              <FormField label="Authenticator code" required hint="Demo: 000000 wrong code · 111111 rate limit · 999999 unknown outcome">
                <FormInput value={totp} onChange={v => setTotp(v.replace(/\D/g, '').slice(0, 6))} placeholder="6 digits" mono/>
              </FormField>
            </FormRow>
            <div className="cred-fine">Sent over the PMS socket inside Tailscale. PMS never stores, logs or shows the key; the backend stores it encrypted.</div>
          </div>
          </div>
        </>
      )}
    </Modal>
  );
}

Object.assign(window, { ApiKeysCard, SetKeyModal });
