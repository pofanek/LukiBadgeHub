-- These policies existed before the CMS migration and were permissive alongside
-- the new rules. RLS combines permissive policies with OR, so they must be removed.
drop policy if exists "Enable read access for all users" on public.games;
drop policy if exists "Admins can insert  games." on public.games;
drop policy if exists "Moderators can update games." on public.games;
