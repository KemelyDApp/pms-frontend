# KYC/KYB design brief: pm-system

Oct 24, 2026 · @Kos

## Goal and scope

Design the pm-system KYC screens for M9c: Organizations, the KYC review queue and panel, wallet whitelisting, the quarantine view, ops actions, and the KYC parts of Fund flow, Admin > Config, Overview and Roles. M9c ships only the backend routes and the pms-backend topics and commands; the frontend team builds the screens on them. Outline the quarantine release and return-to-sender flow (M9e) now, hidden until then.

The prototype has no Organizations, KYC queue, review or quarantine screen, so all of them are new. Its few KYC fragments break the rules below, so replace them rather than reuse them. The client app has its own brief: "KYC/KYB design brief: frontend\_v2".

Rules every screen keeps:

- **Refs identify records.** Use `ORG-0001`, `W-0001` and `Q-0001` in rows, headers, links and notices; refs grow past four digits (`ORG-10000`). The organization name is encrypted and no organization has one yet, so fall back to the primary wallet address.
- **Personal data by scope.** No rule yet says which scope sees names, contacts, people and documents, or how they are masked. Wallet addresses and backend user ids are not personal data \[N1\].
- **Reason codes, plus encrypted text later.** Today's controls take only a `reason_code` slug (`^[a-z0-9_]{1,64}$`), and no list of codes exists. The spec also asks for a reason of at least 5 characters, stored encrypted like review notes and client messages. Prod may store none of that text until encrypted backups exist \[A3\].
- **Four eyes on high risk.** A `high` risk tier needs a second approval, and the database refuses the same officer as both approvers.
- **Step-up.** Return to sender asks for a fresh TOTP code \[D6\], and the gating-mode switch needs dual approval plus a code \[N13\]. Which other decisions need a fresh code is not decided; pm-system's `TotpCodePrompt` can take it.
- **The server decides.** The backend re-checks every action. Nobody types a withdrawal destination: it is always the client's requesting wallet \[B9\].
- **Freezes always apply.** A freeze refuses the client's deposit check, deposit address, invest and withdraw in every mode, `off` included \[B1\]. An on-chain deposit is never refused: a frozen client's deposit is held instead. Every other refusal depends on the gating mode.

## Screens to add

Add six Organizations screens to pm-system, plus ops actions and small changes to Fund flow, Admin > Config, Overview and Roles. Rename the Investors nav item to Organizations, with sub-tabs List, KYC queue, Wallet whitelisting and Quarantine, and redirect `/investors`. Build the sub-tabs on the prototype `Hub` (`pages-hub.jsx`), which hides tabs a role lacks and shows "N hidden by role".

pm-system has no KYC data before M9c: the backend reads below answer only pms-backend's service account, which consumes them from M9c. No read carries a name, and none searches by name or address, so rows key on refs.

### Organizations list

| Item | Detail |
| --- | --- |
| Purpose | Find an organization, see its KYC state and follow the legacy migration. |
| Scope | `investors`, relabelled "Organizations (view)". |
| Backend read | `ref`, `type`, `kyc_status`, `risk_tier`, `submitted_at`, `approved_at`, `next_review_at`, `migrated`, `wallet_count`, `primary_wallet_ref`. Filters: `status`, `risk`, `due_within_days`, `migrated`, `include_empty_drafts` (off hides unmigrated empty drafts), `order`. Migration banner from the summary read's `migrated{total, approved}`. |
| M9c topic | `orgs.list`. |
| Actions | Filter tiles All, Needs review, Waiting on client, Approved, Re-KYC ≤ 30d, Frozen; open the profile; expand a row to its wallets. |
| Tile counts | The summary's `review_due_30d` counts approved organizations only, so the Re-KYC tile also filters `status=approved`. |
| Reuse | `SortableTable` (`components.jsx`) or `PmsTable` with `renderSubRows` and `emptyState`; the Counterparties expandable rows (`pages.jsx`). No `.pms-kpi` tile is clickable, so the tiles are new, or `.pms-subtabs` with counts. |

### Organization profile

