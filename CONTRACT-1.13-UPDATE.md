# pms-backend contract 1.11.0 -> 1.13.0: what pm-system needs

For the frontend team. You last received contract **1.11.0**. This note covers everything from 1.11.0 to 1.13.0.

- **1.12.0 is already live** (pms-backend v0.1.13). It adds the exit for a rejected organization: two officer commands and one org field. pm-system does not use any of it yet, and nothing in pm-system breaks on it.
- **1.13.0 ships next.** It is the investor level of design v3: access state, wallet, P&L 30d/ITD, net deposited, allocation and the KYC status on every investor; a per-investor activity feed; two new topics (`investors.activity`, and `org.investors.{id}` for firm users only); wallets with no user listed as investors.
- **Before 1.13.0 reaches your host**, map `sub: "kyc"` on the Overview attention line, add `draft` to the "Waiting on client" filter, and widen two enums in your types (§2). On **prod** the release order is backend-fastapi, then **your pm-system release**, then pms-backend 1.13.0: pms-backend waits for your release. On **test**, pms-backend 1.13.0 goes out right after backend-fastapi without waiting (owner decision, 2026-11-06), so until your release reaches test the Overview "KYC to review" link there does not open.
- **Show `—` when a field is null.** Never compute a money figure in the browser.
- **The authority** is pms-backend's generated `contracts/asyncapi.yaml` and `contracts/ts/pms-contracts.d.ts` at the 1.13.0 release. This note summarises them. If the two disagree, the generated files win. The design work list stays in [V3-UPDATE.md](V3-UPDATE.md); this note does not repeat it.

Source: PB:contracts/VERSION:1 (1.13.0), PB13:contracts/VERSION:1 (1.12.0); PB:contracts/README.md:3-21, :34-65; BF:docs/design/owner-decisions.md row 300 (file line 309: "BF → PB reset → FE → PB"); PB:docs/superpowers/plans/2026-11-05-m12-investor-level.md:611-620.

**How to read the references.** Each one is `repo:path:line`.

| Prefix | What it is |
|---|---|
| `PB` | pms-backend `origin/m12/impl` @ `d0ba04e` (1.13.0, including the review fixes) |
| `PB13` | pms-backend tag `v0.1.13` (1.12.0) |
| `FM` | frontend-mono `origin/main` @ `dcae7e85`. Paths start at `apps/pm-system/src/` unless they start with `apps/`. |
| `BF` | backend-fastapi `origin/m12/impl` @ `2144d76` |
| `BFm` | backend-fastapi `origin/master` @ `d1c94f7` |
| `V3` | [V3-UPDATE.md](V3-UPDATE.md) in this repo |

Shorthand inside PB:

| Short | Full path |
|---|---|
| `t/investors.py` | `pms_backend/contracts/topics/investors.py` |
| `t/kyc.py`, `t/overview.py` | the same folder |
| `c/kyc.py` | `pms_backend/contracts/commands/kyc.py` |
| `p/…` | `pms_backend/projections/…` |
| `guide` | `docs/frontend-guide.md` |
| `plan` | `docs/superpowers/plans/2026-11-05-m12-investor-level.md` |
| `fx/…` | `pms_backend/mock/fixtures/…` |

---

## 1b. Contract 1.12.0 (live now): the rejected-organization exit

**What it is.** A `rejected` organization can be given a withdraw-only exit. While the exit is open, the users whose wallets the reject removed can withdraw their balance. Each withdrawal waits in the ordinary approvals queue as PENDING_APPROVAL, with no exit marker on it. Deposits and invests stay refused. Opening an exit moves no money: it only writes a state. Each payout is the client's own withdrawal.

**Where it fits.** On the org profile of a `rejected` organization: an "Open exit" action, and a "Close exit" action while `exit_open` is true.

### The two commands

Both commands have the same rules:
- scope `kyc.approve`, firm staff only;
- a TOTP on every call, sent in the command frame's `totp`. A malformed TOTP is `bad_request`, not `invalid_totp`;
- `reason_code` is a private argument. It is stored nowhere in the PMS and never served back;
- there is no note field.

| Command | Args | `reason_code` values | When to offer it |
|---|---|---|---|
| `kyc.org.exit_open` | `{organization_id, reason_code}` | `client_request`, `review_cleared` | on a `rejected` organization only |
| `kyc.org.exit_close` | `{organization_id, reason_code, max_cancel?}` | `suspicious_activity`, `legal_hold`, `sanctions_hit`, `other_compliance`, `error_corrected` | while `exit_open` is true, on a `rejected` or `frozen` organization |

**The confirm step.**
- **Open.** Show the cascade preview's `reject.users_with_balance` and `reject.allocations` (who could withdraw), the reason select and the TOTP. Do not show the organization's reject code as a reason to open.
- **Close.** Show the preview's new `exit_close` block (what the close would cancel). Send it back as `max_cancel`:
  - `withdrawals` = `withdrawals_created + withdrawals_pending_approval + withdrawals_approved`;
  - `strategy_changes` = `strategy_changes`.

  Each is an int from 0 to 2^31-1. `max_cancel` is optional, but send it.

**The result** is the same for both commands:

```
{organization_id, organization_ref: "ORG-NNNN", status, exit_open,
 users?, users_with_balance?, cancelled?: {withdrawals_rejected, withdrawals_failed, strategy_changes, in_flight} | null}
```

- On an open, `cancelled` is `null`.
- **The null-counts rule.** `users`, `users_with_balance` and `cancelled` all `null` means the action **did apply**, but backend-fastapi's answer could not be read. Re-read the organization. Never repeat the action because of it. In that case `exit_open` is the command's own value: `true` after an open, `false` after a close.

**Refusals, and what to show.**

| Error | `details` | Meaning, and what to show |
|---|---|---|
| `upstream_rejected` | `{upstream_status_code: 409, reason: "already_open"}` | The exit is already open. Re-read the org. |
| `upstream_rejected` | `reason: "not_open"`, `current?` | There is no open exit to close. Re-read the org. |
| `upstream_rejected` | `reason: "not_rejected"`, `current?` | The organization is not `rejected` (show `current`): unfreeze it first, or the reject has not landed yet. |
| `upstream_rejected` | `reason: "exit_sanctions_hit"` | The organization was rejected on a sanctions hit. This is terminal: never offer the open again for it. |
| `upstream_rejected` | `reason: "exit_disabled"` | The backend switch for exits is off on this host. Say "Exits are switched off on this server". |
| `conflict` | `reason: "cascade_grew"` (close only) | More would be cancelled than the officer confirmed. Fetch the preview again and re-confirm. |
| `forbidden` | — | "You cannot act on an organization that holds your own address". Every wallet of the organization counts, removed ones included. |
| `conflict` | — | "The server is busy; retry" (the backend answered `kyc_busy`). |
| `not_found` | — | Unknown organization. |
| `upstream_unavailable` | `outcome: "unknown"` | The outcome is unknown. Re-read the org before you offer a retry. |

pms-backend does not pre-check the organization's status. A stale screen still sends the command, and the backend decides.

### The additive fields

- **`OrgRow.exit_open?: boolean | null`.** It is on `orgs.list`, `OrgDetail` and the `org.{id}` events. It is the stored state: it stays true while an officer's open stands, even while the backend switch is off. It is `null` until the backend serves it.
- **The cascade preview's `exit_close?: KycCascadeCounts | null`.** It is `null` unless the exit is open.
- **Two new `org.{id}` activity types**, `org.exit_opened` and `org.exit_closed`. They arrive as ordinary activity items. pm-system's activity text prints `event_type` raw, so they already show (FM:pages/Investors/components/OrganizationProfile/utils/getActivityText.ts:30-31).
- **Clients see none of this.**

**The switch.** The backend's exit switch (`KYC_REJECTED_EXIT`) was left off on test and prod at deploy. Until it is turned on, an open answers `exit_disabled`. Its current value on each host is not recorded in these repos (unverified).

**Does pm-system have it? No.**
- A grep for `exit_open`, `exit_close` and `exit_opened` over `apps/pm-system` finds nothing.
- `OrgRow` has no `exit_open` (FM:types/kyc/orgsList.ts:18-35).
- `KycCascadePreview` has no `exit_close` (FM:types/kyc/controls.ts:93-105).

1.12.0 widened no published enum, so this is new work only. Nothing in pm-system breaks on it.

**Optional: stop one user's exit.** Send `kyc.wallet.freeze` on that user's removed wallet while the organization is `rejected`. The backend accepts it, and the unfreeze returns the wallet to `removed`. So do not hide Freeze for a removed wallet of a rejected organization.

