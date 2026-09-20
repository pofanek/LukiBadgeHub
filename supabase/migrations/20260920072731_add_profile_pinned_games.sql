create table public.profile_pinned_games (
  profile_id uuid not null references auth.users (id) on delete cascade,
  game_id bigint not null references public.games (id) on delete cascade,
  pinned_at timestamptz not null default now(),
  primary key (profile_id, game_id)
);

create index profile_pinned_games_profile_pinned_at_idx
  on public.profile_pinned_games (profile_id, pinned_at desc);

alter table public.profile_pinned_games enable row level security;

revoke all on table public.profile_pinned_games from anon, authenticated;
grant select on table public.profile_pinned_games to anon, authenticated;
grant insert, delete on table public.profile_pinned_games to authenticated;

create policy "Pinned games are visible on profiles"
on public.profile_pinned_games for select
to anon, authenticated
using (true);

create policy "Users can pin games on their profile"
on public.profile_pinned_games for insert
to authenticated
with check ((select auth.uid()) = profile_id);

create policy "Users can unpin games on their profile"
on public.profile_pinned_games for delete
to authenticated
using ((select auth.uid()) = profile_id);
