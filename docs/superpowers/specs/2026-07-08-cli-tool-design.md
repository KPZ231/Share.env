# CLI tool for env.Share — design

Date: 2026-07-08

## Goal

A CLI (`envshare`) that lets a developer:
1. Authenticate against the env.Share webapp.
2. List environments they have access to.
3. `git clone` the repo linked to an environment, then automatically fetch and write the decrypted `.env` file into the cloned folder, prompting for whatever protection-level credentials the environment requires (password / TOTP / access key).

## Non-goals (v1)

- WebAuthn/passkey unlock from the CLI (no browser context available). Environments whose only 2FA method is a passkey show a message pointing the user to the web app.
- Editing/uploading env files from the CLI (read-only).
- Windows-specific credential-manager integration — local token file with restricted permissions is enough for v1.

## Architecture

### 1. Device code auth flow

New Prisma model `CliDeviceAuth`:
- `id`, `deviceCodeHash` (sha256, raw code returned once), `userCode` (short, human-typeable, unique, indexed), `status` (`pending` / `approved` / `denied`), `userId` (nullable until approved), `expiresAt` (10 min TTL), `createdAt`.

New Prisma model `CliToken`:
- `id`, `tokenHash` (sha256 of a 256-bit `randomBytes` token, same pattern as `lib/tokens.ts`), `userId`, `label` (optional, e.g. hostname), `createdAt`, `lastUsedAt`, `revoked`.

Flow:
1. `POST /api/cli/device/start` — creates `CliDeviceAuth`, returns `{ deviceCode, userCode, verificationUrl, expiresIn }`.
2. CLI opens `verificationUrl` in the user's browser (falls back to printing the URL).
3. User logs into the webapp (existing Supabase session) and lands on `app/[locale]/(app)/cli/authorize/page.tsx`, which shows the `userCode` for confirmation and an Approve/Deny action (Server Action).
4. Approving issues a `CliToken` for that user tied to the `CliDeviceAuth` record, and flips its status to `approved`.
5. CLI polls `POST /api/cli/device/poll` every few seconds until status is `approved` (returns the raw token once) or `denied`/expired (returns an error).
6. CLI writes `{ token, apiUrl }` to `~/.envshare/config.json`, permissions restricted to the owner.

### 2. New API routes (`app/api/cli/*`)

All require `Authorization: Bearer <token>`, resolved by hashing and looking up `CliToken` (must be `revoked: false`), which resolves to a `userId` used for all subsequent Prisma queries (still scoped manually to that user's workspace memberships — Prisma bypasses RLS, so every query here must explicitly filter by membership, same discipline as `lib/share-links.ts`).

- `GET /api/cli/environments` — lists env files across workspaces the user belongs to: `{ id, name, workspaceName, protectionLevel, githubOwner, githubRepo }`.
- `POST /api/cli/environments/:id/unlock` — body `{ password?, totpCode?, accessKey? }`. Delegates to a shared verification helper (see below). Returns a short-lived (~60s) unlock token on success.
- `GET /api/cli/environments/:id/download` — for `protectionLevel: none`, works with just the bearer token; otherwise requires a valid unlock token from the previous step (query param or header). Returns the decrypted `.env` as `text/plain`. Rate-limited per user (reuse whatever limiter pattern exists for other public-ish endpoints, or add a minimal in-memory/Upstash limiter if none exists yet — confirm during planning).

### 3. Shared unlock logic

Extract the password + TOTP (+ access key) verification currently inline in `lock-actions.ts` into `lib/env-unlock.ts`, exporting plain functions (`verifyPassword`, `verifyTotp`, `verifyAccessKey`) that both the existing Server Actions and the new API route call. No behavior change for the web flow — pure extraction.

### 4. CLI package

New `cli/` workspace (Node/TS, bin name `envshare`), commands:
- `envshare login` — runs the device flow above.
- `envshare logout` — calls a revoke endpoint (or Server Action reachable via API) to flip `CliToken.revoked`, deletes local config.
- `envshare list` — calls `GET /api/cli/environments`, prints a table.
- `envshare clone <env-id>` — looks up the environment, `git clone git@github.com:{githubOwner}/{githubRepo}.git` (shell out to system `git`), `cd`s into the resulting folder, runs the same unlock+download flow as `pull`, writes `.env`.
- `envshare pull` — run from inside an already-cloned repo. Reads `.envshare` (JSON: `{ environmentId }`) from the repo root if present, otherwise prompts once and writes it. Prompts for credentials per protection level, downloads, writes `.env`.

Credential prompting: password via masked stdin prompt, TOTP via plain 6-digit prompt, access key via masked prompt. Never logged, never written anywhere but the request body.

### 5. Security

- Device code and user code are single-use and expire in 10 minutes.
- `CliToken` stored hashed only; raw value shown once at login, never retrievable again.
- `~/.envshare/config.json` written with `0600` permissions (best-effort on Windows).
- `.env` content is never logged by the CLI or the API route (consistent with the existing "never log secrets" rule).
- API routes reuse the existing protection-level verification rather than re-implementing it, so the security guarantees stay in one place.

## Testing

- `lib/env-unlock.ts`: unit-testable pure functions — add a minimal self-check (per project convention, no test framework currently exists — a small `tsx`-runnable script similar to `lib/tokens.ts`'s self-check is enough).
- API routes: manual verification via `curl`/CLI against a dev environment for each protection tier (none / password_2fa / password_2fa_key) and the device-auth happy/denied/expired paths.
- CLI: manual run of `login → list → clone → pull` against local dev server.

## Open questions for planning phase

- Confirm whether a rate-limiting primitive already exists anywhere in the codebase to reuse for `/api/cli/*`, or whether a minimal one needs to be added.
- Confirm git clone protocol default (SSH vs HTTPS) — likely SSH given `githubOwner`/`githubRepo` fields, but the CLI should let the user pick/override.
