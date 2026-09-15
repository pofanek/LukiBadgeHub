# Production readiness audit — Phase 1

Date: 2026-09-15  
Branch: `audit/production-readiness-2026-09-15`

## Scope and evidence

This phase was read-only apart from this audit document and a required temporary architecture report at `/tmp/architecture-review-20260915-184810.html`. It inspected the React/Vite SPA, Supabase migrations/tests, Edge Functions, R2 implementation, deployment files, dependency manifests, and the linked Supabase project.

The linked-project migration history matches the repository through `20260914190252`. Supabase CLI 2.117.0 advisors reported exposed `SECURITY DEFINER` functions, legacy RLS/grant issues, unindexed legacy foreign keys, and disabled leaked-password protection. Catalog queries confirmed the findings. Current production tables contain no data, as provided by the project owner.

## Architecture

- Client-rendered Vite React SPA deployed to Vercel; all application reads/mutations use Supabase directly from the browser.
- Supabase Auth and PostgREST are the data plane. Two Edge Functions (`media`, `delete-account`) use a service-role key only server-side.
- Public media is R2 behind `media.lukibadgehub.com`; unique object paths correctly make immutable one-week caching safe.
- `useGames` and `useLeaderboard` provide an in-tab public query cache. Other user data is intentionally uncached.
- No `CONTEXT.md`, ADRs, API contract, environment template, or deployment runbook exists.

## Plan and findings

### CRITICAL

1. **C-01 — Contact delivery is both nonfunctional and unsafe to repair in the browser.** `frontend/src/utils/webhook.ts:23` reads `import.meta.env.WEBHOOK_URL`, which Vite does not expose to client code because it lacks the `VITE_` prefix. The contact form neither awaits nor handles the failure (`frontend/src/pages/Contact/Contact.tsx:37-75`). Making the secret client-visible would expose an abuseable Discord webhook. **Plan:** replace it with an authenticated/validated server-side endpoint or Supabase Edge Function; verify Turnstile server-side, restrict payload length/content, apply rate limiting, and return explicit status.

2. **C-02 — Legacy public database attack surface remains exposed.** The recovered baseline migrations retain unused `public.badges`, `public.user_favorited_games`, and publicly executable `public.rls_auto_enable()`. The linked database grants broad table privileges to the first two; `rls_auto_enable()` is a `SECURITY DEFINER` function callable by `PUBLIC`/anon/authenticated. None have application call sites. **Plan:** after a final dependency-reference check, remove these empty legacy objects and their grants/policies in a new migration; do not merely add indexes to dead tables.

3. **C-03 — Production auth protection has a known security warning.** Linked Supabase advisors report leaked-password protection disabled. This is Dashboard configuration rather than repository state. **Plan:** enable it in Supabase Auth before launch and record it in the deployment checklist.

### HIGH

1. **H-01 — Game-detail loads all player claims and profiles for a game.** `frontend/src/pages/GameDetail/GameDetail.tsx:417-531` fetches unbounded claims then performs repeated browser filtering. **Plan:** add a parameter-validated, paginated aggregate database function for the top/recent player display plus the viewer's claim ids; move only this data seam and test it.

2. **H-02 — Game-player page duplicates the unbounded aggregation client-side.** `frontend/src/pages/GamePlayers/GamePlayers.tsx:37-102` reads every claim, then every matching profile, and sorts in memory. **Plan:** route it to the same paginated aggregate function; cache public pages for 30 seconds with targeted mutation invalidation.

3. **H-03 — Catalogue experience/badge sorting fetches every match.** `frontend/src/hooks/useGames.ts:129-172` bypasses database pagination for aggregate sorts. **Plan:** use a single SQL aggregate function/query that filters, orders, counts, and pages server-side; retain existing ordinary-sort path.

