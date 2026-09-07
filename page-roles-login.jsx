/* Admin › Roles & permissions — the matrix that decides which tabs, sub-tabs
   and overview blocks each role sees. Wallet login + sign-out live here too. */

function RolesPage() {
  const [, bump] = React.useState(0);
  React.useEffect(() => { const h = () => bump(x => x + 1); window.addEventListener('pms:roles', h); return () => window.removeEventListener('pms:roles', h); }, []);
  const roles = pmsRoles();
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [confirmRm, setConfirmRm] = React.useState(null);
  const users = window.USERS || [];
  const members = id => users.filter(u => (u.role || '').toLowerCase().replace(/[^a-z]/g, '') === (roles[id]?.label || '').toLowerCase().replace(/[^a-z]/g, '') || (u.role || '').toLowerCase() === id).length;
  const has = (rid, s) => pmsCan(rid, s);
  const implied = (rid, s) => roles[rid]?.scopes !== '*' && s.startsWith('admin.') && roles[rid]?.scopes.includes('admin');

  return (
    <>
      <div className="pms-page-head">
        <div>
          <h1>Roles & permissions</h1>
          <div className="sub">A scope unlocks tabs, sub-tabs and Overview blocks. Toggle a cell and the app updates immediately — use <b>Viewing as</b> in the top bar to preview.</div>
        </div>
        <div className="pms-page-actions">
          <button className="pms-btn ghost" onClick={pmsResetRoles}>Reset to defaults</button>
          <button className="pms-btn primary" onClick={() => setAdding(true)}>+ New role</button>
        </div>
      </div>

      <div className="pms-card">
        <div className="pms-card-body flush" style={{ overflowX: 'auto' }}>
          <table className="pms-table rp-tbl">
            <thead>
              <tr>
                <th style={{ minWidth: 260 }}>Scope · what it unlocks</th>
                {Object.entries(roles).map(([id, r]) => (
                  <th key={id} className="rp-role">
                    <div className="rp-role-h">
                      <span className="pms-role-tag">{r.short}</span>
                      <span className="nm">{r.label}</span>
                      <span className="mt">{r.scopes === '*' ? 'all scopes' : `${r.scopes.length} scopes`} · {members(id)} member{members(id) === 1 ? '' : 's'}</span>
                      {!r.locked && <button className="rp-rm" title="Remove role" onClick={() => setConfirmRm(id)}>Remove</button>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PMS_SCOPES.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="rp-scope"><b>{s.label}</b><span className="pms-mono">{s.id}</span></div>
                    <div className="rp-unlocks">
                      {s.unlocks.tabs?.map(t => <span key={t} className="rp-u tab">{t}</span>)}
                      {s.unlocks.subs?.map(t => <span key={t} className="rp-u sub">{t}</span>)}
                      {s.unlocks.blocks?.map(t => <span key={t} className="rp-u blk">{t}</span>)}
                    </div>
                  </td>
                  {Object.entries(roles).map(([rid, r]) => {
                    const on = has(rid, s.id); const lock = r.scopes === '*'; const imp = implied(rid, s.id);
                    return (
                      <td key={rid} className="rp-cell">
                        <button className={`rp-tg ${on ? 'on' : ''} ${lock || imp ? 'lock' : ''}`} disabled={lock || imp}
                          title={lock ? 'Admin always has every scope' : imp ? "Implied by 'admin'" : on ? 'Click to revoke' : 'Click to grant'}
                          onClick={() => pmsSetScope(rid, s.id, !on)}>
                          <span className="k"></span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rp-legend">
        <span><span className="rp-u tab">Tab</span> sidebar destination</span>
        <span><span className="rp-u sub">Sub-tab</span> inside a hub</span>
        <span><span className="rp-u blk">Block</span> on the Overview</span>
        <span className="muted">· Admin is locked to all scopes · <span className="pms-mono">admin</span> implies <span className="pms-mono">admin.*</span> · changes persist in this browser and are recorded in the audit log</span>
      </div>

      <FormModal open={adding} title="New role" onClose={() => setAdding(false)} submitLabel="Create role" canSubmit={newName.trim().length > 1}
        subtitle="A new role starts with no scopes — grant them in the matrix." note="Role created — grant scopes in the matrix."
        onSubmit={() => { pmsAddRole(newName.trim()); setNewName(''); }}>
        <FormField label="Role name" required><FormInput value={newName} onChange={setNewName} placeholder="e.g. Risk officer"/></FormField>
      </FormModal>
      <ConfirmModal open={!!confirmRm} title={`Remove role “${roles[confirmRm]?.label || ''}”`} tone="danger" onClose={() => setConfirmRm(null)} confirmLabel="Remove role"
        body={<>Members of this role lose access to everything it granted and fall back to Overview only. Reassign them first.</>}
        impact={[{ k: 'Members affected', v: String(members(confirmRm)) }, { k: 'Scopes revoked', v: String(roles[confirmRm]?.scopes?.length ?? 0) }]}
        onConfirm={() => pmsRemoveRole(confirmRm)}/>
    </>
  );
}

// ── Wallet login (web3 only) ─────────────────────────────────────
const WALLETS = [
  { id: 'metamask', name: 'MetaMask', hint: 'Browser extension', glyph: 'M' },
  { id: 'walletconnect', name: 'WalletConnect', hint: 'Scan with any mobile wallet', glyph: 'W' },
  { id: 'ledger', name: 'Ledger', hint: 'Hardware · via Ledger Live', glyph: 'L' },
  { id: 'coinbase', name: 'Coinbase Wallet', hint: 'Extension or mobile', glyph: 'C' },
];
const DEMO_ADDR = '0x8f3C…A41e';
function LoginPage({ onLogin }) {
  const [env, setEnv] = React.useState(() => { try { return localStorage.getItem('pms.env') || 'test'; } catch (e) { return 'test'; } });
  const [step, setStep] = React.useState('pick'); // pick → connecting → sign → done
  const [wallet, setWallet] = React.useState(null);
  const nonce = React.useMemo(() => Math.random().toString(36).slice(2, 10).toUpperCase(), []);
  const connect = w => { setWallet(w); setStep('connecting'); setTimeout(() => setStep('sign'), 900); };
  const sign = () => { setStep('done'); setTimeout(() => { try { localStorage.setItem('pms.env', env); } catch (e) {} onLogin({ address: DEMO_ADDR, wallet: wallet.name, env }); }, 700); };
  return (
    <div className="lg">
      <div className="lg-card">
        <div className="lg-brand"><div className="pms-sb-brand-skull"></div><div><div className="n">Kemely PMS</div><div className="s">Portfolio management · internal</div></div></div>
        <div className="lg-env">
          <span>Environment</span>
          <div className="pms-seg">{['test', 'prod'].map(e => <button key={e} className={env === e ? 'active' : ''} onClick={() => setEnv(e)}>{e.toUpperCase()}</button>)}</div>
        </div>
        {step === 'pick' && <>
          <h1>Sign in with your wallet</h1>
          <p>Access is wallet-based — no passwords. Your address must be on the team allow-list; your role and scopes are attached to it by an admin.</p>
          <div className="lg-wallets">
            {WALLETS.map(w => <button key={w.id} className="lg-w" onClick={() => connect(w)}><span className="g">{w.glyph}</span><span className="t"><b>{w.name}</b><span>{w.hint}</span></span><span className="arr">→</span></button>)}
          </div>
        </>}
        {step === 'connecting' && <div className="lg-state"><div className="lg-spin"></div><h1>Connecting to {wallet.name}…</h1><p>Approve the connection request in your wallet.</p></div>}
        {step === 'sign' && <>
          <h1>Sign to authenticate</h1>
          <p>Signing proves you control the wallet. This is a message signature — it costs nothing and moves no funds.</p>
          <div className="lg-msg pms-mono">
            <div>pms.kemely.fund wants you to sign in with your account:</div>
            <div className="a">{DEMO_ADDR}</div>
            <div>Environment: {env.toUpperCase()}</div>
            <div>Nonce: {nonce}</div>
            <div>Issued: {new Date().toISOString().slice(0, 19)}Z · expires in 5 min</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="pms-btn ghost" onClick={() => setStep('pick')}>Use another wallet</button>
            <span className="spacer"></span>
            <button className="pms-btn primary" onClick={sign}>Sign message</button>
          </div>
        </>}
        {step === 'done' && <div className="lg-state"><div className="lg-ok">✓</div><h1>Signed in</h1><p>{DEMO_ADDR} · {wallet.name} · {env.toUpperCase()}</p></div>}
        <div className="lg-foot">Not on the allow-list? Ask an admin to add your address under Admin › Users.</div>
      </div>
    </div>
  );
}

Object.assign(window, { RolesPage, LoginPage });
