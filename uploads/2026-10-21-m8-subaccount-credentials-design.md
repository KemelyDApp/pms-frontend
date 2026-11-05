# M8 — Exchange sub-account API keys through PMS — Design

2026-10-21 · owner: Kos · status: **draft, awaiting owner approval** (process step 0)

Repos: `pms-backend` (this spec), `backend-fastapi` (its part is mirrored in
`backend-fastapi/docs/superpowers/specs/2026-10-21-pms-credentials-write-design.md`),
`frontend-mono` (`apps/pm-system`). Binding external rules: `kemely-infra/docs/env-segregation.md`
R1–R13 and its "Safety rules for Claude Code".

## 1. Goal

Kos creates an API key by hand on Binance or OKX for a trading sub-account (prod:
`candlehunter1`, `candlehunterusdc2`; test: `testcandlehunter*`; one Binance master account serves
both environments; the Broker API answers -1002, so the key cannot be minted). He pastes it into
pm-system instead of admin-panel. pm-system sends it over the PMS socket. pms-backend checks the
admin scope and a per-command TOTP code, and passes the key straight through to backend-fastapi.
backend-fastapi stores it Fernet-encrypted on `sub_account`, as it does today for admin-panel.

The key, secret and passphrase are never persisted, logged, published or echoed by pms-backend or
pm-system. pms_bot (pms-backend's backend identity) gains a write-only path and can still never
read a plaintext key.

**Out of M8:** clearing a key from PMS (`.clear`, owner flag F3); minting keys exchange-side
(`api_key.rotate` stays a stub); checking a key against the exchange before storing it; HTTPS for
pm-system (owner flag F6); xbridge or bot cache invalidation; ENCRYPTION_KEY rotation. Each one is
in §9 Deferred, with the place it goes.

## 2. What exists today (verified, file:line)

| # | Fact | Evidence |
|---|---|---|
| E1 | Keys live in `sub_account.api_key_enc / api_secret_enc / api_passphrase_enc` (Fernet, one `ENCRYPTION_KEY`), plus `api_key_created_at` (the time of storage, not of creation on the exchange) and `api_ip_restricted` (as claimed by the caller, never checked) | backend-fastapi `backend/models/sub_account.py:31-36`, `backend/utils/encryption.py:21-42`, `backend/api/routes/sub_account.py:121-125` |
| E2 | Four routes: status GET `:75-100` (never decrypts), POST `:103-128` (unconditional overwrite; an empty passphrase stores NULL), plaintext GET `:131-172` (logs `[secret-export] … exported by=<caller>`), DELETE `:175-196` | backend-fastapi `backend/api/routes/sub_account.py` |
| E3 | All four require `exchange:network_sync`. That scope sits on role `cex_credential` (basis_bot, candle_sniper, transfer_service_bot, xbridge), not on every bot: orchestrator_bot and pms_bot lack it. `admin` passes every check by bypass, which is how admin-panel reaches them | `sub_account.py:78,106,134,178`; `alembic/versions/m064_service_role_split_phase1.py:55,68-73`; `backend/api/acl.py:70` |
| E4 | Scope strings: `a|b` is any-of (`acl.py:72`); two arguments are all-of (`acl.py:224-236`). `admin:read` stands in for a required `admin` on GET/HEAD only (`acl.py:53,79`). `admin:strict` is satisfied only by real `admin` (`acl.py:55-61`). Scopes are re-read from the DB on every request (`acl.py:105-111`) | backend-fastapi `backend/api/acl.py` |
| E5 | pms_bot holds exactly role `pms_service` with the 27 scopes of m067 (`admin:read` plus explicit writes), pinned by `tests/test_pms_service_account.py:6-31`; FORBIDDEN includes `admin`, `secret:export`, `exchange:network_sync` (`:16`). Migration head is `m073` | backend-fastapi `alembic/versions/m067_pms_service_account.py:24-33`, `m073_drop_system_catalog.py:19-20` |
| E6 | **Existing leak.** `AdminActionLogMiddleware` stores a `body_summary` for every POST/PUT/DELETE under `/v1/sub-accounts`, 403/422 included. Its scrub masks only keys containing `password|token|secret|signature`, so on a credentials POST the `api_secret` is masked but **`api_key` and `api_passphrase` are stored in plaintext**. `GET /v1/admin-action-log/` requires `admin`, which pms_bot's `admin:read` satisfies on GET; rows also go out on the `admin-realtime` Redis channel. pms-backend polls that endpoint every 10 s and scrubs on ingest | backend-fastapi `backend/middleware.py:46-57,100-104,117-124,143,151-156,203`; `backend/api/routes/admin_action_log.py:12-15,52`; `backend/services/admin_action_tail.py:46-64`; pms-backend `pms_backend/projections/platform_audit.py:322-353` |
| E7 | **422 echo.** No `RequestValidationError` handler exists, so a malformed credentials POST gets back a 422 whose `detail[].input` holds the submitted body (key and passphrase included) | backend-fastapi `backend/main.py:377-390`; fastapi 0.115.8 (`uv.lock:705-706`) |
| E8 | `CredentialSetRequest` is a plain `BaseModel` with `str` fields: its repr, and any Sentry frame locals, print the plaintext | backend-fastapi `sub_account.py:59-63` |
| E9 | pms-backend's stub `api_key.rotate`: scope `admin`, `StepUp.per_command`, `money_path=True`, `implemented=False`, args `{sub_account_id}` only | pms-backend `pms_backend/contracts/commands/admin.py:222-223,382-393` |
| E10 | The command ladder never logs `frame.args`; audit rows never carry args; validation details are `loc/msg/type` only. But the idempotency entry stores an **unsalted sha256 of the canonical args** in Redis (persisted to `dump.rdb`), and with `PMS_LOG_LEVEL=DEBUG` the websockets library logs the head and tail of every frame through `uvicorn.error` | pms-backend `ws/commands.py:459-487,1272-1330`; `ws/idempotency.py:167-172,179-189`; `deploy/compose.prod.yml:44-46`; `logging_setup.py:117-119` |
| E11 | Upstream writes go through `BackendClient.write` → `http.send_once`: one send, the body never logged, `WriteOutcome.body` kept out of repr and logs | pms-backend `upstream/backend.py:796-850`, `upstream/http.py:547-603,656-675` |
| E12 | pm-system already has the `admin.keys` topic (rows with `sub_account_id`, exchange display name, label, `has_key`, `created_at`, `ip_restricted`, status) and the read-only API-keys table, plus a TOTP-gated command pattern (`AddVenue` → `pmsSocket.command('venue.add', …, {totp})`). No credentials form exists | pms-backend `contracts/topics/admin.py:184-222`; frontend-mono `apps/pm-system/src/pages/Admin/components/UsersAudit/components/TeamKeys/components/ApiKeys/ApiKeys.tsx`, `pages/Admin/components/Counterparties/components/AddVenue/hooks/useAddVenue.ts:11-15` |
| E13 | `admin.keys` emits only when a key's status moves (`missing`/`active`/`rotate-soon`/`expired`), so replacing an active key emits nothing | pms-backend `projections/catalogue.py:891` |
| E14 | pm-system is plain HTTP on the hosts' Tailscale addresses (`ws:`), so the pasted secret is protected on the browser → host hop only by WireGuard. `randomId.ts` exists because `crypto.randomUUID` is unavailable there | frontend-mono `apps/pm-system/src/shared/services/pmsSocket/utils/randomId.ts:1-11`, `buildSocketUrl.ts:5` |
| E15 | Key caches downstream: xbridge KeyStore 300 s TTL (`XBRIDGE_KEY_TTL_SECS`), and on a backend error it keeps serving a cached key up to 1 800 s; `invalidate_cex` has no caller. basis-bot caches 30 min. Open Binance user-data streams keep the old auth until they reconnect | xbridge-connector `src/keystore/mod.rs:30,43,135-138,167-208`; basis-bot (consumers report); xbridge `binance/mod.rs:2951-2985` |
| E16 | Prod deploys from release tags only: backend-fastapi `v*`, pms-backend `v*`, pm-system `pm-system-v*`, each requiring the `tested-<sha>` image from the test deploy. The `prod` branch no longer deploys (backend-fastapi's CLAUDE.md still says it does) | backend-fastapi `.github/workflows/docker.yml:7-11,282-304`; pms-backend `.github/workflows/ci.yml:7-12,206-271`; frontend-mono `.github/workflows/pm-system.yml:10-22,95-134` |
| E17 | pms-backend's contract is frozen at 1.1.0; the 1.2.0 proposal waits on owner decision 31; new commands are tier 1.3.0 in its taxonomy | pms-backend `contracts/VERSION`; `docs/design/contract-1.2.0-proposal.md:3-8,19`; `docs/design/owner-decisions.md:138` |

Corrections to the brief: claim 3 ("every bot holds `exchange:network_sync`") is wrong, see E3;
claim 5 ("pms_bot cannot read a plaintext secret today") is wrong for the API key and the OKX
passphrase, see E6; transfer-service's plaintext read is dead code. The full reader reports are in
the M8 gap-analysis notes folded into the plans.

## 3. Design

### 3.1 The flow

```
pm-system (Admin › API keys row › "Set key")
  │  ws: command sub_account.credentials.set {sub_account_id, api_key, api_secret,
  │      api_passphrase?, ip_restricted, replace}  totp=<6 digits>
  ▼
pms-backend ladder: rate limit → scope admin → target firm → reservation (fingerprint WITHOUT
  the secret fields) → per-command TOTP → args (SecretStr, value-free errors) → handler
  handler: fresh admin → PMS sub_account row (exists, active, exchange binance|okx, passphrase
  rule) → GET status (backend) → refuse `conflict` if a key exists and replace=false →
  POST credentials (backend) → GET status → result {sub_account_id, has_key, has_passphrase,
  ip_restricted, created_at} → value-free audit row → after commit: refresh the catalogue
  row, admin.keys key.updated, admin notice
  ▼
backend-fastapi POST /v1/sub-accounts/{id}/credentials/ as pms_bot
  scope `exchange:network_sync|sub_account:credentials_write` → validate (no echo) → Fernet →
  commit → audit row WITHOUT the body → `[secret-write]` log line without values
```

### 3.2 backend-fastapi

1. **New scope `sub_account:credentials_write`.** Migration `m074_pms_credentials_write_scope.py`
   (revises `m073`) creates the scope and links it to role `pms_service` only, in the m070
   pattern. No `scope_ver` bump (scopes are read per request). The pinned set in
   `tests/test_pms_service_account.py` gains it; FORBIDDEN is unchanged.
2. **Route guards as named constants** in `routes/sub_account.py`:
   - `CRED_READ_PLAINTEXT = 'exchange:network_sync'` on the plaintext GET: **unchanged**, with a
     comment never to add `admin|` (which `admin:read` would satisfy) or the write scope.
   - `CRED_WRITE = 'exchange:network_sync|sub_account:credentials_write'` on POST.
   - `CRED_STATUS = 'exchange:network_sync|sub_account:credentials_write'` on the status GET.
   - DELETE stays `exchange:network_sync` (PMS does not clear in M8; flag F3).
   A route-table test pins all four strings.
3. **Leak fixes (ship with, not after, the new scope):**
   - The admin-action middleware stores no body for `/v1/sub-accounts/{id}/credentials/`
     (a fixed `"[credentials withheld]"`). The scrub word list widens to
     `key|secret|passphrase|password|token|signature|credential|mnemonic|seed`, and its value
     pattern handles escaped quotes.
   - A `RequestValidationError` handler drops `input` and `ctx` from 422 bodies on the
     credentials paths. Other routes keep today's 422 shape (global change deferred, §9).
   - `CredentialSetRequest` takes `SecretStr` fields with `hide_input_in_errors=True` and
     bounded lengths; `.get_secret_value()` is called only at `encrypt_value`.
   - POST logs `[secret-write] sub=<id> by=<caller> passphrase=<bool> ip_restricted=<bool>`,
     never a value or a hash of one, plus the caller's `X-Request-ID`.
   - **Data migration `m075_redact_credential_audit_rows.py`** replaces `body_summary` on every
     existing `admin_action_log` row for a credentials path with `"[credentials withheld]"`
     (flag F4: it rewrites audit data).
4. **Validation:** an OKX sub-account requires a passphrase (empty string counts as absent);
   errors name the field, never the value. This applies to every caller (flag F5). No
   `extra='forbid'`, so admin-panel's and xbridge's bodies stay valid.
5. **Rate limit** on POST: 20 per principal per hour, fail-closed (`limit_key`), answered 429.
6. **Docs:** fix CLAUDE.md's stale `prod`-branch lines, add the credential routes and the
   rotation procedure (§3.5) to the docs, and add consumer notes.

### 3.3 pms-backend

1. **New command `sub_account.credentials.set`** (flag F1: `api_key.rotate` stays a stub,
   reserved for an exchange-side mint):
   - scope `admin`, `StepUp.per_command`, `money_path=True`, firm target (unrestricted resource
     scope), with a new `CommandSpec.secret_args = ("api_key", "api_secret", "api_passphrase")`;
   - args `{sub_account_id: int, api_key: SecretStr, api_secret: SecretStr, api_passphrase:
     SecretStr | None, ip_restricted: bool = false, replace: bool = false}`, the model with
     `hide_input_in_errors=True` and value-free bounds (printable ASCII, 8–256 characters for the
     key and secret, 1–128 for the passphrase, no surrounding whitespace);
   - result `{sub_account_id, has_key, has_passphrase, ip_restricted, created_at}`, nothing else;
   - error codes as the registry derives them, plus `upstream_rejected` (money path).
2. **Contract 1.2.0** ships this one command, additive, with its announcement. The pending
   1.2.0 proposal backlog is relabelled 1.3.0, and owner decision 31 stays open for it (flag F2).
3. **Ladder changes:**
   - the reservation fingerprint leaves out `secret_args` fields entirely (nothing derived from a
     secret reaches Redis). The cost: a resend under the same idempotency key with a different
     secret replays the first answer, and pm-system mints a new key per submit;
   - a success replay window of 600 s (`RESULT_TTL_S`), which also keeps the command out of the
     24-hour new-key class;
   - budgets: 5 per user per hour, 20 firm-wide per hour (`COMMAND_BUDGETS`), on top of one
     TOTP step per frame;
   - `setup_logging` pins the `websockets` loggers and `uvicorn.error` at INFO or above, so DEBUG
     can never print frame heads and tails.
4. **Handler** (`ws/handlers/admin_credentials.py`):
   - `fresh_actor(scope="admin")`;
   - load the PMS `sub_account` row: absent, inactive or not `account_type='sub_account'` →
     `not_found`; exchange not binance or okx → `bad_request` ("unsupported exchange"); OKX
     without a passphrase, or Binance with one → `bad_request` naming the field;
   - set `ctx.audit_target = ("sub_account", id)` before any upstream call;
   - read status from backend-fastapi; if `has_key` and not `replace` → `conflict` ("a key is
     already set; confirm the replacement");
   - POST the credentials once (`record=False`), under the money-path upstream budget, shielded;
     2xx → read status again → result; 4xx → `upstream_rejected` with
     `{"upstream_status_code": n}` only; 5xx, timeout or cancel → `upstream_unavailable`
     ("outcome unknown; check the key status before retrying"). `outcome.body` is never read
     past its status, never logged, never returned;
   - `audit_after = {"credential": "set", "replaced": bool, "passphrase": bool,
     "ip_restricted": bool}`; no journal row (an overwrite is idempotent, and the status read
     settles an unknown outcome).
5. **After commit:** upsert the PMS `sub_account` credential columns from the status read;
   `admin.keys` emits `key.updated` whenever `created_at` changes, not only on a status move
   (fixes E13); an in-app notice to `admin` holders, "API key set for <label> (<exchange>)",
   with a link from the existing fixed link vocabulary (the plan picks the route of the API-keys
   table) (flag F7). Every one of these is value-free.
6. **Upstream client:** `set_sub_account_credentials` (POST) and `sub_account_credential_status`
   (GET) wrappers with path templates, sending the command id as `X-Request-ID`.
7. **Host check:** `upstream.pms_bot.scopes` gains `sub_account:credentials_write` (must be
   true) and `exchange:network_sync`, `secret:export`, `is_admin` (must be false; these rows
   FAIL the check, not just inform). A new row GETs
   `/v1/sub-accounts/2147483647/credentials/` as pms_bot and expects 403: a 404 would mean
   pms_bot passed the plaintext gate. `cmd.catalogue` counts the new command.
8. **Docs:** security notes (a "commands that carry secrets" section), the runbook rotation
   procedure (§3.5) and the stale lines the gap analysis found, the contracts README and the
   generated frontend-guide blocks, the 1.2.0 announcement, and owner-decision rows.

### 3.4 pm-system (frontend-mono `apps/pm-system`)

- Admin › Users, keys & audit › **API keys**: a row action "Set key" (or "Replace key" when
  `has_key`), for `admin` holders with TOTP enrolled and the socket live.
- The modal names the target: label, exchange and sub-account id. It shows a warning that the key
  must be IP-allowlisted to this environment's egress address and have withdrawals disabled.
- Fields:
  - API key: text, `autoComplete="off"`;
  - secret: `type="password"`, `autoComplete="new-password"`;
  - passphrase: shown and required when the exchange matches `/okx/i`; the server enforces it
    anyway;
  - an IP-restricted switch;
  - the TOTP code inline.

  All fields have spellcheck and autocorrect off and the password-manager ignore attributes.
- Replacing an existing key needs an explicit confirmation step ("replaces the key set on
  <date>"), which sends `replace=true`.
- The secret never enters the TanStack mutation variables (read from refs at call time,
  `gcTime: 0`), Redux, localStorage, the URL or a query key.
- Every field is cleared on success, cancel, close and unmount. After a failure the fields are
  kept only for `invalid_totp`, `totp_locked`, `rate_limited` and `not_connected`, where the
  secret was never used.
- Errors map to fixed strings; server `message` and `details` are never rendered.
- Success shows the result's date, plus "bots may keep the previous key for up to 30 minutes;
  delete the old key on the exchange only after that".
- A `commandsReady` flag lets the UI merge before pms-backend serves the command.
- No `crypto.randomUUID`; ids from `randomId.ts`.

### 3.5 Rotation procedure (runbook, both repos)

1. Create the new key on the exchange for the right sub-account. Allowlist it to the
   environment's egress IP and disable withdrawals (env-segregation E1).
2. Paste it in that environment's pm-system.
3. Wait until the bots have fetched it. That takes up to 5 min for xbridge and up to 30 min for
   basis-bot, longer for an open user-data stream. Check backend-fastapi's log for
   `[secret-export] sub=<id> exported by=<bot>` after the set.
4. Only then delete the old key on the exchange. Deleting it first stops trading until every
   cache expires.

### 3.6 Security invariants and where each is tested

| # | Invariant | Enforced by | Test (fails first) |
|---|---|---|---|
| S1 | pms_bot can never GET plaintext credentials | plaintext gate unchanged; m074 touches pms_service only | backend: seeded pms_bot GET → 403 for an existing key and for an unknown id; route-table pin; pms host-check 403 probe |
| S2 | pms_bot can POST and read status | `CRED_WRITE`, `CRED_STATUS`, m074 | backend: seeded pms_bot POST → 200, decrypt round-trip; status → 200 |
| S3 | admin-panel and the bots keep working | any-of strings; POST schema unchanged | backend: `exchange:network_sync` token and admin POST/status → 200; existing GET test still green |
| S4 | No credential value in backend-fastapi's audit table, 422 bodies, logs or reprs | §3.2 item 3 | backend: sentinel values absent from `admin_action_log`, 422 bodies, `caplog`, `repr(body)`; m075 redacts old rows |
| S5 | Only `admin` holders with a valid per-command TOTP can set a key | ladder scope + step-up; `fresh_actor` | pms: non-admin → `forbidden`; narrowed admin → `out_of_scope`; missing or wrong code → `step_up_required` / `invalid_totp` |
| S6 | The secret never persists, logs or echoes in pms-backend | `secret_args` fingerprint; SecretStr; value-free audit, result and errors; logger pins | pms: one sentinel test across caplog, `audit_log`, `audit_outbox`, `event_log`, Redis `idem:*`, the result, error frames and notifications, including the upstream 422-echo, 5xx, timeout and bad-args paths |
| S7 | Rate limits hold | pms `COMMAND_BUDGETS`; backend `limit_key` | pms: 6th set in an hour → `rate_limited`; backend: 21st POST → 429 |
| S8 | A replacement is always deliberate | handler `replace` check; the UI confirmation | pms: `has_key` and `replace=false` → `conflict`, no POST sent |
| S9 | pm-system keeps the secret out of stores, URLs and screens | §3.4 | jest: the args builder, the error mapper (never server text), the mutation variables without the secret, the fields cleared on close |

## 4. Rulings

1. Command identity: new `sub_account.credentials.set`; `api_key.rotate` untouched (F1).
2. Contract 1.2.0 = this command only; the backlog becomes the 1.3.0 proposal (F2).
3. No clear or DELETE path through PMS in M8; the backend DELETE guard is unchanged (F3).
4. Status for pms_bot through the write scope, never by widening `admin:read`.
5. The plaintext GET guard is a named constant pinned by a route-table test and a host-check
   probe.
6. The backend audit-body fix, the 422 fix and SecretStr land in the same backend PR as m074,
   before pms-backend can send a key.
7. The fingerprint leaves the secret fields out; success replays for 600 s.
8. No journal before the POST; an unknown outcome is `upstream_unavailable`, and the status read
   is the truth.
9. Exchange rules are checked in pms-backend and in backend-fastapi (OKX needs a passphrase).
10. Every PMS-side notice, audit row and event is value-free; a test enforces it.
11. Deploy order: backend-fastapi, then pms-backend, then pm-system. Each goes master/main → test
    → Kos checks on test with a `testcandlehunter*` sub-account → Kos tags prod.

## 5. Owner flags (defaults taken; Kos may overturn)

| # | Question | Default |
|---|---|---|
| F1 | New command `sub_account.credentials.set`, or widen `api_key.rotate`'s frozen args? | new command |
| F2 | Contract: 1.2.0 with only this command, the old 1.2.0 backlog relabelled 1.3.0? | yes |
| F3 | A "remove key" (`.clear` + backend DELETE scope) in M8? | no, deferred |
| F4 | Redact existing `admin_action_log` credential rows (m075, rewrites audit data)? | yes |
| F5 | OKX passphrase required for every backend caller (admin-panel included)? | yes |
| F6 | pm-system is plain HTTP (breaks R13: internal systems on HTTPS). Send keys over `ws://` inside Tailscale, recorded as exception E2 in kemely-infra (a PR there, ASK KOS), with HTTPS as a follow-up; or keep the form disabled until HTTPS? | accept, record E2 |
| F7 | An in-app notice to every admin on each key set? | yes |
| F8 | Past credential POSTs exposed `api_key` and the OKX passphrase (never the secret) to `admin`/`admin:read` readers. Rotate those keys? | Kos decides; no forced rotation in M8 |
| F9 | Rate limits: pms 5/user/h and 20/firm/h; backend 20/principal/h | as stated |
| F10 | Who may set a key: any role holding `admin`, or bootstrap/owner addresses only? | any `admin` holder |

## 6. Consumers and compatibility

| Change | Consumer | Compatible? |
|---|---|---|
| POST and status accept the new scope as well | admin-panel (admin bypass), xbridge (`exchange:network_sync`), transfer-service, basis-bot, candle-sniper | yes: any-of string, schema unchanged |
| Plaintext GET | xbridge KeyStore, basis-bot, candle-sniper | untouched |
| OKX passphrase now required | admin-panel's "Save key" on an OKX row without a passphrase now gets a 422 naming the field | flag F5 |
| 422 bodies on credential paths lose `input` | any caller parsing them (none found) | yes |
| New PMS command, contract 1.2.0 | pm-system | additive |
| `admin.keys` `key.updated` on a `created_at` change | pm-system | additive (more events, same shape) |

## 7. Deploy and release

1. **backend-fastapi:** PR → CI → merge (**ASK KOS**) → test deploy (m074 and m075 run at
   start) → I check `/health`, the scope rows and the 403 probe on test → Kos tags `v<next>` on
   the tested commit.
2. **pms-backend:** the same; its host check runs after the test deploy. Kos tags `v<next>`.
3. **pm-system:** the same; Kos sets a key for a `testcandlehunter*` sub-account on test
   (`http://100.87.253.3:8083`), checks status and the bot pickup, then tags `pm-system-v<next>`.

I give Kos one prefilled "new release" link per repo (tag, target sha, title, body). Nothing
reaches prod except through his tags. No new GitHub secret is needed: scopes are per request, and
pms_bot's password secrets are unchanged.

## 8. Acceptance on the test host

- backend-fastapi: `/health` OK; pms_bot's `/v1/users/me/scopes/` lists
  `sub_account:credentials_write` and not `exchange:network_sync`.
- pms-backend host check: every row green, including the new negative-scope rows and the 403
  probe.
- Kos, with a dummy-or-real test key on a `testcandlehunter*` sub-account:
  - set it from pm-system with TOTP: success shows the date;
  - the API-keys row updates;
  - backend status shows `has_key`;
  - a second set without the confirmation is refused;
  - with the confirmation it replaces the key;
  - backend `admin_action_log` shows `[credentials withheld]`;
  - the bot logs `[secret-export]` within 30 minutes.

## 9. Deferred (with destination)

- Global 422 `input` stripping; Sentry `include_local_variables=False` / `before_send`;
  `ENCRYPTION_KEY` validated at startup → backend-fastapi deferred findings.
- xbridge `invalidate_cex` hook called after a set; basis-bot shorter cache → inbound asks to
  those repos (ASK KOS to file).
- Compare-and-set (`expected_created_at`) on the backend POST; checking a key with the exchange;
  a masked key hint → M8 deferred findings.
- `.clear` through PMS (F3) → the next credentials milestone.
- HTTPS and a CSP for pm-system (F6) → kemely-infra and frontend-mono.
