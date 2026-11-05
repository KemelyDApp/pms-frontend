# KYC / KYB, Wallet Whitelisting & Organization Linking — Implementation Spec

Target: Kemely platform (main app + PMS admin panel)
Status: approved for implementation · v1.0 · 21 Oct 2026
UI reference: the PMS prototype (`Kemely PMS.html` → **Organizations** tab). Files: `data-kyc.js`, `page-orgs.jsx`, `page-kyc-queues.jsx`, `styles/kyc.css`, `pages.jsx › AdminConfigTab`, `permissions.js`.

---

## 1. Summary

Today **investor = wallet address**. This spec introduces an **Organization**: the KYC'd legal entity or natural person that owns one or more **whitelisted wallets**.

- Every Organization is verified once (KYC for individuals, KYB for entities). Wallets are then whitelisted *for that Organization*.
- A wallet can only deposit, trade or withdraw when **its Organization is approved** and **the wallet is whitelisted**. Otherwise the main app is **view only**.
- Proof of wallet ownership is the **sign-in signature** the user makes when they connect the wallet to the main app.
- **Only self-hosted wallets** can be whitelisted. Exchange-hosted wallets are rejected because they cannot sign.
- Review is **manual, in-house**, using a structured checklist in the PMS. There is no third-party KYC vendor in v1, but the design must stay provider-agnostic.

---

## 2. Decisions log (source of truth)

| # | Topic | Decision |
|---|---|---|
| 1 | Parent entity name | **Organization** |
| 2 | Client types | Individual (KYC), Company (KYB), Fund / SPV, Trust / Foundation |
| 3 | KYC provider | Manual review in-house |
| 4 | Sanctions / PEP / adverse media | Manual: the reviewer ticks a checklist. Results are recorded, not auto-screened. |
| 5 | Wallet ownership proof | Sign-in signature when the wallet connects to the main app |
| 6 | Exchange-hosted wallets | **Not allowed**: self-hosted only |
| 7 | Who starts KYC / adds wallets | The client self-serves in the main app; ops reviews in the PMS |
| 8 | Unknown wallet connects to the main app | **Starts a new Organization onboarding** |
| 9 | Adding a 2nd+ wallet to an approved Organization | **Ops links it manually in the PMS.** The Organization's authorised signatory confirms by **email from the registered address**. The wallet then signs in on the main app. |
| 10 | Restricted (not approved / not whitelisted) wallet | **View only**: no deposits, no trading, no withdrawals |
| 11 | Cool-down after whitelisting | **48 h** before the wallet can *receive withdrawals*. Deposits and trading are allowed during the cool-down. |
| 12 | Deposit from a non-whitelisted wallet | **Quarantine**. If the receiving deposit address belongs to an Organization, start whitelisting the sender. |
| 13 | Re-KYC cadence | **Every 12 months for everyone** (configurable) |
| 14 | Second approval (four-eyes) | **High-risk cases only** |
| 15 | People at an Organization | UBOs, directors and signatories are KYC subjects. They **do not get logins** in v1; the wallet is the login. |
| 16 | Ops controls | Freeze wallet · freeze Organization · remove wallet from whitelist · force re-KYC |
| 17 | Freeze effect | Withdrawals **and** new deposits blocked. **Existing positions keep running.** |
| 18 | Risk-tier limits | Yes: deposit and withdrawal limits per tier, **configurable in Admin › Config, blank by default (= no limit)** |
| 19 | Migration | **Each existing investor wallet becomes its own Organization and must complete KYC.** It is view only until approved. |
| 20 | PMS navigation | Rename **Investors → Organizations**. KYC lives inside it as sub-tabs. |

---

## 3. Glossary

- **Organization**: the KYC subject that owns wallets and investments. Types: `individual`, `company`, `fund`, `trust` (`trust` includes foundations; store `subtype` = `trust` | `foundation`).
- **Person**: a natural person linked to an Organization in one or more roles: UBO (≥ 25%), director, authorised signatory, trustee, settlor, protector, beneficiary, council member, founder, account holder.
- **Primary wallet**: the wallet that first connected and started the onboarding.
- **Whitelisted wallet**: a wallet in status `active` or `cooldown`.
- **Registered email**: the Organization's official email captured during KYB. It is used for signatory confirmations.
- **Quarantine**: a holding state for inbound funds from non-whitelisted senders.

---