| Item | Detail |
| --- | --- |
| Purpose | One organization's KYC record, wallets and history, with its ops actions. |
| Scope | `investors` to view; as the spec stands, that includes People and Documents. `kyc.approve` for actions and Link wallet. |
| Header | Ref, status badge, type, risk tier, `migrated`, `next_review_at`, ops buttons, and a 10-step progress tracker. The spec names the tracker but lists no steps. |
| Tabs | Overview, People, Documents, Wallets, Investments, Activity. |
| Wallets tab (now) | Backend wallet read: `ref`, `address`, `chain_family`, `status`, `is_primary`, `source`, `signature_status`, `signatory_email_status`, `onchain_history`, `cooldown_ends_at`. It carries no `label` and no `frozen_by`. |
| People tab (M9c) | Roles `ubo`, `director`, `signatory`, `trustee`, `settlor`, `protector`, `beneficiary`, `council_member`, `founder`, `account_holder`. Also `ownership_pct`, `pep` and checks `check_id`, `check_liveness`, `check_address`, `check_screening` (`pending`, `ok`, `failed`, `n/a`). Names are encrypted, and `pep` and `ownership_pct` stay out of the non-PII reads. |
| Documents tab (metadata M9c, files M9d) | `doc_type`, `status`, `issued_at`, `expires_at`, `reviewed_at`, MIME type and size; no file name is stored. An expiry raises a profile flag and changes no access, unless compliance forces a re-KYC. |
| Activity tab (M9c) | Audit events such as `org.frozen` or `wallet.activated`, with statuses, refs and codes only. Free-text reasons sit only in an encrypted field. |
| Investments tab | Org-level totals wait until pms-backend can read other users' client operations (inbound issue #12). |
| Link wallet modal | Only on an `approved` organization. Chain (EVM only in v1), address, label (max 64), wallet type; exchange-hosted blocks submit. A used address shows "Wallet belongs to ORG-xxxx"; if that is an empty draft, dissolving it into this organization frees the address. |
| Reuse | `InvHeader`, `InvHero` and `.pms-tabbar` with counts (`page-investor-detail.jsx`), or `InvestorDetailsHeader` and `PmsTabs`; `.pms-dl` or `RecordList`; the `sc-rail`/`sc-step` stepper (`page-strategy-create.jsx`); the saga timeline (`pages-v2.jsx`) or `InvComms` rows for Activity; `FormModal` or `PmsModal`. |

### KYC review queue

| Item | Detail |
| --- | --- |
| Purpose | Work submitted cases, oldest first, within the review deadline. |
| Scope | `kyc.approve`. |
| Data | Columns Organization, type, stage, risk, waiting days, reviewer. The deadline runs `kyc_review_sla_days` (default 3) from `submitted_at`; the summary's `sla_breached` counts `submitted`, `in_review` and `second_approval` cases past it. M9c adds topic `kyc.queue`. |
| Actions | Claim (M9c: `submitted` to `in_review`, sets the reviewer); open the review panel. |
| Reuse | `PmsTable`; the `Hub` sub-tab count badge. |

### KYC review panel

| Item | Detail |
| --- | --- |
| Purpose | Decide one case. |
| Scope | `kyc.approve`. |
| Layout | Left: documents and people, with a viewer. Right: checklist, risk tier, decision. |
| Checklist | Five groups: Entity verification (Identity for individuals), People (entities only), Screening, Source of funds, Wallet. Each tick stores who and when; notes live in separate encrypted fields. No item catalogue exists in code yet, so wording comes from spec §8. |
| Risk tier | `low`, `medium`, `high`. A PEP person forces `high`. Risk-tier limits are deferred, so no limit fields \[D2\]. |
| Decisions | Approve needs every tick and a tier: it sets `approved` and the primary wallet `cooldown`, or `second_approval` when `high`. Request info needs a client message, sets `info_requested`, and the case leaves the queue. Reject needs a client reason, sets `rejected`, and removes the primary wallet. |
| Second approval | A different officer sees the first ticks pre-filled and may untick. |
| Autosave | Each save carries a revision; M9c plans a 409 for a stale one. |
| Re-KYC | Review kind is `initial`, `annual` or `forced`. Unchanged items may be pre-ticked; screening and proof of address are re-done. |
| Reuse | `.pms-audit-check` rows (`page-overview.jsx`) plus a tick control (`Switch` or `rp-tg`); the withdrawal Reject modal's reason chips and client textarea (`page-overview.jsx`); `TotpCodePrompt`. The document viewer is new: it opens short-lived URLs and never caches them. |

### Wallet whitelisting queue

