# Production readiness audit — Phase 5 final review

Date: 2026-09-19
Branch: `audit/production-readiness-2026-09-15`

## Review result

The Phase 2–4 diff was re-reviewed for unintended public data exposure,
cache ownership, invalidation, database grants, and frontend regressions.
`git diff --check`, ESLint, Vitest, the local PostgreSQL 17 migration reset,
seven pgTAP suites (69 assertions), the production Vite build, and a
Playwright public-route/mobile smoke test pass.

The smoke test verified metadata on `/`, `/games`, `/contact`, and `/search`,
static robots/sitemap delivery, canonical URLs, Open Graph title/description,
and the mobile Contact textarea's non-resizable layout. The local Turnstile
widget was unavailable because the configured site key does not allow
`127.0.0.1`; that is expected until a local-development key is configured.

## Remaining release blockers

| Severity | Path/system | Finding | Required resolution |
| --- | --- | --- | --- |
| CRITICAL | Hosted Supabase database | The linked project still contains the legacy two-argument `get_game_leaderboard`, `rls_auto_enable`, and legacy tables. The new migrations are tested locally but intentionally not deployed. | Apply migrations `20260915165203`, `20260915165213`, and `20260915165722` to the linked project, then rerun advisors. |
| CRITICAL | Supabase Edge Functions / Dashboard | `feedback` is not deployed or configured. Contact delivery requires `TURNSTILE_SECRET_KEY` and `DISCORD_FEEDBACK_WEBHOOK_URL`, which must remain function secrets. | Set the listed secrets, deploy `feedback`, and make a real production-origin submission. |
| HIGH | Supabase Auth Dashboard | Leaked-password protection is disabled in the linked project. | Enable leaked-password protection before launch. |
| HIGH | `supabase/functions/media/index.ts` | Direct R2 signed uploads validate only declared MIME type, not image bytes or a server-enforced byte limit; R2 replacement/orphan lifecycle remains operational rather than transactional. | Add verified-upload processing or a trusted upload proxy, enforce a byte limit, and schedule an orphan inventory/cleanup process. |
| HIGH | `frontend/src/hooks/useGames.ts`, `frontend/src/hooks/useProfileFollows.ts` | Catalogue aggregate sorting and follower/following reads can grow unbounded. | Add measured, bounded database pagination/aggregate read models before those datasets grow. |
| MEDIUM | `supabase/functions/feedback/index.ts`, `supabase/migrations/20260915165213_add_feedback_rate_limit.sql` | No Edge-runtime contract tests; hashed rate-limit rows have no retention job. | Add Edge tests for CORS, Turnstile failure, webhook timeout/failure, and origin handling; schedule bounded retention cleanup. |
| MEDIUM | `supabase/migrations/20260913094117_add_leaderboard_queries.sql` | Existing global leaderboard `SECURITY DEFINER` functions remain advisor warnings and perform full-ranking scans. | Validate representative-data `EXPLAIN ANALYZE`; document the hidden-badge security rationale or introduce maintained score projections only if measured. |
| MEDIUM | `tests/login_flow.py` | The existing E2E test refers to obsolete `/rankings`, `/friends`, and `/billing` destinations. Desired mobile-menu behavior is not inferable from current routes. | Confirm intended destinations, then update the E2E flow. |

## Non-blocking accepted tradeoffs

- Per-game public leaderboard responses are cached only in the browser for 30
  seconds and are explicitly invalidated after badge and CMS mutations. This
  is a safe, bounded staleness window; no user-specific responses enter that
  cache.
- Route splitting removed large route modules from the initial graph. The
  initial vendor chunk remains about 548 kB minified; investigate manual
  vendor splitting only after bundle profiling identifies a material target.
- The local database plan confirms migration reproducibility and existing
  supporting join indexes. No speculative index was added for the new
  bounded leaderboard RPC while tables are empty.

## Hosted advisor interpretation

The final read-only advisor run reflects the currently deployed database, not
the local migration state. Its legacy `badges`, `user_favorited_games`,
`rls_auto_enable`, and two-argument `get_game_leaderboard` warnings are
expected until the release-blocking migrations are applied. The
`account_deletion_requests` no-policy finding is intentional: RLS is enabled,
no browser roles receive table grants, and only service-role code accesses it.