## 4. Data model

Postgres naming. Every table has `created_at` and `updated_at`. All status changes write an `audit_event` (see §12).

### 4.1 `organization`
| column | type | notes |
|---|---|---|
| id | text PK | `ORG-0001`… |
| name | text | legal name / full name |
| type | enum | `individual` \| `company` \| `fund` \| `trust` |
| subtype | text null | `trust` \| `foundation` |
| jurisdiction | text | ISO-3166 country (+ state where relevant) |
| registration_no | text null | entities only |
| lei | text null | optional |
| registered_email | citext | used for signatory confirmation |
| registered_address | jsonb | |
| kyc_status | enum | see §5.1 |
| risk_tier | enum null | `low` \| `medium` \| `high`. Set at review. |
| submitted_at | timestamptz null | |
| approved_at | timestamptz null | |
| next_review_at | date null | `approved_at + kyc_review_interval_months` |
| reviewer_id | fk user null | 1st reviewer |
| first_approval_by / first_approval_at | fk / ts null | for the four-eyes flow |
| second_approval_by / second_approval_at | fk / ts null | |
| info_request_message | text null | shown to the client |
| reject_reason | text null | shown to the client |
| frozen_reason | text null | |
| prev_status | enum null | restored on unfreeze |
| migrated_from_investor_id | text null | legacy `INV-xxxx` |
| onboarding_progress | jsonb | which main-app steps are complete |

### 4.2 `organization_person`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | fk | |
| full_name, dob, nationality, residence_country | | |
| roles | text[] | `ubo`, `director`, `signatory`, `trustee`, `settlor`, `protector`, `beneficiary`, `council_member`, `founder`, `account_holder` |
| ownership_pct | numeric null | required for `ubo` (≥ 25) |
| email | citext null | required for `signatory` |
| check_id / check_liveness / check_address / check_screening | enum | `pending` \| `ok` \| `failed` \| `n/a` |
| pep | bool | if true, EDD (enhanced due diligence) is required |

### 4.3 `kyc_document`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | fk | |
| person_id | fk null | for person-level docs (ID, proof of address, selfie) |
| doc_type | enum | see §7 |
| file_key | text | object storage key (encrypted at rest) |
| status | enum | `missing` \| `uploaded` \| `ok` \| `rejected` \| `expired` |
| issued_at / expires_at | date null | proof of address must be < 3 months old at review |
| reviewed_by / reviewed_at | | |

### 4.4 `kyc_review`
One row per review attempt (initial, re-KYC, forced re-KYC).
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | fk | |
| kind | enum | `initial` \| `annual` \| `forced` |
| checklist | jsonb | `{ item_id: { checked: bool, by, at, note } }` (§8) |
| risk_tier | enum | |
| decision | enum null | `approve` \| `request_info` \| `reject` |
| decision_by / decision_at | | |
| notes | text | internal |

### 4.5 `wallet`
| column | type | notes |
|---|---|---|
| id | text PK | `W-0001` |
| organization_id | fk | **one wallet ↔ one Organization** (unique on `chain_family + address`) |
| chain_family | enum | `evm` \| `solana` \| `bitcoin` (extensible) |
| address | text | stored normalised (EVM checksum, BTC lowercase bech32) |
| label | text | |
| is_primary | bool | |
| source | enum | `main_app_connect` \| `linked_by_ops` \| `quarantined_deposit` |
| status | enum | see §5.2 |
| signature_status | enum | `awaiting` \| `verified` |
| signature_payload | jsonb | message, signature, nonce, signed_at, chain id |
| signatory_email_status | enum | `n/a` \| `awaiting` \| `confirmed` |
| signatory_confirmation_id | fk null | |
| onchain_history | enum | `unreviewed` \| `clean` \| `flagged` |
| cooldown_ends_at | timestamptz null | |
| frozen_reason / removed_reason | text null | |
| prev_status | enum null | |

### 4.6 `signatory_confirmation`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| wallet_id | fk | |
| sent_to | citext | must equal `organization.registered_email` at send time |
| token_hash | text | single-use, 72 h expiry |
| confirmed_at | timestamptz null | |
| confirmed_by_person_id | fk null | must hold the `signatory` role |
| evidence | jsonb | email headers, IP, user agent |

