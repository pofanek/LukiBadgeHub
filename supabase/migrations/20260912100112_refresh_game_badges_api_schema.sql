-- Explicit grants are required when new tables are not automatically exposed
-- through the Data API. Reload PostgREST's schema cache after the grants.
grant usage on schema public to anon, authenticated;
grant select on table public.game_badges, public.user_badges to anon, authenticated;
grant insert, update, delete on table public.game_badges to authenticated;
grant insert, delete on table public.user_badges to authenticated;

notify pgrst, 'reload schema';
