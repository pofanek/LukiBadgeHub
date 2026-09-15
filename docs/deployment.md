# Deployment checklist

## Vercel frontend

Configure Vercel with `frontend` as the root directory and run its normal Vite build (`npm run build`). Keep `frontend/vercel.json` so client-side routes are rewritten to `index.html`.

Provide the four public variables listed in `frontend/.env.example`. `VITE_SUPABASE_ANON_KEY`, the R2 public URL, and the Turnstile site key are designed for browser exposure. Do not set a service-role key, database password, Supabase access token, R2 access key, Discord webhook, or Turnstile secret in Vercel frontend variables.

## Supabase database and functions

1. Review and apply migrations with the Supabase CLI against the linked project.
2. Deploy `media`, `delete-account`, and `feedback` Edge Functions.
3. Configure function-only secrets: `R2_ENDPOINT`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `TURNSTILE_SECRET_KEY`, and `DISCORD_FEEDBACK_WEBHOOK_URL`.
4. Enable Turnstile in Supabase Auth and configure its secret in the Dashboard. Enable leaked-password protection in Supabase Auth before production launch.
5. Set Auth Site URL and redirect URLs to `https://www.lukibadgehub.com` and `https://www.lukibadgehub.com/auth/callback`; preserve localhost callbacks for development.
6. Restrict R2 bucket write access to signed uploads, use the public media hostname only for reads, and allow the production origin in R2 CORS for signed PUT requests.

## Release and rollback

Run lint, tests, database tests, and `npm run build` before deployment. Deploy database migrations before any frontend that depends on them, then Edge Functions, then the frontend. If the frontend release fails, roll back the Vercel deployment; database migrations are forward-only and need a compensating migration rather than history rewrites.

`docker-compose.yml` is development-only and mounts the local source tree. It is not a production deployment path.