### 4.7 `deposit_quarantine`
| column | type | notes |
|---|---|---|
| id | text PK | `Q-0001` |
| tx_hash, chain, asset, amount | | |
| from_address | text | |
| to_deposit_address | text | |
| matched_organization_id | fk null | via deposit-address ownership |
| status | enum | `held` \| `whitelisting` \| `released` \| `returned` |
| wallet_id | fk null | the whitelisting case created for the sender |
| note | text | |
| resolved_by / resolved_at | | |

### 4.8 `risk_tier_limit` (config)
| tier | deposit_monthly_usd | withdrawal_monthly_usd |
|---|---|---|
| low / medium / high | numeric **null = no limit** | numeric **null = no limit** |

### 4.9 Legacy link
`investor.organization_id` (fk). Balances, P&L and FIFO lots stay on the existing investor/ledger tables and are **aggregated per Organization** across its wallets.

---

## 5. State machines

### 5.1 Organization `kyc_status`

```
draft ──submit──▶ submitted ──assign──▶ in_review
                                         │
             ┌───────────request_info────┤
             ▼                           │
      info_requested ──resubmit──▶ submitted
                                         │
                      reject ◀───────────┤
                        ▼                │ approve (risk ≠ high)
                    rejected             ├──────────────────────▶ approved
                                         │ approve (risk = high)
                                         ▼
                                  second_approval ──approve (different officer)──▶ approved
                                         └──reject / request_info──▶ rejected / info_requested

approved ──freeze──▶ frozen ──unfreeze──▶ prev_status
approved ──force_rekyc / annual due──▶ info_requested (kind = forced/annual)
```

Rules:
- `draft`: the client is still filling in onboarding in the main app.
- `submitted → in_review` happens when a reviewer opens or claims the case.
- **Four-eyes:** when `risk_tier = high`, the first approval moves the case to `second_approval`. Only a **different** user with `kyc.approve` can give the final approval. Enforce this server-side: `second_approval_by != first_approval_by`.
- `rejected` is terminal for that Organization. A new attempt needs a new Organization or an admin reopen (v2).
- On `approved`, set `approved_at`, `next_review_at = approved_at + interval`, and the primary wallet moves to `cooldown` (§5.2).

### 5.2 Wallet `status`

```
(primary, during KYC)            pending_kyc ──org approved──▶ cooldown ──48h──▶ active
(linked by ops / quarantine)     awaiting_email ──signatory confirms──▶ awaiting_connect
                                 awaiting_connect ──wallet signs in on main app──▶ review
                                 (if the signature already exists, skip straight to review)
                                 review ──approve──▶ cooldown ──48h──▶ active
                                 review ──reject──▶ removed
active|cooldown ──freeze──▶ frozen ──unfreeze──▶ prev_status
active|cooldown ──remove──▶ removed
org frozen ⇒ every active|cooldown|review wallet → frozen (store prev_status)
org unfrozen ⇒ restore each wallet's prev_status
```

- `cooldown_ends_at = approved_at + whitelist_cooldown_hours`. A scheduled job flips `cooldown → active`.
- **Re-adding a removed wallet** restarts the full linking flow and a new cool-down.

### 5.3 Quarantine `status`

```
held ──matched org approved──▶ whitelisting (creates wallet case, source = quarantined_deposit)
whitelisting ──wallet becomes active──▶ released (credit funds to the Organization)
held|whitelisting ──ops "return to sender"──▶ returned (minus network fee)
```

---

## 6. Main-app access gating

Gating is evaluated **per request**, server-side. Never trust the client.

| Condition | View balances | Deposit | Trade / invest | Withdraw |
|---|---|---|---|---|
| Unknown wallet (no Organization) | onboarding only | ✕ | ✕ | ✕ |
| Org `draft` / `submitted` / `in_review` / `info_requested` / `second_approval` | ✓ | ✕ | ✕ | ✕ |
| Org `rejected` | ✓ (read-only + reason) | ✕ | ✕ | ✕ |
| Org `approved`, wallet `pending_kyc` / `awaiting_*` / `review` | ✓ | ✕ | ✕ | ✕ |
| Org `approved`, wallet `cooldown` | ✓ | ✓ | ✓ | ✕ (to this wallet) |
| Org `approved`, wallet `active` | ✓ | ✓ | ✓ | ✓ (only to `active` wallets of the same Organization) |
| Wallet `frozen` | ✓ | ✕ | positions keep running; **no new orders** from this wallet | ✕ |
| Org `frozen` | ✓ | ✕ | **existing positions keep running**; no new investments | ✕ |