4. **H-04 — Every route is in the initial JavaScript graph.** `frontend/src/main.tsx:5-66` statically imports large infrequently visited routes, notably `AdminGames`, `GameDetail`, and `Settings`. **Plan:** use route-level lazy imports with one accessible loading fallback; measure build output before/after.

5. **H-05 — The largest route is a 1,493-line monolith.** `frontend/src/pages/AdminGames/AdminGames.tsx` contains data access, media orchestration, cache invalidation, and UI. **Plan:** only while changing its behavior, extract feature-local data/actions and shared media UI; avoid an unrelated rewrite.

6. **H-06 — User follow queries are unbounded.** `frontend/src/hooks/useProfileFollows.ts:58-84` reads the whole follower/following edge set for every profile. **Plan:** add count/relationship RPCs and paginated follower lists before social growth; do not cache relationship data in the public cache.

7. **H-07 — Storage upload policy has no server-side byte-size or content validation.** `supabase/functions/media/index.ts:62-114` trusts the declared MIME type and signs unrestricted PUTs. **Plan:** enforce content length in the signed request where R2 supports it or proxy/verify uploads; validate image signatures/dimensions before accepting a database reference; test authorization and abusive input.

8. **H-08 — R2 lifecycle has no orphan cleanup.** Random immutable paths are correct for CDN caching, but replaced avatar/game/badge assets can remain forever if a later DB mutation fails or old-object deletion is missed. **Plan:** make database-reference update and obsolete-path cleanup an explicit, recoverable workflow; add a scheduled orphan inventory/cleanup runbook.

9. **H-09 — Production deployment is not reproducible from repository documentation.** `README.md` is product-only; no `.env.example`, deployment checklist, or Edge Function/R2 configuration checklist exists. `frontend/dockerfile` runs the Vite dev server and `npm install`, not a production build. **Plan:** document required public variables, Supabase Dashboard settings, function secrets, R2 CORS/cache setup, Vercel root/build settings, and deploy/rollback order; replace or label the Docker file as development-only.

10. **H-10 — Essential test seams are untested.** Only two frontend unit tests exist, and Edge Functions have no tests. Database tests omit account deletion, media ownership, legacy-surface removal, cache invalidation, pagination, invalid function parameters, and profile mutation constraints. **Plan:** add narrow unit/integration tests at public seams before changing them; retain E2E only for login and the highest-value customer flows.

11. **H-11 — The committed E2E flow is stale against current routes.** `tests/login_flow.py:134-145` asserts `/rankings`, `/friends`, and `/billing`, while `frontend/src/main.tsx:45-48` serves `/leaderboard`, has no friends route, and serves `/support`. **Plan:** reconcile the specification with live navigation and update the test after the user confirms intended mobile-menu destinations if they differ.

12. **H-12 — Public leaderboard/database RPCs are expensive full-ranking scans.** `supabase/migrations/20260913094117_add_leaderboard_queries.sql` aggregates all badge claims and computes window ranks per request; its current `SECURITY DEFINER` status is intentional for hidden special badges but needs documented justification. **Plan:** validate with EXPLAIN after representative seed data; consider maintained score projections only if measured. Keep parameters bounded and add function/RLS contract tests.

### MEDIUM

1. **M-01 — Public metadata is missing.** `frontend/index.html` has no description/canonical/robots metadata; no sitemap or robots file exists. **Plan:** add static public metadata, `robots.txt`, and a sitemap for crawlable static routes. Dynamic game/profile URLs need a generated sitemap only after a server-side data source is selected.

2. **M-02 — Public cache has no stale-while-revalidate.** `frontend/src/utils/queryCache.ts` has safe request deduplication and bounded entries but hard-expiry only. **Plan:** keep it for now; add SWR only if navigation latency is measured as material.

3. **M-03 — Catalogue data duplicates badge payloads.** `frontend/src/hooks/useGames.ts:95-115` and page queries select `game_badges.*`, including fields not always rendered. **Plan:** define narrow read shapes and an aggregate endpoint for lists after replacing aggregate sorting.

