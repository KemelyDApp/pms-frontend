/* Sidebar — navigation. 8 top-level destinations; each declares the scope it needs. */

const NAV = [
  { group: "Portfolio", items: [
    { id: "overview",   label: "Overview",        icon: "grid" },
    { id: "strategies", label: "Strategies",      icon: "layers", scope: "strategies" },
    { id: "tradesim",   label: "TradeSim Hub",    icon: "bolt",   scope: "research" },
    { id: "trading",    label: "Trading",         icon: "list",   scope: "trading", badge: { v: "LIVE", kind: "info" } },
    { id: "investors",  label: "Investors",       icon: "users",  scope: "investors" },
    { id: "fundflow",   label: "Fund flow",       icon: "flow",   scope: "fundflow", badgeFn: (can) => { if (can && !can('fundflow.approve')) return null; const n = (window.FUND_INTENTS || []).filter(i => i.dir === 'withdraw' && (i.stage === 'W2_APPROVAL' || i.stage === 'W4_PROVIDER_CHECK')).length; return n ? { v: String(n), kind: 'warn' } : null; } },
  ]},
  { group: "Control", items: [
    { id: "recon",      label: "Reconciliation",  icon: "check",  scope: "recon", badgeFn: () => { const n = (window.RECON_BREAKS_FULL || window.RECON_BREAKS || []).filter(r => r.severity === 'high').length; return n ? { v: String(n), kind: 'neg' } : null; } },
    { id: "finance",    label: "Finance",         icon: "coin",   scope: "finance" },
    { id: "admin",      label: "Admin",           icon: "key",    scope: "admin" },
  ]},
];
window.PMS_NAV = NAV;

const ICONS = {
  grid:  <><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></>,
  stack: <><path d="M2 4l6-2 6 2-6 2-6-2z"/><path d="M2 8l6 2 6-2" opacity="0.6"/><path d="M2 12l6 2 6-2" opacity="0.4"/></>,
  list:  <><path d="M2 4h12M2 8h12M2 12h12"/><circle cx="2" cy="4" r="0.8" fill="currentColor" stroke="none"/><circle cx="2" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="2" cy="12" r="0.8" fill="currentColor" stroke="none"/></>,
  trend: <><path d="M2 12l4-4 3 3 5-6"/><path d="M11 5h3v3"/></>,
  coin:  <><circle cx="8" cy="8" r="6"/><path d="M8 4v8M10 5.5c-.6-.5-1.5-.8-2.5-.8-1.4 0-2.5.7-2.5 1.6S6.1 7.7 7.5 8s2.5.7 2.5 1.6-1.1 1.6-2.5 1.6c-1 0-1.9-.3-2.5-.8"/></>,
  layers:<><path d="M8 2l6 3-6 3-6-3 6-3z"/><path d="M2 8l6 3 6-3" opacity="0.6"/><path d="M2 12l6 3 6-3" opacity="0.4"/></>,
  cube:  <><path d="M8 2l6 3v6l-6 3-6-3V5l6-3z"/><path d="M2 5l6 3 6-3M8 8v7" opacity="0.5"/></>,
  flow:  <><circle cx="3" cy="4" r="1.6"/><circle cx="3" cy="12" r="1.6"/><circle cx="13" cy="8" r="1.6"/><path d="M4.5 4.5C8 5 10 6.5 11.5 7.5M4.5 11.5C8 11 10 9.5 11.5 8.5"/></>,
  users: <><circle cx="6" cy="6" r="2.4"/><path d="M2 14c0-2.4 1.8-4 4-4s4 1.6 4 4"/><circle cx="11.5" cy="5.5" r="1.8" opacity="0.6"/><path d="M9.5 10.5c1-.8 2-1.2 3-1.2 1.6 0 3 1.2 3 3" opacity="0.6"/></>,
  shield:<><path d="M8 2l5 2v4c0 3-2 5.5-5 6.5-3-1-5-3.5-5-6.5V4l5-2z"/></>,
  check: <><circle cx="8" cy="8" r="6"/><path d="M5.5 8.5l2 2 3.5-4"/></>,
  building:<><rect x="3" y="3" width="10" height="11"/><path d="M5 6h2M9 6h2M5 9h2M9 9h2M5 12h2M9 12h2"/></>,
  arrow: <><path d="M3 5h8M8 2l3 3-3 3"/><path d="M13 11H5M8 8l-3 3 3 3"/></>,
  doc:   <><path d="M4 2h6l3 3v9H4V2z"/><path d="M10 2v3h3"/><path d="M6 8h4M6 11h4" strokeWidth="0.8"/></>,
  key:   <><circle cx="5" cy="8" r="3"/><path d="M8 8h6M12 8v3M14 8v2"/></>,
  bolt:  <><path d="M9 1.5L3.5 9H8l-1 5.5L12.5 7H8l1-5.5z"/></>,
};

