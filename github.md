repo: KemelyDApp/frontend-mono
branch: main
path: apps/pm-system

## Last sync
date: 2026-11-05T17:16:00Z

### Updated in this project
- New Kemely PMS v3.html mirrors apps/pm-system: nav, header, role preview, tabs, blocks and phase-2 states
- Fonts and tokens follow libs/shared/design-tokens (Montserrat + JetBrains Mono)
- Phase-2 commands show as disabled buttons with the reason on hover

## Screen map
| Screen | Repo files |
| --- | --- |
| Shell (header, sidebar, bell, Viewing as) | src/shared/components/PmsHeader, PmsSidebar, constants/navConfig.ts |
| Overview | src/pages/Overview/components/* |
| Strategies (list, Bots & sagas, details, create) | src/pages/Strategies/** |
| TradeSim Hub | src/pages/TradeSimHub/components/* |
| Trading (Positions, Orders, P&L) | src/pages/Trading/components/* |
| Organizations + KYC | src/pages/Investors/components/* |
| Investor details | src/pages/InvestorDetails/components/* |
| Fund flow | src/pages/FundFlow/components/* |
| Reconciliation | src/pages/Reconciliation/components/* |
| Finance | src/pages/Finance/components/* |
| Admin | src/pages/Admin/components/* |