| Item | Detail |
| --- | --- |
| Purpose | Approve an extra wallet that ops linked to an approved organization. |
| Scope | `kyc.approve`. |
| Data now | Backend wallet read, filtered by `status`, `organization_ref`, `user_id`, `signature_status`. M9c adds topic `wallets.queue`. |
| Flow | Ops links it (`awaiting_email`); the signatory confirms by email (`awaiting_connect`, or `review` if a signature exists); the wallet signs in (`review`); compliance approves (`cooldown`, 48 h default); then `active`. The email step arrives with M9d, so a wallet linked in M9c waits in `awaiting_email` until then. |
| Actions | Approve only when signatory email is `confirmed`, signature `verified` and on-chain history `clean`. Reject sets `removed` with a client reason. |
| Gap | `onchain_history` starts `unreviewed`, and no planned route sets it; the spec has only a review checklist tick for it. Without such a control, Approve never enables. |
| Reuse | `PmsTable`; `StageDot`-style stage pills (`pages-v2.jsx`); the three conditions as `.pms-audit-check` rows. |

### Quarantine list (view only until M9e)

| Item | Detail |
| --- | --- |
| Purpose | See deposits held because KYC refused the sender or the owner. |
| Scope | `investors` to view; returning funds needs `kyc.approve` (M9e). |
| Data | Quarantine row (M9c topic `quarantine.list`): `ref`, `tx_hash`, `network_code`, `coin`, `amount`, `verified_amount`, `observed_from_address`, `observed_via`, `sender_verified`, `to_deposit_address`, matched organization, `status`, `reason`. `sender_verified` is always false for a Kafka-observed deposit \[B22\]. A KYC hold without a transaction hash gets no row, so it never shows here. |
| Actions now | None. pm-system cannot credit or fail any held deposit: both routes need `admin:strict`, which its service account lacks. They also answer 409 `kyc_quarantined` while a quarantine row exists \[B7\]. |
| M9e adds | Release, auto-whitelisting of the sender, and return to sender. Return pays only the verified sender the verified amount minus the exchange withdraw fee. It needs a reason, and dual approval above `withdrawal_approval_threshold`. |
| Rule banner | The spec asks for one. Deposit addresses are shared per pool \[A1\], so a hold depends on the sender and on the owner's KYC. A freeze holds in every mode; sender and approval holds apply only to deposits requested while the mode enforced \[B5, B8\]. |
| Reuse | `PmsTable`, `PageMeta`, `.pms-callout` for the banner. |

### Ops actions

Freeze, unfreeze, remove, force re-KYC and dissolve each need `kyc.approve` and a reason, and each writes an audit event. Dissolve is not in the spec's `kyc.approve` list, so its scope is unverified. Force re-KYC's reason is also the client message. Enable each button by these rules \[B12\]:

| Action | Enabled when | Effect |
| --- | --- | --- |
| Freeze organization | Status is not `frozen` or `dissolved` (`rejected` included) | Freezes it and its `active`, `cooldown` and `review` wallets; cancels in every mode. |
| Unfreeze organization | Status is `frozen` | Restores its previous status and only the wallets its freeze froze. |
| Freeze wallet | Wallet is not `removed` and not frozen on its own | Stays frozen after the organization's unfreeze; cancels in every mode. |
| Unfreeze wallet | Wallet is `frozen` and its organization is not | Restores the wallet's previous status. |
| Remove wallet | Wallet is not `removed`; a primary only while another wallet is `active` | Cancels only where the mode enforces \[B11\]. |
| Force re-KYC | Status is `approved`, with no open review | Sets `info_requested`; cancels only where the mode enforces \[B11\]. |
| Dissolve draft | The draft is empty \[D3\] | Moves every wallet into a chosen target organization, keeping each W-ref, none primary; needs a target picker. |

A cancel turns `CREATED` and `PENDING_APPROVAL` withdrawals into `REJECTED`, `APPROVED` ones into `FAILED`, and `CREATED` strategy changes into `FAILED` \[B10\]. Claimed withdrawals always finish, unfreezing reopens nothing, and a cancelled withdrawal may already have made a bot wait or close part of a position \[B19\]. Reuse `ConfirmModal` (`forms.jsx`: tone banner, impact rows, a reason textarea of at least 5 characters, typed phrase) or `TotpCodePrompt`, and add a reason-code select.

