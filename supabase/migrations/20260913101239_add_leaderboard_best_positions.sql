create table public.leaderboard_best_positions (
  profile_id uuid primary key references public.user_profiles (id) on delete cascade,
  best_rank bigint not null check (best_rank > 0),
  achieved_at timestamptz not null
);

alter table public.leaderboard_best_positions enable row level security;

revoke all on table public.leaderboard_best_positions from anon, authenticated;
grant select on table public.leaderboard_best_positions to anon, authenticated;

create policy "Best leaderboard positions are visible"
on public.leaderboard_best_positions for select
to anon, authenticated
using (true);

insert into public.leaderboard_best_positions (profile_id, best_rank, achieved_at)
with scores as (
  select
    user_badges.user_id,
    coalesce(sum(case game_badges.difficulty
      when 'easy' then case game_badges.tier when 'low' then 5 when 'mid' then 7 else 10 end
      when 'medium' then case game_badges.tier when 'low' then 15 when 'mid' then 21 else 30 end
      when 'hard' then case game_badges.tier when 'low' then 60 when 'mid' then 84 else 120 end
      when 'extreme' then case game_badges.tier when 'low' then 600 when 'mid' then 840 else 1200 end
      when 'supreme' then case game_badges.tier when 'low' then 5000 when 'mid' then 7500 else 10000 end
      when 'inhuman' then case game_badges.tier when 'low' then 35000 when 'mid' then 50000 else 70000 end
    end), 0)::bigint as score
  from public.user_badges
  join public.game_badges on game_badges.id = user_badges.badge_id
  group by user_badges.user_id
)
select user_id, rank() over (order by score desc)::bigint, now()
from scores
where score > 0;

create or replace function private.record_best_leaderboard_position()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_rank bigint;
begin
  select player_rank
  into current_rank
  from public.get_leaderboard_position('experience', null, new.user_id);

  if current_rank is not null then
    insert into public.leaderboard_best_positions (profile_id, best_rank, achieved_at)
    values (new.user_id, current_rank, new.earned_at)
    on conflict (profile_id) do update
    set best_rank = excluded.best_rank,
        achieved_at = excluded.achieved_at
    where excluded.best_rank < public.leaderboard_best_positions.best_rank;
  end if;

  return new;
end;
$$;

revoke all on function private.record_best_leaderboard_position() from public, anon, authenticated;

create trigger record_best_leaderboard_position
after insert on public.user_badges
for each row execute function private.record_best_leaderboard_position();