Additional rules:
- **Withdrawal destination** must be an `active` wallet of the **same Organization**. Never a third party.
- **Risk-tier limits** (if set) are checked against the Organization's rolling 30-day total across all its wallets.
- Withdrawals above `withdrawal_approval_threshold` (existing system setting, default $1,000) still go through the existing approval queue.
- A forced or annual re-KYC moves the Organization to `info_requested`, so access drops to **view only** until re-approved. Positions keep running.

---

## 7. Onboarding (main app, client side)

Triggered when **an unknown wallet connects**.

1. **Connect & sign in.** The wallet signs a challenge (§9). This creates an `organization(status=draft)` and a `wallet(is_primary, source=main_app_connect, status=pending_kyc, signature_status=verified)`.
2. **Choose type:** Individual / Company / Fund-SPV / Trust-Foundation.
3. **Entity details:** legal name, jurisdiction, registration no, LEI (optional), registered address, **registered email** (verify by OTP).
4. **People:** add UBOs ≥ 25%, directors and authorised signatories (plus trustees, settlor, protector and beneficiaries for trusts). Each person completes ID + liveness + proof of address through a person-level link.
5. **Documents:** upload the required set (below).
6. **Source of funds / wealth:** a declaration plus evidence.
7. **Review & submit**, which sets `submitted`.

The client sees the status and any `info_request_message` / `reject_reason` in the main app.

### Required documents per type

**Individual:** passport or national ID; proof of address (< 3 months); liveness selfie; source-of-wealth declaration; tax residency self-certification.

**Company:** certificate of incorporation; memorandum & articles; register of directors; register of shareholders / UBO chart; proof of registered address (< 3 months); board resolution naming the authorised signatories; source-of-funds declaration. *Per person:* ID, liveness, proof of address.

**Fund / SPV:** certificate of registration; offering memorandum / PPM; fund administrator confirmation; investment management agreement; register of directors; controlling persons / UBO chart; board resolution naming the authorised signatories; source-of-funds declaration.

**Trust / Foundation:** trust deed or foundation charter; certificate of registration; register of trustees / council; settlor / founder ID; protector and beneficiaries (≥ 25% or class description); proof of address (< 3 months); source-of-funds declaration.

---

## 8. Compliance review (PMS)

**Layout:** split view. Documents and People are on the left (list + viewer). The checklist, risk tier and decision are on the right.

### Checklist (all items must be ticked to approve)
**Entity verification** (*Identity* for individuals)
- Registration documents match the public registry (*individual:* the ID document is genuine, valid and matches the applicant)
- Registered address verified, document < 3 months old (*individual:* liveness selfie matches the ID photo)
- Directors and authorised signatories match the board resolution (*individual:* proof of address < 3 months and matches)
- All UBOs ≥ 25% identified and the ownership chart is complete (*trust:* trustees/council, settlor and beneficiaries identified)

**People** (entities only)
- Every UBO, director and signatory has a valid ID, liveness and proof of address

**Screening** (manual)
- Sanctions lists checked (OFAC, EU, UN, UK HMT) for the entity and all people
- PEP check: none, or PEP documented with EDD
- Adverse media search: no material findings

**Source of funds**
- Source of funds / wealth is plausible and evidenced

**Wallet**
- Main-app sign-in signature verified for the primary wallet
- Wallet is self-hosted (not exchange-hosted)
- On-chain history reviewed: no mixer, darknet or sanctioned exposure

Then **Risk tier** (`low` / `medium` / `high`). It is required, and `high` triggers four-eyes.

### Decisions
- **Approve:** enabled only when 100% of checks are ticked and a risk tier is set.
  - Risk `high` and no first approval yet → `second_approval`.
  - Otherwise → `approved`; the primary wallet → `cooldown`.
- **Request info:** a message is required (shown to the client) → `info_requested`. The case leaves the queue.
- **Reject:** a reason is required (shown to the client) → `rejected`. The primary wallet → `removed` (`removed_reason = "KYC rejected"`).

Each tick stores `{by, at}`. For `second_approval`, the second officer sees the first reviewer's ticks pre-filled and may untick anything they disagree with.

**Queue:** oldest first. **SLA 3 days** from `submitted_at` (highlight when breached). Columns: Organization, type, stage, risk, waiting days, reviewer.