Each control returns the changed wallets, the cancelled withdrawals and strategy changes, and the claimed withdrawals left alone. A refused transition names a code (see States, badges and copy); a lock timeout means busy, retry. No control route exists yet, so how these reach pm-system is unverified.

### Fund flow touch-points

- **Approvals.** A KYC-refused approve changes nothing: the request stays `PENDING_APPROVAL`, and a repeat approve gets the same refusal \[B6\]. Before pms-backend PR #38 the TOTP prompt read "conflict: the upstream reported a conflicting decision (upstream\_status\_code: 409)". With PR #38 it reads "upstream\_rejected: the upstream refused the approval: the client's KYC does not allow it (reason: kyc\_refused)", derived from the code, not run.
- **Deposits.** The fund-flow row has no held stage and no `held_at`, only `failure_reason`. So pm-system can spot a KYC hold only by its `KYC hold` prefix; whether the row carries that text for a held deposit is unverified. The prototype stage pills have no held stage either.
- **Withdrawals.** A KYC-cancelled withdrawal carries the cancel text in `failure_reason`, the same field.

### Admin > Config: KYC settings

| Key | Default | Allowed | Note |
| --- | --- | --- | --- |
| `whitelist_cooldown_hours` | 48 | 0-168 | Wallet waiting period. |
| `kyc_review_interval_months` | 12 | 1-60 | Sets `next_review_at`. |
| `kyc_review_sla_days` | 3 | 1-30 | Queue deadline. |
| `signatory_confirm_ttl_hours` | 72 | 1-168 | Used from M9d. |
| `kyc_gating_mode` | `off` | `off`, `shadow`, `enforce_new`, `enforce` | Guarded setting. |

A bad value answers 422, and deleting or renaming one of these keys answers 409 `kyc_setting_protected` \[B18\]. The mode write comes in M9c under its own scope, never under `kyc.approve` \[N13\].

