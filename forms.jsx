/* Reusable form + confirmation modal toolkit.
   Built on the existing <Modal>. Provides labelled fields, a generic
   FormModal shell, and a ConfirmModal for dangerous actions (typed
   confirmation + optional reason). No real submission — these are
   design flows that close with a toast-style stub. */

// ─── Field primitives ──────────────────────────────────────────
function FormField({ label, hint, required, children, error }) {
  return (
    <div className="pms-ff">
      <label className="pms-ff-label">{label}{required && <span className="req">*</span>}</label>
      {children}
      {error ? <div className="pms-ff-err">{error}</div> : hint ? <div className="pms-ff-hint">{hint}</div> : null}
    </div>
  );
}

function FormInput({ value, onChange, placeholder, type = 'text', prefix, suffix, mono }) {
  return (
    <div className={`pms-ff-input ${prefix ? 'has-prefix' : ''} ${suffix ? 'has-suffix' : ''}`}>
      {prefix && <span className="pms-ff-affix">{prefix}</span>}
      <input type={type} value={value} placeholder={placeholder} className={mono ? 'pms-mono' : ''}
        onChange={e => onChange(e.target.value)}/>
      {suffix && <span className="pms-ff-affix suf">{suffix}</span>}
    </div>
  );
}

function FormSelect({ value, onChange, options }) {
  return (
    <div className="pms-ff-select">
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.v ?? o} value={o.v ?? o}>{o.l ?? o}</option>)}
      </select>
      <svg className="caret" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4l3 3 3-3"/></svg>
    </div>
  );
}

function FormTextarea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea className="pms-ff-textarea" rows={rows} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}/>;
}

function FormSeg({ value, onChange, options }) {
  return (
    <div className="pms-seg pms-ff-seg">
      {options.map(o => (
        <button key={o.v ?? o} className={value === (o.v ?? o) ? 'active' : ''} onClick={() => onChange(o.v ?? o)}>{o.l ?? o}</button>
      ))}
    </div>
  );
}

function FormRow({ children }) { return <div className="pms-ff-row">{children}</div>; }

// ─── Generic form modal ────────────────────────────────────────
function FormModal({ open, title, subtitle, onClose, onSubmit, submitLabel = 'Submit', submitTone = 'primary', canSubmit = true, children, note }) {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => { if (open) setDone(false); }, [open]);
  const submit = () => { setDone(true); setTimeout(() => { onSubmit && onSubmit(); onClose(); }, 850); };
  return (
    <Modal open={open} title={title} onClose={onClose}
      footer={done ? null : <>
        <button className="pms-btn ghost" onClick={onClose}>Cancel</button>
        <button className={`pms-btn ${submitTone}`} disabled={!canSubmit} onClick={submit}>{submitLabel}</button>
      </>}>
      {subtitle && <div className="pms-form-sub">{subtitle}</div>}
      {done ? (
        <div className="pms-form-done">
          <div className="ic">✓</div>
          <div className="t">Submitted</div>
          <div className="s">{note || 'Request queued — this is a design prototype, no live submission.'}</div>
        </div>
      ) : (
        <div className="pms-form-body">{children}</div>
      )}
    </Modal>
  );
}

// ─── Dangerous-action confirmation ─────────────────────────────
function ConfirmModal({ open, title, onClose, onConfirm, confirmLabel = 'Confirm', tone = 'danger',
  body, confirmPhrase, requireReason, impact }) {
  const [typed, setTyped] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [done, setDone] = React.useState(false);
  React.useEffect(() => { if (open) { setTyped(''); setReason(''); setDone(false); } }, [open]);
  const phraseOk = !confirmPhrase || typed.trim().toUpperCase() === confirmPhrase.toUpperCase();
  const reasonOk = !requireReason || reason.trim().length >= 5;
  const ok = phraseOk && reasonOk;
  const go = () => { setDone(true); setTimeout(() => { onConfirm && onConfirm(reason); onClose(); }, 850); };
  return (
    <Modal open={open} title={title} onClose={onClose}
      footer={done ? null : <>
        <button className="pms-btn ghost" onClick={onClose}>Cancel</button>
        <button className={`pms-btn ${tone}`} disabled={!ok} onClick={go}>{confirmLabel}</button>
      </>}>
      {done ? (
        <div className="pms-form-done"><div className="ic">✓</div><div className="t">Done</div><div className="s">Action dispatched — design prototype, no live effect.</div></div>
      ) : (
        <>
          <div className={`pms-confirm-banner ${tone}`}>
            <span className="ic">⚠</span>
            <div>{body}</div>
          </div>
          {impact && (
            <div className="pms-confirm-impact">
              {impact.map((r, i) => <div key={i} className="row"><span className="k">{r.k}</span><span className="v">{r.v}</span></div>)}
            </div>
          )}
          {requireReason && (
            <FormField label="Reason (audit log)" required>
              <FormTextarea value={reason} onChange={setReason} placeholder="Min 5 characters — recorded in the immutable audit log." rows={2}/>
            </FormField>
          )}
          {confirmPhrase && (
            <FormField label={<>Type <span className="pms-mono" style={{color:'var(--pms-neg)'}}>{confirmPhrase}</span> to confirm</>} required>
              <FormInput value={typed} onChange={setTyped} placeholder={confirmPhrase} mono/>
            </FormField>
          )}
        </>
      )}
    </Modal>
  );
}

Object.assign(window, {
  FormField, FormInput, FormSelect, FormTextarea, FormSeg, FormRow,
  FormModal, ConfirmModal,
});
