create table public.user_game_library (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id integer not null check (game_id > 0),
  added_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

alter table public.user_game_library enable row level security;

revoke all on table public.user_game_library from anon, authenticated;
grant select on table public.user_game_library to anon, authenticated;
grant insert, delete on table public.user_game_library to authenticated;

create policy "Game libraries are visible on profiles"
on public.user_game_library for select
to anon, authenticated
using (true);

create policy "Users can add games to their library"
on public.user_game_library for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can remove games from their library"
on public.user_game_library for delete
to authenticated
using ((select auth.uid()) = user_id);
