/* Sidebar — navigation */

const NAV = [
  { group: "Portfolio", items: [
    { id: "overview",   label: "Overview",        icon: "grid" },
    { id: "positions",  label: "Positions",       icon: "stack" },
    { id: "blotter",    label: "Orders & blotter",icon: "list", badge: { v: "LIVE", kind: "info" } },
    { id: "pnl",        label: "P&L attribution", icon: "trend" },
    { id: "firm",       label: "Firm PnL",        icon: "coin" },
  ]},
  { group: "Strategies", items: [
    { id: "strategies", label: "Strategies",      icon: "layers" },
    { id: "bots",       label: "Bots & sagas",    icon: "cube", badge: { v: "1", kind: "warn" } },
  ]},
  { group: "Investors", items: [
    { id: "fundflow",   label: "Fund flow",       icon: "flow", badge: { v: "13", kind: "info" } },
    { id: "investors",  label: "Investors",       icon: "users" },
  ]},
  { group: "Risk & Ops", items: [
    { id: "risk",       label: "Risk & limits",   icon: "shield", badge: { v: "1", kind: "neg" } },
    { id: "recon",      label: "Reconciliation", icon: "check", badge: { v: "4", kind: "warn" } },
    { id: "venues",     label: "Counterparties", icon: "building" },
    { id: "transfers",  label: "Transfers",       icon: "arrow", badge: { v: "6", kind: "warn" } },
  ]},
  { group: "System", items: [
    { id: "reports",    label: "Reports",         icon: "doc" },
    { id: "admin",      label: "Admin",           icon: "key" },
  ]},
];

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
};

function Sidebar({ active, onNav, collapsed }) {
  return (
    <aside className="pms-sidebar">
      <div className="pms-sb-brand">
        <div className="pms-sb-brand-skull"></div>
        {!collapsed && (
          <div className="pms-sb-brand-text">
            <div className="pms-sb-brand-name">Kemely PMS</div>
            <div className="pms-sb-brand-sub">Internal · v2.4</div>
          </div>
        )}
      </div>
      <nav style={{flex: 1, overflowY: 'auto', overflowX: 'hidden'}}>
        {NAV.map((grp,i) => (
          <div className="pms-sb-section" key={i}>
            {!collapsed && <div className="pms-sb-label">{grp.group}</div>}
            {grp.items.map(item => (
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
                  {item.badge && <span className={`pms-sb-badge ${item.badge.kind}`}>{item.badge.v}</span>}
                </>}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div className="pms-sb-foot">
        <div className="pms-sb-user">
          <div className="pms-sb-avatar">EC</div>
          {!collapsed && <>
            <div className="pms-sb-user-info">
              <div className="pms-sb-user-name">Emily Chen</div>
              <div className="pms-sb-user-role">PM · Kemely Capital</div>
            </div>
            <svg className="pms-sb-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M5 6l3 3 3-3"/>
            </svg>
          </>}
        </div>
      </div>
    </aside>
  );
}

function TopBar({ crumbs, ccy, setCcy, onToggleSidebar }) {
  return (
    <header className="pms-topbar">
      <div className="pms-crumbs">
        <span className="sep">{crumbs[0]}</span>
        <span className="sep">/</span>
        <strong>{crumbs[1]}</strong>
      </div>
      <div className="pms-search">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
        Search positions, orders, clients…
        <kbd>⌘K</kbd>
      </div>
      <div className="spacer"></div>
      <div className="pms-topbar-right">
        <div className="pms-pill-status">
          <span className="dot"></span>
          All systems · {NOW.toISOString().slice(11,16)} UTC
        </div>
        <div className="pms-seg" role="tablist" aria-label="Currency">
          {['USD','USDC','BTC'].map(c => (
            <button key={c} className={ccy===c?'active':''} onClick={()=>setCcy(c)}>{c}</button>
          ))}
        </div>
        <button className="pms-icon-btn" title="Notifications">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 11V7a5 5 0 0110 0v4l1.5 2H1.5L3 11zM6 14a2 2 0 004 0"/></svg>
          <span className="pms-dot"></span>
        </button>
        <button className="pms-icon-btn" title="Refresh">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M14 2v4h-4M2 14v-4h4"/><path d="M3.5 6a5 5 0 018.5-1.5L14 6M2 10l2 1.5A5 5 0 0012.5 10"/></svg>
        </button>
      </div>
    </header>
  );
}

Object.assign(window, { Sidebar, TopBar, NAV });