---

## 9. Wallet ownership proof (signature spec)

The signature from **main-app sign-in** is the ownership proof. There is no separate step.

| Chain family | Standard | Notes |
|---|---|---|
| EVM | **SIWE / EIP-4361** (EIP-191 personal_sign). Smart-contract wallets (Safe etc.) are verified via **EIP-1271** `isValidSignature`. | Domain-bound message, single-use nonce, `issued-at`, `expiration-time` ≤ 10 min, chain id |
| Solana | **Sign-In With Solana** (ed25519 `signMessage`) | same message fields |
| Bitcoin | **BIP-322** generic message signing | legacy BIP-137 is acceptable for P2PKH only |

Store the full payload (`message`, `signature`, `nonce`, `signed_at`, `chain_id`, verification result) on `wallet.signature_payload`. Nonces are single-use and server-issued.

**Exchange-hosted wallets** cannot produce these signatures, so they are rejected automatically. In the ops "Link wallet" form, choosing *Exchange-hosted* blocks submission.

---

## 10. Linking an additional wallet to an existing Organization

Because **any unknown wallet that connects starts a new onboarding**, adding a wallet to an approved Organization goes through ops.

**Preconditions:** Organization `approved`; the requester is in contact with ops (e.g. by email or the support channel).

1. **Ops → PMS › Organization › Wallets › "+ Link wallet".** Enter chain, address, label and wallet type (*must be self-hosted*). This creates `wallet(source=linked_by_ops, status=awaiting_email, signature_status=awaiting, signatory_email_status=awaiting)`. If the address is already linked to any Organization, block with "Wallet belongs to ORG-xxxx".
2. **Signatory confirmation email** goes to `organization.registered_email`. It contains the wallet address, chain and label, and a single-use confirm link (72 h). The confirming person must be an `organization_person` with the `signatory` role (they select themselves and confirm). Store the evidence. → `signatory_email_status=confirmed`; the status moves to `awaiting_connect` (or `review` if a signature already exists).
3. **The wallet signs in on the main app** using the same challenge as §9. Because the address is pre-registered to the Organization, it **must not** start a new onboarding; it attaches to the existing Organization. → `signature_status=verified`, status `review`.
4. **Compliance approves** in PMS › Organizations › Wallet whitelisting. Approve is enabled only if email is `confirmed`, signature is `verified` and on-chain history is `clean`. → `cooldown` (48 h).
5. The **cool-down ends**, and the wallet becomes `active`.

Reject at step 4 → `removed` with a reason shown to the client.

> Edge case: if a wallet connects before ops has linked it, it creates a **new draft Organization**. Ops should merge it: delete the empty draft and run the linking flow above. Merging (v2) must be audited.

---

## 11. Quarantine (inbound from non-whitelisted senders)

On every inbound deposit:
1. Resolve `to_deposit_address → organization` (deposit addresses are issued per Organization).
2. If `from_address` is an `active` or `cooldown` wallet of that Organization → normal credit.
3. Otherwise → create `deposit_quarantine(status=held)`.
   - If the matched Organization is `approved`: **auto-start whitelisting** of the sender, i.e. create `wallet(source=quarantined_deposit, status=awaiting_email)` and send the signatory confirmation (§10, steps 2–5). Set quarantine `status=whitelisting`.
   - If the Organization is not approved, or nothing matches: stay `held`.
4. When the sender wallet becomes `active` → `released`; credit the funds and notify the client.
5. Ops can **return to sender** at any time (reason required) → `returned`, minus the network fee.

Show a UI rule banner, and a quarantine count in Overview › Needs attention.

---

## 12. Ops controls (PMS)

Every action needs the `kyc.approve` scope and a **reason (≥ 5 chars)**, and writes an audit event.

| Action | Effect |
|---|---|
| **Freeze Organization** | `kyc_status=frozen`, store `prev_status`; all `active`/`cooldown`/`review` wallets → `frozen`. Withdrawals and new deposits blocked; existing positions keep running. |
| **Unfreeze Organization** | restore `prev_status`; wallets frozen by the Organization freeze go back to their `prev_status`. Wallets frozen individually stay frozen. |
| **Freeze wallet** | that wallet only → `frozen`. |
| **Unfreeze wallet** | → `prev_status` (not allowed while the Organization is frozen). |
| **Remove wallet from whitelist** | → `removed`. Re-adding needs the full §10 flow and a new cool-down. A primary wallet can only be removed if another `active` wallet exists. |
| **Force re-KYC** | creates `kyc_review(kind=forced)`; Organization → `info_requested` with the reason as the client message. Access drops to view only; positions keep running. |

