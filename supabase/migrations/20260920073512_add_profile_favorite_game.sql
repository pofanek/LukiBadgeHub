create table public.profile_favorite_games (
  profile_id uuid primary key references auth.users (id) on delete cascade,
  game_id bigint not null references public.games (id) on delete cascade,
  selected_at timestamptz not null default now()
);

alter table public.profile_favorite_games enable row level security;

revoke all on table public.profile_favorite_games from anon, authenticated;
grant select on table public.profile_favorite_games to anon, authenticated;
grant insert, update, delete on table public.profile_favorite_games to authenticated;

create policy "Favorite games are visible on profiles"
on public.profile_favorite_games for select
to anon, authenticated
using (true);

create policy "Users can choose a favorite game on their profile"
on public.profile_favorite_games for insert
to authenticated
with check ((select auth.uid()) = profile_id);

create policy "Users can change their favorite game"
on public.profile_favorite_games for update
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

create policy "Users can clear their favorite game"
on public.profile_favorite_games for delete
to authenticated
using ((select auth.uid()) = profile_id);
