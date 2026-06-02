# Kemely PMS — Main Dashboard Redesign Specification

---

## Terminology

**Strategy** — the top-level trading unit, defined by its logic and risk parameters. There are currently 3 strategies: Market-Neutral Arb, Cross-Exchange Arb, and Proprietary Trading. Never used interchangeably with "bot" or "strategy category".

**Bot** — the software execution engine assigned to a strategy. One bot per strategy. Referred to by its identifier (e.g., `basis-bot-01`). Never called a "strategy".

**Pool** — a capital allocation sub-unit within a strategy, mapped to a specific venue. One strategy can have multiple pools.

**Venue** — a trading platform where one or more pools are deployed (e.g., Binance, OKX, Bybit). Never called "exchange" or "CEX".

**Sub-account** — a CEX-level account structure within a venue. Distinct from a pool.

**Asset class** — a grouping of the firm's AUM by asset type (e.g., Stablecoins, BTC, ETH, SOL, Other alts). Never called "bucket".

**Investor** — a capital allocator with a balance in the fund. Never called "client".

**Saga** — a multi-step automated workflow executed by the system (e.g., a deposit, a pool rebalance, a fee distribution). Never called "workflow".

**Reconciliation break** — a discrepancy between the internal ledger and a venue snapshot. "Recon break" acceptable as shorthand in widget row labels only.

**P&L** — profit and loss. Always written as P&L, never PnL.

**High-water mark (HWM)** — the highest NAV per share a strategy has reached for a given investor. Defined here; referred to as HWM throughout.

**Bot console** — the operational detail view of a bot. Never called "bot triage".

**Drawdown** — peak-to-trough decline in NAV from the strategy's highest point. Expressed as a negative percentage.

---

## Design Philosophy

The main dashboard is a **situational awareness surface**, not a task management interface. It answers one question: *"How is the firm doing right now, and does anything need attention?"*

All widgets display **stats only**. No inline action buttons on the main dashboard.

---

## Widget Rules

Each widget displays one primary number and one trend indicator. No exceptions.

**Widget types:**

- **Absolute value** — a count or currency amount. Trend shows change over the selected time span (absolute or %).
- **Relative value** — a percentage or ratio. Trend shows change over the selected time span in percentage points.
- **Line chart** — a continuous metric over time. One line per series. When "Compare to previous period" is active, a second line is shown for the equivalent prior period.
- **Bar chart** — a discrete metric across labeled categories. Never stacked. Horizontal when bars carry different labels. Vertical for time-series bars only. When "Compare to previous period" is active, a second bar group is shown alongside each bar.
- **Donut chart** — proportional breakdown of a single total. Segments sum to 100%. The primary number is the total. When "Compare to previous period" is active, an inner ring shows the prior period.
- **Table** — structured rows of related entities. Maximum 10 columns. Default sort defined per widget. To be reviewed separately.

Each widget may optionally include a **description** — a short static label shown below the primary number that provides context (e.g., a limit value, a threshold, or a unit clarification). The description is not a metric and carries no trend.

Widgets are grouped by topic. A group is a named set of related widgets displayed together.

---

## Global Controls

Fixed at the top of the page. Apply to all widgets unless noted.

**Time span** — toggle: `1d` · `3d` · `7d` · `30d` · `90d`. Default: `7d`. Point-in-time widgets are unaffected.

**Compare to previous period** — checkbox. When active, each widget shows the equivalent prior-period value as a trend reference. Charts show a secondary line, bar group, or inner ring.

**Data freshness** — top-right of page header. Shows `Last updated: HH:MM UTC` with a manual refresh button. Each widget shows its own freshness timestamp at the bottom.

---

## Section 1 — Critical Ops

**Purpose:** Surface conditions that could cause financial loss, compliance failure, or investor harm. Zero-count widgets remain visible and indicate a healthy state.

---

### Group: Drawdown Breaches

**Strategies in drawdown alert** · absolute value
Primary: count of strategies currently at or above their drawdown alert threshold.
Description: firm drawdown limit (e.g., −5.00%).
Trend: change in count over the selected time span.

---

### Group: Bot Errors

**Bot errors (last 1h)** · absolute value
Primary: total error count across all bots in the last 60 minutes.
Trend: change vs. the prior 60-minute window.

