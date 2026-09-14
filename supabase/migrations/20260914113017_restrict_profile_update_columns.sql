-- Keep profile self-service updates from granting role management.
revoke update on table public.user_profiles from authenticated;

grant update (
  username,
  bio,
  country_code,
  avatar_path,
  banner_path,
  pinned_badge_id,
  hide_pinned_badge_edit
) on table public.user_profiles to authenticated;

drop policy if exists "Visible game badges are readable" on public.game_badges;

create policy "Visible game badges are readable"
on public.game_badges for select
to anon, authenticated
using (
  exists (
    select 1
    from public.games
    where games.id = game_badges.game_id
      and (games.is_published or (select private.is_admin()))
  )
  and (
    game_badges.difficulty not in ('extreme', 'supreme', 'inhuman')
    or (select private.is_admin())
    or exists (
      select 1
      from public.user_profiles
      where user_profiles.id = (select auth.uid())
        and user_profiles.role = 'Moderator'
    )
  )
);
