/* v3 shell — PmsHeader, PmsSidebar, PageWrapper, hash router. Mirrors apps/pm-system/src/shared/components. */
const NAV = [
  { group: 'Portfolio', items: [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'strategies', label: 'Strategies', icon: 'strategies', scope: 'strategies' },
    { id: 'tradesim', label: 'TradeSim Hub', icon: 'bolt', scope: 'research' },
    { id: 'trading', label: 'Trading', icon: 'list', scope: 'trading', badge: { v: 'LIVE', kind: 'info', whenLive: true } },
    { id: 'investors', label: 'Organizations', icon: 'groups', scope: 'investors', liveBadge: 'organizations' },
    { id: 'fundflow', label: 'Fund flow', icon: 'sync', scope: 'fundflow', liveBadge: 'fundflow' },
  ] },
  { group: 'Control', items: [
    { id: 'recon', label: 'Reconciliation', icon: 'check', scope: 'recon', liveBadge: 'recon' },
    { id: 'finance', label: 'Finance', icon: 'paid', scope: 'finance' },
    { id: 'admin', label: 'Admin', icon: 'key', scope: ['admin.users', 'admin.settings', 'admin.health', 'admin.audit', 'admin'] },
  ] },
];
const PAGE_SCOPE = Object.fromEntries(NAV.flatMap(g => g.items).map(i => [i.id, i.scope]));
const SEG_LABEL = { strategies: 'Strategies', tradesim: 'TradeSim Hub', trading: 'Trading', investors: 'Organizations', fundflow: 'Fund flow', recon: 'Reconciliation', finance: 'Finance', admin: 'Admin',
  positions: 'Positions', orders: 'Orders & executions', pnl: 'P&L attribution', orgs: 'Organizations', accounts: 'Investors', kyc: 'KYC review', whitelisting: 'Wallet whitelisting', quarantine: 'Quarantine',
  deposits: 'Deposits & withdrawals', approvals: 'Approvals', users: 'Users, keys & audit', roles: 'Roles & permissions', counterparties: 'Counterparties', bots: 'Bots & sagas', new: 'Create strategy',
  overview: 'Overview', pools: 'Pools', 'bot-triage': 'Bot triage', 'fee-policy': 'Fee policy' };