Source: PB:contracts/README.md:53-65; PB:guide:2543-2593; PB:c/kyc.py:266-272 (args), :544-546 (`exit_close`), :548-562 (result), :1348-1361 (scope, TOTP); PB:t/kyc.py:467-483 (reasons), :582-585 (`OrgRow.exit_open`), :984-994 (`KycMaxCancel`), :997-1010 (`KycCascadeCounts`); PB:pms_backend/ws/handlers/kyc_controls.py:84-95, :348-417 (refusals, null counts); PB:guide:1641-1644 (TOTP form); BFm:docs/design/owner-decisions.md:294, :506 (the switch off at deploy).

---

## 2. Do this before pms-backend 1.13.0 reaches your host

On prod, your release has to go out between backend-fastapi's M12 deploy and pms-backend 1.13.0. On test, pms-backend 1.13.0 is already deployed before your release (owner decision, 2026-11-06).

### Must fix

1. **Map `sub: "kyc"` on the Overview attention line.**
   - **What changes.** The "KYC to review" row now links `{page: "investors", sub: "kyc"}`. In 1.12.0 it linked `sub: "list"`.
   - **Why it breaks.** `SUB_PATH` is `{list: '', approvals: '/approvals', admin: '/users'}`, so the line navigates to `/investorsundefined`. No route matches that path. What the screen then shows is unverified.
   - **The fix.**
     - Add `kyc: '/kyc'` to `SUB_PATH`. That gives `/investors/kyc`, the KYC review route.
     - Widen `link.sub` to `'list' | 'approvals' | 'admin' | 'kyc' | null`.
     - Fall back to `''` for an unknown member, so a later widening cannot build `/<page>undefined` again.
   - Source: PB:p/attention.py:119-120 (PB13:p/attention.py:119 had `list`); PB:t/overview.py:427-435; FM:pages/Overview/components/AttentionWidget/AttentionLine/AttentionLine.tsx:15, :24; FM:types/overview.ts:313; FM:pages/Investors/routes.tsx:23.
2. **Add `draft` to the "Waiting on client" filter.**
   - **What changes.** `counts.waiting_on_client` (on `orgs.list`, and `organizations.waiting_on_client` on `overview.metrics`) is now `draft + info_requested`. Empty drafts are counted too.
   - **The fix.** The filter tests `kyc_status === 'info_requested'`. Make it `draft` or `info_requested`.
   - **The rows can still be short.** `orgs.list` hides empty drafts unless you subscribe with `include_empty_drafts: true` ("Show empty drafts"). Say so in the tile's tooltip, or subscribe with drafts for that filter.
   - Source: PB:p/kyc.py:2267, :2277; PB:t/kyc.py:26-27, :593, :606; PB:p/overview.py:981-988; FM:pages/Investors/components/Organizations/utils/orgFilters.ts:24-28.
3. **Tolerate the two widened enums.**
   - `InvestorRemovedReason` gains `user_linked` and `wallet_removed`, and `investor.removed` gains `replaced_by?: number | null`. Your type is `'out_of_scope' | 'no_balance'`.
   - `OverviewAttentionSub` gains `kyc` (item 1).
   - The reducers already ignore `reason`, so this is a type change only.
   - Source: PB:t/investors.py:175-183, :416-419; FM:types/investors.ts:53; FM:shared/topics/investors/investorsListTopic.ts:35-38.
4. **Keep the whole-row upsert on `investors.list`.** A stamped row event can now arrive as two frames (§6.1). Your reducer replaces the whole row by `id` and applies frames in seq order, so it ends on the full row. Do not switch to a field-by-field merge that keeps a known value when the new one is null: the first frame carries the KYC fields as `null` on purpose. Each frame has its own `seq`, so your `seq <= last` drop keeps both.
   - Source: PB:p/investors.py:2138-2176; FM:shared/topics/investors/investorsListTopic.ts:10-16, :29-33; FM:shared/services/pmsSocket/subscriptions.ts:153-159.

### Should fix in the same release (things that break or mislead once 1.13.0 is live)

5. **The intent form offers no strategy for a zero-balance investor.**
   - A firm list now includes KYC investors with no balance, and their `strategy_ids` is `[]`.
   - `useIntentFormOptions` offers `investor.strategy_ids` whenever it finds the address. So a first deposit for such an investor has no strategy to pick.
   - Fix: when `strategy_ids` is empty, offer every strategy.
   - User-less wallet rows (`user_id: null`) also appear in the investor picker. Whether backend-fastapi accepts an intent for one is unverified. Consider leaving them out.
   - Source: FM:pages/FundFlow/components/DepositsWithdrawals/hooks/useIntentFormOptions.ts:28-30, :32-39, :41-50; PB:p/investors.py:2521-2524, :2063-2087.
6. **A wallet investor shows a meaningless number** such as `#2147483649`. Show the served `ref` (§5). Fix the investor header and the org Record card.
   - Source: FM:pages/InvestorDetails/components/InvestorDetailsHeader/InvestorDetailsHeader.tsx:45-47; FM:pages/Investors/components/OrganizationProfile/components/RecordCard/RecordCard.tsx:43.
7. **The page of a retired id goes stale.**
   - `investor.{id}` ignores the new `investor.replaced`. The next re-subscribe then answers `not_found`, and the page shows "Couldn't load" above the old data.
   - Fix: handle `investor.replaced` and navigate to `/investors/<replaced_by>` with `replace: true` (§6.2).
   - Source: FM:shared/topics/investors/investorTopic.ts:82-83; FM:pages/InvestorDetails/hooks/useInvestorDetails.ts:26-35; PB:t/investors.py:834-839.
8. **Page `investors.list` past 500 rows.**
   - A firm list can now exceed 500 rows, because it includes zero-balance investors and wallets.
   - Today every consumer reads page 1 only: the org Record card, the withdrawal address lookup and the intent form. Wallet ids sort after every user id, so they fall off first.
   - Fix: page with `next_cursor`, or subscribe with `organization_id` where the org is known.
   - **Live events are not filtered by these params.** With `organization_id` (or `access`), drop any added or updated row whose `organization_id` (or `access`) does not match the subscription. Also drop a row whose org changes away: a re-parent arrives on `investors.list` as `investor.updated` with the new `organization_id`. Your reducer today upserts every `investor.added` / `investor.updated` it receives, so without this check the withdrawal lookup and the intent picker would offer investors of another organization.
   - Source: PB:p/investors.py:2647-2650; PB:t/investors.py:284-287 (params "shape the snapshot only"); PB:p/investors.py:2593-2608 (`_filtered`, used by `snapshot` only), :2138-2176 (row frames, no param filter); FM:shared/topics/investors/investorsListTopic.ts:29-33; FM:pages/Investors/components/OrganizationProfile/hooks/useOrgInvestors.ts:6-12; FM:pages/FundFlow/components/DepositsWithdrawals/components/WithdrawalModal/hooks/useWithdrawableBalance.ts:12-21.

### Safe as is (no action)

- New optional fields and unknown event types pass through: there is no runtime decoder, and every reducer ends in `default: return state`.
- Ids above 2^31 are safe JS integers, and `/investors/2147483649` matches the route.
- `KycGatingMode` already has `invalid`, and `GATING_TAGS.invalid` exists.

Source: FM:shared/services/pmsSocket/pmsSocket.ts:86-91; FM:pages/InvestorDetails/hooks/useInvestorDetails.ts:21-22; FM:types/overview.ts:140; FM:pages/Overview/components/InvestorsWidget/utils/gatingTag.ts:11-21.

---

## 3. Data for the new screens, now

This table replaces the "Arrives with M12" column of V3's "Data for the new screens" (V3:111-128).

All money values are **decimal strings** (`"1250000.00"`), never JSON numbers. `pct` is a JSON number from 0 to 100. Times are ISO 8601 UTC with `Z`.

**"Firm only"** means the caller holds `"*"` on both strategies and pools. A narrowed caller gets `null` for those fields. **Show `—`** for every null value, and **no tag** for a null access state or KYC status. Never compute P&L, net deposited or allocation in the browser.

