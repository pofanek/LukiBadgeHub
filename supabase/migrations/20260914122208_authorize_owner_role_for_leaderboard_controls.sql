-- Owner-only CMS controls are authorized from the role assigned to the
-- authenticated profile, not a duplicated UUID configuration value.
create or replace function private.is_leaderboard_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.user_profiles
      where id = (select auth.uid())
        and role = 'Owner'::public.role
    );
$$;

revoke all on function private.is_leaderboard_owner() from public, anon, authenticated;
grant execute on function private.is_leaderboard_owner() to authenticated;