const parseHash = () => (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
function useRoute() {
  const [segs, setSegs] = useState(parseHash);
  useEffect(() => { const f = () => setSegs(parseHash()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return segs;
}
const navigate = path => { location.hash = '#' + path; document.querySelector('.page-wrapper')?.scrollTo(0, 0); };

const RoleCtx = React.createContext(null);
function usePreviewRole() { return React.useContext(RoleCtx); }
const can = (role, need) => V3.hasScope(role.scopes, need);
const scopeCount = scopes => scopes === '*' ? 'all scopes' : `${scopes.length} of ${V3.SCOPES.length} scopes`;

function Brand({ collapsed, onToggle }) {
  return <div className="pms-brand">{!collapsed && <div><div className="pms-brand__name">Kemely PMS</div><div className="pms-brand__sub">Internal · v3.0</div></div>}
    <button className="pms-brand__collapse" onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><Icon n={collapsed ? 'chevR' : 'chevL'}/></button></div>;
}
function StreamStatus({ st }) {
  const V = { live: ['live', 'Live', 'streaming', 'var(--system-success-500)'], pending: ['pending', 'Reconnecting', 'attempt 2', 'var(--system-warning-500)'], offline: ['offline', 'Offline', 'socket closed', 'var(--system-error-500)'] }[st];
  return <div className={`stream-status stream-status--${V[0]}`} role="status"><StatusDot color={V[3]} glow={st === 'live'}/><span>{V[1]}<span className="stream-status__detail"> · {V[2]}</span></span></div>;
}
function RoleDropdown() {
  const { preview, own, setPreview } = usePreviewRole();
  const [open, setOpen] = useState(false);
  if (own.id !== 'admin') return null;
  return <div className="role-dd">
    <button className="role-dd__btn" onClick={() => setOpen(o => !o)}><span className="role-badge">{preview.id}</span><span className="role-dd__as">Viewing as</span><span className="role-dd__role">{preview.name}</span><Icon n="chevD"/></button>
    {open && <><div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)}></div><div className="panel role-dd__panel">
      <div className="role-dd__hint">Preview the app as another role. Pages, tabs, blocks and buttons follow its scopes; your own permissions don't change. <a onClick={() => { setOpen(false); navigate('/admin/roles'); }}>Edit roles</a></div>
      {V3.ROLES.map(r => <div key={r.id} className={`role-dd__item ${r.id === preview.id ? 'on' : ''}`} onClick={() => { setPreview(r.id); setOpen(false); }}><span className="role-badge">{r.id}</span><span className="nm">{r.name}</span><span className="sc">{scopeCount(r.scopes)}</span>{r.id === preview.id && <span style={{ color: '#b06cff' }}>✓</span>}</div>)}
    </div></>}
  </div>;
}
function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(V3.NOTIFS);
  const [shown, setShown] = useState(4);
  const unread = rows.filter(r => !r.read).length, crit = rows.filter(r => !r.read && r.level === 'critical').length, warn = rows.filter(r => !r.read && r.level === 'warning').length;
  const vis = rows.slice(0, shown), rem = rows.length - vis.length;
  return <div className="bell">
    <button className={`bell__btn ${open ? 'on' : ''}`} onClick={() => setOpen(o => !o)} title="Notifications"><Icon n="bell"/>{unread > 0 && <span className={`bell__badge ${crit ? 'crit' : ''}`}>{unread}</span>}</button>
    {open && <><div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)}></div><div className="panel np">
      <div className="np__head"><span className="np__title">Notifications</span>{crit > 0 && <span className="np__chip crit">{crit} critical</span>}{warn > 0 && <span className="np__chip warn">{warn} warning</span>}<button className="np__mark" disabled={!unread} onClick={() => setRows(r => r.map(x => ({ ...x, read: true })))}>Mark all read</button></div>
      <div className="np__list">{vis.map(n => <button key={n.id} className={`ni ni--${n.level} ${n.read ? 'ni--read' : ''}`} onClick={() => { setRows(r => r.map(x => x.id === n.id ? { ...x, read: true } : x)); setOpen(false); n.link && navigate(n.link); }}>
        <span className="ni__icon">{{ critical: '⚠', warning: '!', info: '●' }[n.level]}</span>
        <span className="ni__body"><span className="ni__title">{n.title}{!n.read && <span className="ni__unread"></span>}</span><span className="ni__text">{n.body}</span><span className="ni__time">{fmtAge(n.age)} ago</span></span>{n.link && <span className="ni__go">→</span>}</button>)}
        {rem > 0 && <button className="np__more" onClick={() => setShown(s => s + 4)}>Show {Math.min(4, rem)} more · {rem} older</button>}</div>
      <div className="np__foot"><button disabled title={NOT_SERVED}>Notification settings</button></div>
    </div></>}
  </div>;
}
function PmsHeader({ collapsed, onToggle, segs, stream }) {
  const [ccy, setCcy] = useState('USD');
  const crumbs = ['Kemely PMS', ...(segs.length ? segs.filter(s => SEG_LABEL[s] || /^(ORG|STR|INV)/i.test(s) || /^\d+$/.test(s)).map(s => SEG_LABEL[s] || s) : ['Overview'])];
  return <header className="pms-header">
    <div className="pms-header__brand-cell" style={{ width: collapsed ? 64 : 240 }}><Brand collapsed={collapsed} onToggle={onToggle}/></div>
    <div className="pms-header__bar">
      <section className="pms-header__left">
        <div className="pms-header__rout">{crumbs.map((c, i) => <React.Fragment key={i}>{i > 0 && <span>/</span>}{i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}</React.Fragment>)}</div>
        <div className="hsearch"><Icon n="search"/><input placeholder="Search positions, orders, organizations..."/><kbd>⌘K</kbd></div>
      </section>
      <section className="pms-header__right"><StreamStatus st={stream}/><Seg options={['USD', 'USDC', 'BTC']} value={ccy} onChange={setCcy}/><RoleDropdown/><NotificationsBell/></section>
    </div>
  </header>;
}
function TotpEnrollModal({ open, onClose }) {
  const [code, setCode] = useState('');
  return <PmsModal open={open} sm title="Enable two-factor authentication" onClose={onClose} foot={<><PmsButton variant="ghost" onClick={onClose}>Cancel</PmsButton><PmsButton variant="primary" disabled={code.length !== 6} onClick={onClose}>Confirm</PmsButton></>}>
    <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>Scan the QR code with an authenticator app, then enter the 6-digit code it shows. Approvals, KYC decisions and key changes ask for a fresh code.</p>
    <div style={{ width: 148, height: 148, borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px dashed rgba(255,255,255,.15)', display: 'grid', placeItems: 'center', fontSize: 11 }} className="muted">QR code</div>
    <Field label="Authenticator code" req><TotpCodeInput value={code} onChange={setCode}/></Field>
  </PmsModal>;
}
function PmsSidebar({ collapsed, segs, live }) {
  const { preview, own } = usePreviewRole();
  const [open, setOpen] = useState(false);
  const [totp, setTotp] = useState(false);
  const u = V3.USER;
  const page = segs[0] || 'overview';
  return <aside className="sb" style={{ width: collapsed ? 64 : 240 }}>
    <nav className="sb__nav">{NAV.map(g => { const items = g.items.filter(i => can(preview, i.scope)); if (!items.length) return null; return <div className="sb__section" key={g.group}>{!collapsed && <div className="sb__label">{g.group}</div>}
      {items.map(i => { const lb = i.liveBadge && V3.NAV_BADGES[i.liveBadge]; const b = lb ? { v: String(lb.value), kind: lb.kind } : i.badge && (!i.badge.whenLive || live) ? i.badge : null; return (
        <div key={i.id} className={`sb__item ${page === i.id ? 'on' : ''}`} onClick={() => navigate(i.id === 'overview' ? '/' : '/' + i.id)} title={i.label}><Icon n={i.icon}/>{!collapsed && <><span className="lb">{i.label}</span>{b && <span className={`sb__badge sb__badge--${b.kind}`}>{b.v}</span>}</>}</div>); })}
    </div>; })}</nav>
    <div className="sb__foot">
      {open && <><div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setOpen(false)}></div><div className="sbu__panel">
        <div className="sbu__meta">Signed in via {u.wallet}</div>
        {u.totp_enabled ? <div className="sbu__act st"><Icon n="shield"/>2FA enabled</div> : <button className="sbu__act" onClick={() => { setOpen(false); setTotp(true); }}><Icon n="shield"/>Enable 2FA</button>}
        <button className="sbu__act out" onClick={() => { setOpen(false); navigate('/login'); }}><Icon n="logout"/>Sign out</button>
      </div></>}
      <button className="sbu__trigger" onClick={() => setOpen(o => !o)}><div className="sbu__avatar">EC</div>{!collapsed && <><div className="sbu__info"><div className="sbu__name">{u.display_name}</div><div className="sbu__role">{own.name} · <span className="mono">{shortAddr(u.address)}</span></div></div><Icon n="chevD"/></>}</button>
    </div>
    <TotpEnrollModal open={totp} onClose={() => setTotp(false)}/>
  </aside>;
}

function Login() {
  return <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '24px 16px', background: 'radial-gradient(1200px 600px at 20% -10%,rgba(176,108,255,.12),transparent 60%),#141414' }}>
    <section style={{ width: '100%', maxWidth: 440, padding: '26px 26px 18px', background: '#16171f', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,.5)' }}>
      <div style={{ paddingBottom: 14, marginBottom: 18, borderBottom: '1px solid rgba(255,255,255,.06)' }}><div style={{ fontSize: 15, fontWeight: 700 }}>Kemely PMS</div><div className="muted" style={{ fontSize: 11 }}>Portfolio management · internal</div></div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sign in with your wallet</div>
      <p className="muted" style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>Access is wallet-based — no passwords. Your address must be on the team allow-list; your role and scopes are attached to it by an admin.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{['MetaMask', 'WalletConnect', 'Coinbase Wallet'].map(w => <PmsButton key={w} onClick={() => navigate('/')}>{w}</PmsButton>)}</div>
      <p className="muted" style={{ margin: '16px 0 0', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 10.5, textAlign: 'center' }}>Not on the allow-list? Ask an admin to add your address under Admin › Users.</p>
    </section>
  </main>;
}

