-- Moderators can access the CMS and award only the manually reviewed badge tiers.
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
        and role in ('Admin'::public.role, 'Moderator'::public.role)
    );
$$;

revoke all on function private.is_cms_user() from public, anon;
grant execute on function private.is_cms_user() to authenticated;
grant execute on function private.is_cms_user() to anon;

create policy "CMS users can award special badges"
on public.user_badges for insert
to authenticated
with check (
  (select private.is_cms_user())
  and exists (
    select 1 from public.game_badges
    where game_badges.id = user_badges.badge_id
      and game_badges.difficulty in ('extreme', 'supreme', 'inhuman')
  )
);