**Errors by type** · bar chart (horizontal)
Primary: error count in the last 60 minutes grouped by type (INSUFFICIENT_MARGIN · RATE_LIMIT · POSITION_LOCK_TIMEOUT · GAP_DETECTED).
Trend: change per bar vs. prior 60-minute window shown as a second bar group.
View applied: filtered to the selected error type on bar click.

---

### Group: Withdrawal Approvals

**Pending withdrawals** · table
Primary: top 10 pending withdrawal approvals sorted by age descending.
Columns: investor · amount · asset · chain · audit status · age · stage.
Trend: TBD.

---

### Group: Reconciliation Breaks

**Open reconciliation breaks** · table
Primary: top 10 open reconciliation breaks sorted by severity then age descending.
Columns: break ID · venue · asset · diff (USD) · severity · age · status.
Trend: TBD.

---

### Group: Pending Fund Transfers

**Transfers pending approval** · table
Primary: top 10 fund transfers awaiting approval sorted by risk level then age descending.
Columns: transfer ID · from · to · asset · amount · risk level · signing · age.
Trend: TBD.

---

## Section 2 — Monitoring

**Purpose:** Real-time read of firm trading health. No action implied.

---

### Group: AUM & NAV

**Total AUM** · absolute value
Primary: total assets under management in USD.
Trend: change over the selected time span (absolute and %).

**NAV trend** · line chart
Primary: NAV value over the selected time span.
Trend: previous period shown as a secondary line when toggle is active.

---

### Group: Firm P&L

**Gross P&L** · absolute value
Primary: gross trading P&L for the selected time span.
Trend: change vs. previous period.

**Win rate** · relative value
Primary: percentage of trading days with positive P&L in the selected time span.
Trend: change vs. previous period in percentage points.

**Daily P&L distribution** · bar chart (vertical)
Primary: gross P&L per calendar day over the selected time span.
Trend: previous period shown as a second bar group when toggle is active.

**P&L by destination** · donut chart
Primary: gross P&L for the selected time span broken down by destination (to investors · performance fee · management fee · txn spread).
Trend: previous period shown as inner ring when toggle is active.

---

### Group: Strategy Performance

**Strategy summary** · table
Primary: one row per strategy. Columns: strategy name · APY (90d annualized) · P&L for selected period · current drawdown · drawdown limit · bot status.
Trend: P&L and drawdown columns show delta vs. previous period when toggle is active.
View applied: clicking a row opens that strategy's detail.

---

### Group: Trade Activity

**Total trades** · absolute value
Primary: count of trades executed in the selected time span.
Trend: change vs. previous period.

**Fill rate** · relative value
Primary: percentage of submitted orders filled in the selected time span.
Trend: change vs. previous period in percentage points.

**Trades per strategy** · bar chart (horizontal)
Primary: trade count in the selected time span, one bar per strategy.
Trend: change per bar vs. previous period shown as a second bar group.
View applied: filtered to the selected strategy on bar click.

---

### Group: Active Positions

**Open positions** · absolute value
Primary: count of currently open positions across all strategies and venues.
Trend: change over the selected time span.

**Gross notional** · absolute value
Primary: total notional value of all open positions in USD.
Trend: change over the selected time span.

**Unrealized P&L** · absolute value
Primary: combined unrealized P&L across all open positions in USD.
Trend: change over the selected time span.

**Top positions** · table
Primary: top 10 open positions by notional. Columns: asset · venue · side · notional · uPnL · uPnL %.
Trend: notional and uPnL columns show delta vs. previous period when toggle is active.

---

### Group: Fund Flow Pipeline

**Deposits in flight** · absolute value
Primary: count of deposit intents not yet settled or failed.
Trend: change over the selected time span.

**Notional in flight** · absolute value
Primary: combined dollar amount of all in-flight deposits.
Trend: change over the selected time span.

**Settled in period** · absolute value
Primary: total dollar amount of deposits settled in the selected time span.
Trend: change vs. previous period.

**Deposit conversion rate** · relative value
Primary: percentage of initiated deposits that reached settled status in the selected time span.
Trend: change vs. previous period in percentage points.

**Average time to settle** · absolute value
Primary: p50 settlement time in hours for deposits in the selected time span.
Trend: change vs. previous period.

---

### Group: Venue Health

**Venues with degraded or down status** · absolute value
Primary: count of venues not in healthy status.
Trend: change over the selected time span.

