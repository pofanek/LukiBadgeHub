create or replace function private.is_game_badge_creator(p_game_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.game_badge_creators
      where game_id = p_game_id
        and profile_id = (select auth.uid())
    );
$$;

revoke all on function private.is_game_badge_creator(bigint) from public;
grant execute on function private.is_game_badge_creator(bigint) to authenticated;
grant execute on function private.is_game_badge_creator(bigint) to anon;

drop policy if exists "Published games are visible" on public.games;
create policy "Published games are visible"
on public.games for select
to anon, authenticated
using (
  is_published
  or (select private.is_admin())
  or (select private.is_game_badge_creator(id))
);

create policy "Badge creators can update assigned games"
on public.games for update
to authenticated
using ((select private.is_game_badge_creator(id)))
with check ((select private.is_game_badge_creator(id)));

drop policy if exists "Visible game badges are readable" on public.game_badges;
create policy "Visible game badges are readable"
on public.game_badges for select
to anon, authenticated
using (
  exists (
    select 1
    from public.games
    where games.id = game_badges.game_id
      and (
        games.is_published
        or (select private.is_admin())
        or (select private.is_game_badge_creator(game_badges.game_id))
      )
  )
);

create policy "Badge creators can create badges for assigned games"
on public.game_badges for insert
to authenticated
with check ((select private.is_game_badge_creator(game_id)));

create policy "Badge creators can update badges for assigned games"
on public.game_badges for update
to authenticated
using ((select private.is_game_badge_creator(game_id)))
with check ((select private.is_game_badge_creator(game_id)));

create policy "Badge creators can delete badges for assigned games"
on public.game_badges for delete
to authenticated
using ((select private.is_game_badge_creator(game_id)));

drop policy if exists "Published game badge creators are visible" on public.game_badge_creators;
create policy "Published game badge creators are visible"
on public.game_badge_creators for select
to anon, authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.games
    where games.id = game_badge_creators.game_id
      and (games.is_published or (select private.is_admin()))
  )
);
