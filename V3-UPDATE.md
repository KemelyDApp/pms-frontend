# PMS design v3: what changes for apps/pm-system

For the frontend team. This repo is the Claude Design project for the Portfolio Management System. This
update adds design **v3**: `Kemely PMS v3.html` and the `v3/` folder, plus the KYC v2 files. It also
maps every v3 change against the current code in `KemelyDApp/frontend-mono`, `apps/pm-system`
(`main` @ `dcae7e85`, 2026-11-05).

- **Open the design:** `Kemely PMS v3.html` in a browser. It loads `data-kyc-v2.js` and `v3/*`.
- **Where each screen lives in the repo:** `github.md` has the screen map.
- **Earlier designs stay as they are:** `Kemely PMS.html` and `Kemely PMS v2.html`.
- **Read the rest in this order:**
  - "Summary" below for the shape of the change;
  - "Per-tab changes" for the work list;
  - "Data for the new screens" for what the topics carry today and what comes later;
  - "Appendix A" for every difference, with the design and code file:line.

Code paths below are relative to `apps/pm-system/src/`. Design paths are relative to this repo.

## Summary: the new Investors level

- **An investor is one wallet.** Each whitelisted wallet of an Organization is one investor account, with its own balance, withdrawable/locked split, strategy allocation, P&L and activity. The Organization carries the KYC; money and activity are per wallet (`v3/data-investors.js`).
- **Every investor has an access state:**
  - **Trading:** the org is approved and the wallet is active.
  - **View only:** the org is not approved yet.
  - **Frozen:** the wallet or the org is frozen.
  - **Removed:** the wallet was removed.
- **The code already has the base.** An investor in pm-system is already one address with an `organization_id` (`types/investors.ts:14-42`). What v3 adds is new screens, new fields, and wallets that have no user or no balance yet.
- **The sidebar label stays "Organizations".** v3 adds a second sub-tab, **Investors** (`/investors/accounts`), and turns the org profile's "Investments" placeholder into a working **Investors** tab.
- **The Investor page keeps its route** (`/investors/<id>`). Its "Back" link now leads to the organization, and its header shows the wallet address and the access tag.

## Per-tab changes

### Organizations (`pages/Investors/**`)

**New: Investors sub-tab** (`v3/page-orgs.jsx:72-84`, `:269-274`)
- **KPIs:** investor count, total balance, P&L 30d, and the counts in Trading, View only and Frozen.
- **"All investors" table, filterable by access.** Columns: wallet (short address, primary tag, INV ref, source), organization with its KYC tag, access, balance, withdrawable, P&L 30d, allocation bar, last event. A row opens `/investors/<id>`.
- **"Latest activity" feed** across all investors, with a group filter: All / Money / P&L & fees / Access.
- **Routing:** add an `accounts` tab to `utils/investorsTabs.ts` and `routes.tsx`. Today `/investors/accounts` falls into `investors/:investorId` and shows "No investor with id accounts".