function Sidebar({ active, onNav, collapsed, roleId, can, session, onLogout }) {
  const role = (window.pmsRoles ? window.pmsRoles() : window.PMS_ROLES || {})[roleId] || { label: 'Admin', short: 'ADM' };
  const [userOpen, setUserOpen] = React.useState(false);
  return (
    <aside className="pms-sidebar">
      <div className="pms-sb-brand">
        <div className="pms-sb-brand-skull"></div>
        {!collapsed && (
          <div className="pms-sb-brand-text">
            <div className="pms-sb-brand-name">Kemely PMS</div>
            <div className="pms-sb-brand-sub">Internal · v3.0</div>
          </div>
        )}
      </div>
      <nav style={{flex: 1, overflowY: 'auto', overflowX: 'hidden'}}>
        {NAV.map((grp,i) => {
          const items = grp.items.filter(it => !can || can(it.scope));
          if (!items.length) return null;
          return (
          <div className="pms-sb-section" key={i}>
            {!collapsed && <div className="pms-sb-label">{grp.group}</div>}
            {items.map(item => {
              const badge = item.badgeFn ? item.badgeFn(can) : item.badge;
              return (
              <div
                key={item.id}
                className={`pms-sb-item ${active === item.id ? 'active' : ''}`}
                onClick={() => onNav(item.id)}
                title={item.label}
              >
                <svg className="pms-sb-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  {ICONS[item.icon]}
                </svg>
                {!collapsed && <>
                  <span>{item.label}</span>
                  {badge && <span className={`pms-sb-badge ${badge.kind}`}>{badge.v}</span>}
                </>}
              </div>
            );})}
          </div>
        );})}
      </nav>
      <div className="pms-sb-foot">
        <div className={`pms-sb-user ${userOpen ? 'open' : ''}`} onClick={() => setUserOpen(o => !o)}>
          <div className="pms-sb-avatar">EC</div>
          {!collapsed && <>
            <div className="pms-sb-user-info">
              <div className="pms-sb-user-name">Emily Chen</div>
              <div className="pms-sb-user-role">{role.label} · <span className="pms-mono">{session?.address || '0x8f3C…A41e'}</span></div>
            </div>
            <svg className="pms-sb-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M5 6l3 3 3-3"/>
            </svg>
          </>}
        </div>
        {userOpen && (
          <div className="pms-sb-menu">
            <div className="h">Signed in via {session?.wallet || 'wallet'} · <span className="pms-mono">{(session?.env || 'test').toUpperCase()}</span></div>
            <button onClick={() => { setUserOpen(false); onNav('admin', 'admin'); }}>My access & keys</button>
            <button className="neg" onClick={() => { setUserOpen(false); onLogout && onLogout(); }}>Sign out</button>
          </div>
        )}
      </div>
    </aside>
  );
}

