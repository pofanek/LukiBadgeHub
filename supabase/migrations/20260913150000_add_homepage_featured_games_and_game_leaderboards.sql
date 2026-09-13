create table public.homepage_featured_games (
  slot smallint primary key check (slot between 1 and 5),
  game_id bigint not null references public.games (id) on delete restrict
);

insert into public.homepage_featured_games (slot, game_id)
select row_number() over (order by games.created_at desc, games.id desc)::smallint, games.id
from public.games
where games.is_published
order by games.created_at desc, games.id desc
limit 5;

alter table public.homepage_featured_games enable row level security;
revoke all on public.homepage_featured_games from anon, authenticated;
grant select on public.homepage_featured_games to anon, authenticated;
grant update (game_id) on public.homepage_featured_games to authenticated;

create policy "Homepage featured games are visible"
on public.homepage_featured_games for select
to anon, authenticated
using (true);

create policy "Leaderboard owner can update homepage featured games"
on public.homepage_featured_games for update
to authenticated
using ((select private.is_leaderboard_owner()))
with check ((select private.is_leaderboard_owner()));

create or replace function public.get_game_leaderboard(
  p_game_id bigint,
  p_limit integer default 100,
  p_board text default 'badges'
)
returns table (
  player_rank bigint,
  profile_id uuid,
  username text,
  avatar_path text,
  country_code text,
  badges_collected bigint,
  earned_experience bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with player_scores as (
    select
      user_badges.user_id,
      count(*)::bigint as badges_collected,
      coalesce(sum(case game_badges.difficulty
        when 'easy' then case game_badges.tier when 'low' then 5 when 'mid' then 7 else 10 end
        when 'medium' then case game_badges.tier when 'low' then 15 when 'mid' then 21 else 30 end
        when 'hard' then case game_badges.tier when 'low' then 60 when 'mid' then 84 else 120 end
        when 'extreme' then case game_badges.tier when 'low' then 600 when 'mid' then 840 else 1200 end
        when 'supreme' then case game_badges.tier when 'low' then 5000 when 'mid' then 7500 else 10000 end
        when 'inhuman' then case game_badges.tier when 'low' then 35000 when 'mid' then 50000 else 70000 end
      end), 0)::bigint as earned_experience
    from public.user_badges
    join public.game_badges on game_badges.id = user_badges.badge_id
    where game_badges.game_id = p_game_id
    group by user_badges.user_id
  ), ranked as (
    select
      rank() over (order by
        case when p_board = 'experience' then player_scores.earned_experience end desc,
        case when p_board = 'badges' then player_scores.badges_collected end desc,
        player_scores.badges_collected desc,
        player_scores.earned_experience desc,
        user_profiles.username asc
      )::bigint as player_rank,
      player_scores.user_id as profile_id,
      user_profiles.username,
      user_profiles.avatar_path,
      user_profiles.country_code,
      player_scores.badges_collected,
      player_scores.earned_experience
    from player_scores
    join public.user_profiles on user_profiles.id = player_scores.user_id
  )
  select * from ranked
  order by player_rank, username
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.get_game_leaderboard(bigint, integer, text) from public;
grant execute on function public.get_game_leaderboard(bigint, integer, text) to anon, authenticated;