**Margin utilization per venue** · bar chart (horizontal)
Primary: margin used as a percentage of total margin available, one bar per venue.
Trend: change per bar vs. previous period shown as a second bar group.
View applied: filtered to the selected venue on bar click.

**Venue status summary** · table
Primary: one row per venue. Columns: venue · status · capital · margin used % · sub-accounts · API key status.
Trend: margin used % column shows delta vs. previous period when toggle is active.
View applied: sorted by margin utilization descending.

---

## Section 3 — Management

**Purpose:** Business-level visibility into investor relationships, fee earnings, and operational workflows. Consulted daily.

---

### Group: Investor Overview

**Total investors** · absolute value
Primary: count of active investors.
Trend: change over the selected time span.

**Combined investor balance** · absolute value
Primary: total balance across all active investors in USD.
Trend: change over the selected time span.

**Withdrawable balance** · absolute value
Primary: total amount available for immediate withdrawal across all investors.
Trend: change over the selected time span.

**YTD net inflow** · absolute value
Primary: net investor capital movement year-to-date (deposits minus withdrawals).
Trend: change vs. same period prior year.

**Investors with compliance flags** · absolute value
Primary: count of investors currently in KYT review or with a flagged KYC status.
Trend: change over the selected time span.
View applied: filtered to flagged investors only.

---

### Group: Firm Revenue

**Total firm balance** · absolute value
Primary: combined balance across all firm revenue sub-accounts.
Trend: change over the selected time span.

**YTD firm revenue** · absolute value
Primary: total firm revenue year-to-date across all revenue types.
Trend: change vs. same period prior year.

**Revenue by type** · donut chart
Primary: YTD firm revenue broken down by type (performance fees · management fees · txn spread · funding · rebates · LP rewards).
Trend: previous period shown as inner ring when toggle is active.

**Blended APY on idle cash** · relative value
Primary: blended annual yield across active earn deployments, weighted by deployed balance.
Trend: change vs. previous period in percentage points.
View applied: scrolled to earn deployments section.

---

### Group: Fee Crystallizations

**Investors below HWM** · absolute value
Primary: count of investors where current NAV per share is below their HWM.
Trend: change over the selected time span.
View applied: filtered to investors below HWM, sorted by next crystallization date ascending.

**YTD crystallizations completed** · absolute value
Primary: count of performance fee crystallization events completed year-to-date.
Trend: change vs. same period prior year.

**Crystallization schedule** · table
Primary: one row per strategy. Columns: strategy · next crystallization date · investors below HWM · expected perf fee (yes / no).
Trend: TBD.
View applied: clicking a row opens that strategy's investor list sorted by HWM status.

---

### Group: Active Sagas

**Active sagas** · absolute value
Primary: count of sagas currently running.
Trend: change over the selected time span.

**Active sagas by type** · bar chart (horizontal)
Primary: count of running sagas grouped by type (deposits · withdrawals · rebalances · fee distributions).
Trend: change per bar vs. previous period shown as a second bar group.
View applied: filtered to the selected saga type on bar click.

**Sagas in error** · absolute value
Primary: count of sagas currently stalled or in error state.
Trend: change over the selected time span.
View applied: filtered to error and stalled status.

---

## Section 4 — Admin

**Purpose:** System hygiene, access, and compliance items. Consulted weekly or on-demand.

---

### Group: API Key Health

**Keys requiring attention** · absolute value
Primary: count of API keys with status "needs rotation" or "expired".
Trend: change over the selected time span.
View applied: filtered to keys requiring attention.

---

### Group: Audit Events

**Audit events by type** · table
Primary: one row per event type, showing count of events in the selected time span.
Columns: event type · count.
Default sort: count descending.
Trend: TBD.

---

### Group: Scheduled Reports

**Reports ready** · absolute value
Primary: count of generated reports available for download.
Trend: change over the selected time span.

**Reports queued or generating** · absolute value
Primary: count of reports currently in queue or in progress.
Trend: TBD.

---

### Group: System Health

**Services degraded** · absolute value
Primary: count of services not in healthy status.
Trend: change over the selected time span.

**SLA compliance** · relative value
Primary: percentage of reconciliation runs completed within SLA over the last 30 days (rolling, unaffected by time span filter).
Trend: change vs. prior 30-day window in percentage points.