---

## 13. Annual re-review

- `next_review_at = approved_at + kyc_review_interval_months` (default 12).
- 30 days before: show in PMS › Organizations › "Re-KYC ≤ 30 days" and notify the client to refresh documents (expired PoA, updated registers, re-screening).
- On the due date: if not re-approved, move to `info_requested` (`kind=annual`), which makes the main app view only.
- The re-approval uses the same checklist. Previously verified, unchanged items may be pre-ticked, but **screening and proof of address must be re-done**.

---

## 14. Configuration (Admin › Config)

Stored in `system_setting`, as with the existing settings.

| key | default | notes |
|---|---|---|
| `whitelist_cooldown_hours` | **48** | 0–168 |
| `kyc_review_interval_months` | **12** | 1–60 |
| `kyc_review_sla_days` | 3 | queue highlighting |
| `signatory_confirm_ttl_hours` | 72 | email link expiry |
| `risk_tier_limit.{low,medium,high}.deposit_monthly_usd` | **blank (no limit)** | |
| `risk_tier_limit.{low,medium,high}.withdrawal_monthly_usd` | **blank (no limit)** | |
| `withdrawal_approval_threshold` | 1000 (existing) | unchanged |

---

## 15. Permissions

| Scope | Grants |
|---|---|
| `investors` (renamed "Organizations (view)") | Organizations tab: list, profile, Quarantine (view) |
| **`kyc.approve`** (new) | KYC review queue, review screen and decisions, Wallet whitelisting queue, link wallet, freeze/unfreeze, remove wallet, force re-KYC, return quarantined funds, Overview "KYC to review" attention item |

Default roles: **Admin** = all; **Compliance** += `kyc.approve`; PM / IR keep view only.
Server rule: the **second approval must be by a different user** than the first.

---

## 16. Audit events

Write each event to the immutable audit log (`actor`, `org_id`, `wallet_id`, `before`, `after`, `reason`, `ip`, `ts`):

`org.created` · `org.submitted` · `org.review_claimed` · `org.check_ticked` / `org.check_unticked` · `org.risk_set` · `org.info_requested` · `org.first_approval` · `org.approved` · `org.rejected` · `org.frozen` · `org.unfrozen` · `org.rekyc_forced` · `org.rekyc_due` · `wallet.connected` · `wallet.signature_verified` · `wallet.linked` · `wallet.signatory_email_sent` · `wallet.signatory_confirmed` · `wallet.approved` · `wallet.rejected` · `wallet.cooldown_started` · `wallet.activated` · `wallet.frozen` · `wallet.unfrozen` · `wallet.removed` · `deposit.quarantined` · `deposit.whitelisting_started` · `deposit.released` · `deposit.returned` · `config.changed`

---

## 17. Notifications

| Event | PMS (bell + Overview › Needs attention) | Client (main app + email) |
|---|---|---|
| KYC submitted | "KYC cases to review" (+ count) | confirmation |
| Second approval needed | "KYC case needs 2nd approval" | — |
| Info requested | — | message + required action |
| Approved | — | approved; cool-down end time |
| Rejected | — | reason |
| Wallet linked | — | signatory email |
| Wallet active | — | "wallet whitelisted" |
| Deposit quarantined | "Quarantined deposits" | "funds held, verify sender" |
| Re-KYC due ≤ 30 d | list filter | reminder |
| Frozen / unfrozen | audit | notice (reason optional, decided by compliance) |

---

## 18. Suggested API (PMS backend)

```
GET    /orgs?status=&risk=&due=            list + counts per filter
GET    /orgs/:id                           profile (people, docs, wallets, investments, activity)
POST   /orgs/:id/claim                     → in_review
PUT    /orgs/:id/review                    { checklist, risk_tier, notes }   (autosave)
POST   /orgs/:id/approve                   → second_approval | approved
POST   /orgs/:id/request-info              { message }
POST   /orgs/:id/reject                    { reason }
POST   /orgs/:id/freeze | /unfreeze        { reason }
POST   /orgs/:id/force-rekyc               { reason }
POST   /orgs/:id/wallets                   link wallet { chain_family, address, label, custody:"self" }
POST   /wallets/:id/approve | /reject      { reason? }
POST   /wallets/:id/freeze | /unfreeze | /remove   { reason }
GET    /quarantine
POST   /quarantine/:id/return              { reason }
GET    /kyc/queue  ·  GET /wallets/queue
```