function App() {
  const segs = useRoute();
  const [t, setTweak] = useTweaks(window.V3_TWEAKS);
  const [collapsed, setCollapsed] = useState(false);
  const own = V3.ROLES[0];
  const preview = V3.ROLES.find(r => r.id === t.viewAs) || own;
  window.V3_STATE = t.dataState; window.V3_DOCRESP = t.docResponse || 'ok';
  const page = segs[0] || 'overview';
  const PAGES = { overview: window.OverviewPage, strategies: window.StrategiesPage, tradesim: window.TradeSimPage, trading: window.TradingPage, investors: window.InvestorsPage, fundflow: window.FundFlowPage, recon: window.ReconPage, finance: window.FinancePage, admin: window.AdminPage };
  const allowed = page === 'login' || can(preview, PAGE_SCOPE[page]);
  useEffect(() => { if (!allowed) navigate('/'); }, [allowed]);
  if (page === 'login') return <><Login/><V3Tweaks t={t} setTweak={setTweak}/></>;
  const P = PAGES[page] || window.OverviewPage;
  return <RoleCtx.Provider value={{ preview, own, setPreview: id => setTweak('viewAs', id) }}>
    <div className="page-root">
      <PmsHeader collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} segs={segs} stream={t.stream}/>
      <div className="page-shell"><PmsSidebar collapsed={collapsed} segs={segs} live={t.stream === 'live'}/>
        <main className="page-wrapper">{P ? <P segs={segs.slice(1)} live={t.stream === 'live'}/> : <div className="basic-page muted">Page not built yet.</div>}</main>
      </div>
    </div>
    <V3Tweaks t={t} setTweak={setTweak}/>
  </RoleCtx.Provider>;
}
function V3Tweaks({ t, setTweak }) {
  return <TweaksPanel>
    <TweakSection label="Viewing as (role preview)"/><TweakSelect label="Role" value={t.viewAs} options={V3.ROLES.map(r => ({ label: r.name, value: r.id }))} onChange={v => setTweak('viewAs', v)}/>
    <TweakSection label="Connection & data"/><TweakRadio label="Socket" value={t.stream} options={[{ label: 'Live', value: 'live' }, { label: 'Pending', value: 'pending' }, { label: 'Offline', value: 'offline' }]} onChange={v => setTweak('stream', v)}/>
      <TweakSelect label="Topic state" value={t.dataState} options={[{ label: 'Snapshot loaded', value: 'live' }, { label: 'Loading', value: 'loading' }, { label: 'Error', value: 'error' }]} onChange={v => setTweak('dataState', v)}/>
    <TweakSelect label="Document response (KYC viewer)" value={t.docResponse || 'ok'} options={[{ label: '200 · opens', value: 'ok' }, { label: 'Streaming (stuck)', value: 'loading' }, { label: '5xx · error', value: 'error' }, { label: '429 · limit reached', value: 'limit' }, { label: '404 · file missing', value: 'missing' }]} onChange={v => setTweak('docResponse', v)}/>
    <TweakSection label="Screens"/><TweakButton label="Login page" onClick={() => navigate('/login')}/>
  </TweaksPanel>;
}
Object.assign(window, { App, usePreviewRole, can, navigate, SEG_LABEL });