**Organization profile** (`v3/page-orgs.jsx:117-176`)
- **Tabs:** Overview · Investors · People · Documents · Wallets · Activity.
- **Investors tab:** KPIs (balance, locked, P&L 30d, P&L ITD, the org's allocation), the org's investor table, and a "+ Link wallet" button.
- **Overview:** the "Record" card is replaced by an "Investors" card showing balance, P&L 30d, the split by access and the gating mode.
- **Activity is split in two:**
  - "Investor activity": the events of every wallet of the org, filterable by investor;
  - "KYC & wallets": today's data, shown as a table.
- **People:** each person shows a name (masked without KYC access), ownership %, PEP, ID, liveness, address and screening checks. Today the tab shows only the id and roles.
- **KYC steps:** seven fixed steps, Account → Entity → People → Documents → Wallet → Review → Approved. Screening, Source of funds, Cool-down and Trading are dropped. *Owner decision: keep Screening and Cool-down from the code (see "Owner decisions").*
- **Banners:** Frozen shows the reason code and Waiting on client shows the request reason. v3 has no Dissolved banner.

**KYC case** (`v3/page-orgs.jsx:193-227`, `v3/kyc-docs.jsx`, `KYC Document Viewer.html`)
- **Documents:** Open and Download buttons on each document.
- **Full-screen document viewer:** zoom, rotate, SHA-256, and "used as evidence" marks.
- **Checklist:** each checklist item links to its documents.

**Filters**
- "Waiting on client" counts `draft` and `info_requested` together. Today it counts only `info_requested`, and the number comes from the backend. *Owner decision: yes; the backend counter changes.*

**Quarantine**
- v3 shows a KPI row instead of the header text.
- v3 has only Release and Return. **The code is ahead here**: it already has settle, close and the second approvals. Keep the code's actions (owner decision).

**Unchanged:** the organizations list (columns and filters), the Wallets tab, Wallet whitelisting, the KYC review queue.

### Investor details (`pages/InvestorDetails/**`)

**Header**
- Shows the address, the access tag, "primary wallet", the INV ref, the organization with its KYC tag, the wallet status and the source.
- The Call button is removed.
- Manual Deposit and Approve withdrawal are disabled by the access state.
- New View only and Frozen banners.

**Balance strip**
- Hurdle becomes Net deposited.
- MTD/YTD/ITD % becomes P&L 30d in $.

**Overview**
- New cards: Recent activity, Other investors of this organization, Wallet.
- The Account profile card is removed.
- Allocation, Cost basis, Fees paid (now ITD) and FIFO are simplified.

**Activity**
- A filter by event group.
- New event kinds: `SIGN_IN`, `WALLET_LINKED`, `DEPOSIT_HELD`, `DEPOSIT_BLOCKED`, `FROZEN`.
- New statuses: `BLOCKED`, `HELD`.

**Placeholders**
- Compliance, Documents and Communication show a "Not served" placeholder.
- The "Edit whitelist" button stays in v3. It conflicts with the wallet-per-investor model, so confirm it before you build it.

### Fund flow (`pages/FundFlow/**`)

- The Investor column becomes an INV-ref link to the investor page. There is no organization column.
- A deposit held for KYC links to Quarantine from its modal.
- The stage names change.
- The New Deposit form is not drawn in v3: keep today's form.
- Approvals: unchanged.

### Shell, Overview, Admin

- Breadcrumbs show ids.
- The Overview line "KYC cases to review" goes to `/investors/kyc`. The backend must send `sub='kyc'`.
- The role scope "investors" is labelled "Organizations & investors".
- The other Admin changes in v3 do not touch the investor level (Appendix A).

### Strategies, TradeSim Hub, Trading, Reconciliation, Finance

None of these screens gets the investor level. Small design-vs-code differences are listed in Appendix A; treat them as optional.

## Data for the new screens

pm-system keeps reading pms-backend's WebSocket topics. Today's topics already carry part of what v3 shows; the rest is being added on the backend side (milestone M12). The new field and topic names will be published in pms-backend `contracts/asyncapi.yaml`. Until a field arrives, show `—`; do not compute money figures in the browser.

| v3 shows | Today | Arrives with M12 |
|---|---|---|
| Investor id, address, organization id/ref | `investors.list`, `investor.{id}` (the investor id is the backend user id; keep it as the id and display `INV-<id>`) | — |
| Balance, withdrawable, locked breakdown, allocation per strategy | `investors.list` row (balance, withdrawable, locked) and `investor.{id}` (allocation %) | allocation % on the list row |
| Wallet status, primary flag, source, the org's KYC status | on the org's wallet rows (`org.{id}`), not on the investor | on the investor row and the investor page |
| Access state (Trading / View only / Frozen / Removed) | — | on the investor row and the investor page (computed by the backend) |
| P&L 30d, P&L ITD, net deposited | realised ITD/YTD/MTD on `investor.{id}` | P&L 30d and ITD on the row and the page; net deposited |
| Wallets with no user yet (linked by ops, from quarantine) | not listed | listed as investors: zero balance, View only |
| Activity: deposits, withdrawals, P&L, fees | `investor.{id}` ops | — |
| Activity: STRATEGY_CHANGE (from → to), SIGN_IN, WALLET_LINKED, DEPOSIT_HELD, DEPOSIT_BLOCKED, FROZEN | — | in the investor's activity feed |
| Organization totals (balance, locked, P&L 30d/ITD, split by access) | — | on the org (new fields or topic) |
| "Latest activity" across all investors, and across one org's investors | — | a new feed topic |
| "Waiting on client" count including `draft` | `orgs.list` counts `info_requested` only | the same count field, now including `draft` |
| Overview "KYC cases to review" link | — | `link.sub='kyc'` on `overview.attention` |

## Owner decisions (Kos, 2026-11-05)

1. **Wallets with no user yet** (linked by ops before the first sign-in, or from quarantine) **are investors**: zero balance, View only. **Tron wallets are folded into their EVM investor** (`linked_user_id`); they are not separate investors.
2. **Keep what works in the code** where v3 removes it: the Quarantine actions (settle, close, second approvals) and the KYC steps (Screening, Cool-down). Follow v3 for the rest: the Record card becomes the Investors card, and Hurdle becomes Net deposited.
3. **"Waiting on client" counts `draft` and `info_requested`.** The count comes from the backend, which changes to match; the tile needs no logic of its own.

Build the screens now against "Data for the new screens": wire the fields that exist today, and show `—` for the rest until M12 ships them.

---

## Appendix A: every difference, with design and code references

A per-area reader compared v3 with the code. A second reader re-checked the Organizations, Investors and Investor details findings against both sources and dropped the claims that did not hold.


### Organizations, Investors and Investor details (verified)

- **Organizations page: sub-tabs** — *new*. New sub-tab 'Investors' (id 'accounts', route /investors/accounts) in 2nd place. Its count badge counts investors that are not removed. Order: Organizations · Investors · KYC review · Wallet whitelisting · Quarantine. The default tab stays 'orgs'. KYC review and Wallet whitelisting stay gated by KYC access, as in code. The Investors tab is not gated.
  - Design: `v3/page-orgs.jsx:269-274; v3/shell.jsx:19`
  - Code today: absent in code: pages/Investors/utils/investorsTabs.ts:7-12 has 4 tabs; pages/Investors/routes.tsx:19-29 has no 'accounts' route; pages/Investors/utils/getInvestorsTabs.ts:14-20 puts badges only on kyc and quarantine. Today the route 'investors/:investorId' (app.tsx:32) catches /investors/accounts and shows 'No investor with id "accounts"' (pages/InvestorDetails/InvestorDetails.tsx:112-114).
  - Data source today: none for the tab. shared/constants/navConfig.ts:64 builds the sidebar subTabs from INVESTORS_TABS, so a new entry also shows in the sidebar.
- **Investors (new tab): header and KPIs** — *new*. New page 'Investors' with the subtitle 'An investor is one wallet address · every investor belongs to an Organization, which carries the KYC · balances and activity are per wallet'. Export button (disabled, phase 2). KPI row: Investors (n · m organizations), Combined balance (+ withdrawable), P&L 30d, then counts for Trading, View only and Frozen.
  - Design: `v3/page-orgs.jsx:72-82`
  - Code today: absent in code
  - Data source today: partial. investors.list (shared/topics/investors/investorsListTopic.ts:18-22) gives balance and withdrawable per row (types/investors.ts:22,25), and the org count can be derived from organization_id (:40). There is no P&L field in the list and no access state. Today only FundFlow and RecordCard (via useOrgInvestors) read this topic.
- **Investors (new tab): All investors table** — *new*. Table with an access filter (All / Trading / View only / Frozen), sorted by balance; a row opens /investors/<id>. Columns: INVESTOR · WALLET (short address, 'primary' tag, INV-ref · source), ORGANIZATION (link + org KYC tag), ACCESS, BALANCE, WITHDRAWABLE, P&L 30D, STRATEGIES (allocation bar), LAST ACTIVITY (event tag + time).
  - Design: `v3/page-orgs.jsx:40-50, 83`
  - Code today: absent in code
  - Data source today: partial. InvestorRow (types/investors.ts:14-42) has address, balance, withdrawable, blocked and locked_breakdown, strategy_ids (no %), last_op_type/last_op_at (:38-39) and organization_id/ref (:40-41). Missing: wallet ref, is_primary, wallet source, wallet status, org kyc_status, access, P&L 30d, allocation %. Those wallet fields exist only on OrgWalletRow (types/kyc/wallets.ts:24-50).
- **Investors (new tab): Latest activity feed** — *new*. A feed of the 12 newest events across all investors, with a group filter: All / Money / P&L & fees / Access. Columns: TIME, INVESTOR, EVENT, AMOUNT, ASSET/CHAIN, STRATEGY/DETAIL, REFERENCE, STATUS. The per-investor ledger in code already has the same columns without INVESTOR (pages/InvestorDetails/components/InvestorActivity/columns.tsx:41-101). What is new: the INVESTOR column, the scope across all investors, and the group filter.
  - Design: `v3/page-orgs.jsx:52-70, 76, 84`
  - Code today: absent in code
  - Data source today: none across investors. Ops come only per investor from investor.{id} (shared/topics/investors/investorTopic.ts:26-27; InvestorOp types/investors.ts:172-191).
- **Investors level: access state** — *new*. New access state per investor: trading / view_only / frozen / removed. 'removed' means the wallet was removed. 'frozen' means the wallet or the org is frozen. 'trading' means the org is approved and the wallet is active. Anything else is view_only. It shows as a tag in every investor table, as KPI counts, as banners on the investor page, and it gates Manual Deposit and Approve withdrawal there.
  - Design: `v3/data-investors.js:8; v3/page-orgs.jsx:33-34; v3/page-fundflow.jsx:90, 96-98`
  - Code today: absent in code
  - Data source today: none as a field. It can be derived from OrgRow.kyc_status (types/kyc/orgsList.ts:22) and OrgWalletRow.status / frozen_by (types/kyc/wallets.ts:36, 43), but InvestorRow and InvestorProfile carry neither.
- **Investors level: data model** — *changed*. Corrected. The code already has 'investor = one address, linked to an org'. InvestorRow has a single address (types/investors.ts:15-16) and organization_id/ref (:40-41). An org wallet points to its investor, the backend user who proved it, through OrgWalletRow.user_id / linked_user_id (types/kyc/wallets.ts:29-31). So the org → wallet → investor chain exists in the data. What the design changes: (a) every org wallet is an investor, including wallets with no user yet (ops-linked, awaiting_email / pending_kyc) and unfunded ones, while the code list can drop rows with reason 'no_balance' (types/investors.ts:53); (b) investors get an INV-42xx ref instead of #id; (c) per-investor P&L 30d, which the code lacks (InvestorSummary :73-89 has realised ITD/YTD/MTD only); (d) allocation % on the list row, which the code has only per investor (InvestorStrategyBalance.pct :106).
  - Design: `v3/data-investors.js:1-2, 12-24`
  - Code today: types/investors.ts:14-42, 53, 63-71, 73-89; types/kyc/wallets.ts:29-31
  - Data source today: investors.list + investor.{id}. Missing: investors for wallets without a user, P&L 30d, and the wallet fields on the investor.
- **Investors level: activity event kinds** — *changed*. Design kinds: DEPOSIT, WITHDRAW, STRATEGY_CHANGE (with an 'A → B' note), PNL, MANAGEMENT_FEE, PERFORMANCE_FEE, plus new access kinds SIGN_IN, WALLET_LINKED, DEPOSIT_HELD (quarantine ref), DEPOSIT_BLOCKED (org_not_approved) and FROZEN. They are grouped money / fees / access. STRATEGY_CHANGE is the code's REALLOCATION under a new name. The design drops NETWORK_FEE, TXN_FEE_SPREAD and WALLET_TRANSFER. New statuses BLOCKED and HELD; FAILURE is not shown.
  - Design: `v3/data-investors.js:27-45; v3/page-orgs.jsx:35-36`
  - Code today: types/investors.ts:3-12 (InvestorOpType), :176 (SUCCESS/PENDING/FAILURE)
  - Data source today: investor.{id} ops cover only the money and fee kinds. Access-type events exist only as org KYC/wallet activity (OrgActivityItem, types/kyc/org.ts:63-74).
- **Org profile: tabs** — *changed*. Segments become Overview · Investors · N · People · N · Documents · Wallets · N · Activity · N. The placeholder 'Investments' tab is replaced by a working 'Investors' tab in 2nd place, and Activity gets a count (investor events + KYC events).
  - Design: `v3/page-orgs.jsx:124`
  - Code today: pages/Investors/components/OrganizationProfile/utils/getProfileTabs.ts:13-20; OrganizationProfile.tsx:115-120 (Investments rendered as HiddenSection 'Not served yet')
  - Data source today: partial. useOrgInvestors gives the investor count. No balances per org.
- **Org profile: Investors tab** — *new*. KPI row: Investors (n trading), Combined balance (withdrawable · locked), P&L 30d, P&L ITD (+ net deposited), and an 'Allocation · organization' bar weighted by balance. A warning note says every investor is view only until KYC is approved. Then an Investors table (same columns minus ORGANIZATION; a row opens the investor) with '+ Link wallet'. The design shows the button disabled with a reason; code renders it only for approved orgs (WalletsTab.tsx:53-63). Today the org's investors appear only as #id links in the Record card (RecordCard.tsx:32-50).
  - Design: `v3/page-orgs.jsx:126-127, 151-156`
  - Code today: absent in code (Investments placeholder at OrganizationProfile.tsx:115-120)
  - Data source today: partial. useOrgInvestors (OrganizationProfile/hooks/useOrgInvestors.ts:7-13) already filters investors.list by organization_id. Locked IS in InvestorRow (blocked + locked_breakdown, types/investors.ts:24-33). Net deposited can be derived from deposits_total and withdrawals_total (:34-35). Missing from the list: P&L 30d, P&L ITD, allocation %, access.
- **Org profile: Overview** — *changed*. The grid becomes the KYC case card + a new 'Investors' summary card ('one per wallet': Combined balance, P&L 30d, access breakdown, Type, Gating 'global mode · shadow', link 'All N →'). The code's Record card (ref, type, origin, investor links, wallets, primary wallet ref, previous status, created/updated) is gone. The design's KYC case card keeps Status, Submitted, Reviewer, First approval, Approved and Next review, and shows the review kind as card meta when it is not initial. It drops revision, Claimed, Decision and Risk tier.
  - Design: `v3/page-orgs.jsx:145-148`
  - Code today: OrganizationProfile.tsx:89-94; components/RecordCard/RecordCard.tsx:22-62; components/KycCaseCard/KycCaseCard.tsx:27-75
  - Data source today: Record and KYC fields come from the org topic. No balance or P&L at org level. Gating mode is served in the overview topic (types/overview.ts:158, used by pages/Overview/components/InvestorsWidget/utils/gatingTag.ts) and in the cascade preview (types/kyc/controls.ts:99), not on the org.
- **Org profile: Activity** — *changed*. Activity splits into two segments. New: 'Investor activity · N' with the money/fee/access events of all the org's investors, a group filter and an investor dropdown ('All investors (n)'). Mostly existing: 'KYC & wallets · N'. Code already shows time, actor, event, wallet ref and from → to changes as text. The design turns this into a table (TIME, EVENT, ACTOR, CHANGE as status tags, SUBJECT), which is a layout change, not new data.
  - Design: `v3/page-orgs.jsx:161-163`
  - Code today: components/ActivityTab/ActivityTab.tsx:19-56; utils/getActivityText.ts:18-40
  - Data source today: KYC part: org topic activity (OrgActivityItem with before/after, types/kyc/org.ts:63-74). Investor part: none at org level.
- **Org profile: People** — *changed*. The People table shows the person's name (initials masked without KYC access), ROLE, and with KYC access OWNERSHIP % and a PEP tag, plus check columns ID, LIVENESS, ADDRESS, SCREENING. Code shows only #id, roles and current/removed.
  - Design: `v3/page-orgs.jsx:149`
  - Code today: components/PeopleTab/PeopleTab.tsx:9-40; OrgPerson types/kyc/org.ts:55-59 (id, roles, removed_at)
  - Data source today: none in the org topic. Ownership, PEP and checks exist only in the KYC case snapshot (types/kyc/case.ts:34-35; KycCase PeopleTable.tsx:44-83).
- **Org profile: KYC progress steps** — *changed*. Design: 7 fixed steps (Account · Entity · People · Documents · Wallet · Review · Approved), derived from kyc_status alone. Code: Submitted · Entity · People · Screening · Source of funds · Wallet (with done/total) · Compliance review · Approved · Cool-down · Trading, built from the served tracker. The design drops Screening, Source of funds, Cool-down, Trading and the per-group counts, and adds Account and Documents.
  - Design: `v3/page-orgs.jsx:130-131, 143`
  - Code today: OrganizationProfile/utils/getKycSteps.ts:37-54; components/KycSteps/KycSteps.tsx:12-21
  - Data source today: org topic tracker
- **Org profile: banners** — *changed*. The Frozen banner shows the freeze reason code instead of 'since <date> · was <status>'. The Waiting-on-client banner shows the info reason and 'main-app access is view only' instead of a generic 'Compliance asked the client for more information'. The design has no Dissolved banner; code does.
  - Design: `v3/page-orgs.jsx:141-142`
  - Code today: components/ProfileBanner/ProfileBanner.tsx:11-47
  - Data source today: none. Neither OrgDetail (types/kyc/org.ts:33-41) nor OrgRow (types/kyc/orgsList.ts:18-35) has freeze_code or info_reason.
- **Investor details (wallet level)** — *changed*. Corrected. The route is unchanged (/investors/<id>, outside the tabs in both), and much is already in code: the balance strip, the org link, the buttons, the tabs, and the NAV / Allocation / Cost basis / Fees paid / FIFO cards. Real changes: (1) the back link goes to the org ('← ORG-ref · type'), not 'All Investors' → /investors; (2) the title is the short address with an access tag and a 'primary wallet' tag; the sub-line is INV-ref · org link + org KYC tag · wallet status tag · source. Code shows name, #id, address, 'Onboarded' date, org link and note. (3) The Call button is removed. (4) New view_only and frozen banners. (5) Manual Deposit and Approve withdrawal are disabled by access state. (6) In the strip, Hurdle becomes Net deposited, and the MTD/YTD/ITD return % become P&L 30d in $. (7) Overview adds 'Recent activity' and 'Other investors · <org>' cards, and a 'Wallet' card (address, chain, added via, status) replaces the unserved Account profile. (8) The Activity tab gets the group filter. (9) A missing investor gets a 'Back to Investors' link to /investors/accounts.
  - Design: `v3/page-orgs.jsx:268; v3/page-fundflow.jsx:73-117`
  - Code today: app.tsx:32; pages/InvestorDetails/InvestorDetails.tsx:29-36, 112-114; components/InvestorDetailsHeader/InvestorDetailsHeader.tsx:33-35, 41-73, 78-100; components/InvestorBalances/InvestorBalances.tsx:39-114; components/InvestorOverview/InvestorOverview.tsx:18-38; components/InvestorActivity/InvestorActivity.tsx:30-57
  - Data source today: investor.{id}. Absent: wallet status, source, primary flag, access and P&L 30d (InvestorProfile types/investors.ts:63-71). Sibling investors can be derived from investors.list by organization_id. Net deposited = net_inflow (:82).
- **KYC case: Documents** — *new*. Each document row gets Open and Download buttons, disabled with a reason (no file / not previewable / hourly download limit). Without KYC access the row shows '🔒 Restricted'. PERSON shows the masked name (revealable) instead of #id. FILE adds the page count. Footer: 'n documents · m with a file · opening is logged'.
  - Design: `v3/page-orgs.jsx:212-213; v3/kyc-docs.jsx:9-23, 37-45`
  - Code today: KycCase/components/CaseEvidence/components/DocumentsTable/DocumentsTable.tsx:15-64 (DOCUMENT, PERSON #id, STATUS, FILE type·size, UPLOADED; no actions)
  - Data source today: none. Code has no document open/download command.
- **KYC case: Document viewer** — *new*. New full-screen document viewer: page nav and thumbnails, zoom, fit width, rotate; a metadata panel (ref, type, person, uploaded, file, SHA-256); a pinned checklist item to tick; 'Used as evidence for' ticks that update the case checklist; 'n of m evidence documents · Next'. States: loading with progress, error + Retry, hourly limit, file missing + 'Request again'. Plus a download action.
  - Design: `v3/kyc-docs.jsx:68-113; v3/page-orgs.jsx:225`
  - Code today: absent in code
  - Data source today: none
- **KYC case: Checklist** — *new*. Each checklist item gets an evidence link: 'View document ›' / 'View n documents ›' (opens the viewer on the matching docs), 'No document yet', or 'no document needed'.
  - Design: `v3/page-orgs.jsx:220; v3/kyc-docs.jsx:25-35, 47-53`
  - Code today: absent in code (KycCase/components/Checklist/Checklist.tsx has no evidence links; items in KycCase/constants/checklist.ts)
  - Data source today: none (no mapping from documents to checklist items)
- **Organizations list: 'Waiting on client' filter** — *changed*. The 'Waiting on client' tile/filter counts draft + info_requested. Code filters info_requested only. The KYC review KPI 'Waiting on client' uses the same draft + info_requested rule in the design.
  - Design: `v3/page-orgs.jsx:90, 183`
  - Code today: pages/Investors/components/Organizations/utils/orgFilters.ts:24-27
  - Data source today: The tile count is the served counts.waiting_on_client (types/kyc/orgsList.ts:40), so the backend count definition would change too.
- **Quarantine** — *changed*. The counts move into a KPI row (Held, Whitelisting, Returning, Resolved · 30d) instead of the card meta line (held · whitelisting · returning · released · returned · closed). Row actions: Release (primary) and Return to sender are active. Re-open and Close deposit show as 'Off on every host'. Code has more: return, cancel return, settle, close, 2nd approvals for return/settle/close, withdraw/cancel the 1st approval, re-open, release. Here the design lags the code.
  - Design: `v3/page-orgs.jsx:254, 262`
  - Code today: Quarantine/components/HeldDeposits/HeldDeposits.tsx:61-73; utils/getDepositActions.ts:29-89
  - Data source today: quarantineListTopic counts (released/returned/closed totals; no 'resolved 30d')

**Unchanged:** Organizations list: header, Export and '+ New Investor' (phase 2), migration bar, 6 filter tiles, 'Show empty drafts', columns ORGANIZATION / TYPE / KYC / RISK / WALLETS / SUBMITTED / NEXT REVIEW (no balance or investor columns added). Org profile: header (ref, KYC tag, risk, #id, type, origin, primary wallet), Open review / Give 2nd approval / Force re-KYC / Freeze / Unfreeze with cascade-preview confirm, Documents placeholder, Wallets tab columns and Freeze / Unfreeze / On-chain mark / Remove menu, Link wallet form. KYC review: KPIs and cases table. KYC case: header with Reveal names, Documents/People/Record/Activity segments, claim/take over, checklist, risk tier, Request info / Reject / Approve. Wallet whitelisting: 6-step flow, Queue/Pending KYC, columns and actions. Quarantine: header, Rule note, held-deposits columns. Sidebar: still 'Organizations' with the live badge. Investor details: route /investors/<id>; org link; Message / Statement (PDF) / + Manual Deposit / Approve withdrawal; tabs Overview / Activity / Fees / Compliance / Documents / Communication; strip Total / Withdrawable / Locked / ITD P&L / Allocation; NAV, Allocation, Cost basis, Fees paid, FIFO lots; Fees periods table; activity ledger columns.

### Investor details and Fund flow

- **Investor details · level** — *changed*. What an investor is. Design: one whitelisted org wallet, ref INV-<id>. It carries wallet ref, address, org, org KYC status, wallet status, is_primary, source and a derived access state (trading, view_only, frozen, removed). Unfunded or pending wallets with balance 0 are investors too. Code: a backend user (id, address, display_name, note, first_seen_at) with an optional organization_id and organization_ref. The wallet-to-user link exists only on org wallet rows (user_id, linked_user_id), not on the investor record.
  - Design: `v3/data-investors.js:1-2, 8, 12-24`
  - Code today: types/investors.ts:63-71; pages/InvestorDetails/components/InvestorDetailsHeader/InvestorDetailsHeader.tsx:56-65; types/kyc/wallets.ts:24-50
  - Data source today: investorTopic 'investor.{id}' (shared/topics/investors/investorTopic.ts:26-28) keyed by user id. Wallet status, is_primary, source and frozen_by exist only on org.wallet rows (OrgWalletRow). The access state and an INV ref have no source.
- **Investor details · routing** — *moved*. In the design, /investors/<numeric id> is served inside the Organizations page. The back link goes to the owning organization ('← ORG-ref · type'), and the not-found state links to a new /investors/accounts 'Investors' list tab. In the code, investors/:investorId is a standalone route. Its back link 'All Investors' goes to /investors, which redirects to /investors/orgs, and the code has no Investors list tab.
  - Design: `v3/page-orgs.jsx:268, 272; v3/page-fundflow.jsx:79, 93; v3/shell.jsx:19 (accounts: 'Investors')`
  - Code today: app.tsx:32; pages/InvestorDetails/components/InvestorDetailsHeader/InvestorDetailsHeader.tsx:33-36; pages/Investors/routes.tsx:16-20; pages/Investors/utils/investorsTabs.ts:7-12
  - Data source today: none for an accounts tab
- **Investor details · header** — *changed*. Design header: the title is the short wallet address with an Access tag (Trading, View only, Frozen) and a 'primary wallet' tag. The subline reads: INV ref · Organization link + org KYC status tag · Wallet status tag · source (Main app sign-in, Linked by ops, Quarantined deposit). Code header: display_name or address, then #id · full address · 'Onboarded <date>' · org link or 'No organization' · note. The design drops the onboarded date and the note.
  - Design: `v3/page-fundflow.jsx:94-95`
  - Code today: pages/InvestorDetails/components/InvestorDetailsHeader/InvestorDetailsHeader.tsx:38-73
  - Data source today: InvestorProfile has no access state, wallet status, is_primary, source or org KYC status. Nearest source: OrgWalletRow and the org topic.
- **Investor details · header actions** — *removed*. The disabled 'Call' button is gone. The design keeps Message, Statement (PDF), + Manual Deposit and Approve withdrawal.
  - Design: `v3/page-fundflow.jsx:96`
  - Code today: pages/InvestorDetails/components/InvestorDetailsHeader/InvestorDetailsHeader.tsx:78-80
  - Data source today: none (no command)
- **Investor details · header actions** — *changed*. Actions are gated by wallet access. '+ Manual Deposit' is disabled unless access is trading ('Investor is view only / frozen'). 'Approve withdrawal' is disabled with a reason when the wallet is frozen, view only, or has nothing withdrawable. In the code, Manual deposit is gated only by scope and COMMANDS_READY, and Approve withdrawal is disabled only while no investor is loaded.
  - Design: `v3/page-fundflow.jsx:90, 96`
  - Code today: pages/InvestorDetails/utils/canUseCommand.ts:7-14; pages/InvestorDetails/InvestorDetails.tsx:65-66; pages/InvestorDetails/components/InvestorDetailsHeader/InvestorDetailsHeader.tsx:94-100
  - Data source today: none for access. summary.withdrawable exists (types/investors.ts:75).
- **Investor details · page states** — *new*. New state banners. 'View only in the main app' names the cause: org KYC is not approved, or the wallet is not whitelisted (no deposits, no trading). 'Frozen' names the scope: this wallet or the whole organization (withdrawals and deposits blocked, positions keep running). There is also a 'no funds yet' note on Overview and a 'never been funded' empty state on Fees.
  - Design: `v3/page-fundflow.jsx:97-98, 106, 118`
  - Code today: absent in code
  - Data source today: none (no access, wallet status or org KYC status on investor.{id})
- **Investor details · balance strip** — *changed*. Tiles in the design: Total balance with '30d P&L', Withdrawable, Locked, Net deposited (deposits − withdrawals), ITD P&L, Allocation. Tiles in the code: Total balance with MTD/YTD/ITD return %, Withdrawable, Locked, Hurdle (below or above, perf fee hint), ITD P&L with YTD and MTD sub-values, Allocation. The Hurdle tile is removed, Net deposited is new, and the 30d P&L replaces the return percentages.
  - Design: `v3/page-fundflow.jsx:100-104`
  - Code today: pages/InvestorDetails/components/InvestorBalances/InvestorBalances.tsx:32-112
  - Data source today: Net deposited: summary.net_inflow (types/investors.ts:82). P&L 30d: none (only pnl_realized_itd, ytd and mtd, types/investors.ts:83-85).
- **Investor details · Overview** — *new*. Three new Overview cards. 'Recent activity' shows the last 5 events with an 'All N →' link to the Activity tab. 'Other investors · ORG-ref' lists the sibling wallets of the same organization (wallet, access, balance; click opens that investor; 'This is the organization's only wallet' when empty), with an 'Organization →' link. 'Wallet' shows address, chain, 'Added via' and wallet status.
  - Design: `v3/page-fundflow.jsx:110, 111, 114`
  - Code today: absent in code (pages/InvestorDetails/components/InvestorOverview/InvestorOverview.tsx:18-38)
  - Data source today: Recent activity: activity.items (investor.{id}). Siblings: investors.list filtered by organization_id (pages/Investors/components/OrganizationProfile/hooks/useOrgInvestors.ts:7-12), with no access per row. Wallet card: none on investor.{id}; OrgWalletRow has source and status.
- **Investor details · Overview** — *removed*. The 'Account profile' card (Type, Domicile, KYC tier, KYC renews, AML score, Tax ID, Primary contact) is gone. KYC moves to the organization, and the Wallet card takes its slot.
  - Design: `v3/page-fundflow.jsx:107-116 (no profile card)`
  - Code today: pages/InvestorDetails/components/InvestorOverview/InvestorOverview.tsx:32-34; pages/InvestorDetails/components/InvestorOverview/components/AccountProfile/utils/getProfileRecords.ts:6-24
  - Data source today: none (code always passes profile={undefined})
- **Investor details · Overview** — *changed*. NAV card. The design draws a 90-day NAV line chart ('investor share of strategy NAV') with no stats row. The code shows an empty 'NAV history isn't available yet' placeholder with ITD/YTD/MTD returns and Best/Worst/Sharpe set to '—'.
  - Design: `v3/page-fundflow.jsx:108`
  - Code today: pages/InvestorDetails/components/InvestorOverview/components/InvestorNavCard/InvestorNavCard.tsx:15-48
  - Data source today: none (nav_series not served, InvestorNavCard.tsx:15)
- **Investor details · Overview** — *changed*. Allocation card. The design shows a plain list: strategy · $ amount · %. The code shows a donut, and per strategy the fee rates (perf, mgmt, hurdle), hurdle gap or excess, lock days, a 'since' date, the last mgmt fee date and perf YTD %. The design drops the fee and hurdle details and adds a $ amount per strategy.
  - Design: `v3/page-fundflow.jsx:109`
  - Code today: pages/InvestorDetails/components/InvestorOverview/components/InvestorAllocationCard/InvestorAllocationCard.tsx:24-69; pages/InvestorDetails/components/InvestorOverview/utils/getAllocation.ts:11-45
  - Data source today: balances[].balance and pct (types/investors.ts:91-118)
- **Investor details · Overview** — *changed*. Cost basis drops to 3 rows (Deposited, Withdrawn, Net invested). The code has 6 rows: Total deposited, Total withdrawn, Net inflow, Current balance, Unrealized P&L (—), Realized P&L ITD.
  - Design: `v3/page-fundflow.jsx:112`
  - Code today: pages/InvestorDetails/components/InvestorOverview/components/CostBasis/utils/getCostBasisRecords.ts:13-24
  - Data source today: summary.deposits_total, withdrawals_total, net_inflow
- **Investor details · Overview** — *changed*. Fees paid switches from YTD to ITD (Performance, Management, Total). The code card is 'Fees paid YTD' with Mgmt, Perf and Total YTD plus 'Next mgmt fee · perf fee expected'. The design drops the next-fee row.
  - Design: `v3/page-fundflow.jsx:113`
  - Code today: pages/InvestorDetails/components/InvestorOverview/components/FeesPaid/FeesPaid.tsx:12-19; pages/InvestorDetails/components/InvestorOverview/components/FeesPaid/utils/getFeesRecords.ts:5-15
  - Data source today: none for ITD totals (InvestorFees has ytd_* only, types/investors.ts:159-170; could be summed from periods)
- **Investor details · Overview** — *changed*. FIFO lots becomes a plain table: DEPOSITED, AMOUNT, REMAINING, UNLOCKS ('in Nd' or 'unlocked'). The code card 'FIFO deposit lots & unlock timeline' has a totals strip (Available now, Provider, Strategy and Position locked, Blocked in total), 4 KPI cards (Balance, Withdrawable, Locked, Hurdle) and a LotTimeline chart.
  - Design: `v3/page-fundflow.jsx:87, 115`
  - Code today: pages/InvestorDetails/components/InvestorOverview/components/FifoDeposit/FifoDeposit.tsx:24-85
  - Data source today: lots.items and lots.totals (types/investors.ts:120-147)
- **Investor details · Activity** — *new*. Event-group filter on the Activity tab: All, Money, P&L & fees, Access.
  - Design: `v3/page-fundflow.jsx:117; v3/page-orgs.jsx:36, 64-70`
  - Code today: absent in code (pages/InvestorDetails/components/InvestorActivity/InvestorActivity.tsx:31-49)
  - Data source today: none (client-side filter over activity.items would work for money and fees)
- **Investor details · Activity** — *changed*. Event kinds and statuses. The design adds access events (SIGN_IN, WALLET_LINKED, DEPOSIT_HELD, DEPOSIT_BLOCKED, FROZEN) and STRATEGY_CHANGE with an 'A → B' note, plus statuses BLOCKED and HELD. The 'STRATEGY' column becomes 'STRATEGY / DETAIL', which shows the note or the reason (org_not_approved, wallet or organization). The code has DEPOSIT, WITHDRAW, PNL, PERFORMANCE_FEE, MANAGEMENT_FEE, REALLOCATION, NETWORK_FEE, TXN_FEE_SPREAD, WALLET_TRANSFER, with statuses SUCCESS, PENDING and FAILURE. NETWORK_FEE, TXN_FEE_SPREAD and WALLET_TRANSFER do not appear in the design.
  - Design: `v3/page-orgs.jsx:35-36, 52-62; v3/data-investors.js:27-43`
  - Code today: types/investors.ts:3-12, 172-191; pages/InvestorDetails/components/InvestorActivity/columns.tsx:11-27, 85-89
  - Data source today: investor.{id} activity.items (InvestorOp). Access events (sign-in, wallet linked, deposit held or blocked, frozen) have no source.
- **Investor details · Compliance** — *removed*. The 'Screening log' table (TIME, TYPE, PROVIDER, OUTCOME, SCORE, REFERENCE, DETAIL) and the 'Risk posture' card (AML score bar, Sanctioned?, PEP exposure, Geographic risk, Source of funds, Last and next re-screen, Withdrawal whitelist) are gone. One card remains with 'Not served by the contract', a new link 'KYC lives on the organization: ORG →', and the Run rescreen and Edit whitelist buttons in its header.
  - Design: `v3/page-fundflow.jsx:120`
  - Code today: pages/InvestorDetails/components/Complience/Complience.tsx:19-47; pages/InvestorDetails/components/Complience/components/RiskPosture/RiskPosture.tsx:28-58
  - Data source today: none (code passes screening=[] and profile=undefined, InvestorDetails.tsx:100-105)
- **Investor details · Compliance** — *changed*. Edit whitelist conflicts with the new model. In the code it replaces an investor-level list of withdrawal addresses (up to N addresses, TOTP). In the design an investor IS one whitelisted wallet, and whitelisting is per org wallet (Organizations › Wallet whitelisting), yet the button is still shown (phase 2).
  - Design: `v3/page-fundflow.jsx:120`
  - Code today: pages/InvestorDetails/components/WhitelistEdit/WhitelistEdit.tsx:33-38; pages/InvestorDetails/components/WhitelistEdit/hooks/useEditWhitelist.ts:11-15
  - Data source today: command investor.whitelist.edit (COMMANDS_READY false)
- **Investor details · Documents** — *changed*. The Documents table (DOCUMENT, TYPE, SIZE, SIGNED / GENERATED, EXPIRES, tags) is replaced by a 'Not served by the contract' text card.
  - Design: `v3/page-fundflow.jsx:121`
  - Code today: pages/InvestorDetails/components/Documents/Documents.tsx:14-22
  - Data source today: none (documents=[])
- **Investor details · Communication** — *removed*. The communication log list and the disabled 'Log a call' button are gone. Only a 'Not served' text and '+ New message' remain.
  - Design: `v3/page-fundflow.jsx:122`
  - Code today: pages/InvestorDetails/components/Communication/Communication.tsx:23-74
  - Data source today: none (comms=[])
- **Investor details · Fees** — *changed*. The total row is labelled 'Total' (sum of the shown periods) instead of 'YTD Total', and the fee-model note under the table is gone.
  - Design: `v3/page-fundflow.jsx:88-89, 119`
  - Code today: pages/InvestorDetails/components/Fees/utils/getFeesRows.ts:20-32; pages/InvestorDetails/components/Fees/Fees.tsx:40
  - Data source today: fees.periods, fees.ytd_*, fees.model
- **Fund flow · Deposits & withdrawals** — *changed*. The INVESTOR column shows the INV ref (wallet-investor) as a link to /investors/<id>. In the code it is display_name or the shortened address as plain text (full address on hover), with no link to the investor page. Neither side adds an organization column.
  - Design: `v3/page-fundflow.jsx:18, 27`
  - Code today: pages/FundFlow/components/DepositsWithdrawals/components/IntentsTable/columns.tsx:28-36; pages/FundFlow/components/DepositsWithdrawals/utils/intentFormatters.ts:14-15
  - Data source today: fundflow intents topic: FundflowIntent.user {address, display_name} and user_label only. No investor id, wallet ref or organization (types/fundflow.ts:56-60).
- **Fund flow · Deposits & withdrawals** — *changed*. Intent modal. The Investor row shows the INV ref. The design adds a stage progress strip, and its detail list is cut to Investor, Amount, Chain, Strategy, Stage, Age, Unlock ETA. The code also shows Direction, Address, KYT score, Confirmations, Provider, Tx hash, Hold, Failure and an event Timeline.
  - Design: `v3/page-fundflow.jsx:30-33`
  - Code today: pages/FundFlow/components/DepositsWithdrawals/components/IntentModal/components/IntentDetails/IntentDetails.tsx:146-193
  - Data source today: FundflowIntent (types/fundflow.ts:56-83); no INV ref
- **Fund flow · Deposits & withdrawals** — *new*. KYC-hold state. Stage 'Held (KYC)' gets a note in the modal: 'KYC hold (org_not_approved): funds held for review · see Organizations › Quarantine'. In the code, a hold is only a flag: the stage tag turns warning, the reason shows in a tooltip and a 'Hold' row, and nothing points to Quarantine.
  - Design: `v3/page-fundflow.jsx:18, 33`
  - Code today: pages/FundFlow/components/DepositsWithdrawals/utils/intentFormatters.ts:25-29; pages/FundFlow/components/DepositsWithdrawals/components/IntentsTable/columns.tsx:73-77; pages/FundFlow/components/DepositsWithdrawals/components/IntentModal/components/IntentDetails/IntentDetails.tsx:167
  - Data source today: held_at and held_reason on FundflowIntent; no link to quarantine rows
- **Fund flow · Deposits & withdrawals** — *changed*. Stage vocabulary for the sankey and the stage tags. Design deposits: Created, Tx sent, KYT, On-chain, Credited, Settled. Design withdrawals: Created, Approval, Lock check, Provider, On-chain, Settled. Code deposits: D0–D5 (Created, Tx scan, Tx found, Confirmations, Core → sub, Allocated). Code withdrawals: W0–W7 (Requested, Approval, Balance check, Sub → core, CEX withdraw, Tx found, Confirmations, Delivered), plus Rejected, Failed and Expired.
  - Design: `v3/page-fundflow.jsx:2-3, 6-12`
  - Code today: pages/FundFlow/components/DepositsWithdrawals/utils/stageLabels.ts:3-21; pages/FundFlow/components/DepositsWithdrawals/components/IntentModal/utils/intentStages.ts:8-27
  - Data source today: FundflowStage. The design's KYT and Lock check stages have no source (kyt is NotAvailable, types/fundflow.ts:73).
- **Fund flow · Deposits & withdrawals** — *changed*. The intent modal footer shows both Retry and Force advance (disabled, phase 2) plus Close. The code shows a single action picked by intent state (Retry intent if failed, Force advance if there are later stages, otherwise a reason).
  - Design: `v3/page-fundflow.jsx:30`
  - Code today: pages/FundFlow/components/DepositsWithdrawals/components/IntentModal/IntentModal.tsx:82-106
  - Data source today: COMMANDS_READY fund_intent.retry and force_advance = false
- **Fund flow · Deposits & withdrawals** — *removed*. The New Deposit / New Withdrawal form is not drawn. The design has the button only, with a phase-2 reason (its modal state is unused). The code has a full form: an investor picker listing investors.list users by address, strategy, asset, network, amount, a withdrawable balance for withdrawals, and TOTP. Under the wallet model this picker would have to list INV wallets.
  - Design: `v3/page-fundflow.jsx:15, 22`
  - Code today: pages/FundFlow/components/DepositsWithdrawals/DepositsWithdrawals.tsx:83-93; pages/FundFlow/components/DepositsWithdrawals/components/IntentFields/IntentFields.tsx:50-80; pages/FundFlow/components/DepositsWithdrawals/hooks/useIntentFormOptions.ts:32-39; pages/FundFlow/components/DepositsWithdrawals/components/WithdrawalModal/hooks/useWithdrawableBalance.ts:9-26
  - Data source today: investors.list (users) and investor.{id} balances

**Unchanged:** Unchanged, already in code: the investor page tab set and order (Overview, Activity, Fees, Compliance, Documents, Communication) with count badges. The Message, Statement (PDF), + Manual Deposit and Approve withdrawal buttons; Approve withdrawal goes to /fundflow/approvals in both. Phase-2 commands are disabled in both. The Withdrawable and Locked tiles and the allocation bar, plus the Activity columns TIME, AMOUNT, ASSET/CHAIN, REFERENCE and STATUS with Load more. The Fees table columns (PERIOD, ROUNDTRIPS, PERIOD P&L, PERF FEE, MGMT FEE, TOTAL FEE, STATUS charged/open). In Fund flow: the two tabs (Deposits & withdrawals, Approvals); the header, Deposits/Withdrawals toggle, Export CSV and + New Deposit/Withdrawal buttons; the Source / Visible-to meta line; the 4 KPIs (In flight, Settled 24h, Failed/blocked, Avg time to settle) and the pipeline sankey card. The intents columns other than Investor stay the same: INTENT, AMOUNT, ASSET, CHAIN, STRATEGY, STAGE, KYT '—', AGE and UNLOCK ETA, with a click opening the intent modal. The whole Approvals ('Fund transfers') page is the same: header buttons, the Pending/In-flight/Recent tabs, the treasury↔venue transfer columns, and Approve/Reject with note and TOTP. Approvals never mentions investors in either version. Neither the design nor the code puts an Organization column or an investor/org filter in Fund flow.

### Shell, Overview and Admin

- **Shell / routes** — *new*. New sub-route and breadcrumb label for the Investors level: /investors/accounts is labelled 'Investors' and is the second sub-tab of the Organizations page, after 'Organizations'. The sidebar item itself is NOT renamed: it stays 'Organizations' (id investors). The code has no 'accounts' tab and no 'accounts' route; the catch-all route sends /investors/accounts to /investors/orgs.
  - Design: `v3/shell.jsx:19 (accounts: 'Investors'); v3/page-orgs.jsx:272 (tab list)`
  - Code today: absent in code: pages/Investors/utils/investorsTabs.ts:7-12 (orgs, kyc, whitelisting, quarantine only); pages/Investors/routes.tsx:30-41 (no accounts route, '*' redirects to orgs); shared/constants/navConfig.ts:64 (subTabs = INVESTORS_TABS)
  - Data source today: investors.list topic (shared/topics/investors/investorsListTopic.ts). Its rows are keyed by investor id/address and carry organization_id, balance, withdrawable and locked_breakdown. Today only OrganizationProfile (useOrgInvestors.ts) and Fund flow read it. It has no per-wallet ref, wallet status, access state (trading/view_only/frozen) or allocation % that v3/data-investors.js:8,22-24 shows.
- **Shell / sidebar nav** — *changed*. Sidebar labels are unchanged: 'Organizations' is still the nav label, and the Organizations badge still counts organizations (4 to review). There is no separate 'Investors' nav item and no investor badge in the sidebar. The investor count appears only as a badge on the new Investors sub-tab.
  - Design: `v3/shell.jsx:8; v3/data.js:69; v3/page-orgs.jsx:272 (Investors tab badge = count of non-removed investor accounts)`
  - Code today: shared/constants/navConfig.ts:58-65 (same label and badge); the investor-count tab badge is absent in code
  - Data source today: nav.badges topic has organizations/fundflow/recon/bots only (shared/topics/nav/navBadgesTopic.ts:5); no investor count
- **Shell / header breadcrumbs** — *changed*. In the design, breadcrumbs keep every known path segment, including record ids (numbers and ORG-/STR-/INV- refs). Example: /investors/4201 reads 'Organizations / 4201' and /investors/orgs/12 reads 'Organizations / Organizations / 12'. The code shows at most the section plus a known sub-tab label and drops ids, so investor details show only 'Organizations'.
  - Design: `v3/shell.jsx:76`
  - Code today: shared/components/PmsHeader/utils/getRouteSegments.ts:16-22
  - Data source today: none
- **Shell / Viewing as** — *changed*. In the design, the role-preview panel links 'Edit roles' to /admin/roles. In the code, the link reads 'edit scopes →' and points to href="#edit-scopes", which goes nowhere.
  - Design: `v3/shell.jsx:51`
  - Code today: shared/components/PmsHeader/components/RoleDropdown/components/RoleDrodownList/RoleDropdownList.tsx:27-31
  - Data source today: none
- **Shell / Viewing as** — *removed*. The design has no 'Sign out' button in the Viewing-as panel; sign out is only in the sidebar user menu. The code shows a 'Sign out' button in the role panel, and its handler does nothing.
  - Design: `v3/shell.jsx:50-53 (no sign out); v3/shell.jsx:111 (sign out in sidebar user menu)`
  - Code today: shared/components/PmsHeader/components/RoleDropdown/components/RoleDrodownList/RoleDropdownList.tsx:50-54
  - Data source today: none
- **Shell / Viewing as** — *changed*. The design hides the Viewing-as control unless your own role is admin. The code always renders it; when you cannot preview, the list falls back to your own role only.
  - Design: `v3/shell.jsx:47`
  - Code today: shared/components/PmsHeader/PmsHeader.tsx:65; shared/hooks/usePreviewRole.ts:18,30 (canPreview = admin.users)
  - Data source today: admin.roles topic (rolesTopic), enabled only with admin.users
- **Admin › Roles & permissions (scope label)** — *changed*. In the design, the 'investors' scope is labelled 'Organizations & investors', so the scope covers the new investor level. In the code it is 'Organizations (view)', and it unlocks only the sub-tabs Organizations and Quarantine, with no Investors sub-tab.
  - Design: `v3/data.js:12`
  - Code today: pages/Admin/components/RolesPermissions/components/RolesMatrix/utils/scopeCatalogue.ts:38-45
  - Data source today: scope catalogue is a front-end constant
- **Overview › Needs attention** — *changed*. The 'KYC cases to review' row deep-links to /investors/kyc in the design. In the code, the attention link 'sub' has no 'kyc' value and SUB_PATH has no kyc entry, so the row opens /investors, which redirects to the Organizations list.
  - Design: `v3/page-overview.jsx:29; v3/data.js:56`
  - Code today: pages/Overview/components/AttentionWidget/AttentionLine/AttentionLine.tsx:15; types/overview.ts:313
  - Data source today: overview.attention topic (overviewAttentionTopic); backend would need to send link.sub='kyc'
- **Overview › Organizations widget** — *removed*. No investor-level widget in the design: the Organizations block shows only the KYC/org view (KYC approved x/y; Combined balance, KYC to review, Waiting on client, Quarantined deposits, Re-KYC due). The code also has an investor-only fallback, used when the organizations block is missing: 'Active investors' KPI plus Withdrawable now, Locked, Below high-water mark and Compliance flags. The design does not draw that state.
  - Design: `v3/page-overview.jsx:69-77, 116`
  - Code today: pages/Overview/components/InvestorsWidget/InvestorsWidget.tsx:33-39, 75, 102-108
  - Data source today: overview.metrics topic, investors + organizations blocks
- **Admin › Users, keys & audit › Team & keys (Team members)** — *changed*. The design adds a STATUS column (active/deactivated) and shows the actions menu only for active members: Change role, Rename, Sessions, Reset 2FA, Deactivate. The code has no STATUS column (a deactivated member is marked inside the member cell). For each user it offers 'Sessions (n)' and, for deactivated users, 'Reactivate'. The design has no Reactivate.
  - Design: `v3/page-admin.jsx:9`
  - Code today: pages/Admin/components/UsersAudit/components/TeamKeys/components/TeamMembers/columns.tsx:32-79; .../TeamMembers/utils/getUserActions.ts:45-55
  - Data source today: admin.users topic (usersTopic)
- **Admin › Users, keys & audit › Team & keys (API keys)** — *changed*. The design drops the IP RESTRICTED column, renames STORED to CREATED, and uses different status values: active / rotate · 200d+ / missing. The code uses ACTIVE / ROTATE SOON / EXPIRED / NO KEY.
  - Design: `v3/page-admin.jsx:8`
  - Code today: pages/Admin/components/UsersAudit/components/TeamKeys/components/ApiKeys/columns.tsx:110-123; .../ApiKeys/constants/columns.ts:11-26
  - Data source today: admin.keys topic (apiKeysTopic)
- **Admin › Users, keys & audit › Config** — *changed*. The design shows a fixed list of settings in the groups Withdrawals / Rounding / KYC, with keys usd_display_decimals and crypto_display_decimals. Those keys do not exist in code. The design also omits kyc_enforce_at, and every Edit button is disabled ('Backend rejects writes today'). The code builds its groups (KYC / Withdrawals & transfers / Allocation & risk / Platform & data / Other) from the live settings topic, using amount_decimals and kyc_enforce_at. Settings are edited inline with Save, a confirm modal and a second-admin approval.
  - Design: `v3/page-admin.jsx:28-31`
  - Code today: pages/Admin/components/UsersAudit/components/Config/utils/getSettingGroups.ts:8-47; .../Config/components/SettingRow/SettingRow.tsx:112,142
  - Data source today: admin.settings topic (settingsTopic)
- **Admin › Users, keys & audit › Config (KYC gating by organization)** — *removed*. The design's overrides card lists rows with a Remove button only, with no way to add an override. The code has an AddOverride control that picks an organization with no override.
  - Design: `v3/page-admin.jsx:32`
  - Code today: pages/Admin/components/UsersAudit/components/Config/components/GatingOverrides/GatingOverrides.tsx:59
  - Data source today: admin.settings topic (kyc_gating_mode:org:<id> keys)
- **Admin › Roles & permissions** — *removed*. The design's 'Scope matrix' has no 'what it unlocks' column (the Tab / Sub-tab / Block tags) and no 'Remove role' action. The code shows both.
  - Design: `v3/page-admin.jsx:63-66`
  - Code today: pages/Admin/components/RolesPermissions/components/RolesMatrix/RolesMatrix.tsx:76-81, 218-222; .../RolesMatrix/utils/unlockTags.ts
  - Data source today: admin.roles topic (rolesTopic) + front-end scope catalogue

**Unchanged:** Already in code and the same: sidebar groups, items, order, icons, scope gating and live badges (Portfolio: Overview, Strategies, TradeSim Hub, Trading LIVE, Organizations, Fund flow; Control: Reconciliation, Finance, Admin); page access redirect for a preview role; the brand 'Kemely PMS · Internal · v3.0'; header search with the same placeholder ('Search positions, orders, organizations...') and no investor search; stream status; the USD/USDC/BTC toggle; the notifications bell (unread badge, critical/warning chips, Mark all read, Show more, disabled Notification settings); the sidebar user menu (Signed in via, 2FA, Sign out); the investor-details route /investors/:id; Overview controls (1D/7D/30D/90D) and all 10 widgets with the same rows: Performance, Needs attention, Strategies, TradeSim Hub, Trading, Fund flow, Organizations (org/KYC mode, gating tag and tooltip), Reconciliation, Finance, Admin; Admin tabs (Users, keys & audit · Roles & permissions · Counterparties) and their scopes; Users, keys & audit sub-tabs (Team & keys, System health, Audit log, Config), header counts, Download audit (CSV) and Invite user; System health and Audit log columns; Risk-tier limits and CEX withdrawal fees cards as mocks; Counterparties header, columns, expandable sub-accounts and Add venue. In this area the only new level for Investors is the sub-tab route and label. The design adds no 'Investors' nav item and no investor widget on Overview.

### Strategies, TradeSim Hub and Trading

- **Strategies > Bots & sagas** — *removed*. The "Saga timeline · last N events" card for the focused bot (orchestrator → venue → recorder event list) is gone. The design shows only the three triage cards for the focused bot.
  - Design: `v3/page-strategies.jsx:48-70 (no timeline; BotTriage only at :68)`
  - Code today: pages/Strategies/StrategiesHub/components/BotsSagas/components/BotFocus/BotFocus.tsx:27; .../SagaTimeline/SagaTimeline.tsx:17-36
  - Data source today: botEventsMock (StrategiesHub/components/BotsSagas/utils/mocks.ts)
- **Strategies > Bots & sagas** — *moved*. The focused-bot block (headline plus Wallet balances, Errors and Position locks) moves from above the Bots/Saga grid to below it.
  - Design: `v3/page-strategies.jsx:56-68`
  - Code today: pages/Strategies/StrategiesHub/components/BotsSagas/BotsSagas.tsx:25-29
  - Data source today: botsMock, botTriageMock (mocks)
- **Strategies > Bots & sagas** — *changed*. Header buttons "Bot console" and "Kill all" are disabled in the design, with a not-served (phase 2) reason on hover. In the code they are enabled buttons with no handler.
  - Design: `v3/page-strategies.jsx:53`
  - Code today: pages/Strategies/StrategiesHub/components/BotsSagas/components/BotsSagasHeader/BotsSagasHeader.tsx:33-34
  - Data source today: none
- **Strategies > Bots & sagas** — *new*. New info note: "Bots & sagas still run on mocks: the contract has no bots-list or sagas topic yet."
  - Design: `v3/page-strategies.jsx:55`
  - Code today: absent in code
  - Data source today: botsMock, sagasMock (mocks)
- **Strategy details (header, Overview)** — *removed*. The design assumes exactly one bot per strategy: the subtitle always reads "1 bot (id)" and the card is always "Bot · id". The code also handles strategies with several bots ("N bots", card "Bots · N", allocated capital hidden).
  - Design: `v3/page-strategies.jsx:101, :107`
  - Code today: pages/Strategies/StrategyDetails/components/StrategyDetailsHeader/StrategyDetailsHeader.tsx:13-17; .../StrategyOverview/components/BotCard/BotCard.tsx:17-33
  - Data source today: strategyTopic (strategy.bots, bot_id) + botsTopic
- **Strategy details > Fee policy** — *new*. New info note: "Fee policy still runs on mocks: no fee-policy topic in the contract yet."
  - Design: `v3/page-strategies.jsx:114`
  - Code today: absent in code (tab renders strategyFeePolicyMock silently: pages/Strategies/StrategyDetails/components/StrategyFeePolicy/StrategyFeePolicy.tsx:13)
  - Data source today: strategyFeePolicyMock (mocks)
- **Strategy details > Fee policy** — *changed*. Accrual waterfall becomes a plain label/value list with no bars and no period dates in the title ("this period"). Rows are renamed ("= Above hurdle", "= Total fees accrued"). The code shows bars and "Accrual waterfall · start → end".
  - Design: `v3/page-strategies.jsx:117`
  - Code today: pages/Strategies/StrategyDetails/components/StrategyFeePolicy/components/AccrualWaterfall/AccrualWaterfall.tsx:17-30; utils/getAccrualRows.ts:25-58
  - Data source today: strategyFeePolicyMock (mocks)
- **Strategies > Create > Legs** — *changed*. Legs step is simpler. Each leg is a pool select, a Role select (spot/perp/hedge) and Allocation %. The design drops the free-text leg role, the Market and Margin selects, the per-leg Remove button and "+ Create new pool…" (with the inline new-pool form). The total must be exactly 100% to continue. The code allows a total other than 100% and shows a warning.
  - Design: `v3/page-strategies.jsx:153-154, :133`
  - Code today: pages/Strategies/StrategyCreate/components/LegsStep/components/LegCard/LegCard.tsx:44-137; LegsStep/LegsStep.tsx:51-79; utils/getStepValidity.ts:24-29
  - Data source today: poolsMock, exchangeAccountsMock (mocks)
- **Strategies > Create > Bot wiring** — *changed*. Wiring is read-only: auto bot IDs ("auto · new-N") and the bot strategy taken from the category. The code has editable BOT STRATEGY and BOT ID per leg, % and ALLOCATED columns, "unwired" legs, and a both-set-or-both-cleared validation error.
  - Design: `v3/page-strategies.jsx:155`
  - Code today: pages/Strategies/StrategyCreate/components/WiringStep/columns.tsx:10-47; WiringStep.tsx:41-57
  - Data source today: form state + botStrategies util
- **Strategies > Create > Deposit networks** — *changed*. Columns change to NETWORK / TOKEN / CONFIRMATIONS (fixed ETH, TRON, BSC, ARB), and at least one network is required. The code shows CHAIN plus one column per leg exchange (network code, fee, "deposits off"); selecting none means all supported networks. The code has no source for confirmations.
  - Design: `v3/page-strategies.jsx:156, :133`
  - Code today: pages/Strategies/StrategyCreate/components/NetworksStep/columns.tsx:9-41; NetworksStep.tsx:39-53; utils/getStepValidity.ts:38
  - Data source today: depositNetworksMock (no confirmations field)
- **Strategies > Create > Review & Summary** — *changed*. Review becomes one flat key/value list. It drops the legs table (pool, sub-account, role · market, %, bot) and the "Bots wired x/y" summary row. The design adds a "Visible to clients" row to Review and puts Name and Category in the Summary list.
  - Design: `v3/page-strategies.jsx:157, :161`
  - Code today: pages/Strategies/StrategyCreate/components/ReviewStep/ReviewStep.tsx:74-99; StrategySummary/StrategySummary.tsx:28-56
  - Data source today: form state
- **Strategies > Create > Success** — *changed*. The success card has a single "All strategies" button and the text "design mock, no command yet". The code shows a per-leg list (pool, role, %, bot), "Back to strategies" and "Open strategy". The page title changes from "Create strategy" to "New strategy", with the subtitle "the create wizard still runs on mocks".
  - Design: `v3/page-strategies.jsx:135, :138`
  - Code today: pages/Strategies/StrategyCreate/components/CreateSuccess/CreateSuccess.tsx:33-51; StrategyCreateHeader/StrategyCreateHeader.tsx:15-19
  - Data source today: form state (no create command)
- **TradeSim Hub > Live simulation** — *removed*. The pair header shows only exchange, symbol and best score. Removed: rank #, perp/spot instrument style, DELIST tag, best Win %, APY, DD, and the "N vars" count.
  - Design: `v3/page-tradesim.jsx:42`
  - Code today: pages/TradeSimHub/components/LiveSim/components/ComboTable/ComboTable.tsx:32-68
  - Data source today: live results topic (useLiveResults)
- **TradeSim Hub > Live simulation** — *removed*. Each pair shows a fixed 3 variants. Removed: top-5 limit, the "Show all N variants" / "Show top 5" toggle, and best-row highlighting.
  - Design: `v3/page-tradesim.jsx:37, :43`
  - Code today: pages/TradeSimHub/components/LiveSim/components/ComboTable/ComboTable.tsx:17, 26-29, 74-86
  - Data source today: live results topic
- **TradeSim Hub (header, Live simulation, Spot vs perp)** — *removed*. No degraded states: the recorder badge is always "Recorder OK · 14 streams" and the timestamps are always fresh. The code has recorder ok/warning/down/pending with a stale-since tooltip, "Stale ·" labels and per-panel load or page-switch errors.
  - Design: `v3/page-tradesim.jsx:77, :38, :71`
  - Code today: pages/TradeSimHub/components/TradesimHeader/TradesimHeader.tsx:16-41; LiveSim/LiveSim.tsx:27-31, 63-75; SpotPerp/SpotPerp.tsx:75-89
  - Data source today: tradesimStatusTopic, live results, basis topics
- **TradeSim Hub > Spot vs perp basis** — *removed*. The basis table is not paginated. The code pages it at 8 rows, with BTC and ETH pinned.
  - Design: `v3/page-tradesim.jsx:55-71`
  - Code today: pages/TradeSimHub/components/SpotPerp/SpotPerp.tsx:21, 62-69
  - Data source today: basis topic (useBasis)
- **Trading > Positions** — *changed*. The KPI row is replaced by 5 fixed KPIs: Gross notional, Net exposure, Unrealized P&L, Hedged pairs, Stale marks. The code shows Gross notional plus one card per strategy (gross and uPnL per strategy). The subtitle adds net exposure and the strategy count.
  - Design: `v3/page-trading.jsx:49-51`
  - Code today: pages/Trading/components/PositionsExposures/utils/getPositionStats.ts:16-47; components/PositionCards/PositionCards.tsx:18-24
  - Data source today: positionsTopic: notional, upnl, hedged_pair_id and stale exist; net exposure, hedged-pair count and stale count are not computed today
- **Trading > Positions > Hedge calculator** — *changed*. Hedge calculator becomes a read-only result list: net exposure, hedge side, quantity, instrument, "resulting net delta ≈ 0". It drops the editable "Net exposure to hedge" input and the authenticator (TOTP) code.
  - Design: `v3/page-trading.jsx:30-38`
  - Code today: pages/Trading/components/PositionsExposures/components/HedgeCalculator/HedgeCalculator.tsx:132-140, 177-192
  - Data source today: positionsTopic + hedge.stage command (phase 2)
- **Trading > Orders & executions** — *changed*. "Cancel all" is clickable and opens the confirm modal; only the modal's submit is disabled. In the code the header button itself is disabled until orders.cancel_all is served.
  - Design: `v3/page-trading.jsx:98, :113`
  - Code today: pages/Trading/components/OrdersExec/OrdersExec.tsx:86-93; utils/commandsReady.ts:15
  - Data source today: orders.cancel_all command (phase 2)
- **Trading > Orders & executions** — *removed*. The Pause-all-bots and Cancel-all modals have no "Reason (audit log)" field. The code requires a reason of at least 5 characters as well as the phrase and the code. The per-row Cancel has no single-order modal in the design; the code has a CancelOrder modal.
  - Design: `v3/page-trading.jsx:77-85, :110, :112-113`
  - Code today: pages/Trading/components/OrdersExec/components/PauseBots/PauseBots.tsx:35, 68; CancelOrders/CancelOrders.tsx:41, 75; OrdersExec.tsx:137
  - Data source today: bot.pause, orders.cancel_all, order.cancel commands (phase 2)
- **Trading > Orders & executions** — *removed*. The subtitle loses "24h notional" and the stream indicator loses the "Connecting" state (only Streaming or Offline).
  - Design: `v3/page-trading.jsx:93, :95`
  - Code today: pages/Trading/components/OrdersExec/utils/getOrdersSummary.ts:12-17; OrdersExec.tsx:31, 51-56
  - Data source today: orders topic + socket status
- **Trading > P&L attribution** — *changed*. The KPI row is replaced by an attribution split: Net realized P&L, Basis / spread, Funding, Directional, Fees (each with % of total). The code shows Cumulative P&L, Realized, Unrealized (across N positions) and Fees paid, so Unrealized disappears.
  - Design: `v3/page-trading.jsx:127`
  - Code today: pages/Trading/components/PnL/utils/getPnlKpis.ts:15-48
  - Data source today: pnl attribution topic: TradingPnlTotals (types/trading.ts:13-22) has no basis/funding/directional totals; they exist only per strategy in by_strategy (types/trading.ts:24-34) and would have to be summed
- **Trading > P&L attribution** — *removed*. The span selector offers only 7D / 30D / 90D / YTD. The code also has 1D, 1Y and ALL.
  - Design: `v3/page-trading.jsx:117-118, :125`
  - Code today: pages/Trading/components/PnL/utils/spans.ts:3-11
  - Data source today: pnl attribution topic (span param)

**Unchanged:** Already in code, same: Strategies hub tabs (Strategies, Bots & sagas with warn badge); strategy cards (NAV, NAV/share, APY, drawdown, P&L 24h/30d, bot and pool count, venues, fees tag; Compare and + New strategy); bots table columns and saga workflow list; triage cards (Wallet balances, Errors, Position locks with disabled actions); strategy details back link, header actions (disabled), 5 KPIs, tabs Overview / Pools / Bot triage / Fee policy / Orders with badges; Overview (NAV chart, bot card, open positions); Pools columns; Bot triage actions (Rebalance wallets, Pause bot, Kill switch); Fee policy KPIs, policy list with Edit/read-only rows (including "High-water mark per investor"), crystallisations table; strategy Orders columns; create wizard's 6 steps and identity/params fields; TradeSim header, Data collection (workers, loops, stats, events chart, disk usage), Live sim stats and variant columns, pagination, Spot vs perp columns and ALL/BINANCE/OKX filter; Trading tabs with LIVE badge; Positions category tabs, Status/Venue/Asset filters, hedged-only and ~0 switches, open and closed columns, Export and + New order disabled, New order modal with TOTP; Orders filters (status, venue, strategy), columns, Pause gated on strategies.write, Cancel-all phrase and TOTP; P&L cumulative and daily charts and attribution-by-strategy table, Export PDF disabled. No investor (wallet) level in any of these screens, in the design or in the code.

### Reconciliation and Finance

- **Reconciliation and Finance (investor level)** — *new*. No investor (wallet) level here. Neither page has a per-investor breakdown in the design or in the code. Recon breaks are keyed by venue, pool and asset only, with no wallet or investor column, filter or drill-down. The Finance fee waterfall still says 'all numbers attributed to firm, not investors', and fee accruals and sweeps have no investor column. Per-investor fees exist in the design only as MANAGEMENT_FEE and PERFORMANCE_FEE rows in each investor's activity feed (data-investors.js:33-34), which the Organizations and Investor screens show, not Finance. The code types have no field for this either: FinanceFeeEvent carries strategy_id and pool_id only, and ReconFinding carries pool_id, exchange and sub_account but no wallet or investor id.
  - Design: `v3/page-recon-finance.jsx:35-42, :70, :71; v3/data-investors.js:33-34`
  - Code today: src/types/finance.ts:47-54; src/types/recon.ts:14-37; src/pages/Finance/Finance.tsx:68
  - Data source today: none (finance.firm and recon.findings carry no investor or wallet key)
- **Reconciliation** — *changed*. The reconciler set in the strip differs. The design shows 4 cards: Balance drift, XBridge vs ledger, Transfer-service and On-chain deposits. The code's server-driven strip and its type have 6 reconcilers: balance, intent, fee, lock, hot_wallet and client_sum. client_sum (sum of client balances), the one closest to an investor-level check, is missing from the design. xbridge, transfers and onchain do not exist in the code type.
  - Design: `v3/page-recon-finance.jsx:3-8, :27-32`
  - Code today: src/types/recon.ts:3; src/pages/Reconciliation/components/ReconcilerStrip/ReconcilerStrip.tsx:22-66
  - Data source today: recon.runs topic (useReconRuns, reconcilers[])
- **Reconciliation** — *changed*. The reconciler health values differ. The design uses healthy, degraded and failing. The code's ReconHealth type is healthy, stale or error, so the code has no 'degraded' or 'failing' state.
  - Design: `v3/page-recon-finance.jsx:4-7, :28`
  - Code today: src/types/recon.ts:87; src/pages/Reconciliation/utils/reconFormatters.ts:20-24
  - Data source today: recon.runs topic (reconcilers[].health)
- **Reconciliation** — *new*. The Open breaks filter gains an 'All' option, so the design's segments are Actionable / Warn / Info / All. The code has only Actionable / Warnings / Info, with no unfiltered view and no export params for All.
  - Design: `v3/page-recon-finance.jsx:19, :33`
  - Code today: src/pages/Reconciliation/utils/reconFilters.ts:4-18
  - Data source today: recon.findings topic, filtered by severity (useReconFindings)
- **Reconciliation** — *new*. A new break row, 'Deposit seen on-chain, not credited', comes from an on-chain deposits reconciler. It has no venue and no pool, and it is a per-wallet deposit problem. The design still names no wallet or investor on that row. The code has no on-chain deposit reconciler.
  - Design: `v3/page-recon-finance.jsx:14`
  - Code today: absent in code (src/types/recon.ts:3)
  - Data source today: none
- **Reconciliation** — *removed*. The break modal loses its action sub-forms. In the design, Open ticket, Force reconcile and Mark resolved are plain disabled buttons in the footer. In the code, each opens its own step inside the modal: Mark resolved has a resolution dropdown (investigated, manual adjustment, auto-corrected), notes and a TOTP code; Open ticket has a title field; Force reconcile has a TOTP code. The button order and emphasis also change: the design makes Mark resolved primary, the code makes Force reconcile primary.
  - Design: `v3/page-recon-finance.jsx:46`
  - Code today: src/pages/Reconciliation/components/BreakModal/BreakModal.tsx:17-45, :90-93; .../ResolveBreak/ResolveBreak.tsx:15-75; .../OpenTicket/OpenTicket.tsx:28-58; .../ForceReconcile/ForceReconcile.tsx:17-26
  - Data source today: commands recon.resolve / recon.ticket / recon.force (COMMANDS_READY false)
- **Reconciliation** — *removed*. The break modal shows fewer details. The design lists venue/pool, asset, expected, actual, diff, first seen and last seen, plus tags for severity, copies and reconciler. The code also shows Problem, Notes, Diff %, the Last run id and the raw Detail key/value list. The design drops these.
  - Design: `v3/page-recon-finance.jsx:47-49`
  - Code today: src/pages/Reconciliation/components/BreakModal/components/BreakDetails/BreakDetails.tsx:42-86
  - Data source today: recon.findings (latest finding: notes, run_id, detail)
- **Reconciliation** — *changed*. The Recent runs footer in the design shows a total run count ('5 of 214 runs') and Load more. The code shows 'last N · live' with Load more and Show less, and has no total run count.
  - Design: `v3/page-recon-finance.jsx:43`
  - Code today: src/pages/Reconciliation/components/RecentRuns/RecentRuns.tsx:29-48; src/types/recon.ts:112-118
  - Data source today: recon.runs topic (no total count field)
- **Reconciliation** — *changed*. The New reconciliation modal's reconciler dropdown lists the design's 4 reconcilers. The code hardcodes the 6 code reconcilers (balance, intent, fee, lock, hot_wallet, client_sum). The pool dropdown is the same.
  - Design: `v3/page-recon-finance.jsx:52`
  - Code today: src/pages/Reconciliation/components/NewReconciliation/NewReconciliation.tsx:15-22, :43-55
  - Data source today: hardcoded list; pools from loaded findings
- **Finance** — *changed*. The period selector changes to MTD / QTD / YTD. The code offers 1D / 7D / 30D / 90D / YTD / 1Y / All, and its FinanceSpan type has no mtd or qtd value, so MTD and QTD have no data source.
  - Design: `v3/page-recon-finance.jsx:59, :64`
  - Code today: src/pages/Finance/utils/financeSpans.ts:3-15; src/types/finance.ts:1
  - Data source today: finance.firm topic (span param: 1d|7d|30d|90d|ytd|1y|all)
- **Finance** — *removed*. The fee waterfall loses its 'Total firm revenue' row. The design shows only the three source rows (performance, management, txn spread). The code appends a total row with its previous-period comparison.
  - Design: `v3/page-recon-finance.jsx:71`
  - Code today: src/pages/Finance/components/FeeWaterfall/utils/getFeeWaterfallRows.ts:25-31
  - Data source today: finance.firm (revenue_total, revenue_total_prev)
- **Finance** — *removed*. The Recent sweeps table loses client paging: the design shows a flat list with no Load more or Show less. It also drops the 'newest 100' meta, and the Fee accruals meta 'newest 20 · firm-wide' becomes 'recent fee events'.
  - Design: `v3/page-recon-finance.jsx:70, :72`
  - Code today: src/pages/Finance/components/RecentSweeps/RecentSweeps.tsx:22-43; src/pages/Finance/components/FeeAccruals/FeeAccruals.tsx:25
  - Data source today: finance.firm (fee_sweeps, fee_events_recent)
- **Finance** — *removed*. The header meta loses the stale state. The code shows 'stale since HH:MM:SS UTC: the figures may be behind' when the snapshot is stale. The design MetaLine shows only Source, Refresh, Updated and Visible to.
  - Design: `v3/page-recon-finance.jsx:65`
  - Code today: src/pages/Finance/components/FinanceHeader/FinanceHeader.tsx:64-71
  - Data source today: finance.firm (stale_since)
- **Finance** — *changed*. The Sweep to treasury modal changes. The design lists only active revenue accounts, with the balance in each option label. The code lists every account, shows the balance as a hint below the dropdown ('unknown, the venue probe failed' when the balance is missing) and validates 'More than the account holds'. The design has no over-balance check.
  - Design: `v3/page-recon-finance.jsx:75-78`
  - Code today: src/pages/Finance/components/SweepToTreasury/SweepToTreasury.tsx:55-90
  - Data source today: finance.firm (revenue_accounts); command sweep.treasury (COMMANDS_READY false)

**Unchanged:** The parts below are the same in the design and the code. Reconciliation: header subtitle, Export breaks, + New reconciliation; KPI row (Open breaks with the severity and copies breakdown, Net diff, Last full recon, SLA compliance 'not tracked yet'); reconciler cards that filter Recent runs on click; Open breaks columns (BREAK ID, RECONCILER, PROBLEM, VENUE+pool, ASSET, EXPECTED, ACTUAL, DIFF, DIFF %, AGE, LAST SEEN, SEVERITY, COPIES, Investigate), grouped by problem; Recent runs columns (STARTED, RECONCILER, RUN, DURATION, STATUS, FINDINGS, ERROR); New reconciliation modal with reconciler and pool pickers; force and resolve need admin; phase-2 commands are disabled. Finance: 'Firm P&L' title and subtitle, Export, Sweep to treasury, the meta line; KPIs (Firm balance vs previous span, Perf, Mgmt and Txn spread YTD); Revenue accounts columns (VENUE, ACCOUNT, BALANCE, STATUS, PENDING SWEEPS, IN <span> with the perf/mgmt/spread split, LAST SWEEP); Fee accruals columns (TIME, TYPE, STRATEGY, POOL, AMOUNT); Fee waterfall (SOURCE, SHARE bar, AMOUNT, VS PREV); Recent sweeps columns (TIME, TYPE, AMOUNT, FROM → TO, STATUS); Sweep modal with account, an optional amount (empty sweeps the whole balance) and a TOTP code.
