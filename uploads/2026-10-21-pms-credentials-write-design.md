# PMS credentials write path — Design (backend-fastapi part of pms-backend M8)

2026-10-21 · owner: Kos · status: **draft, awaiting owner approval** (process step 0)

The cross-repo design is `pms-backend/docs/superpowers/specs/2026-10-21-m8-subaccount-credentials-design.md`
(the master spec: goal, flow, pms-backend and pm-system parts, owner flags F1–F10). This file is
the backend-fastapi slice, self-contained enough to plan and review here. Binding external rules:
`kemely-infra/docs/env-segregation.md` R1–R13 and its "Safety rules for Claude Code".

## Goal

Let pms-backend's service identity `pms_bot` (role `pms_service`) store an exchange sub-account
API key through `POST /v1/sub-accounts/{id}/credentials/` and read its non-secret status, through
a NEW write-only scope `sub_account:credentials_write`. pms_bot must never be able to read a
plaintext key: it keeps lacking `exchange:network_sync`, `admin` and `secret:export`. admin-panel
and the bots keep working unchanged.

Before pms-backend can send a key, this repo must also stop the existing plaintext leaks on the
credentials POST:
- **E6:** `admin_action_log.body_summary` stores `api_key` and `api_passphrase` in clear, and pms_bot reads that table through `admin:read`.
- **E7:** 422 bodies echo `input`.
- **E8:** `CredentialSetRequest` reprs print the plaintext.

## Facts (file:line)

- **Storage:** `backend/models/sub_account.py:31-36`; Fernet with one `ENCRYPTION_KEY` in `backend/utils/encryption.py:21-42`.
- **Routes in `backend/api/routes/sub_account.py`:**
  - status GET `:75-100`, which never decrypts;
  - POST `:103-128`, an unconditional overwrite. An empty passphrase becomes NULL, and `api_key_created_at` is set to now;
  - plaintext GET `:131-172`, which logs `[secret-export]`;
  - DELETE `:175-196`.
  - All four sit on `exchange:network_sync` (`:78,106,134,178`).
- **Scope grammar** (`backend/api/acl.py`):
  - `a|b` is any-of (`:72`); two arguments are all-of (`:224-236`).
  - `admin` bypasses every check (`:70`).
  - `admin:read` satisfies `admin` on GET/HEAD only (`:53,79`).
  - `admin:strict` (`:55-61`).
  - Scopes are re-read per request (`:105-111`).
- **Who holds `exchange:network_sync`:** role `cex_credential`, which is basis_bot, candle_sniper, transfer_service_bot and xbridge (`alembic/versions/m064_service_role_split_phase1.py:55,68-73`). The memberless `service` role still links it (`m065_service_role_split_phase2.py:25-28`).
- **pms_service:** the 27 scopes of `m067_pms_service_account.py:24-33`, pinned by `tests/test_pms_service_account.py:6-31`. The FORBIDDEN set is at `:16`.
- **Migration head:** `m073` (`m073_drop_system_catalog.py:19-20`).
- **Audit middleware:**
  - It stores a body for every mutating request under `/v1/sub-accounts`, 403 and 422 included (`backend/middleware.py:46-57,100-104,143,151-156,203`).
  - The scrub words are only `password|token|secret|signature` (`:117-124`), and the value regex stops at an escaped quote.
  - The read route is `backend/api/routes/admin_action_log.py:12-15,52`.
  - Rows are fanned out at `backend/services/admin_action_tail.py:46-64`.
- **Exception handling:** no `RequestValidationError` handler; only the generic one (`backend/main.py:377-390`).
- **Rate limiter:** `backend/services/rate_limiter.py`. `limit_key` with `fail_closed=True` exists; `rate_limit_user` fails open (`:71-76,95-99`).
- **Existing credential tests:** only `tests/test_secret_export_scope.py:33-41`. No POST or DELETE tests.
- **Consumers:**
  - admin-panel@master `src/api/subAccounts.ts:27-38`: POST, status and DELETE, all as admin.
  - xbridge-connector: `src/http/admin.rs:285-305` (POST with `exchange:network_sync`) and `src/keystore/mod.rs:285` (GET).
  - basis-bot: `src/services/BackendAPI/BackendAPI.ts:184` (GET).
  - candle-sniper: `src/services/BackendAPI.ts:331-333` (GET).
  - transfer-service: POST wrapper `src/services/BackendAPI/BackendAPI.ts:629-647`, with no call site.

## Design