| v3 element (V3 line) | Topic | Field(s) | Notes |
|---|---|---|---|
| Investor id and INV ref (V3:117) | `investors.list` row; `investor.{id}` profile | `id`, `ref`, `user_id` | Key by `id`, display `ref` (`INV-7` or `W-1101`). `user_id` is null for a wallet. See §5. |
| Address, organization link (V3:117) | same | `address`, `organization_id`, `organization_ref` | Unchanged. For a removed investor the org falls back to its wallet's org. |
| Wallet: primary tag, W-ref, source, status (V3:119) | list row; profile | `wallet {id, ref, organization_id, organization_ref, status, source, is_primary, frozen_by, chain_family}` | Firm only. `source` gives "Added via": `main_app_connect`, `linked_by_ops`, `quarantined_deposit`. |
| Org KYC tag (V3:119) | list row; profile | `organization_kyc_status` | Firm only. Reuse the KYC status tags. |
| Access tag (V3:120) | list row: `access` (a string); profile: `access.state` (a block) | `trading`, `view_only`, `frozen`, `removed` | Firm only. `null` also means "not served yet". See §5. |
| View only / Frozen banners; button gating (V3:71-72) | profile | `access {state, code, gating_mode, enforced, exit_open}`, `wallet.frozen_by` | Show the code's sentence (§5 lists all ten), never a reason text. Gate the buttons with the table in §5 ("Button gating"): `null` access, `enforced: false` and `removed` with `exit_open: true` each have a rule. |
| Balance, withdrawable, locked (V3:118) | list row | `balance`, `withdrawable`, `blocked`, `locked_breakdown` | Unchanged. |
| Allocation bar on the row (V3:118) | list row | `allocation [{strategy_id, strategy_name, balance, pct}]` | `[]` for a zero balance. On a narrowed list it covers the caller's strategies only. |
| P&L 30d, P&L ITD, net deposited (V3:121) | list row | `pnl_30d`, `pnl_itd`, `net_deposited` | See "Money definitions" below the table. |
| Balance strip: P&L 30d, Net deposited (V3:75-76) | profile `summary` | `summary.pnl_30d`, `summary.net_inflow` | Show Net deposited from `summary.net_inflow`. It is `deposits_total - withdrawals_total` over the same slice as the list row's `net_deposited`; both come from `slice_totals`, so they are equal. No list subscription is needed (`investors.list` has no id param). |
| Fees paid ITD (V3:81) | profile `fees` | `itd_management_fee`, `itd_performance_fee`, `itd_total` | Magnitudes, like the YTD fees. |
| Last activity column (V3:37) | list row | `last_event_at`, `last_event_kind` | Covers the items the caller may see. Always null in the `org.investors.{id}` snapshot, though that topic's live `investor.added` / `investor.updated` rows do carry it. On the org page, take LAST ACTIVITY from `investors.list` subscribed with `organization_id` (its snapshot fills `last_event_*` for the page), or hide the column. An unknown stored kind is sent as null. |
| Investors sub-tab KPIs (V3:36) | `investors.list` snapshot `totals` | `investor_count`, `balance`, `withdrawable`, `pnl_30d`, `by_access {trading, view_only, frozen, removed}`, `organization_count` | `by_access` and `organization_count` are firm only. The totals change only on a new snapshot: `investors.totals.updated` is never sent. Here `investor_count` is the row count, removed and null-access rows included. |
| Investors sub-tab count badge (V3:147, :350) | `investors.list` snapshot `totals` | firm: `investor_count − by_access.removed`; narrowed: `investor_count` (`by_access` is null) | A count, not money. `nav.badges` carries no investor count. **The two `investor_count`s differ:** on `investors.list` it counts every row; on `org.investors.{id}` it counts the rows that are not `removed`. Show the list's figure on the Investors sub-tab KPI and the org's figure on the org Investors tab; do not reuse one value for both. |
| "All investors" table with an access filter (V3:37) | `investors.list` params | `access: [...]` | Send `access` for a firm user only. A firm `access` filter drops rows whose access is null. **There is no server sort:** rows page by id ascending (500 a page, wallet ids after every user id), so page 1 is not the top balances. To sort by balance, load every page through `next_cursor`, or sort only within the loaded page and say so in the UI. |
| "Latest activity" with a group filter (V3:38) | `investors.activity` | params `group`, `limit`; snapshot `items[]` | New topic, §4.3. Filter live events on the client. |
| Org Investors tab KPIs and allocation (V3:43) | `org.investors.{id}` `totals` | `investor_count`, `by_access`, `balance`, `withdrawable`, `locked`, `pnl_30d`, `pnl_itd`, `net_deposited`, `allocation[]` | Firm only (narrowed: `out_of_scope`). Firm-wide money. |
| Org investor table (V3:43) | `org.investors.{id}` `investors[]` | the list row | A removed investor **with a user** stays listed with `access: "removed"`. A removed user-less wallet leaves the lists instead (§5, "Removed"). |
| Org Overview "Investors" card, gating (V3:44) | `org.investors.{id}` `totals` | `balance`, `pnl_30d`, `by_access`, `gating_mode` | `gating_mode` can be `invalid` (§5). It is the effective mode only: show "Gating · shadow", not "global mode · shadow" (see "Still not served"). |
| Org "Investor activity", filterable by investor (V3:46) | `investors.activity` | params `organization_id`, `investor_id` | |
| Investor header (V3:69) | profile | `ref`, `access.state`, `wallet {is_primary, status, source}`, `organization_kyc_status` | |
| Investor Overview "Recent activity" (V3:79) | `investor.{id}` `feed` block | params `feed {limit, group}` | `feed.items` is newest first. The feed, not `activity`, drives this card. |
| "Other investors of this org" (V3:79) | `org.investors.{id}` rows | | Firm only. A narrowed user can use `investors.list` with `organization_id`. |
| Wallet card: address, chain, added via, status (V3:80) | profile | `wallet`, `linked_wallets [{ref, chain_family, address, status, frozen_by}]`, `last_sign_in_at` | Firm only. Tron wallets appear in `linked_wallets`, never as investors. `last_sign_in_at: null` means no sign-in recorded since backend-fastapi's M12 deploy, not "never" (§8, "Right after deploy"). |
| Activity tab: group filter, new kinds and statuses (V3:84-86) | `investor.{id}` `feed` | `feed.group`; `kind`; `status` (adds `BLOCKED`, `HELD`) | **The v3 Activity tab and Recent activity read `feed`.** The old `activity` (ops) block is unchanged and stays only for op-level detail. A feed item lacks the op fields `tx_hash` (today's ref tooltip), `network_fee`, `network_fee_currency`, `stage`, `roundtrip_id`, `fund_intent_id`, `exchange_tx_id` and `intent_status`. To change the group, fetch the snapshot with `feed: {group, limit}` (`fetchTopicSnapshot`, as `useInvestorDetails` already pages `activity`), and filter live feed events by `item.group` on the client. |
| Wallets with no user yet (V3:122) | firm `investors.list`, `org.investors.{id}` | `id` from 2^31+1, `user_id: null`, `ref: "W-…"` | Always `view_only` (code `kyc_no_user`, or the freeze code if frozen); zero money. |
| "Waiting on client" count (V3:127) | `orgs.list` `counts.waiting_on_client`; `overview.metrics` | | `draft + info_requested`, empty drafts included (§2 item 2). |
| Overview "KYC cases to review" (V3:128) | `overview.attention` | `link {page: "investors", sub: "kyc"}` | §2 item 1. |

**Money definitions.**
- `pnl_30d` and `pnl_itd` are the signed sum of settled P&L ops, gross of fees.
- `pnl_30d`'s window starts at today's UTC midnight minus 30 days, so it moves at 00:00 UTC.
- `net_deposited` = deposits − withdrawals. Reallocations are excluded. The profile's `summary.net_inflow` is the same figure.
- **On a narrowed list or profile, every money field** (balance, P&L 30d/ITD, net deposited, allocation) covers the caller's strategies only, not the investor's whole figure. `org.investors.{id}` totals are firm-wide.

**Still not served:**
- the Frozen and Waiting-on-client banner reasons;
- the org People details;
- the investor ref in Fund flow (`FundflowUserRef` carries only `address` and `display_name`);
- the intent modal's link to Quarantine. A `DEPOSIT_HELD` feed item does carry the `Q-` ref;
- a total count for `feed` or `investors.activity`: each has only `items` and `next_cursor`. For "All N →", the Activity tab badge and "Investor activity · N", show the link without N, or show the loaded count with a "+" while `next_cursor` is set;
- whether an organization's gating mode is the global one or an override: neither `org.investors.{id}` `totals.gating_mode` nor `OrgRow` says so. Show just the mode, e.g. "Gating · shadow". (An `admin.settings` holder sees an override as a `kyc_gating_mode:org:<id>` row; the mock fixture has one, and that the real server lists it is unverified.)

See §8.

Source: PB:t/investors.py:305-321 (totals), :324-335 (wallet), :338-358 (linked wallets, access block), :361-405 (row), :445-465 (profile), :481 (`summary.pnl_30d`), :616-619 (`fees.itd_*`), :710-730 (feed block), :874-897 (org topic); PB:p/investors.py:2104-2109, :2116-2131, :2525-2526, :2593-2608, :2677-2687, :3324-3338 (redaction, filters, totals); PB:p/org_investors.py:82-132, :148-166; PB:plan:114, :133-136 (rulings 3, 9, 10); PB:pms_backend/contracts/topics/fundflow.py:239-245; BF:backend/services/kyc/access.py:181-200. Net deposited: PB:p/investors.py:1410-1436 (`slice_totals`, "the one sum behind `investors.list` rows, the detail summary"), :3090 (`net_inflow`), :2453 and :3437 (row and profile both call `slice_totals` over the caller's slice); PB:t/investors.py:284-291 (no id param), :477. Narrowed money: PB:p/investors.py:2431-2479 (`_investor_row` docstring). Counts: PB:p/investors.py:2688, :2673-2684; PB:p/org_investors.py:120; PB:t/investors.py:710-714, :859-863 (no feed total). Last activity: PB:p/investors.py:2526, :2654, :2307, :2372-2381; PB:p/org_investors.py:92. Sort: PB:p/investors.py:2648-2650. Feed vs ops: PB:t/investors.py:622-643, :667-707; FM:pages/InvestorDetails/components/InvestorActivity/columns.tsx:94; FM:pages/InvestorDetails/hooks/useInvestorDetails.ts:61-65. Gating source: PB:p/org_investors.py:98-131, :145; PB:t/kyc.py:563-586 (OrgRow has no gating field); PB:fx/admin.settings.json:142. Sign-in: PB:p/investors.py:3136-3146.

---

## 4. Per topic

### Rules for every new investor topic

- **Scope.** Every investor topic needs the scope `investors`. Without it the subscribe answers `forbidden` "`<topic>` requires scope investors".
- **Firm vs narrowed.** A firm user holds `"*"` on both strategies and pools; anyone else is narrowed.
- **Durable.** `investors.list`, `investor.{id}`, `investors.activity` and `org.investors.{id}` all have a `seq`, and replay with `since` works. Your client already resends `since` on a re-subscribe.
- **Params shape the snapshot only.** Every event reaches every subscriber in scope, whatever its params, so filter events on the client.
- **Params refuse extra keys** with `bad_request`.
- **`ccy`.** Only `"USD"` is served. `USDC` and `BTC` answer `not_implemented`.
- **Cursors** are opaque strings. Send them back verbatim. A cursor the server did not mint answers `bad_request` "invalid cursor".
- **Snapshots** carry `stale_since?`.

Source: PB:pms_backend/ws/server.py:1076-1104; PB:pms_backend/authz/effective.py:78-84; PB:t/investors.py:845-848, :901-986; PB:pms_backend/ws/providers/common.py:46-60, :119-132; PB:contracts/asyncapi.yaml:21796; PB:pms_backend/contracts/common.py:198-205.

### 4.1 `investors.list` (changed)

**Params**

| Param | Type | Default | Notes |
|---|---|---|---|
| `ccy` | `"USD"` | `"USD"` | |
| `limit` | int 1..500 | 500 | |
| `cursor` | string \| null | null | pages by id |
| `access` (new) | `InvestorAccess[]` \| null | null | firm only. Narrowed users get `out_of_scope` "the access filter is firm-only", even for `[]`. |
| `organization_id` (new) | int 1..2^63-1 \| null | null | Larger is `bad_request`. The TS types do not carry this bound. |

`access` and `organization_id` narrow both the rows and the totals.

**Snapshot:** `{as_of, ccy, totals, investors: InvestorRow[], next_cursor?, stale_since?}`
- Rows come by id ascending: users first, then wallets. There is no sort param: a table sorted by balance must load every page (§3).
- `next_cursor` is set while more rows exist.
- `totals` sum the whole filtered set, not the page.
- **A firm list** holds every non-hidden investor (zero balance included) plus every listed user-less EVM wallet.
- **A narrowed list** holds the investors with a live balance in the caller's strategies, as before.

**New row fields:** `ref`, `user_id`, `wallet`, `organization_kyc_status`, `access`, `allocation`, `pnl_30d`, `pnl_itd`, `net_deposited`, `last_event_at`, `last_event_kind`. All are optional and nullable. The older fields are unchanged.

**Totals:**
- `pnl_30d`, `pnl_itd` and `net_deposited` are always set.
- `by_access` and `organization_count` are firm only.
- `investor_count` is the row count. It equals the sum of `by_access` only when every row has an access: rows with `access: null` are counted in no state.

**Events:**
- **`investor.added` / `investor.updated`** carry an `InvestorRow`, possibly as two frames (§6.1). `investor.added` is now also sent for:
  - a fresh zero-balance KYC investor;
  - a newly listed wallet;
  - the user row after a retirement;
  - a re-add after a slice exit.
- **`investor.removed`**: `{id, reason, replaced_by?}`. `replaced_by` is set on `user_linked`. A strategy investor's removal can arrive once per strategy it held, with identical payloads, so apply it idempotently.
- **`investors.totals.updated`** is declared but **never sent**. Re-read the totals from a new snapshot.

**Refusals:**
- `out_of_scope`: a narrowed user sent `access`;
- `bad_request`: an invalid cursor, an `organization_id` out of range, or an extra key;
- `not_implemented`: a non-USD `ccy`.

**Example** (mock fixture, shortened): one row, then a wallet's retirement as it arrives on the list.

```json
{"id": 7, "address": "0x8Ba1…BA72", "balance": "1250000.00", "withdrawable": "780000.00",
 "organization_id": 1, "organization_ref": "ORG-0001", "ref": "INV-7", "user_id": 7,
 "wallet": {"id": 1101, "ref": "W-1101", "organization_id": 1, "organization_ref": "ORG-0001",
            "status": "active", "source": "main_app_connect", "is_primary": true,
            "frozen_by": null, "chain_family": "evm"},
 "organization_kyc_status": "approved", "access": "trading",
 "allocation": [{"strategy_id": 1, "strategy_name": "Delta-neutral basis", "balance": "800000.00", "pct": 64.0},
                {"strategy_id": 2, "strategy_name": "Funding carry", "balance": "450000.00", "pct": 36.0}],
 "pnl_30d": "4795.40", "pnl_itd": "-1250.00", "net_deposited": "1200000.00",
 "last_event_at": "2026-09-10T07:55:00Z", "last_event_kind": "SIGN_IN"}

{"type": "investor.removed", "payload": {"id": 2147484750, "reason": "user_linked", "replaced_by": 23}}
```

Source: PB:t/investors.py:284-293, :305-321, :370-419, :901-921; PB:p/investors.py:1084-1102, :1651-1674, :2521-2524, :2593-2608, :2643-2698; PB:p/investor_set.py:362, :386, :391-412, :470-478; PB:pms_backend/ws/providers/investors.py:40-74; PB:fx/investors.list.json:20-113, :354-366.

### 4.2 `investor.{id}` (changed)

**Params:**
- `id`: from the topic name;
- `ccy`: `"USD"`;
- `activity {limit 1..500 = 100, cursor?}`: unchanged;
- **new** `feed {limit 1..200 = 50, cursor?, group: all|money|fees|access = all}`.

**Snapshot.** The changes:
- a new `feed {items: InvestorFeedItem[], next_cursor?}` block, ordered newest first (`ts DESC, id DESC`) and filtered by `group`;
- `summary.pnl_30d`;
- `fees.itd_management_fee`, `itd_performance_fee`, `itd_total`.

**Profile fields:**
- **Served to everyone:** `ref`, `user_id`, `replaced_by` (always null on a served snapshot).
- **Firm only:** `wallet`, `organization_kyc_status`, `access {state, code?, gating_mode?, enforced?, exit_open?}`, `linked_wallets[]` (`[]` when none) and `last_sign_in_at`.
- **A legacy user with no wallet** gets `access: {state: "view_only", code: "kyc_no_organization", gating_mode: <the global mode>, exit_open: false}`.

**Zero-money snapshots.** A firm user also gets a snapshot for an investor with no live balance, and for a listed wallet. A wallet's snapshot has empty `balances`, `lots`, `activity` and `pending_intents`, `user_id: null`, and its own feed.

**New events:**

| Event | Payload | Who gets it |
|---|---|---|
| `investor.feed.appended` | `InvestorFeedItem` | firm: every item; narrowed: money and fee items in their strategies, except a STRATEGY_CHANGE between two different strategies (key-less, firm only; §6.4) |
| `investor.feed.updated` | `{id, removed?: bool, item?}`: exactly one of `item` or `removed: true` | as above |
| `investor.access.updated` | `{id, access, organization_kyc_status, wallet}` | firm only |

**Applying `investor.access.updated`.** It carries the current `access`, `organization_kyc_status` and `wallet`, all three every time. Replace the three profile fields with the payload's values, nulls included: a null is the new value, not "unchanged". `access: null` means backend-fastapi does not serve the state yet; `wallet: null` means no wallet (a legacy user). Source: PB:p/investors.py:2341-2358 (all three set, dumped without `exclude_none`); PB:t/investors.py:824-831; PB:p/investor_set.py:609-631 (`access_of`: null only when the wallet row has no `investor_access`).
| `investor.replaced` | `{id, replaced_by}` | firm only; re-subscribe on `investor.<replaced_by>` |

**Other events:**
- `investor.profile.updated` also carries `ref` and `user_id`. Your shallow merge works.
- Unchanged: `investor.balance.updated`, `op.appended`, `op.updated`, `hurdle.updated`.
- Still never sent: `lots.updated`, `fee.charged`, `intent.updated`. `pending_intents` stays `[]`.

**Refusals:**
- `not_found` "investor <id> not found", one text for every case:
  - an absent or hidden investor, or a retired or removed wallet;
  - for a narrowed user, also any wallet id and any investor with nothing in their strategies;
  - an id outside the two ranges of §5.
- `bad_request`:
  - an invalid `activity.cursor` or `feed.cursor`. The cursor is checked first, so this applies even for an id you cannot see;
  - a non-canonical id, such as `investor.007`.
- `not_implemented`: a non-USD `ccy`.

**Example** (mock fixture, shortened): the profile's new part, then two events.

```json
"ref": "INV-7", "user_id": 7,
"wallet": {"id": 1101, "ref": "W-1101", "status": "active", "source": "main_app_connect", "is_primary": true, "frozen_by": null, "chain_family": "evm", "organization_id": 1, "organization_ref": "ORG-0001"},
"organization_kyc_status": "approved",
"access": {"state": "trading", "code": null, "gating_mode": "shadow", "enforced": false, "exit_open": false},
"linked_wallets": [{"ref": "W-1102", "chain_family": "tron", "address": "T9yD…YAoM", "status": "active", "frozen_by": null}],
"last_sign_in_at": "2026-09-10T07:55:00Z", "replaced_by": null

{"type": "investor.access.updated", "payload": {"id": 7, "organization_kyc_status": "frozen",
  "access": {"state": "frozen", "code": "kyc_org_frozen", "gating_mode": "shadow", "enforced": true, "exit_open": false}, "wallet": {…}}}
{"type": "investor.replaced", "payload": {"id": 2147484750, "replaced_by": 23}}
```

Source: PB:t/investors.py:425-465, :481, :616-619, :710-730, :798-839, :922-951; PB:p/investors.py:3130-3133, :3149-3180, :3187-3241, :3278-3338, :3449; PB:p/investor_set.py:605-630; PB:p/investor_feed.py:783-791, :879-926; PB:pms_backend/ws/providers/investors.py:109-110; PB:guide:1076; PB:fx/investor.{id}.json:39-77, :895-927.

### 4.3 `investors.activity` (new)

**Events:** `investor.feed.appended` and `investor.feed.updated`. Each item event goes to both `investor.<id>` and `investors.activity`.

**Params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `ccy` | `"USD"` | `"USD"` | |
| `group` | `all\|money\|fees\|access` | `all` | |
| `access` | `InvestorAccess[]` \| null | null | Firm only (narrowed users get `out_of_scope`). Matches the investor's **current** access. |
| `organization_id` | int 1..2^63-1 \| null | null | |
| `investor_id` | int 1..2^63-1 \| null | null | A wallet id is allowed. |
| `limit` | int 1..200 | 50 | |
| `cursor` | string \| null | null | |

**Snapshot:** `{as_of, ccy, items: InvestorFeedItem[], next_cursor?, stale_since?}`, newest first. Load older pages with a snapshot fetch and `cursor`, the way the investor activity already pages.

**Narrowed users** see only money and fee items in their strategies. A strategy change counts only when both its `from` and its `to` are in their strategies. They never see a wallet investor's items. **That rule is the snapshot's only.** Narrowed holders of both strategies see an `sc-` item in the snapshot (`feed`, `investors.activity`) but get no live event for it, so re-snapshot (debounced) to refresh it. Only an `sc-` item whose `from_strategy_id` is null or equals `strategy_id` is stamped and reaches narrowed holders live (§6.4).

**Live events.** Filter them yourself by `item.organization_id`, `item.investor_id` and `item.group`, to match the params you subscribed with.

**Refusals:**
- `out_of_scope`: a narrowed user sent `access`;
- `bad_request`: a cursor, an id out of range, or a `limit` out of range;
- `not_implemented`: a non-USD `ccy`.

**Example** (mock fixture, one item):

```json
{"id": "op-2214", "ts": "2026-09-10T08:03:19Z", "kind": "PNL", "group": "fees", "status": "SUCCESS",
 "amount": "95.40", "direction": "in", "asset": "USDT", "strategy_id": 1, "strategy_name": "Delta-neutral basis",
 "ref": "rt-88240", "op_id": 2214, "investor_id": 7, "investor_ref": "INV-7",
 "address": "0x8Ba1…BA72", "organization_id": 1, "organization_ref": "ORG-0001", "count": null}
```

The fixture also sets every other optional field to `null`.

Source: PB:t/investors.py:845-863, :952-967; PB:contracts/asyncapi.yaml:453-474, :21795-21851; PB:p/investor_feed.py:1066-1082, :1579-1606, :1669-1707, :1747-1788; PB:pms_backend/ws/providers/investors.py:114-136; PB:fx/investors.activity.json:17-84.

### 4.4 `org.investors.{id}` (new, firm only)

This is the source for the org profile's Investors tab and Overview card. It replaces filtering `investors.list` by `organization_id` (FM:pages/Investors/components/OrganizationProfile/hooks/useOrgInvestors.ts:6-12).

**Params:** `{id (from the topic name, ≥ 1), ccy: "USD"}`

**Snapshot:** `{as_of, ccy, organization_id, organization_ref, totals, investors: InvestorRow[], stale_since?}`
- `investors` are the firm list rows of this organization, removed-access ones included.
- **`last_event_at` and `last_event_kind` are always null in this snapshot.** Code read, not run. The mock fixture fills them, but the real server does not. The topic's live `investor.added` / `investor.updated` rows do carry them, so a column fed from this topic would fill row by row and blank again on each re-snapshot. For LAST ACTIVITY use `investors.list` with `organization_id`, or hide the column (§3).

**Totals.** All fields are required except `gating_mode`. They are firm-wide money:

| Field | Type | Notes |
|---|---|---|
| `investor_count` | int | rows whose access is not `removed` (null-access rows count). Not the same as `investors.list`'s `investor_count`, which counts every row (§3). |
| `by_access` | `{trading, view_only, frozen, removed}` | |
| `balance`, `withdrawable`, `locked` | Money | |
| `pnl_30d`, `pnl_itd`, `net_deposited` | Money | |
| `allocation` | `[{strategy_id, strategy_name, balance, pct}]` | |
| `gating_mode` | `KycGatingMode \| null` | the organization's effective mode, `invalid` included |

**Events.** All are firm only, one frame each.
- **`investor.added` / `investor.updated`.** Sent when an investor joins (a fresh KYC user, a listed wallet, a retirement's user row, a restore) and when an investor's access moves.
- **`investor.removed`.** The investor left this organization:
  - `user_linked` or `wallet_removed`;
  - a sweep's `out_of_scope` or `no_balance`;
  - **a wallet re-parented to another organization**: `investor.removed {reason: "out_of_scope"}` on the old org's page, then `investor.added` on the new one, with no new enum value. Kos confirmed this at the M12 owner gate (2026-11-06).
- **`org.investors.totals.updated`.** The whole totals block, idempotent. It is also re-sent at the 00:00 UTC P&L boundary.
- **A money move sends no row event here**, only the totals event. The rows' money goes stale until a new snapshot. Re-snapshot (debounced) on `org.investors.totals.updated`, or overlay `investors.list` row events by `id`. Code read; not confirmed by a run.

**Refusals:**
- `out_of_scope` "`org.investors.<id>` is outside your resource scope" for a narrowed user. Hide the tab for narrowed roles.
- `not_found` "organization <id> not found".
- `bad_request`: `id` < 1, or an extra key.
- `not_implemented`: a non-USD `ccy`.

**Example** (mock fixture, totals):

```json
{"investor_count": 1, "by_access": {"trading": 1, "view_only": 0, "frozen": 0, "removed": 0},
 "balance": "1250000.00", "withdrawable": "780000.00", "locked": "370000.00",
 "pnl_30d": "4795.40", "pnl_itd": "-1250.00", "net_deposited": "1200000.00",
 "allocation": [{"strategy_id": 1, "strategy_name": "Delta-neutral basis", "balance": "800000.00", "pct": 64.0}, …],
 "gating_mode": "shadow"}
```

Source: PB:t/investors.py:869-898, :968-986; PB:p/org_investors.py:39-40, :82-132, :148-204; PB:p/investors.py:1104-1112, :1233-1244, :2358-2381, :2525-2526; PB:p/investor_set.py:340-349, :481-505; PB:pms_backend/ingest/pollers_ledger.py:1553-1566; PB:pms_backend/ws/server.py:1097-1104, :1698-1722; PB:pms_backend/ws/providers/investors.py:151-152; PB:fx/org.investors.{id}.json:11-45; PB commit 3fca999; PB@7bab0c8:docs/design/owner-decisions.md:494 (K148 "item 6: A, `out_of_scope` on the old page, no widening", confirmed); PB:p/investors.py:2307, :2372-2381 (live org rows carry `last_event_*`).

### 4.5 `overview.attention` (one link changed)

- The topic, the `attention.updated` full replace and the 6-row cap are unchanged.
- The `flag` row ("KYC to review") now links `{page: "investors", sub: "kyc"}` instead of `sub: "list"`.
- The row is shown only to `kyc.approve` holders who are firm users.
- Map it before 1.13.0 (§2 item 1).

Source: PB:t/overview.py:427-435, :462-470, :526-534; PB:p/attention.py:75, :79, :119-120; PB13:p/attention.py:119.

### 4.6 `orgs.list` (shape unchanged; one count changed)

- `counts.waiting_on_client` = `draft + info_requested`, with empty drafts counted. In 1.12.0 it counted `info_requested` only.
- The same rule applies to `overview.metrics` → `organizations.waiting_on_client`.
- `OrgRow.exit_open` is the 1.12.0 field (§1b).
- **One more `overview.metrics` change.** For a firm user, `investors.total_investors` now counts zero-balance KYC investors and listed wallets, because it is the list's own row set. No money figure moves.

Source: PB:p/kyc.py:2267, :2277; PB13:p/kyc.py:2185; PB:t/kyc.py:26-27, :593, :606; PB:p/overview.py:689, :981-988; PB:p/investors.py:2719-2737; PB:plan:116.

---

## 5. Enums and ids

### Every value

| Enum | Values | Notes |
|---|---|---|
| `InvestorAccess` (new) | `trading`, `view_only`, `frozen`, `removed` | |
| `InvestorRemovedReason` (widened) | `out_of_scope`, `no_balance`, `user_linked`, `wallet_removed` | |
| `OverviewAttentionSub` (widened) | `list`, `approvals`, `admin`, `kyc` | |
| `KycGatingMode` | `off`, `shadow`, `enforce_new`, `enforce`, `invalid` | |
| `InvestorFeedKind` (new) | `DEPOSIT`, `WITHDRAW`, `STRATEGY_CHANGE`, `PNL`, `MANAGEMENT_FEE`, `PERFORMANCE_FEE`, `SIGN_IN`, `WALLET_LINKED`, `DEPOSIT_HELD`, `DEPOSIT_BLOCKED`, `FROZEN`, `NETWORK_FEE`, `TXN_FEE_SPREAD`, `WALLET_TRANSFER` | The owner approved fourteen kinds (K147): show `NETWORK_FEE`, `TXN_FEE_SPREAD` and `WALLET_TRANSFER`, and the `FAILURE` status, despite V3:171 (which drops them), so the items agree with the group filter. Lenient: a later minor may add kinds. The d.ts types it as a closed union, so keep a default branch and show an unknown kind as a generic item. Do not use a strict `Record` like `KIND_TONE`. |
| `InvestorFeedGroup` (new) | `money`, `fees`, `access` | |
| `InvestorFeedGroupParam` (new) | `all`, `money`, `fees`, `access` | |
| `InvestorFeedStatus` (new) | `SUCCESS`, `PENDING`, `FAILURE`, `BLOCKED`, `HELD` | |
| feed `direction` | `in`, `out`, `move` | |
| `KycOrgStatus` | `draft`, `submitted`, `in_review`, `info_requested`, `second_approval`, `approved`, `rejected`, `frozen`, `dissolved` | |
| `KycWalletStatus` (`wallet.status`) | `pending_kyc`, `awaiting_email`, `awaiting_connect`, `review`, `cooldown`, `active`, `frozen`, `removed` | |
| `KycWalletSource` | `main_app_connect`, `linked_by_ops`, `quarantined_deposit` | |
| `KycChainFamily` | `evm`, `solana`, `bitcoin`, `tron` | |
| `KycFrozenBy` | `wallet`, `organization` | |
| `KycQuarantineReason` (DEPOSIT_HELD `reason_code`) | `sender_unverified`, `sender_not_whitelisted`, `sender_other_org_wallet`, `no_organization`, `org_not_approved`, `org_frozen`, `wallet_frozen` | |
| 1.12.0 `KycExitOpenReason` / `KycExitCloseReason` | see §1b | |

`access.code` is an open gate word matching `^kyc_[a-z_]{1,60}$`. It is null while `trading`. backend-fastapi serves a closed set of ten codes today. Suggested sentences for the View only and Frozen banners:

| `access.code` | With state | Suggested sentence |
|---|---|---|
| `kyc_no_organization` | `view_only` | No KYC organization for this investor. |
| `kyc_org_not_approved` | `view_only` | The organization's KYC is not approved yet. |
| `kyc_org_rejected` | `view_only` | The organization was rejected. |
| `kyc_org_frozen` | `frozen` (`view_only` on a user-less wallet) | The whole organization is frozen. |
| `kyc_org_dissolved` | `view_only` | The organization is dissolved. |
| `kyc_wallet_not_whitelisted` | `view_only` | The wallet is not whitelisted yet. |
| `kyc_wallet_removed` | `removed` | The wallet was removed. |
| `kyc_wallet_frozen` | `frozen` (`view_only` on a user-less wallet) | This wallet is frozen. |
| `kyc_wallet_cooldown` | `view_only` | The wallet is in its whitelist cooldown: withdrawals wait until it ends. |
| `kyc_no_user` | `view_only` | This wallet has no user yet. |

Keep the raw-code fallback for a code added later.

Source: BF:backend/services/kyc/constants.py:78-80 (`ACCESS_CODES`), :108 (`INVESTOR_ACCESS_CODES` adds `kyc_no_user`); BF:backend/services/kyc/access.py:76-101 (the matrix's codes), :112-118 (`frozen_code`), :181-200 (`investor_access`); PB:t/investors.py:175-242, :251; PB:t/overview.py:427-435; PB:t/kyc.py:135-144, :192-219, :238-266, :467-483, :510-518; PB:contracts/ts/pms-contracts.d.ts:829; FM:pages/InvestorDetails/components/InvestorActivity/columns.tsx:11-27; PB:t/investors.py:196-213 (fourteen kinds); PB@7bab0c8:docs/design/owner-decisions.md:493 (K147, confirmed); V3:171.

### The four v3 access labels

pms-backend copies the state from backend-fastapi's wallet row. The first match wins:

| Wire value | v3 label | When |
|---|---|---|
| `removed` | **Removed** | The wallet was removed (code `kyc_wallet_removed`). **Only an investor with a user shows this tag**: it stays listed. A removed user-less wallet leaves both lists (`investor.removed {reason: "wallet_removed"}`); drop it. A later `investor.added` with the same id is a restore: re-add it. |
| `view_only` | **View only** | The wallet has no user yet. This applies even when it is frozen: the code is then the freeze code, otherwise `kyc_no_user`. |
| `frozen` | **Frozen** | The wallet or the organization is frozen. `wallet.frozen_by` says which. |
| `trading` | **Trading** | The KYC matrix allows every action (`code: null`). |
| `view_only` | **View only** | Anything else, for example an org not approved yet or a wallet in cooldown. `code` says why. |
| `view_only` | **View only** | A legacy user with no wallet (`kyc_no_organization`), set by pms-backend. |
| `null` | no tag | Hidden from you (narrowed), or not served yet (backend-fastapi has not sent it). |

Two more rules:
- **`enforced: false`** means the gate does not block in the current mode. Show "View only (not enforced)".
- **Approve withdrawal.** Keep it enabled while `access.exit_open` is true. `access.exit_open` is the per-wallet exit cover, which is not the org's `OrgRow.exit_open`. The two differ while the backend switch is off.

**Button gating** (V3's header actions; a suggestion, the backend command decides in the end). The first matching row wins:

| `access` | Manual Deposit | Approve withdrawal |
|---|---|---|
| `null` (narrowed, or not served yet) | do not disable on access; leave the decision to the backend command | the same |
| `view_only` or `removed`, `enforced: false` | warn ("not enforced") without disabling: the gate does not block, so a manual deposit would go through. Disabling anyway is a product choice. | the same |
| `trading` | enabled | enabled while `withdrawable` > 0 |
| `view_only`, `enforced: true` | disabled | disabled, unless `exit_open` is true |
| `frozen` (a freeze always has `enforced: true`) | disabled | disabled |
| `removed`, `exit_open: false` | disabled | disabled |
| `removed`, `exit_open: true` | disabled | **enabled**: the common exit case, since an investor the reject removed stays `removed` |

Disable Approve withdrawal when `withdrawable` is 0, whatever the state (V3).

Source: BF:backend/services/kyc/access.py:181-208 (`access_enforced`: a freeze binds in every mode); BF:API.md:1502-1503; PB:p/investor_set.py:582, :605-630 (`access_of` null while not served); PB:p/investors.py:2103-2109 (`ROW_KYC_FIELDS` null for a narrowed holder); BF:docs/design/owner-decisions.md:314 (row 305, KB226: an exit on a removed investor "stays `removed`"); PB:p/investor_set.py:370-386 (wallet removed, restore), :539-557 (`listed_wallets`: state LISTED only); PB:plan:611-620.

### What `gating_mode: "invalid"` means

- The mode row is absent or unreadable. The backend then **enforces**: `invalid` is never `off`.
- Since the review fixes it is stored and served as `invalid`, where it used to arrive as `null`.
- Show it as your existing `INVALID` tag, with the note "no readable mode row (enforced)".
- It appears in `access.gating_mode` and `org.investors.{id}` `totals.gating_mode`.

**Mode and enforcement can disagree on a user-less wallet.** Such a wallet can read `gating_mode: "off"` with `enforced: true`: the org's mode is shown, while the global mode is what enforces. Kos confirmed this rule at the M12 owner gate (2026-11-06): `gating_mode` is the organization's effective mode, and `enforced` follows the global mode. Show both as served.

Source: PB:t/kyc.py:510-518; PB:p/kyc.py:1108-1110; PB commit 9f65385; FM:pages/Overview/components/InvestorsWidget/utils/gatingTag.ts:20, :25-27; BF:API.md:1502; BF@a22538a:docs/design/owner-decisions.md:326 (row 317, KB238: "item 3: yes, the default", confirmed).

### Investor ids and the display ref

| `id` range | What it is | `user_id` | `ref` |
|---|---|---|---|
| 1 .. 2147483647 (2^31-1) | a user | = `id` | `INV-<id>` |
| 2147483649 .. 4294967295 (2^31 + wallet id) | an EVM wallet with no user yet | `null` | the wallet's `W-NNNN` ref |
| anything else | — | — | `investor.{id}` answers `not_found` |

- **Key by `id`.** Display `ref`. Never derive meaning from `ref`: nothing is keyed by it.
- **Update from V3:117.** "display `INV-<id>`" no longer holds: for a wallet, `INV-2147484750` would be wrong. Use the served `ref`. Fall back to `#<id>` only when `ref` is null (an older payload).
- Keep ids as JS numbers, not int32.
- A user-less wallet whose own id is above 2^31-1 is not served.
- Only EVM wallets become investors. A Tron wallet is listed in its user's `linked_wallets`.

Source: PB:p/investor_set.py:91-115, :322-324, :633-656; PB:pms_backend/db/models.py:2741; PB:t/investors.py:248-250; PB:plan:125.

---

## 6. Behaviour notes

### 6.1 Two frames for one row change (`investors.list`)

When an investor has exactly one live strategy, a row event is sent as up to two frames, in order:
1. **A frame stamped with that strategy.** Its KYC fields (`wallet`, `organization_kyc_status`, `access`) are null, and its `last_event_*` covers only that strategy's items. Narrowed holders of the strategy receive this frame.
2. **A full frame, not tied to any strategy.** Only firm users receive it. It is sent only when the row has a KYC field, or when its `last_event_*` differs.

A firm client gets both and ends on the full row. A narrowed client gets only the first. Apply them in order with a whole-row upsert.

You may see a one-render flicker of the access tag between the two frames (inferred). If it shows, debounce the KYC columns per row; never drop a frame.

**Always firm-only, one frame:**
- `investor.access.updated` and `investor.replaced`;
- every `org.investors.<id>` event;
- every event about a user-less wallet;
- a feed item with no strategy (SIGN_IN, WALLET_LINKED, DEPOSIT_BLOCKED, DEPOSIT_HELD, FROZEN);
- a STRATEGY_CHANGE between two different strategies (its live append/update frames are key-less).

Source: PB:p/investors.py:1212-1218, :2138-2176, :2263-2275, :2302-2306, :2340-2393; PB:p/investor_feed.py:1087-1102, :572-589 (`item_of_change`: `strategy_id` = to, `from_strategy_id` = from), :783-791 (`stamp_of`: a different `from_strategy_id` gives no stamp), :1064, :1080 (both item events emitted with that stamp); PB:pms_backend/ws/subscriptions.py:828-841; PB:pms_backend/authz/filters.py:37-41 (no key: firm only).

### 6.2 removed / replaced_by: a wallet that gets its user

When a listed wallet's user becomes known, the wallet investor is **retired** onto the user. All of the following happen in one transaction:
1. `investor.removed {id: <wallet id>, reason: "user_linked", replaced_by: <user id>}` on `investors.list` and `org.investors.<org>`;
2. `investor.replaced {id, replaced_by}` on `investor.<wallet id>`;
3. the user row's `investor.added` on both list topics.

The wallet's feed items move to the user.

**What to do:**
- Drop the wallet row, and move any selection or open drawer to `replaced_by`.
- On an open investor page, navigate to `/investors/<replaced_by>` with `replace: true`.
- `investor.<wallet id>` answers `not_found` from then on. If you land there through a stale link, say "This wallet now belongs to INV-…" when you know the `replaced_by`. Do not keep showing stale data under the error.

Source: PB:p/investor_set.py:430-478; PB:t/investors.py:416-419, :834-839; FM:shared/components/TopicSection/TopicSection.tsx:18-24.

### 6.3 A removed wallet, an investor leaving its last strategy, and a re-parented wallet

- **`wallet_removed`.** It goes to `investors.list` and `org.investors.<org>` only, with no `replaced_by`. **Nothing is sent on `investor.<wallet id>`**, so an open page finds out only at its next subscribe (`not_found`). Drop the row: a removed user-less wallet never shows a Removed tag (only an investor with a user does, §5). If the wallet is restored, it comes back as `investor.added` with the same id: re-add it. Code read.
- **Leaving the last strategy.** When a KYC investor's last live balance goes, you get one stamped `investor.removed {reason: "no_balance"}` per strategy it held, then a firm-only `investor.added`.
  - A firm client drops the row and re-adds it, so the row stays.
  - A narrowed client only drops it.
- **A re-parented wallet** (moved to another organization):
  - on `investors.list`: `investor.updated` with the new `organization_id`;
  - on the org pages: `investor.removed {out_of_scope}` on the old org's page, then `investor.added` on the new one, then both totals.
- **History on a zero-balance row.** A KYC investor with history but no live balance shows `balance`, `withdrawable` and `blocked` as `"0"` and `strategy_ids: []`. Its `deposits_*`, `withdrawals_*` and `pnl_*` keep its settled history, so they are not zero.

Source: PB:p/investor_set.py:371-381, :481-505; PB:p/investors.py:1084-1102, :1116-1141, :2358-2381; PB:docs/design/m12-deferred-findings.md:66-71.

### 6.4 The feed: kinds, groups, items

**Groups:**
- `money` = DEPOSIT, WITHDRAW, STRATEGY_CHANGE, DEPOSIT_HELD, WALLET_TRANSFER;
- `fees` = PNL, MANAGEMENT_FEE, PERFORMANCE_FEE, NETWORK_FEE, TXN_FEE_SPREAD;
- `access` = SIGN_IN, WALLET_LINKED, DEPOSIT_BLOCKED, FROZEN.

The ops' REALLOCATION never appears as an item: a strategy change is one `STRATEGY_CHANGE` item.

**Every item has:** `id`, `ts`, `kind`, `group`, `status` and `investor_id`, plus optional fields.
- `amount` is a magnitude (≥ 0). The sign is in `direction`.
- No item ever carries a reason text.

| `id` prefix → kind | Status | Fields to show | Who sees it |
|---|---|---|---|
| `op-` money and fee kinds | SUCCESS / PENDING / FAILURE | `amount`, `direction`, `asset`, `chain`, `strategy_*`, `ref`, `op_id` | holders of the strategy |
| `fi-` WITHDRAW (a pending withdrawal intent) | PENDING; FAILURE when rejected, failed or expired | `detail_status`, `amount`, `direction: out`, `strategy_*` | holders of the strategy. The item is deleted once the withdrawal is delivered (the op item takes over). |
| `sc-` STRATEGY_CHANGE | SUCCESS / FAILURE / PENDING | `from_strategy_*` → `to_strategy_*`, `amount`, `direction: move` | snapshot: holders of both strategies. Live: firm only when `from_strategy_id` differs from `strategy_id`; narrowed holders of both see the item in the snapshot (`feed`, `investors.activity`) but get no live event for it, so re-snapshot (debounced) to refresh it. Only an `sc-` item whose `from_strategy_id` is null or equals `strategy_id` reaches narrowed holders live. |
| `si-` SIGN_IN | SUCCESS | `ref: "main_app"` | firm only |
| `gb-` DEPOSIT_BLOCKED | BLOCKED | `reason_code` (a `kyc_*` code), `wallet_ref`, `count`; `ts` = the last block of the day | firm only |
| `q-` DEPOSIT_HELD | HELD (held, whitelisting, returning) / SUCCESS (released) / FAILURE (returned, closed, failed) | `amount`, `asset`, `chain`, `ref` (`Q-…`), `reason_code` (`KycQuarantineReason`), `wallet_ref`, `sender_address` | firm only |
| `kyc-` WALLET_LINKED | SUCCESS | `wallet_source`, `wallet_ref` | firm only |
| `kyc-` FROZEN | SUCCESS | `reason_code` = `wallet` or `organization`, `wallet_ref` | firm only |

**Applying events:**
- `investor.feed.appended`: upsert by `id`, then keep newest-first order.
- `investor.feed.updated`: replace by `id`. With `removed: true`, drop the item.
- An item can move. For example, a deposit's `op-` item is updated when its status changes.

**Changed by the review fixes:**
- A strategy change is never shown as a `fi-` WITHDRAW. Phantom items written before the fix are deleted with `investor.feed.updated {removed: true}`.
- A newly listed wallet arrives with its link and freeze items already applied.

Source: PB:t/investors.py:196-256, :667-707, :808-821; PB:p/investor_feed.py:56-83, :387-421, :507-778, :933-1033, :572-589, :783-791, :1588-1605 (`strategy_cut`: a snapshot admits a change whose from and to are both held); PB commits 6ba5d7b, 856f682, ab0b2fa.

### 6.5 Cursors

- `investors.list` pages by id, using `next_cursor`.
- The two feeds (`feed`, `investors.activity`) page by `(ts, id)` descending.
- All three cursors are opaque. Send them back unchanged, with the same params.

Source: PB:p/investors.py:2649; PB:p/investor_feed.py:1642-1665; PB:pms_backend/ws/providers/common.py:119-132.

### 6.6 Errors on the investor topics, and what to show

| Code | When | Show |
|---|---|---|
| `forbidden` | no `investors` scope | hide the screen for that role |
| `out_of_scope` | `org.investors.{id}` for a narrowed user, or `access` sent by a narrowed user | do not subscribe or send for those roles |
| `not_found` | an unknown or hidden investor, a retired or removed wallet, a narrowed user on a wallet id, or no live organization | "Not found"; follow `replaced_by` if you have one |
| `bad_request` | an invalid cursor, an id out of range, an extra param, a non-canonical id | a bug: log it, then reload without the cursor |
| `not_implemented` | `ccy` other than USD | send USD only |
| `conflict` | a duplicate subscription (`details.sub` is the existing id), or a scope change mid-subscribe | for a duplicate, reuse `details.sub`; never retry it (the common double-mount case would loop). Re-subscribe only for the scope change, after the new `hello`. |
| `rate_limited` | more than 64 subscriptions on one connection | unsubscribe the unused ones |

Source: PB:pms_backend/ws/server.py:1076-1104, :1054-1062 (scope change), :1144-1153 (duplicate: `details {sub: existing}`); PB:guide:2730-2745 (:2740 "reuse it instead of retrying"); FM:shared/services/pmsSocket/constants.ts:16.

---

## 7. frontend_v2 (investor dApp)

**No change needed.**
- frontend_v2 calls backend-fastapi over HTTP only. It imports no pms-backend contract, opens no WebSocket and has no asyncapi use (a grep over `apps/frontend_v2/src` finds none), so contracts 1.12.0 and 1.13.0 never reach it.
- backend-fastapi records "frontend_v2: no change" for M12 (BF:API.md:1512), and pms-backend's plan does the same (PB:plan:331).

**Small behaviour differences, none of which needs a code change:**
- **Client-ops order.** The client-ops page is now ordered `logical_dt DESC, id DESC`. Ops with the same time come in a fixed order, so "show more" can no longer repeat or skip one (BF:API.md:1501; FM:apps/frontend_v2/src/pages/dashboard/components/TransactionsWidget/hooks/useTransactionsPaginated/loadTransactions.ts:49).
- **Login.** A wallet login now writes one sign-in row on the server. The response is unchanged (BF:API.md:1507, :1512).
- **The rejected-organization exit** (1.12.0's backend side):
  - **Withdraw.** With the exit on, `/me/access/` reads `actions.withdraw.allowed: true` and `kyc_allowed: false` (code `kyc_org_rejected`). frontend_v2 already enables Withdraw from `allowed`, and it already shows `PENDING_APPROVAL` as pending.
  - **Banner copy (optional).** The banner still says only "not approved". A line such as "You can withdraw your balance; each withdrawal waits for review" would need `actions.withdraw.allowed && !kyc_allowed && code === 'kyc_org_rejected'` in `getKycBanner.ts`. This is a product choice.
  - **The switch.** It was off on test and prod at deploy.
  - Source: FM:apps/frontend_v2/src/shared/hooks/useAccess/useActionBlocked.ts:8; FM:apps/frontend_v2/src/pages/dashboard/utils/getKycBanner.ts:12, :38, :46; BFm:docs/design/owner-decisions.md:506.
- **`invalid` gating mode.** It is already in frontend_v2's `MeAccess` type (FM:apps/frontend_v2/src/shared/types/MeAccess.ts:33).

---

## 8. Not in this release / later

**Not sent:**
- **`investors.totals.updated`** is declared but never sent. Re-read the list totals from a new snapshot, debounced after row events. Only `org.investors.totals.updated` is live.
- **Row events for money moves on `org.investors.{id}`.** Only the totals event is sent (§4.4). Sending the rows too is listed as a later, additive change.
- **On `investor.{id}`:** `lots.updated`, `fee.charged` and `intent.updated`. `pending_intents` stays `[]`.

**Not served:**
- **No reason text anywhere** on the investor topics: not the Frozen or Waiting-on-client banner reasons, not the sign-in IP, device or address. Show codes and refs only.
- **Non-USD views** (`ccy` `USDC` / `BTC`): `not_implemented`.
- **Design items still without data:**
  - the org People details (name, ownership, PEP, checks);
  - the investor ref in Fund flow (`FundflowUserRef` has only `address` and `display_name`; resolve by address through a fully paged `investors.list`);
  - the intent modal's link to Quarantine (the `DEPOSIT_HELD` feed item carries the `Q-` ref);
  - KYC document open, download and the viewer;
  - NAV history.
- **Commands.** The investor commands pm-system already has (message, manual deposit, rescreen, whitelist edit) are still not served. When they are, gate them on `user_id != null`.
- **An exit marker in the approvals queue** for exit withdrawals is deferred to a later pms-backend release. Nothing stops the officer who opened an exit from approving its payouts.

**Confirmed at the M12 owner gate (2026-11-06)**, no longer open:
- a re-parented wallet: `investor.removed {reason: "out_of_scope"}` on the old org page, then `investor.added` on the new one, with no new enum value (§4.4);
- a user-less wallet's `gating_mode` is the organization's effective mode, while `enforced` follows the global mode (§5).

**Right after deploy** (so a tester on the test host does not file these as bugs):
- **Sign-in history has no backfill.** `last_sign_in_at: null` means no sign-in recorded since backend-fastapi's M12 deploy, not "never", and there are no SIGN_IN items from before it (365-day retention). DEPOSIT_BLOCKED items likewise start at that deploy: their table is new in the same migration (inferred).
- **The feed is rebuilt silently.** After 1.13.0 deploys, pms-backend rebuilds the feed in pages, and a fresh start first deletes every item. Nothing is announced: feeds and `last_event_*` can be empty or partial until the rebuild ends, and only a new snapshot shows the result. Re-snapshot rather than wait for events, and show "No activity yet" rather than an error.

**Mock vs real server.** The mock fixtures of `overview.attention` and `orgs.list` were not updated: they show neither `sub: "kyc"` nor the drafts count. The mock `org.investors.{id}` snapshot fills `last_event_*`, which the real server leaves null.

Source: PB:t/investors.py:253-255, :911, :978; PB:docs/design/m12-deferred-findings.md:72-85; PB:p/investors.py:3278-3281; PB:pms_backend/contracts/topics/fundflow.py:239-245; PB:pms_backend/contracts/commands/investors.py:67-116; PB:guide:2587-2589; PB:pms_backend/mock/fixtures/org.investors.{id}.json:116-117; BF:docs/design/owner-decisions.md rows 293, 297, 317; PB:docs/design/owner-decisions.md:493; PB@7bab0c8:docs/design/owner-decisions.md:494 (K148, confirmed); BF@a22538a:docs/design/owner-decisions.md:326 (row 317, KB238, confirmed), :316 (row 307, KB228: "365 days; no backfill"), :325 (row 316: m090 holds `investor_sign_in` and `kyc_gate_block`); PB:p/investor_feed.py:1403-1409 (rebuild "announcing nothing"), :1537-1545 ("a fresh start deletes every item first"); PB:p/investors.py:3136-3146 (`last_sign_in_at`).

### Unverified

- That v0.1.13 (1.12.0) is the build on test and prod: taken from the release statement; no host was checked.
- The current value of the exit switch on each host (it was off at deploy).
- What the router shows for `/investorsundefined`.
- Whether backend-fastapi accepts a fund intent for a user-less wallet (§2 item 5).
- The two-frame tag flicker (§6.1).
- That `org.investors.{id}` rows go stale on money moves, and that its snapshot's `last_event_*` is null: both read from code, not run.
- The prod mapping of frontend_v2's `/api/` and `/wallet-api/` paths (only the dev proxy is in the repo).
