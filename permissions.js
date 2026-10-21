/* Permissions — roles → scopes. Every nav item, hub sub-tab and overview
   block declares the scope it needs; anything the role lacks is hidden.
   Roles are editable in Admin › Roles & permissions; edits persist in
   localStorage and broadcast `pms:roles` so the shell re-renders. */
const PMS_DEFAULT_ROLES = {
  admin:      { label: 'Admin',              short: 'ADM', scopes: '*', locked: true },
  pm:         { label: 'Portfolio manager',  short: 'PM',  scopes: ['strategies', 'research', 'trading', 'fundflow', 'investors', 'recon', 'finance'] },
  ops:        { label: 'Operations',         short: 'OPS', scopes: ['strategies', 'research', 'trading', 'fundflow', 'fundflow.approve', 'recon', 'admin.health'] },
  compliance: { label: 'Compliance',         short: 'CMP', scopes: ['investors', 'kyc.approve', 'fundflow', 'fundflow.approve', 'recon', 'admin.audit'] },
  ir:         { label: 'Investor relations', short: 'IR',  scopes: ['investors', 'fundflow'] },
};
// Scope catalogue — what each scope unlocks (tabs · sub-tabs · overview blocks)
const PMS_SCOPES = [
  { id: 'strategies',       label: 'Strategies & bots',      unlocks: { tabs: ['Strategies'], subs: ['Strategies', 'Bots & sagas', 'Create strategy'], blocks: ['Performance', 'Strategies'] } },
  { id: 'research',         label: 'TradeSim research',      unlocks: { tabs: ['TradeSim Hub'], blocks: ['TradeSim Hub'] } },
  { id: 'trading',          label: 'Trading desk',           unlocks: { tabs: ['Trading'], subs: ['Positions', 'Orders & executions', 'P&L attribution'], blocks: ['Trading'] } },
  { id: 'investors',        label: 'Organizations (view)',   unlocks: { tabs: ['Organizations'], subs: ['Organizations', 'Quarantine'], blocks: ['Organizations'] } },
  { id: 'kyc.approve',      label: 'Review KYC & whitelist wallets', unlocks: { subs: ['KYC review', 'Wallet whitelisting'], blocks: ['Needs attention › KYC'] } },
  { id: 'fundflow',         label: 'Fund flow (view)',       unlocks: { tabs: ['Fund flow'], subs: ['Deposits & withdrawals'], blocks: ['Fund flow'] } },
  { id: 'fundflow.approve', label: 'Approve withdrawals & transfers', unlocks: { subs: ['Fund flow › Approvals'], blocks: ['Needs attention › withdrawals', 'Fund flow › awaiting approval'] } },
  { id: 'recon',            label: 'Reconciliation',         unlocks: { tabs: ['Reconciliation'], blocks: ['Reconciliation'] } },
  { id: 'finance',          label: 'Firm finance',           unlocks: { tabs: ['Finance'], blocks: ['Finance'] } },
  { id: 'admin',            label: 'Administration',         unlocks: { tabs: ['Admin'], subs: ['Users, keys & audit', 'Roles & permissions', 'Counterparties'], blocks: ['Admin'] } },
  { id: 'admin.health',     label: 'System health (read)',   unlocks: { blocks: ['Needs attention › service errors'] } },
  { id: 'admin.audit',      label: 'Audit log (read)',       unlocks: { blocks: ['Needs attention › audit events'] } },
];
const PMS_SCOPE_LABELS = Object.fromEntries(PMS_SCOPES.map(s => [s.id, s.label]));

const PMS_ROLES_KEY = 'pms.roles.v1';
let PMS_ROLES = (() => {
  try { const raw = localStorage.getItem(PMS_ROLES_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return JSON.parse(JSON.stringify(PMS_DEFAULT_ROLES));
})();
function pmsRoles() { return PMS_ROLES; }
function pmsSaveRoles(next) {
  PMS_ROLES = next; window.PMS_ROLES = next;
  try { localStorage.setItem(PMS_ROLES_KEY, JSON.stringify(next)); } catch (e) {}
  window.dispatchEvent(new CustomEvent('pms:roles'));
}
function pmsSetScope(roleId, scope, on) {
  const r = PMS_ROLES[roleId]; if (!r || r.scopes === '*') return;
  const set = new Set(r.scopes); on ? set.add(scope) : set.delete(scope);
  pmsSaveRoles({ ...PMS_ROLES, [roleId]: { ...r, scopes: [...set] } });
}
function pmsAddRole(label) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'role_' + Date.now();
  if (PMS_ROLES[id]) return id;
  pmsSaveRoles({ ...PMS_ROLES, [id]: { label, short: label.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'NEW', scopes: [] } });
  return id;
}
function pmsRemoveRole(id) { if (PMS_ROLES[id]?.locked) return; const n = { ...PMS_ROLES }; delete n[id]; pmsSaveRoles(n); }
function pmsResetRoles() { pmsSaveRoles(JSON.parse(JSON.stringify(PMS_DEFAULT_ROLES))); }
function pmsCan(roleId, scope) {
  if (!scope) return true;
  const r = PMS_ROLES[roleId] || PMS_ROLES.admin;
  if (r.scopes === '*') return true;
  // 'admin' implies every admin.* scope; a specific admin.* grant does not imply 'admin'
  return r.scopes.includes(scope) || (scope.startsWith('admin.') && r.scopes.includes('admin'));
}
Object.assign(window, { PMS_ROLES, PMS_DEFAULT_ROLES, PMS_SCOPES, PMS_SCOPE_LABELS, pmsRoles, pmsCan, pmsSetScope, pmsAddRole, pmsRemoveRole, pmsResetRoles, pmsSaveRoles });