Main app:
```
POST /auth/challenge  { address, chain_family } → { message, nonce }
POST /auth/verify     { message, signature }    → session + org/wallet status
GET  /me/access                                 → gating matrix result (§6)
POST /onboarding/*                              steps 2–7
GET  /signatory/confirm/:token                  → confirm page (select signatory, confirm)
```

Scheduled jobs: cool-down expiry (every minute); re-KYC due scan (daily); signatory token expiry (hourly).

---

## 19. Migration plan

1. For each legacy `investor` (wallet): create an `organization(status=draft, migrated_from_investor_id, name = investor.name)` and a `wallet(is_primary, source=main_app_connect, status=pending_kyc, signature_status=awaiting)`. The signature is captured at the next main-app sign-in.
2. Set `investor.organization_id`. Balances and P&L aggregate per Organization.
3. Gating applies immediately: legacy wallets are **view only until KYC is approved**. Existing positions keep running.
4. Notify all legacy investors with a KYC call to action. Show migration progress (done / total) in PMS › Organizations.
5. Where several legacy wallets belong to one real-world entity: complete KYC on one, then attach the others via §10 (signatory confirmation + sign-in). Delete their empty draft Organizations (audited).

---

## 20. Edge cases & validation

- An address can belong to **only one** Organization. Uniqueness is on (`chain_family`, normalised `address`).
- EVM addresses are case-insensitive. Normalise to checksum for display and lowercase for comparison.
- Smart-contract wallets (Safe) need EIP-1271 verification and may sign through a module. Support both.
- The registered email changes → old pending signatory tokens are invalidated. Email changes require re-verification by ops.
- A signatory leaves the company → ops removes the role. Pending confirmations from them are invalidated.
- A person is PEP → allowed with EDD. Force risk `high`, which means four-eyes.
- Document expiry (ID or PoA) during the approved period → flag on the profile; no access change until the annual review unless compliance forces a re-KYC.
- Cool-down: a withdrawal to a `cooldown` wallet is rejected with the time remaining.
- Withdrawal to a wallet of a *different* Organization → always rejected.
- Freeze during a pending withdrawal → cancel it if not yet broadcast; record the reason.
- Quarantine with no matching Organization → stays `held`; ops returns it to the sender.

---

## 21. PMS screen map (prototype → implementation)

| Screen | Prototype component | Purpose |
|---|---|---|
| Organizations list | `page-orgs.jsx › OrgsList` | migration banner; filter tiles (All / Needs review / Waiting on client / Approved / Re-KYC ≤ 30d / Frozen); table |
| Organization profile | `page-orgs.jsx › OrgProfile` | header + ops actions; 10-step progress tracker; tabs Overview · People · Documents · Wallets · Investments · Activity |
| Link wallet modal | `page-orgs.jsx › KycLinkWalletModal` | §10 step 1; blocks exchange-hosted wallets |
| KYC review queue | `page-kyc-queues.jsx › KycReviewQueue` | §8 queue, SLA |
| KYC review screen | `page-kyc-queues.jsx › KycReviewScreen` | split view, checklist, risk, decisions, four-eyes |
| Wallet whitelisting | `page-kyc-queues.jsx › WalletQueue` | §10 steps 2–5 |
| Quarantine | `page-kyc-queues.jsx › QuarantineView` | §11 |
| Config | `pages.jsx › AdminConfigTab` | §14 |
| Overview hooks | `page-dashboard.jsx` (Organizations block + Needs attention) | counts |
| Permissions | `permissions.js` | §15 |

---

## 22. Out of scope (v1) / future

- An automated sanctions/PEP API and a KYC vendor (keep a `screening_provider` abstraction).
- Automated on-chain risk scoring (Chainalysis / TRM). Today it is a manual reviewer check.
- Logins for Organization people (CFO etc.) with their own roles.
- Self-serve "add another wallet" from an already-whitelisted wallet (dual-signature flow).
- Travel Rule for exchange-hosted wallets (exchange wallets are not allowed in v1).
- Merging duplicate draft Organizations through the UI.
