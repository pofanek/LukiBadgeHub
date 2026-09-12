alter table public.user_profiles
  add column if not exists pinned_badge_id bigint references public.game_badges (id) on delete set null;

create index if not exists user_profiles_pinned_badge_id_idx
  on public.user_profiles (pinned_badge_id);

drop policy if exists "Owners update their profile" on public.user_profiles;

create policy "Owners update their profile"
on public.user_profiles for update
to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and (
    pinned_badge_id is null
    or exists (
      select 1
      from public.user_badges
      where user_badges.user_id = (select auth.uid())
        and user_badges.badge_id = user_profiles.pinned_badge_id
    )
  )
);

create or replace function private.clear_unclaimed_pinned_badge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.user_profiles
  set pinned_badge_id = null
  where id = old.user_id
    and pinned_badge_id = old.badge_id;

  return old;
end;
$$;

revoke all on function private.clear_unclaimed_pinned_badge()
  from public, anon, authenticated;

drop trigger if exists clear_unclaimed_pinned_badge on public.user_badges;

create trigger clear_unclaimed_pinned_badge
after delete on public.user_badges
for each row execute function private.clear_unclaimed_pinned_badge();
