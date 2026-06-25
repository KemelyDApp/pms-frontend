/* Dashboard metrics — deterministic, span-aware (1d/3d/7d/30d/90d) with prev-period values.
   Reads live globals from data.js / data-v2.js. All flow metrics scale with the span;
   point-in-time metrics keep a fixed value and only their trend reflects the span. */

(function () {
  const SPAN_DAYS = { '1d': 1, '3d': 3, '7d': 7, '30d': 30, '90d': 90 };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }
  // deterministic delta% in [-range, +range] biased by key
  function biasedDelta(key, span, range = 8, bias = 0.5) {
    const r = hash(key + '|' + span);
    return ((r - bias) * 2) * range;
  }

  // mk: build an absolute-value metric. value is current; prev derived from delta%.
  function mk(value, deltaPct) {
    const prev = deltaPct === 0 ? value : value / (1 + deltaPct / 100);
    return { value, prev, deltaPct, deltaAbs: value - prev };
  }
  // mkPP: relative (percentage) metric. trend in percentage points.
  function mkPP(value, deltaPP) {
    return { value, prev: value - deltaPP, deltaPP };
  }

  function metricsFor(span) {
    const days = SPAN_DAYS[span] || 7;
    const NAV = window.NAV_HISTORY || [];
    const POOLS = window.POOLS || [];
    const POSITIONS = window.POSITIONS || [];
    const INVESTORS = window.INVESTORS || [];
    const VENUES = window.VENUES || [];
    const FIRM = window.FIRM_PNL || {};
    const SERVICES = window.SERVICES || [];
    const API_KEYS = window.API_KEYS || [];
    const AUDIT = window.AUDIT_LOG || [];
    const SAGAS = window.SAGAS || [];
    const FUND = window.FUND_INTENTS || [];

    const navSlice = NAV.slice(-(days + 1));
    const navNow = NAV[NAV.length - 1]?.nav || 43_760_000;
    const navThen = navSlice[0]?.nav || navNow;
    const navSeries = NAV.slice(-days).map(d => ({ date: d.date, value: d.nav }));
    const navPrevSeries = NAV.slice(-(days * 2), -days).map(d => ({ date: d.date, value: d.nav }));

    // daily P&L series
    const dailyPnl = NAV.map((d, i) => ({ date: d.date, value: d.pnl - (NAV[i - 1]?.pnl ?? 0) })).slice(1);
    const pnlSeries = dailyPnl.slice(-days);
    const pnlPrevSeries = dailyPnl.slice(-(days * 2), -days);
    const grossPnl = pnlSeries.reduce((s, d) => s + d.value, 0);
    const grossPnlPrev = pnlPrevSeries.reduce((s, d) => s + d.value, 0) || grossPnl * 0.92;
    const winDays = pnlSeries.filter(d => d.value > 0).length;
    const winRate = pnlSeries.length ? (winDays / pnlSeries.length) * 100 : 0;
    const winRatePrev = pnlPrevSeries.length ? (pnlPrevSeries.filter(d => d.value > 0).length / pnlPrevSeries.length) * 100 : winRate - 3;

    // flow scaling: per-day base × days
    const tradesPerDay = 1180;
    const totalTrades = Math.round(tradesPerDay * days * (1 + biasedDelta('trades', span, 0.04)));
    const tradesPrev = Math.round(totalTrades / (1 + biasedDelta('tradesΔ', span, 6) / 100));

    // positions (point-in-time)
    const openPositions = POSITIONS.length ? POSITIONS.length : 142;
    const grossNotional = POSITIONS.reduce((s, p) => s + Math.abs(p.notional), 0) || 26_400_000;
    const uPnl = POSITIONS.reduce((s, p) => s + p.upnl, 0) || 405_000;

    // P&L destination (firm split) — scales with span
    const pnlDest = (() => {
      const gross = Math.max(1, grossPnl);
      return [
        { label: 'To investors',    value: Math.round(gross * 0.80), color: '#B06CFF' },
        { label: 'Performance fee',  value: Math.round(gross * 0.155), color: '#68DA98' },
        { label: 'Management fee',   value: Math.round(gross * 0.028), color: '#4EB5FF' },
        { label: 'Txn spread',       value: Math.round(gross * 0.017), color: '#FFC454' },
      ];
    })();

    // errors (last 1h, point-in-time) from BOT_ERRORS
    const botErrorsByType = (() => {
      const acc = {};
      Object.values(window.BOT_ERRORS || {}).forEach(arr => arr.forEach(e => {
        acc[e.code] = (acc[e.code] || 0) + e.count;
      }));
      const order = ['INSUFFICIENT_MARGIN', 'RATE_LIMIT', 'POSITION_LOCK_TIMEOUT', 'GAP_DETECTED'];
      return order.map(code => ({ label: code, value: acc[code] || 0, prev: Math.round((acc[code] || 0) * (1 + biasedDelta(code, span, 30) / 100)) }));
    })();
    const botErrors1h = botErrorsByType.reduce((s, e) => s + e.value, 0);
    const botErrorsPrev = botErrorsByType.reduce((s, e) => s + e.prev, 0);

    // strategies in drawdown alert (>= 80% of limit)
    const ddLimit = { 1: -2, 2: -3, 3: -5 };
    const strategiesInDd = POOLS.filter(p => Math.abs(p.drawdown_pct) >= Math.abs(ddLimit[p.id]) * 0.8).length;

    // trades per strategy (horizontal bars), scales with span
    const tradesPerStrategy = POOLS.map(p => {
      const base = p.id === 1 ? 0.34 : p.id === 2 ? 0.50 : 0.16;
      const v = Math.round(totalTrades * base);
      return { label: p.name, value: v, prev: Math.round(v / (1 + biasedDelta('tps' + p.id, span, 6) / 100)), color: p.id === 1 ? '#B06CFF' : p.id === 2 ? '#FF8330' : '#36C2FF' };
    });

    // venues
    const venuesDegraded = VENUES.filter(v => v.status !== 'healthy').length;
    const marginPerVenue = VENUES.filter(v => v.type === 'CEX').map(v => ({
      label: v.name, value: Math.round(v.margin * 100), prev: Math.round(v.margin * 100 / (1 + biasedDelta('mv' + v.name, span, 10) / 100)),
    }));

    // fund flow pipeline
    const deposits = FUND.filter(i => i.dir === 'deposit');
    const depositsInFlight = deposits.filter(i => i.stage !== 'D5_SETTLED' && !i.failed).length;
    const notionalInFlight = deposits.filter(i => i.stage !== 'D5_SETTLED' && !i.failed).reduce((s, i) => s + i.amount, 0);
    const settledInPeriod = Math.round(2_840_000 * (days / 7) * (1 + biasedDelta('settled', span, 0.05)));
    const depositConversion = 92.4 + biasedDelta('conv', span, 3);
    const avgSettleHrs = 0.71 + Math.abs(biasedDelta('settleH', span, 0.4));

    // investors
    const totalInvestors = INVESTORS.length;
    const combinedBalance = INVESTORS.reduce((s, i) => s + i.balance, 0);
    const withdrawable = INVESTORS.reduce((s, i) => s + i.withdrawable, 0);
    const ytdNetInflow = INVESTORS.reduce((s, i) => s + (i.deposits - i.withdrawals), 0);
    const investorsFlagged = INVESTORS.filter(i => i.flag).length;
    const investorsBelowHwm = INVESTORS.filter(i => i.balance < i.hwm).length;

    // firm revenue
    const firmBalance = FIRM.total_balance || 2_260_400;
    const ytdRevenue = (FIRM.perf_fees_ytd || 0) + (FIRM.mgmt_fees_ytd || 0) + (FIRM.funding_ytd || 0) + (FIRM.rebates_ytd || 0) + (FIRM.liquidity_ytd || 0);
    const revenueByType = [
      { label: 'Performance fees', value: FIRM.perf_fees_ytd || 1_840_400, color: '#B06CFF' },
      { label: 'Management fees',  value: FIRM.mgmt_fees_ytd || 284_200,  color: '#4EB5FF' },
      { label: 'Txn spread',       value: 142_000,                         color: '#FF8330' },
      { label: 'Funding',          value: FIRM.funding_ytd || 84_200,      color: '#68DA98' },
      { label: 'Rebates',          value: FIRM.rebates_ytd || 48_400,      color: '#FFB060' },
      { label: 'LP rewards',       value: FIRM.liquidity_ytd || 18_400,    color: '#7DF6C8' },
    ];
    const blendedApy = FIRM.apy || 8.42;

    // sagas
    const activeSagas = SAGAS.length;
    const sagasByType = (() => {
      const acc = {};
      SAGAS.forEach(s => {
        const k = /deposit/i.test(s.workflow) ? 'Deposits'
                : /withdraw/i.test(s.workflow) ? 'Withdrawals'
                : /rebalance/i.test(s.workflow) ? 'Rebalances'
                : /fee/i.test(s.workflow) ? 'Fee distributions' : 'Other';
        acc[k] = (acc[k] || 0) + 1;
      });
      return ['Deposits', 'Withdrawals', 'Rebalances', 'Fee distributions'].map(k => ({ label: k, value: acc[k] || 0, prev: (acc[k] || 0) }));
    })();
    const sagasInError = 0;

    // crystallizations
    const ytdCrystallizations = 12;
    const crystalSchedule = POOLS.map(p => ({
      strategy: p.name,
      next: '2026-06-30',
      below: INVESTORS.filter(i => i.balance < i.hwm && i.strategies >= 1).length > 0 ? (p.id) : 0,
      perfExpected: p.pnl_30d > 0,
    }));

    // admin
    const keysAttention = API_KEYS.filter(k => k.status === 'rotate-soon' || k.status === 'expired').length;
    const auditByType = (() => {
      const acc = {};
      AUDIT.forEach(a => { acc[a.action] = (acc[a.action] || 0) + 1; });
      return Object.entries(acc).map(([k, v]) => ({ type: k, count: v })).sort((a, b) => b.count - a.count);
    })();
    const servicesDegraded = SERVICES.filter(s => s.status !== 'healthy').length;
    const reportsReady = 5;
    const reportsQueued = 1;
    const slaCompliance = 99.84;

    // strategy summary table
    const strategySummary = POOLS.map(p => ({
      id: p.id, name: p.name, apy: p.apy,
      pnl: p.pnl_30d * (days / 30),
      pnlPrev: p.pnl_30d * (days / 30) / (1 + biasedDelta('sp' + p.id, span, 7) / 100),
      dd: p.drawdown_pct, ddLimit: ddLimit[p.id], bot_status: p.bot_status, bot_id: p.bot_id,
    }));

    // top positions
    const topPositions = [...POSITIONS].sort((a, b) => Math.abs(b.notional) - Math.abs(a.notional)).slice(0, 6);
    // recently closed positions — bots hold briefly, so closed roundtrips are the real signal
    const closedPositions = (window.CLOSED_POSITIONS || []).slice(0, 8);

    return {
      span, days,
      // critical ops
      strategiesInDd: mk(strategiesInDd, biasedDelta('ddc', span, 0)),
      ddLimitLabel: '−5.00%',
      botErrors1h: { value: botErrors1h, prev: botErrorsPrev, deltaAbs: botErrors1h - botErrorsPrev },
      botErrorsByType,
      // monitoring
      totalAum: mk(navNow, ((navNow / navThen) - 1) * 100),
      navSeries, navPrevSeries,
      grossPnl: { value: grossPnl, prev: grossPnlPrev, deltaAbs: grossPnl - grossPnlPrev, deltaPct: ((grossPnl / grossPnlPrev) - 1) * 100 },
      winRate: mkPP(winRate, winRate - winRatePrev),
      pnlSeries, pnlPrevSeries,
      pnlDest,
      strategySummary,
      totalTrades: { value: totalTrades, prev: tradesPrev, deltaAbs: totalTrades - tradesPrev, deltaPct: ((totalTrades / tradesPrev) - 1) * 100 },
      fillRate: mkPP(96.8 + biasedDelta('fill', span, 1.5), biasedDelta('fillΔ', span, 1.2)),
      tradesPerStrategy,
      openPositions: mk(openPositions, biasedDelta('op', span, 6)),
      grossNotional: mk(grossNotional, biasedDelta('gn', span, 5)),
      uPnl: { value: uPnl, prev: uPnl / (1 + biasedDelta('upnl', span, 10) / 100), deltaAbs: uPnl - uPnl / (1 + biasedDelta('upnl', span, 10) / 100) },
      depositsInFlight: mk(depositsInFlight, biasedDelta('dif', span, 12)),
      notionalInFlight: mk(notionalInFlight, biasedDelta('nif', span, 12)),
      settledInPeriod: mk(settledInPeriod, biasedDelta('settledΔ', span, 8)),
      depositConversion: mkPP(depositConversion, biasedDelta('convΔ', span, 2)),
      avgSettleHrs: mk(avgSettleHrs, biasedDelta('settleHΔ', span, 8)),
      venuesDegraded: mk(venuesDegraded, biasedDelta('vd', span, 0)),
      marginPerVenue,
      // management
      totalInvestors: mk(totalInvestors, biasedDelta('inv', span, 4)),
      combinedBalance: mk(combinedBalance, biasedDelta('cb', span, 4)),
      withdrawable: mk(withdrawable, biasedDelta('wd', span, 6)),
      ytdNetInflow: mk(ytdNetInflow, biasedDelta('nif2', span, 10)),
      investorsFlagged: mk(investorsFlagged, biasedDelta('flag', span, 0)),
      firmBalance: mk(firmBalance, biasedDelta('fb', span, 5)),
      ytdRevenue: mk(ytdRevenue, biasedDelta('rev', span, 9)),
      revenueByType,
      blendedApy: mkPP(blendedApy, biasedDelta('apyΔ', span, 0.5)),
      investorsBelowHwm: mk(investorsBelowHwm, biasedDelta('bhwm', span, 0)),
      ytdCrystallizations: mk(ytdCrystallizations, biasedDelta('cryst', span, 0)),
      crystalSchedule,
      activeSagas: mk(activeSagas, biasedDelta('sg', span, 8)),
      sagasByType,
      sagasInError: mk(sagasInError, 0),
      // admin
      keysAttention: mk(keysAttention, biasedDelta('keys', span, 0)),
      auditByType,
      reportsReady: mk(reportsReady, biasedDelta('rr', span, 10)),
      reportsQueued: { value: reportsQueued, prev: reportsQueued, deltaAbs: 0 },
      servicesDegraded: mk(servicesDegraded, biasedDelta('sd', span, 0)),
      slaCompliance: mkPP(slaCompliance, biasedDelta('slaΔ', span, 0.1)),
      // shared tables
      topPositions,
      closedPositions,
    };
  }

  window.dashMetricsFor = metricsFor;
  window.DASH_SPANS = ['1d', '3d', '7d', '30d', '90d'];
})();
