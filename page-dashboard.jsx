/* Main Dashboard — situational-awareness surface (per spec).
   Stats only. No action buttons. 4 sections: Critical Ops · Monitoring · Management · Admin. */

function DashboardPage({ ccy, onOpenPool, onNav }) {
  const [span, setSpan] = React.useState('7d');
  const [compare, setCompare] = React.useState(false);
  // Live, WebSocket-driven timestamp (no manual refresh). Ticks every 5s.
  const [lastUpdated, setLastUpdated] = React.useState(() => new Date().toISOString().slice(11, 19) + ' UTC');
  React.useEffect(() => {
    const t = setInterval(() => setLastUpdated(new Date().toISOString().slice(11, 19) + ' UTC'), 5000);
    return () => clearInterval(t);
  }, []);
  const m = React.useMemo(() => window.dashMetricsFor(span), [span]);

  // Section tabs (replaces long-scroll + anchor nav)
  const TABS = [['ops', 'Critical Ops'], ['monitor', 'Monitoring'], ['manage', 'Management'], ['admin', 'Admin']];
  const [tab, setTab] = React.useState(() => {
    const h = (window.location.hash || '').replace('#dash-', '');
    return TABS.some(t => t[0] === h) ? h : 'ops';
  });
  const selectTab = (id) => { setTab(id); history.replaceState(null, '', '#dash-' + id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // ─── Table column defs ───
  // Short crypto wallet address per intent (deterministic from id + chain).
  const walletAddr = (r) => {
    if (r.address) return r.address;
    const seed = (r.id || '').replace(/\D/g, '') || '0';
    const hex = (n) => parseInt(seed.slice(-6) || '0', 10).toString(16).padStart(6, '0').slice(0, n);
    if (r.chain === 'Ethereum') return `0x${hex(4)}…${hex(4).split('').reverse().join('')}`;
    if (r.chain === 'TRON')     return `T${hex(4).toUpperCase()}…${hex(4).toUpperCase()}`;
    if (r.chain === 'Solana')   return `${hex(4).toUpperCase()}…${hex(4)}`;
    if (r.chain === 'Bitcoin')  return `bc1${hex(4)}…${hex(4)}`;
    return `${hex(4)}…${hex(4)}`;
  };
  const chainPill = (chain) => {
    const c = chain === 'Ethereum' ? '#8AA0FF' : chain === 'TRON' ? '#FF5C5E' : chain === 'Solana' ? '#7DF6C8' : chain === 'Bitcoin' ? '#FFB060' : 'var(--fg-3)';
    return <span className="pms-chain" style={{ borderColor: c, color: c }}>{chain}</span>;
  };

  const withdrawalRows = (window.FUND_INTENTS || [])
    .filter(i => i.dir === 'withdraw' && (i.stage === 'W2_APPROVAL' || i.stage === 'W4_PROVIDER_CHECK'))
    .slice(0, 6);
  // Reconciliation findings — mirrors the reconciler admin panel. FAIL first, then by time desc.
  const reconRows = [...(window.RECON_FINDINGS || [])]
    .sort((a, b) => {
      const sev = { FAIL: 2, INFO: 1 };
      return (sev[b.severity] - sev[a.severity]) || (b.when < a.when ? -1 : 1);
    }).slice(0, 8);
  const reconcilers = window.RECON_RECONCILERS || [];
  const transferRows = [...(window.TRANSFERS_PENDING || [])]
    .sort((a, b) => {
      const risk = { high: 3, medium: 2, low: 1 };
      return (risk[b.risk] - risk[a.risk]) || 0;
    }).slice(0, 6);

  const auditStatusFor = (id) => (window.WITHDRAWAL_AUDITS || {})[id];

  // Reconciliation finding inspect/resolve modal
  const [inspectFinding, setInspectFinding] = React.useState(null);
  const [resolveState, setResolveState] = React.useState('investigated');
  const [resolveNote, setResolveNote] = React.useState('');
  React.useEffect(() => { if (inspectFinding) { setResolveState('investigated'); setResolveNote(''); } }, [inspectFinding]);
  const pa = window.PRIVILEGED_ACTIONS_24H || { count: 0, prev: 0, anomalies: 0 };
  const privEvents = window.PRIVILEGED_EVENTS || [];

  return (
    <div className="dash-page">
      {/* Page header — terminology: "Firm dashboard", stats-only */}
      <div className="dash-page-head">
        <div>
          <h1>Firm dashboard</h1>
          <div className="sub">Situational awareness · 3 strategies · {(window.POOLS || []).length} bots · 6 venues · {(window.INVESTORS || []).length} investors</div>
        </div>
        <div className="dash-secnav">
          {TABS.map(([id, lbl]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => selectTab(id)}>{lbl}</button>
          ))}
        </div>
      </div>

      <DashControls span={span} setSpan={setSpan} compare={compare} setCompare={setCompare} lastUpdated={lastUpdated}/>

      {/* ═══════════ SECTION 1 — CRITICAL OPS ═══════════ */}
      {tab === 'ops' && (
      <DashSection id="ops" num="01" title="Critical Ops" purpose="Conditions that could cause financial loss, compliance failure, or investor harm" tone="crit">
        <DashRow>
          <StatWidget label="Strategies in drawdown alert" metric={m.strategiesInDd} format="num"
            desc={`Firm drawdown limit ${m.ddLimitLabel}`} good="down" critical span={span} compareOn={compare}/>
          <StatWidget label="Bot errors (last 1h)" metric={m.botErrors1h} format="num" unit="abs"
            desc="Across all bots · prior 60-min window" good="down" critical span="1h" compareOn={compare}/>
          <div className="col2"><BarWidgetH label="Errors by type" data={m.botErrorsByType} compareOn={compare} span="1h"
            desc="Last 60 minutes" onBar={null}/></div>
        </DashRow>

        <DashRow>
          <TableWidget label="Pending withdrawals" span={span} action={{ label: 'Review in Transfers', onClick: () => onNav && onNav('transfers') }} desc="Top 6 awaiting approval"
            columns={[
              { label: 'Investor', render: r => <span className="pms-mono text-xs">{r.user}</span> },
              { label: 'Amount', num: true, render: r => <span className="strong">{fmt.usd(r.amount, { compact: true })}</span> },
              { label: 'Asset', render: r => <AssetChip sym={r.asset}/> },
              { label: 'Blockchain', render: r => chainPill(r.chain) },
              { label: 'Wallet address', render: r => <span className="pms-mono text-xs muted">{walletAddr(r)}</span> },
              { label: 'Audit', render: r => { const a = auditStatusFor(r.id); return a ? <span className={`pms-pill ${a.status === 'pass' ? 'pos' : a.status === 'warn' ? 'warn' : 'neg'}`}>{a.status.toUpperCase()}</span> : <span className="pms-pill">PENDING</span>; } },
              { label: 'Age', render: r => <span className="pms-mono text-xs muted">{r.age}</span> },
            ]}
            rows={withdrawalRows}/>
          <TableWidget label="Transfers pending approval" span={span} action={{ label: 'Open Transfers', onClick: () => onNav && onNav('transfers') }} desc="Top 6 awaiting approval"
            columns={[
              { label: 'Transfer ID', render: r => <span className="pms-mono text-xs">{r.id}</span> },
              { label: 'From', render: r => <span className="text-xs">{r.from}</span> },
              { label: 'To', render: r => <span className="text-xs">{r.to}</span> },
              { label: 'Amount', num: true, render: r => <span className="strong">{fmt.usd(r.amount, { compact: true })}</span> },
              { label: 'Risk', render: r => <span className={`pms-pill ${r.risk === 'high' ? 'neg' : r.risk === 'medium' ? 'warn' : 'pos'}`}>{r.risk.toUpperCase()}</span> },
            ]}
            rows={transferRows}/>
        </DashRow>

        <DashFull>
          <TableWidget label="Reconciliation findings" span={span} action={{ label: 'Open Reconciliation', onClick: () => onNav && onNav('recon') }} desc="Continuous audit of internal ledger vs external sources (XBridge, transfer-service, on-chain). Detect & alert only — never auto-corrects."
            columns={[
              { label: 'When', render: r => <span className="pms-mono text-xs muted">{r.when.slice(11)}</span> },
              { label: 'Severity', render: r => <span className={`pms-pill ${r.severity === 'FAIL' ? 'neg' : 'info'}`}>{r.severity}</span> },
              { label: 'Reconciler', render: r => <span className="pms-mono text-xs">{r.reconciler}</span> },
              { label: 'Pool', num: true, render: r => r.pool == null ? <span className="muted">—</span> : r.pool },
              { label: 'Title', render: r => <div><div className={r.severity === 'FAIL' ? 'strong pms-neg' : 'strong'} style={{ fontSize: 12 }}>{r.title}</div><div className="pms-mono muted" style={{ fontSize: 10 }}>{r.code}</div></div> },
              { label: 'Backend', num: true, render: r => <span className="pms-mono text-xs">{fmt.num(r.backend, 4)}</span> },
              { label: 'External', num: true, render: r => <span className="pms-mono text-xs">{fmt.num(r.external, 4)}</span> },
              { label: 'Δ', num: true, render: r => <span className={`pms-mono text-xs ${r.delta > 0 ? 'pms-neg strong' : 'muted'}`}>{fmt.num(r.delta, 4)}</span> },
              { label: 'Resolution', render: r => <span className="text-xs muted">{r.resolution || '—'}</span> },
              { label: 'Actions', render: r => (
                <span className="row" style={{ gap: 10 }}>
                  <button className="dash-link" onClick={(e) => { e.stopPropagation(); setInspectFinding(r); }}>Inspect</button>
                  <button className="dash-link" onClick={(e) => { e.stopPropagation(); setInspectFinding(r); }}>Resolve</button>
                </span>
              ) },
            ]}
            onRow={r => setInspectFinding(r)}
            rows={reconRows}/>
        </DashFull>
      </DashSection>
      )}

      {/* ═══════════ SECTION 2 — MONITORING ═══════════ */}
      {tab === 'monitor' && (
      <DashSection id="monitor" num="02" title="Monitoring" purpose="Real-time read of firm trading health · no action implied">
        <DashCap>Headline</DashCap>
        <DashStrip>
          <StatWidget label="Total AUM" metric={m.totalAum} format="usd" good="up" span={span} compareOn={compare} desc="Assets under management"/>
          <StatWidget label="Gross P&L" metric={m.grossPnl} format="usd" good="up" span={span} compareOn={compare} desc="Gross trading P&L for period"/>
          <StatWidget label="Win rate" metric={m.winRate} format="pct" unit="pp" good="up" span={span} compareOn={compare} desc="Days with positive P&L"/>
          <StatWidget label="Total trades" metric={m.totalTrades} format="num" good="up" span={span} compareOn={compare} desc="Trades executed in period"/>
          <StatWidget label="Fill rate" metric={m.fillRate} format="pct" unit="pp" good="up" span={span} compareOn={compare} desc="Submitted orders filled"/>
          <StatWidget label="Open positions" metric={m.openPositions} format="num" good="neutral" span={span} compareOn={compare} desc="Across all strategies & venues"/>
          <StatWidget label="Gross notional" metric={m.grossNotional} format="usd" good="neutral" span={span} compareOn={compare} desc="Total notional of open positions"/>
          <StatWidget label="Unrealized P&L" metric={m.uPnl} format="usd" good="up" span={span} compareOn={compare} desc="Combined across open positions"/>
        </DashStrip>

        <DashCap>Trading charts</DashCap>
        <DashRow>
          <div className="col2"><LineWidget label="NAV trend" series={m.navSeries} prevSeries={m.navPrevSeries} compareOn={compare}
            primary={fmt.usd(m.totalAum.value, { compact: true })} trend={m.totalAum.deltaPct} good="up" span={span}/></div>
          <div className="col2"><BarWidgetV label="Daily P&L distribution" series={m.pnlSeries} prevSeries={m.pnlPrevSeries} compareOn={compare}
            primary={fmt.signedUsd(m.grossPnl.value, { compact: true })} trend={m.grossPnl.deltaAbs} good="up" span={span}
            desc="Gross P&L per calendar day"/></div>
        </DashRow>
        <DashRow>
          <DonutWidget label="P&L by destination" segments={m.pnlDest} compareOn={compare} span={span}
            desc="Where this period's gross P&L flows"/>
          <div className="col2"><BarWidgetH label="Trades per strategy" data={m.tradesPerStrategy} compareOn={compare} span={span}
            desc="Executed trades per strategy" onBar={null}/></div>
        </DashRow>

        <DashFull>
          <TableWidget label="Strategy summary" span={span} sortNote="one row per strategy" desc="Click a row to open strategy detail"
            onRow={r => onOpenPool && onOpenPool(r.id)}
            columns={[
              { label: 'Strategy', render: r => <span className="row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: r.id === 1 ? '#B06CFF' : r.id === 2 ? '#FF8330' : '#36C2FF' }}></span><span className="strong">{r.name}</span></span> },
              { label: 'APY (90d)', num: true, render: r => <span className="pms-pos strong">{r.apy.toFixed(2)}%</span> },
              { label: 'P&L (period)', num: true, render: r => <span className={classDelta(r.pnl)}>{fmt.signedUsd(r.pnl, { compact: true })}</span> },
              { label: 'Δ prev', num: true, render: r => compare ? <TrendChip delta={((r.pnl / r.pnlPrev) - 1) * 100} good="up"/> : <span className="muted">—</span> },
              { label: 'Drawdown', num: true, render: r => <span className={r.dd < r.ddLimit * 0.8 ? 'pms-warn' : ''}>{r.dd.toFixed(2)}%</span> },
              { label: 'DD limit', num: true, render: r => <span className="muted pms-mono">{r.ddLimit.toFixed(2)}%</span> },
              { label: 'Bot', render: r => <span className="row" style={{ gap: 6 }}><BotStatusDot status={r.bot_status}/><span className="pms-mono text-xs">{r.bot_id}</span></span> },
            ]}
            rows={m.strategySummary}/>
        </DashFull>

        <DashFull>
          <TableWidget label="Recently closed positions" span={span} action={{ label: 'Open Positions', onClick: () => onNav && onNav('positions') }} desc="Bots hold positions briefly — most recently closed roundtrips"
            columns={[
              { label: 'Closed', render: r => <span className="pms-mono text-xs muted">{r.closed}</span> },
              { label: 'Asset', render: r => <AssetChip sym={r.sym}/> },
              { label: 'Venue', render: r => <VenueChip name={r.venue}/> },
              { label: 'Side', render: r => <span className={`pms-side ${r.side === 'long' ? 'buy' : 'sell'}`}>{r.side.toUpperCase()}</span> },
              { label: 'Notional', num: true, render: r => <span className="strong">{fmt.usd(r.notional, { compact: true })}</span> },
              { label: 'Realized P&L', num: true, render: r => <span className={classDelta(r.pnl) + ' strong'}>{fmt.signedUsd(r.pnl, { compact: true })}</span> },
              { label: 'P&L %', num: true, render: r => <span className={classDelta(r.pnl_pct)}>{r.pnl_pct >= 0 ? '+' : ''}{r.pnl_pct.toFixed(2)}%</span> },
              { label: 'Held', render: r => <span className="pms-mono text-xs muted">{r.held}</span> },
            ]}
            rows={m.closedPositions}/>
        </DashFull>

        <DashCap>Fund flow pipeline</DashCap>
        <DashStrip>
          <StatWidget label="Deposits in flight" metric={m.depositsInFlight} format="num" good="neutral" span={span} compareOn={compare} desc="Not yet settled or failed"/>
          <StatWidget label="Notional in flight" metric={m.notionalInFlight} format="usd" good="neutral" span={span} compareOn={compare} desc="Combined in-flight deposits"/>
          <StatWidget label="Settled in period" metric={m.settledInPeriod} format="usd" good="up" span={span} compareOn={compare} desc="Deposits reaching settled"/>
          <StatWidget label="Deposit conversion rate" metric={m.depositConversion} format="pct" unit="pp" good="up" span={span} compareOn={compare} desc="Initiated → settled"/>
          <StatWidget label="Avg time to settle" metric={m.avgSettleHrs} format="hours" good="down" span={span} compareOn={compare} desc="p50 settlement time"/>
        </DashStrip>

        <DashCap>Venue health</DashCap>
        <DashRow>
          <StatWidget label="Venues degraded or down" metric={m.venuesDegraded} format="num" good="down" critical span={span} compareOn={compare} desc="Not in healthy status"/>
          <div className="col2"><BarWidgetH label="Margin utilization per venue" data={m.marginPerVenue} compareOn={compare} span={span} format="pct"
            desc="Margin used % of available" onBar={null}/></div>
        </DashRow>
        <DashFull>
          <TableWidget label="Venue status summary" span={span} sortNote="margin utilization ↓" desc="One row per venue"
            columns={[
              { label: 'Venue', render: r => <VenueChip name={r.name}/> },
              { label: 'Status', render: r => r.status === 'healthy' ? <span className="pms-pill pos"><span className="dot"></span>HEALTHY</span> : r.status === 'degraded' ? <span className="pms-pill warn"><span className="dot"></span>DEGRADED</span> : <span className="pms-pill neg"><span className="dot"></span>OFFLINE</span> },
              { label: 'Capital', num: true, render: r => <span className="strong">{fmt.usd(r.capital, { compact: true })}</span> },
              { label: 'Margin %', num: true, render: r => <span className={r.margin > 0.5 ? 'pms-warn' : ''}>{(r.margin * 100).toFixed(0)}%</span> },
              { label: 'Sub-accounts', num: true, render: r => r.sub_accts },
              { label: 'API keys', render: r => <span className="pms-mono text-xs">{r.api_keys} keys</span> },
            ]}
            rows={[...(window.VENUES || [])].filter(v => v.type === 'CEX').sort((a, b) => b.margin - a.margin)}/>
        </DashFull>
      </DashSection>
      )}

      {/* ═══════════ SECTION 3 — MANAGEMENT ═══════════ */}
      {tab === 'manage' && (
      <DashSection id="manage" num="03" title="Management" purpose="Investor relationships, fee earnings, and operational sagas · consulted daily">
        <DashCap>Investors & revenue</DashCap>
        <DashStrip>
          <StatWidget label="Total investors" metric={m.totalInvestors} format="num" good="up" span={span} compareOn={compare} desc="Active investors"/>
          <StatWidget label="Combined investor balance" metric={m.combinedBalance} format="usd" good="up" span={span} compareOn={compare} desc="Total balance across investors"/>
          <StatWidget label="Withdrawable balance" metric={m.withdrawable} format="usd" good="neutral" span={span} compareOn={compare} desc="Available for immediate withdrawal"/>
          <StatWidget label="YTD net inflow" metric={m.ytdNetInflow} format="usd" good="up" span={span} compareOn={compare} desc="Deposits − withdrawals YTD"/>
          <StatWidget label="Investors with compliance flags" metric={m.investorsFlagged} format="num" good="down" critical span={span} compareOn={compare} desc="KYT review or flagged KYC"/>
          <StatWidget label="Total firm balance" metric={m.firmBalance} format="usd" good="up" span={span} compareOn={compare} desc="Across revenue sub-accounts"/>
          <StatWidget label="YTD firm revenue" metric={m.ytdRevenue} format="usd" good="up" span={span} compareOn={compare} desc="All revenue types YTD"/>
          <StatWidget label="Blended APY on idle cash" metric={m.blendedApy} format="pct" unit="pp" good="up" span={span} compareOn={compare} desc="Weighted across earn deployments"/>
        </DashStrip>

        <DashRow>
          <DonutWidget label="Revenue by type" segments={m.revenueByType} compareOn={compare} span={span}
            desc="YTD firm revenue breakdown"/>
          <div className="col2"><BarWidgetH label="Active sagas by type" data={m.sagasByType} compareOn={compare} span={span}
            desc="Running sagas grouped by type" onBar={null}/></div>
        </DashRow>

        <DashCap>Fee crystallizations & sagas</DashCap>
        <DashStrip>
          <StatWidget label="Investors below HWM" metric={m.investorsBelowHwm} format="num" good="down" span={span} compareOn={compare} desc="NAV/share below high-water mark"/>
          <StatWidget label="YTD crystallizations completed" metric={m.ytdCrystallizations} format="num" good="up" span={span} compareOn={compare} desc="Performance-fee events YTD"/>
          <StatWidget label="Active sagas" metric={m.activeSagas} format="num" good="neutral" span={span} compareOn={compare} desc="Sagas currently running"/>
          <StatWidget label="Sagas in error" metric={m.sagasInError} format="num" good="down" critical span={span} compareOn={compare} desc="Stalled or in error state"/>
        </DashStrip>

        <DashFull>
          <TableWidget label="Crystallization schedule" span={span} sortNote="one row per strategy" desc="Next performance-fee crystallization"
            onRow={r => onOpenPool && onOpenPool(r.id)}
            columns={[
              { label: 'Strategy', key: 'strategy', render: r => <span className="strong">{r.strategy}</span> },
              { label: 'Next crystallization', render: r => <span className="pms-mono text-xs">{r.next}</span> },
              { label: 'Investors below HWM', num: true, render: r => r.below },
              { label: 'Expected perf fee', render: r => r.perfExpected ? <span className="pms-pill pos">YES</span> : <span className="pms-pill">NO</span> },
            ]}
            rows={m.crystalSchedule}/>
        </DashFull>
      </DashSection>
      )}

      {/* ═══════════ SECTION 4 — ADMIN ═══════════ */}
      {tab === 'admin' && (
      <DashSection id="admin" num="04" title="Admin" purpose="System hygiene, access, and compliance · consulted weekly or on-demand">
        <DashStrip>
          <StatWidget label="Keys requiring attention" metric={m.keysAttention} format="num" good="down" critical span={span} compareOn={compare} desc="Needs rotation or expired"/>
          <StatWidget label="Reports ready" metric={m.reportsReady} format="num" good="up" span={span} compareOn={compare} desc="Generated & available for download"/>
          <StatWidget label="Reports queued or generating" metric={m.reportsQueued} format="num" good="neutral" span={span} compareOn={compare} desc="In queue or in progress"/>
          <StatWidget label="Services degraded" metric={m.servicesDegraded} format="num" good="down" critical span={span} compareOn={compare} desc="Not in healthy status"/>
          <StatWidget label="SLA compliance" metric={m.slaCompliance} format="pct" unit="pp" good="up" span="30d rolling" compareOn={compare} desc="Reconciliation runs within SLA"/>
        </DashStrip>

        <DashRow>
          <StatWidget label="Privileged actions (24h)"
            metric={{ value: pa.count, prev: pa.prev, deltaAbs: pa.count - pa.prev, deltaPct: ((pa.count / pa.prev) - 1) * 100 }}
            format="num" unit="abs" good="neutral" span="24h" compareOn={compare}
            desc={`${pa.anomalies} flagged as unusual · ${privEvents.filter(e => e.flag === 'failed').length} failed`}/>
          <div className="col2">
            <TableWidget label="Unusual & failed audit events" span="24h" action={{ label: 'Open Audit log', onClick: () => onNav && onNav('admin') }} desc="Anomalous or failed privileged actions — full log on Admin → Audit"
              onRow={() => onNav && onNav('admin')}
              columns={[
                { label: 'Time', render: r => <span className="pms-mono text-xs muted">{r.t.slice(11)}</span> },
                { label: 'Actor', render: r => <span className="pms-mono text-xs">{r.actor}</span> },
                { label: 'Action', render: r => <span className="pms-mono text-xs strong">{r.action}</span> },
                { label: 'Target', render: r => <span className="pms-mono text-xs muted">{r.target}</span> },
                { label: 'Flag', render: r => <span className={`pms-pill ${r.flag === 'failed' ? 'neg' : 'warn'}`}>{r.flag === 'failed' ? 'FAILED' : 'ANOMALY'}</span> },
                { label: 'Why', render: r => <span className="text-xs muted">{r.note}</span> },
              ]}
              rows={privEvents}/>
          </div>
        </DashRow>
      </DashSection>
      )}

      {/* Reconciliation finding — Inspect / Resolve modal */}
      <Modal open={!!inspectFinding} title={inspectFinding ? `Finding #${inspectFinding.finding_no}` : ''} onClose={() => setInspectFinding(null)}>
        {inspectFinding && (
          <div className="dash-finding">
            <div className="pms-mono muted" style={{ fontSize: 11, marginBottom: 12 }}>{inspectFinding.code}</div>
            <div className="dash-finding-grid">
              <div><span className="k">run_type</span><span className="v">{inspectFinding.reconciler}</span></div>
              <div><span className="k">pool_id</span><span className="v">{inspectFinding.pool ?? '—'}</span></div>
              <div><span className="k">status</span><span className="v"><span className={`pms-pill ${inspectFinding.severity === 'FAIL' ? 'neg' : 'info'}`}>{inspectFinding.severity}</span></span></div>
              <div><span className="k">severity</span><span className="v"><span className={`pms-pill ${inspectFinding.severity === 'FAIL' ? 'neg' : 'info'}`}>{inspectFinding.severity}</span></span></div>
              <div><span className="k">backend</span><span className="v pms-mono">{fmt.num(inspectFinding.backend, 4)} USDT</span></div>
              <div><span className="k">external</span><span className="v pms-mono">{fmt.num(inspectFinding.external, 4)} USDT</span></div>
              <div><span className="k">difference</span><span className="v pms-mono pms-neg">{fmt.num(inspectFinding.delta, 8)} USDT</span></div>
              <div><span className="k">created</span><span className="v pms-mono">{inspectFinding.when}</span></div>
            </div>
            <div className="dash-finding-block">
              <div className="bl">notes</div>
              <div className="bv">{inspectFinding.title}</div>
            </div>
            {inspectFinding.detail && (
              <div className="dash-finding-block">
                <div className="bl">details</div>
                <pre className="dash-finding-json">{JSON.stringify(inspectFinding.detail, null, 2)}</pre>
              </div>
            )}
            <div className="dash-finding-resolve">
              <select className="dash-select" value={resolveState} onChange={e => setResolveState(e.target.value)}>
                <option value="investigated">investigated</option>
                <option value="false_positive">false positive</option>
                <option value="escalated">escalated</option>
                <option value="fixed">fixed</option>
              </select>
              <input className="dash-input" placeholder="optional notes" value={resolveNote} onChange={e => setResolveNote(e.target.value)}/>
              <button className="pms-btn primary" onClick={() => setInspectFinding(null)}>Mark resolved</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

window.DashboardPage = DashboardPage;