function TopBar({ crumbs, ccy, setCcy, onToggleSidebar, onNav, roleId, setRoleId, session, onLogout }) {
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [roleOpen, setRoleOpen] = React.useState(false);
  const ROLES = window.pmsRoles ? window.pmsRoles() : (window.PMS_ROLES || {});
  const role = ROLES[roleId] || ROLES.admin;
  const NOTIFS = [
    { id:'n1', cat:'critical', icon:'⚠', title:'Drawdown limit breach', body:'prop-bot-01 at −4.18% / −5.00% cap · strategy paused', time:'2m ago', nav:'strategies', sub:'list' },
    { id:'n2', cat:'action',   icon:'✋', title:'Withdrawal needs approval', body:'INV-1842 · $124K USDC · audit passed', time:'4m ago', nav:'fundflow', sub:'approvals' },
    { id:'n3', cat:'critical', icon:'⚠', title:'Reconciliation FAIL', body:'Balance drift pool 1 / Binance · 93.15 USDT missing', time:'6m ago', nav:'recon' },
    { id:'n4', cat:'action',   icon:'✋', title:'Transfer 2-of-2 signature', body:'TXR-04830 · $1.24M to cold storage', time:'12m ago', nav:'fundflow', sub:'approvals' },
    { id:'n5', cat:'system',   icon:'●', title:'Connector degraded', body:'Deribit feed lag 18s · failover armed', time:'18m ago', nav:'admin', sub:'venues' },
    { id:'n6', cat:'system',   icon:'●', title:'API key expiring', body:'Deribit master key expired · rotate now', time:'1h ago', nav:'admin', sub:'admin' },
  ];
  const counts = { critical: NOTIFS.filter(n=>n.cat==='critical').length, action: NOTIFS.filter(n=>n.cat==='action').length };
  const [shown, setShown] = React.useState(4);
  const visible = NOTIFS.slice(0, shown);
  const remaining = NOTIFS.length - visible.length;
  const go = (n) => { setNotifOpen(false); onNav && onNav(n.nav, n.sub); };
  return (
    <header className="pms-topbar">
      <div className="pms-crumbs">
        <span className="sep">{crumbs[0]}</span>
        <span className="sep">/</span>
        <strong>{crumbs[1]}</strong>
      </div>
      <div className="pms-search">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
        Search positions, orders, investors…
        <kbd>⌘K</kbd>
      </div>
      <div className="spacer"></div>
      <div className="pms-topbar-right">
        <div className="pms-pill-status" title="Streaming over WebSocket">
          <span className="dot"></span>
          Live · streaming
        </div>
        <div className="pms-seg" role="tablist" aria-label="Currency">
          {['USD','USDC','BTC'].map(c => (
            <button key={c} className={ccy===c?'active':''} onClick={()=>setCcy(c)}>{c}</button>
          ))}
        </div>
        <div className="pms-role-wrap">
          <button className={`pms-role-btn ${roleOpen?'active':''}`} onClick={()=>setRoleOpen(o=>!o)} title="Preview the app as another role">
            <span className="pms-role-tag">{role.short}</span>
            <span className="pms-role-lbl">Viewing as <strong>{role.label}</strong></span>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4l3 3 3-3"/></svg>
          </button>
          {roleOpen && <>
            <div className="pms-notif-scrim" onClick={()=>setRoleOpen(false)}></div>
            <div className="pms-role-menu">
              <div className="pms-role-menu-h">Role preview · blocks & tabs follow the role's scopes · <button className="pms-role-edit" onClick={()=>{ setRoleOpen(false); onNav && onNav('admin', 'roles'); }}>edit scopes →</button></div>
              {Object.entries(ROLES).map(([id, r]) => (
                <button key={id} className={`pms-role-opt ${id===roleId?'sel':''}`} onClick={()=>{ setRoleId && setRoleId(id); setRoleOpen(false); }}>
                  <span className="pms-role-tag">{r.short}</span>
                  <span className="nm">{r.label}</span>
                  <span className="sc">{r.scopes==='*' ? 'all scopes' : r.scopes.length + ' scopes'}</span>
                  {id===roleId && <span className="ck">✓</span>}
                </button>
              ))}
              <div className="pms-role-menu-f"><button onClick={()=>{ setRoleOpen(false); onLogout && onLogout(); }}>Sign out</button></div>
            </div>
          </>}
        </div>
        <div className="pms-notif-wrap">
          <button className={`pms-icon-btn ${notifOpen?'active':''}`} title="Notifications" onClick={()=>setNotifOpen(o=>!o)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 11V7a5 5 0 0110 0v4l1.5 2H1.5L3 11zM6 14a2 2 0 004 0"/></svg>
            <span className="pms-dot"></span>
          </button>
          {notifOpen && (
            <>
              <div className="pms-notif-scrim" onClick={()=>setNotifOpen(false)}></div>
              <div className="pms-notif-panel">
                <div className="pms-notif-head">
                  <span className="t">Notifications</span>
                  <span className="pms-notif-summary">
                    <span className="chip crit">{counts.critical} critical</span>
                    <span className="chip act">{counts.action} need action</span>
                  </span>
                  <button className="pms-notif-clear">Mark all read</button>
                </div>
                <div className="pms-notif-list">
                  {visible.map(n => (
                    <div key={n.id} className={`pms-notif-item ${n.cat}`} onClick={()=>go(n)}>
                      <span className="ic">{n.icon}</span>
                      <div className="bd">
                        <div className="ti">{n.title}</div>
                        <div className="bo">{n.body}</div>
                        <div className="me">{n.time}</div>
                      </div>
                      <span className="go">→</span>
                    </div>
                  ))}
                  {remaining > 0 && (
                    <button className="pms-notif-more" onClick={()=>setShown(s=>s+4)}>
                      Show {Math.min(4, remaining)} more · {remaining} older
                    </button>
                  )}
                </div>
                <div className="pms-notif-foot">
                  <button onClick={()=>{ setNotifOpen(false); onNav && onNav('admin'); }}>Notification settings</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { Sidebar, TopBar, NAV });