1. **Scope and migration.** `m074_pms_credentials_write_scope.py` (`revision='m074'`, `down_revision='m073'`), in the m070 pattern:
   - Insert `sub_account:credentials_write` with `ON CONFLICT (name) DO NOTHING`.
   - Link it to `pms_service` only.
   - The downgrade removes the link, then the scope.
   - No `scope_ver` bump.
2. **Guards as named constants** in `routes/sub_account.py`:
   - `CRED_READ_PLAINTEXT = 'exchange:network_sync'` on the plaintext GET. This is unchanged. A comment says never to add `admin|` or the write scope here.
   - `CRED_WRITE = 'exchange:network_sync|sub_account:credentials_write'` on POST.
   - `CRED_STATUS = 'exchange:network_sync|sub_account:credentials_write'` on status.
   - DELETE is unchanged (`exchange:network_sync`). pms-backend does not clear keys in M8 (master flag F3).
3. **No body in the audit table for credential paths.** The middleware stores the fixed `"[credentials withheld]"` for `/v1/sub-accounts/{id}/credentials/` (with or without the trailing slash). The scrub words widen to `key|secret|passphrase|password|token|signature|credential|mnemonic|seed`, and the value regex handles escaped quotes.
4. **No echo.** A `RequestValidationError` handler drops `input` and `ctx` from 422 bodies on the credential paths. Every other route keeps today's 422 shape; a global change is deferred.
5. **No plaintext in reprs.**
   - `CredentialSetRequest` takes `api_key: SecretStr`, `api_secret: SecretStr`, `api_passphrase: SecretStr | None` and `ip_restricted: bool = False`.
   - `model_config = ConfigDict(hide_input_in_errors=True)`.
   - Lengths are bounded: 1–512 for the key and secret, 0–256 for the passphrase.
   - There is no `extra='forbid'`, so today's bodies stay valid.
   - `.get_secret_value()` is called only at `encrypt_value`.
6. **Exchange rule.** When `exchange.name` (lower-cased) is `okx`, a non-empty passphrase is required. The 422 names the field and never the value. This applies to every caller (master flag F5).
7. **Attribution log.** POST logs `[secret-write] sub=<id> by=<caller> passphrase=<bool> ip_restricted=<bool> request_id=<X-Request-ID>`, with no values and no hashes.
8. **Rate limit.** POST is limited to 20 per principal per hour through `limit_key(..., fail_closed=True)`, answered 429.
9. **Data migration** `m075_redact_credential_audit_rows.py` sets `body_summary = '[credentials withheld]'` on every existing `admin_action_log` row whose path matches the credentials routes. It is irreversible by design: the downgrade is a no-op, with a docstring that says so. Master flag F4; **ASK KOS**.
10. **Docs.**
    - Fix CLAUDE.md lines 37-39 and 61: prod deploys from `v*` tags, not the `prod` branch.
    - Document the four credential routes and their scopes.
    - Add the rotation procedure (master spec §3.5) to `docs/DEPLOY_RUNBOOK.md` or a new ops doc.
    - Record the consumer notes and owner decisions.

## Security invariants and their tests (fail first)

| # | Invariant | Test |
|---|---|---|
| B1 | pms_bot GET plaintext → 403 (existing key and unknown id) | seeded pms_bot login; route-table pin that the GET's scopes equal `['exchange:network_sync']` |
| B2 | pms_bot POST → 200 (round-trip decrypt) and status → 200 | seeded pms_bot |
| B3 | admin, an `exchange:network_sync` token and xbridge-shaped Binance/OKX bodies still → 200 on POST and status; the existing GET test is still green | `_grant` tokens, `admin_api` |
| B4 | No sentinel value in `admin_action_log.body_summary` (POST, 403, 422), in 422 bodies, in `caplog` or in `repr(body)`; m075 redacts old rows | sentinel strings |
| B5 | OKX without a passphrase → 422 naming the field, no value echoed | — |
| B6 | 21st POST in an hour → 429 | — |
| B7 | m074 links only `pms_service`; downgrade then upgrade is clean; one head; `upgrade head` on a fresh DB | the test_mpi_m0_policy pattern |

## Consumers

All compatible:
- the any-of strings keep `exchange:network_sync` and the admin bypass;
- the POST schema only gains bounds and `SecretStr`;
- the plaintext GET is untouched.

One behaviour change (flag F5): an OKX POST without a passphrase is now a 422 instead of a silently broken key.

## Deploy

This repo goes first. Merge (**ASK KOS**) → the test deploy runs m074 and m075 at container start → I check `/health`, pms_bot's scopes and the 403 probe → Kos tags `v<next>` on the tested commit. No new environment variable and no secret change.