pm-system cannot write any setting yet: its service account only reads settings (inbound issue #4), and pms-backend's closed registry has no KYC key. So the KYC rows stay view-only until M9c adds a write path. Viewing Config needs `admin`, and editing needs `admin.settings` with TOTP in `EditSetting`.

A per-organization override is the key `kyc_gating_mode:org:<numeric id>`, never the `ORG-` ref, with the same four values; deleting it restores the global mode. Once an enforcing override has stamped an intent or counted a refusal, that host's legacy backfill never runs, even after removal \[B21\]. Reuse `.pms-cfg-group` and `.pms-cfg-row` (`pages.jsx`) or `Config` plus `EditSetting`.

### Overview widgets

- **Data.** The summary read returns counts by status for organizations, wallets and quarantine, plus `migrated{total, approved}`, `review_due_30d`, `sla_breached` and `gating_mode`. The M9c topic list has no summary topic, so how the Overview gets them is unverified.
- **Needs attention.** The contract allows at most 6 rows; its `flag` kind is reserved and never sent, and M9c plans one `flag` row. A row carries one `scope`, and its link reaches `investors` only with sub `list`, `approvals` or `admin`, so linking a KYC sub-tab needs a contract change. The prototype already designs the row: "Investors with compliance flags", gated on `investors`.
- **Shadow counts.** Would-block outcomes land in a daily tally table, one daily `gate.would_block` audit event per subject, and a pipeline log line. No API reads the tally, so a widget needs a new read.
- **Bell.** The spec wants "KYC cases to review", "KYC case needs 2nd approval" and "Quarantined deposits". Backend ops notices carry refs and counts only, and include `deposit_quarantined` but nothing yet for a submitted case or a second approval. Whether pms-backend feeds them to the bell is unverified.
- **Reuse.** `OvBlock` and Needs attention (`page-dashboard.jsx`) or `AttentionWidget`; the bell panel's `action` category and the nav `badgeFn` (`sidebar.jsx`).

### Permissions

pm-system users get two KYC scopes: `investors`, relabelled "Organizations (view)", and the new `kyc.approve`. Spec defaults: Admin has all, Compliance adds `kyc.approve`, and PM and IR keep view only. Ops gets neither, a gap default that matches the prototype's Ops role, which has no `investors`.

A data migration adds `kyc.approve` to Compliance only where the stored role still equals the default. `kyc.approve` joins pm-system's scope list only after the frontend confirms in writing that it decodes unknown values leniently. The prototype Roles matrix builds its rows from `PMS_SCOPES` (`permissions.js`), so the relabel and the new row are entries there.

The seven backend scopes below belong to pms-backend's service account only; no default role gets them, and backend admin gets 403 \[N4\]. Keep them out of the Roles matrix.

| Backend scope | Opens | When |
| --- | --- | --- |
| `kyc:read` | Summary, organizations list, wallets list | Live (M9a) |
| `kyc:pii_read`, `kyc:document_read` | Profile, people, documents and activity reads | M9c; documents with M9d |
| `kyc:review` | Review decisions (by name; unverified) | M9c |
| `kyc:ops` | Freeze, unfreeze, remove, force re-KYC | M9c |
| `kyc:config` | Gating-mode write | M9c |
| `quarantine:resolve` | Release of quarantined deposits; the return-to-sender scope is unverified | M9e |

## States, badges and copy

Map every KYC value onto five tones with a short label; every tone and label here is a draft for Kos to approve.

| Tone | Prototype `.pms-pill` | pm-system `RoundTag` |
| --- | --- | --- |
| neutral | base pill | `neutral` |
| info | `info` | `info` |
| warning | `warn` | `warning` |
| critical | `neg` | `negative` |
| success | `pos` | `positive` |

### Organization statuses

| `kyc_status` | Tone | Label |
| --- | --- | --- |
| `draft` | neutral | Draft |
| `submitted` | info | Submitted |
| `in_review` | info | In review |
| `info_requested` | warning | Info requested |
| `second_approval` | warning | 2nd approval |
| `approved` | success | Approved |
| `rejected` | critical | Rejected |
| `frozen` | critical | Frozen |
| `dissolved` | neutral | Dissolved |

### Wallet statuses

| `status` | Tone | Label |
| --- | --- | --- |
| `pending_kyc` | neutral | Awaiting KYC |
| `awaiting_email` | info | Awaiting signatory email |
| `awaiting_connect` | info | Awaiting sign-in |
| `review` | info | In review |
| `cooldown` | warning | Cooling down, ends \<time> |
| `active` | success | Active |
| `frozen` | critical | Frozen |
| `removed` | neutral | Removed |

A "with organization" variant of Frozen needs `frozen_by`, which the database holds but no read serves yet. Sub-status pills: `signature_status` `awaiting` warning, `verified` success; `signatory_email_status` `n/a` neutral, `awaiting` warning, `confirmed` success; `onchain_history` `unreviewed` neutral, `clean` success, `flagged` critical.

Risk tier: `low` success, `medium` warning, `high` critical. The prototype's risk palette differs (`risk-low` grey, `risk-moderate` purple, `risk-high` orange), and its `RiskPill` gives `medium` no class. Kos picks one palette.

### Quarantine statuses and reasons

Only `held` occurs before M9e.

| `status` | Tone | Label |
| --- | --- | --- |
| `held` | warning | Held |
| `whitelisting` | info | Whitelisting sender |
| `released` | success | Released |
| `returned` | neutral | Returned to sender |

| `reason` (also inside `held_reason`) | PMS label |
| --- | --- |
| `sender_unverified` | Sender not verified |
| `sender_not_whitelisted` | Sending wallet not approved |
| `sender_other_org_wallet` | Sent from another wallet of the organization |
| `no_organization` | No organization |
| `org_not_approved` | Organization not approved or closed |
| `org_frozen` | Organization frozen |
| `wallet_frozen` | Wallet frozen |

`sender_not_whitelisted` also covers the requesting wallet itself when it is not whitelisted or was removed. `org_not_approved` also covers rejected and dissolved organizations.

### Gating modes

| Mode | Tone | Label | Meaning |
| --- | --- | --- | --- |
| `off` | neutral | Off | Only freezes refuse. |
| `shadow` | info | Shadow | Only freezes refuse; other refusals are counted. |
| `enforce_new` | warning | Enforce new | Full rules, except legacy accounts never approved are only counted. |
| `enforce` | success | Enforce | Full rules. |
| `invalid` | critical | Invalid | Setting missing or bad; enforced as `enforce`. Reported, never stored. |

### Staff-side codes

Only `kyc_refused` reaches pm-system, as pms-backend's mapped approve error, without the KYC code behind it. Its PMS line (draft): "KYC does not allow this withdrawal. Reject the request." `kyc_quarantined` and `kyc_setting_protected` reach admin-panel only, and `kyc_destination_mismatch` reaches transfer-service; staff see only the failed intent's text.

The ops controls raise these codes (see Ops actions for how they reach pm-system):

| Code | Raised by | PMS line (draft) |
| --- | --- | --- |
| `organization_not_found`, `wallet_not_found` | Any control | "Not found. Refresh the list." |
| `already_frozen` | Organization freeze; wallet freeze of a wallet frozen on its own | "Already frozen." |
| `not_frozen` | Organization or wallet unfreeze | "Not frozen." |
| `dissolved` | Organization freeze | "This organization is dissolved." |
| `removed` | Wallet freeze | "This wallet is removed." |
| `already_removed` | Remove wallet | "This wallet is already removed." |
| `organization_frozen` | Wallet unfreeze | "Unfreeze the organization first." |
| `primary_needs_active_peer` | Remove wallet | "Another active wallet is needed before the primary can be removed." |
| `review_open` | Force re-KYC | "A review is already open." |
| `not_approved` | Force re-KYC | "Only an approved organization can be sent to re-KYC." |
| Busy (lock timeout or a moved wallet) | Any control | "Busy. Try again." |

### Intent texts in Fund flow

pm-system shows these backend texts raw, under `Failure` in the intent modal and as the Stage column tooltip. Decision 43 below turns them into pills.

| Backend text | Field |
| --- | --- |
| `KYC hold (<reason>): funds held for review` | deposit `held_reason` and `failure_reason` |
| `KYC hold (<reason>): no transaction hash, held for operator review` | deposit `held_reason` and `failure_reason` |
| `Cancelled: account access changed (<code>); nothing was sent` | withdrawal `failure_reason` |
| `KYC refused at claim (<code>); nothing sent` | withdrawal `failure_reason` |
| `cancelled: KYC (<code>)`, `KYC refused (<code>); nothing moved` | strategy change `last_error`, and its rejected intent's `failure_reason` |

## Design decisions to add

Hand the designer these testable requirements, grouped by screen; each is a suggestion until Kos approves it.

**All KYC screens**

1. Show the ref and status badge in every KYC row, header, modal title and notice, with room for refs past four digits.
2. Use only the tones and labels from the tables above for KYC badges.
3. Show the primary wallet address, checksummed, wherever a name is missing or not allowed. The organizations read gives only `primary_wallet_ref`, so join the wallets read.
4. Give every KYC table empty, loading, error and no-access states in pm-system's `getEmptyState` wording.
5. Show reason codes as readable labels, and never show free text in a list.
6. Drop the prototype's pre-spec mocks: the Sumsub vendor, KYT and AML scores, daily-limit checks, the 24 h cool-down and "Tier 2/3".
7. Drop its Edit whitelist and Run rescreen buttons, unmasked contact and tax data, the staff withdrawal's destination field and the reject email checkbox. Retire pm-system's `WhitelistEdit` and `Rescreen` stubs too.
8. Design at 1440 px in the dark theme, and check the compact density.

**Organizations list**

9. Put the migration banner ("\<approved> of \<total> migrated organizations approved") above the filter tiles.
10. Make the six filter tiles clickable, each with a count, one active at a time.
11. Add a "Show empty drafts" toggle, off by default.
12. Expand a row into its wallets, each with a status badge and a primary marker.
13. Mark a `next_review_at` within 30 days with a warning pill.

**Organization profile**

14. Enable each header action by the ops rules table, and give a disabled one a tooltip naming the rule.
15. Show the tracker with done, current and locked steps.
16. Add tab counts, with an alert tone on Documents when a document is expired.
17. Show the cooldown end time on wallet rows; "frozen with organization" waits until a read serves `frozen_by`.
18. List Activity as time, event label, actor ref and status change, with no free text.
19. Show Investments as "Not available yet" until org-level totals can be read.
20. Offer Link wallet only on an approved organization. Disable submit for an exchange-hosted wallet or another organization's address, naming that ref.

**KYC review**

21. Sort the queue oldest first, and mark rows past the deadline with a critical pill and days overdue.
22. Show who claimed a case, and offer Claim only on unclaimed cases.
23. Show checklist progress as "n of m" beside Approve, and list what is missing while it is disabled.
24. Show each tick's officer ref and time on hover.
25. Lock the risk tier to High when any person is a PEP, and say why; this needs the M9c people read.
26. In second approval, pre-fill the first officer's ticks and disable Approve for that officer.
27. Show "Saved" after autosave, and "Changed by someone else, reload" on a stale revision.
28. Badge the review kind, and leave screening and proof of address unticked on a re-KYC.
29. Build Request info and Reject on the Reject modal layout, labelling the message "Visible to the client".

**Wallet whitelisting**

30. Show the three approval conditions as pass or fail rows, and enable Approve only when all pass.
31. Add a control that marks on-chain history `clean` or `flagged`; it needs a contract addition.
32. Show each wallet's step from `awaiting_email` to `active` as stage pills.

**Quarantine**

33. Ship the Quarantine view with no release, return, credit or fail button until M9e.
34. Show `sender_verified` as "Unverified" unless it is true.
35. Add the rule banner: "Deposits are held here when the sender is not the wallet that requested them, or when the account's KYC does not allow the deposit. Held funds are not credited."
36. Design the M9e return modal now, hidden: the verified sender as a read-only destination, the computed amount read-only, a reason code, TOTP, and a dual-approval note above the threshold. Disable it while `sender_verified` is false.

**Ops actions**

37. Say in every confirm what it cancels: a freeze always cancels unclaimed withdrawals and strategy changes; a removal or re-KYC only where the mode enforces. Exact counts need a preview read, which no plan has.
38. Warn in freeze confirms that bots may already have acted on a withdrawal the freeze cancels.
39. Put a reason-code select above the spec's reason text (at least 5 characters), and keep the text off where encrypted storage is not live.
40. Take the TOTP code in the same modal. Show a "Busy, retry" state on pms-backend's existing `conflict` answer "the server is busy; retry".
41. Give Dissolve a target-organization picker and list the wallets that move.

**Fund flow**

42. Show a KYC-refused approve as "Reject this request", not as a conflict, with Reject one click away. pms-backend PR #38 supplies that refusal; where it is not deployed yet, the prompt shows a conflict.
43. Add "Held (KYC)" deposit and "Cancelled (KYC)" withdrawal pills, with the reason on hover. Detect them from the `failure_reason` prefixes `KYC hold (` and `Cancelled: account access changed (` until the contract adds a field.

**Admin > Config**

44. Add a KYC group with the five keys, their default and allowed values, and no delete or rename control. Keep it read-only until M9c adds a write path.
45. Show the gating mode as a toned pill, and change it through a warning confirm with dual approval and TOTP.
46. List per-organization overrides with "Remove override". Warn: "Using an enforcing override locks the legacy backfill on this host for good, even if you remove it later."

**Overview and navigation**

47. Add an Organizations block: counts by status, Needs review, 2nd approval, Re-KYC ≤ 30d, deadline breaches, quarantine held.
48. Turn the prototype's "Investors with compliance flags" row into one "Organizations need attention" row, with the breakdown in its subtitle.
49. Add bell items for cases to review, 2nd approval and quarantined deposits, and count badges on the nav item and sub-tabs.

**Roles**

50. Add the `kyc.approve` row with its unlocks, and relabel `investors` "Organizations (view)".
51. Hide `kyc.approve` sub-tabs and buttons from view-only roles, with the "N hidden by role" note.

## Open questions for Kos

1. Which people and document fields may pm-system show, to which scope, and how masked? The spec gives the whole profile, People and Documents included, to the `investors` view scope.
2. Which reason codes may ops choose for each action?
3. Do Request info, Reject and force re-KYC ship on prod without client text until encrypted backups exist?
4. Does four-eyes also cover wallet approvals on high-risk organizations, with the first approver locked out meanwhile?
5. Which ten steps does the profile tracker show?
6. Who marks a wallet's on-chain history clean or flagged, and through which control?
7. Which scope may dissolve a draft?
8. One combined attention row, or three, which may need a contract change?
9. Should pm-system show shadow counts, which need a new read?
10. Beyond return to sender and the mode switch, which commands need a fresh TOTP code, and which may use the step-up window?
11. Which risk palette?
12. May pms-backend keep an organization display name? Today's rules lean no: the name is encrypted, and pms-backend stores no personal data \[A3\].
