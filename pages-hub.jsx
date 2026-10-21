/* Hub pages — group existing pages under one nav item with a sub-tab strip.
   Sub-tabs may declare a scope; the hub hides the ones the role lacks. */

function Hub({ tabs, sub, setSub, can, children }) {
  const visible = tabs.filter(t => can(t.scope));
  const cur = visible.some(t => t.id === sub) ? sub : visible[0]?.id;
  React.useEffect(() => { if (cur && cur !== sub) setSub(cur); }, [cur]);
  const hidden = tabs.length - visible.length;
  return (
    <>
      {(visible.length > 1 || hidden > 0) && (
      <div className="pms-hub-tabs" role="tablist">
        {visible.map(t => (
          <button key={t.id} role="tab" className={cur === t.id ? 'active' : ''} onClick={() => setSub(t.id)}>
            {t.label}{t.badge ? <span className={`b ${t.badge.kind || ''}`}>{t.badge.v}</span> : null}
          </button>
        ))}
        {hidden > 0 && (
          <span className="pms-hub-locked" title="Hidden by your role">{hidden} hidden by role</span>
        )}
      </div>
      )}
      {typeof children === 'function' ? children(cur) : children}
    </>
  );
}

function StrategiesHub({ sub, setSub, can, poolId, setPoolId }) {
  const tabs = [
    { id: 'list', label: 'Strategies' },
    { id: 'bots', label: 'Bots & sagas', badge: { v: '1', kind: 'warn' } },
  ];
  if (poolId) return <PoolDetailPage poolId={poolId} onBack={() => setPoolId(null)}/>;
  if (sub === 'new') return <StrategyCreatePage onCancel={() => setSub('list')} onDone={(id) => { setSub('list'); if (id) setPoolId(id); }}/>;
  return (
    <Hub tabs={tabs} sub={sub} setSub={setSub} can={can}>
      {cur => cur === 'bots' ? <BotsPage/> : <StrategiesPage onSelect={setPoolId} onNew={() => setSub('new')}/>}
    </Hub>
  );
}

function TradingHub({ sub, setSub, can, ccy }) {
  const tabs = [
    { id: 'positions', label: 'Positions' },
    { id: 'blotter', label: 'Orders & executions', badge: { v: 'LIVE', kind: 'info' } },
    { id: 'pnl', label: 'P&L attribution' },
  ];
  return (
    <Hub tabs={tabs} sub={sub} setSub={setSub} can={can}>
      {cur => cur === 'blotter' ? <BlotterPage/> : cur === 'pnl' ? <PnlPage/> : <PositionsPage ccy={ccy}/>}
    </Hub>
  );
}

function FundFlowHub({ sub, setSub, can }) {
  const fi = window.FUND_INTENTS || [];
  const pend = fi.filter(i => i.dir === 'withdraw' && (i.stage === 'W2_APPROVAL' || i.stage === 'W4_PROVIDER_CHECK')).length;
  const tabs = [
    { id: 'pipeline', label: 'Deposits & withdrawals' },
    { id: 'approvals', label: 'Approvals', scope: 'fundflow.approve', badge: pend ? { v: String(pend), kind: 'warn' } : null },
  ];
  return (
    <Hub tabs={tabs} sub={sub} setSub={setSub} can={can}>
      {cur => cur === 'approvals' ? <TransfersPage/> : <FundFlowPage/>}
    </Hub>
  );
}

function FinanceHub({ sub, setSub, can }) {
  const tabs = [{ id: 'pnl', label: 'Firm P&L & revenue' }];
  return (
    <Hub tabs={tabs} sub={sub} setSub={setSub} can={can}>
      {() => <FirmPnlPage/>}
    </Hub>
  );
}

function AdminHub({ sub, setSub, can }) {
  const tabs = [
    { id: 'admin', label: 'Users, keys & audit', scope: 'admin' },
    { id: 'roles', label: 'Roles & permissions', scope: 'admin' },
    { id: 'venues', label: 'Counterparties', scope: 'admin' },
  ];
  return (
    <Hub tabs={tabs} sub={sub} setSub={setSub} can={can}>
      {cur => cur === 'venues' ? <VenuesPage/> : cur === 'roles' ? <RolesPage/> : <AdminPage can={can}/>}
    </Hub>
  );
}

Object.assign(window, { Hub, StrategiesHub, TradingHub, FundFlowHub, FinanceHub, AdminHub });
