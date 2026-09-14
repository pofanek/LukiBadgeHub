-- Owners have the same CMS access as admins, while retaining the separate
-- Owner role for owner-only controls.
create or replace function private.is_admin()
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
        and role in ('Admin'::public.role, 'Owner'::public.role)
    );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_admin() to anon;

create or replace function private.is_cms_user()
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
        and role in ('Admin'::public.role, 'Owner'::public.role, 'Moderator'::public.role)
    );
$$;

revoke all on function private.is_cms_user() from public, anon;
grant execute on function private.is_cms_user() to authenticated;
grant execute on function private.is_cms_user() to anon;
