-- Published game badges are part of the public game catalogue. Awarding and
-- editing them remain protected by their separate write policies.
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
);