4. **M-04 — Global search has a fourth dependent request.** `frontend/src/hooks/useGlobalSearch.ts:63-110` makes three parallel searches then a game-name lookup. **Plan:** use a controlled join/RPC if profiling confirms this debounce path is hot; preserve input escaping and limits.

5. **M-05 — App-wide independent auth subscriptions cause repeat work.** `frontend/src/hooks/useAuthUser.ts` is called by multiple route/layout features. **Plan:** profile first; introduce a single AuthProvider only if measurable repeat subscriptions/renders are confirmed.

6. **M-06 — Cache key ownership leaks into pages.** Catalogue, leaderboard, homepage, and game-player invalidation prefixes are manually known by page modules. **Plan:** feature-own typed query/invalidation functions where touched.

7. **M-07 — Duplicate feedback toast implementations.** `AdminAwards.tsx`, `AdminGames.tsx`, `GameDetail.tsx`, and `Settings.tsx` repeat a UI primitive. **Plan:** consolidate only after an accessibility/visual regression test.

8. **M-08 — Database advisor noise should be resolved deliberately.** `account_deletion_requests` intentionally has RLS without policies/service-role-only grants; `homepage_featured_games.game_id` lacks an index. **Plan:** document/accept the first only if advisor suppression is supported; add the latter index only after confirming delete/join plan benefit. Do not index unused legacy foreign keys.

### LOW

1. **L-01 — Production console noise.** `frontend/src/utils/supabase.ts:5-9` logs environment presence and mode. Remove it.

2. **L-02 — Stale TODOs and demo fixture increase maintenance cost.** `frontend/src/main.tsx:67-70`; `frontend/src/pages/GameDetail/GameDetail.tsx` contains a large demo fixture used only to source difficulty ids. Remove only with focused coverage.

3. **L-03 — Metadata titles are dynamic but descriptions are not.** `frontend/src/hooks/usePageTitle.ts` is a useful existing title seam; extend it or add a small metadata helper rather than per-page bespoke code.

## Cache inventory

| Data | Decision | Location/key | TTL | Invalidation/SWR | Safety |
| --- | --- | --- | --- | --- | --- |
| Published catalogue list/pages/details | Keep and refine | Tab memory: `catalogue:*` | 60 seconds | CMS mutations call catalogue invalidation; no SWR yet | Public only |
| Leaderboard pages | Keep | Tab memory: `leaderboard:*` | 30 seconds | Badge mutations invalidate; no SWR yet | Public aggregate only |
| Homepage featured-game slots | Keep | Tab memory: `homepage:featured-games` | 5 minutes | CMS settings mutation invalidates | Public only |
| Per-game player leaderboard | Add after aggregate RPC | Tab memory: `game-players:<game>:<board>:<page>` | 30 seconds | Badge mutation invalidates game prefix | Public aggregate only |
| Badge difficulty labels | No runtime cache needed | Bundled constants | Build lifetime | Deploy | Public/static |
| R2 images | Keep | R2/CDN/browser immutable URL | 7 days immutable | New random path for replacement; cleanup old object | Public media by design |
| Notifications, profiles, libraries, follows, user claims | Do not put in public cache | Component state/RLS queries | N/A | Realtime/local mutation refresh | User-specific; leaking is unacceptable |
| Search results | No cache now | Debounced direct query | N/A | N/A | Mixed public data; first measure |

## Phase 2 proposed order

1. Fix C-01 with a server-side feedback endpoint and tests.
2. Remove C-02 legacy surface in a new migration and add database regression tests.
3. Implement static metadata, sitemap, and robots (M-01).
4. Add only high-confidence route splitting and debug-output removal.
5. Start the aggregate-query work only after an approved SQL shape and test seam are established.

There are **15 CRITICAL + HIGH issues**, exceeding the requested checkpoint threshold of 10. No Phase 2 implementation may begin without user confirmation.
