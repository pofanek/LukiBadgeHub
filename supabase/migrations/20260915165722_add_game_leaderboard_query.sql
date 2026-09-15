-- Replace the legacy two-argument overload imported by the baseline. The
-- replacement relies on the public RLS read model and therefore does not need
-- SECURITY DEFINER privileges.
drop function if exists public.get_game_leaderboard(bigint, integer);

create function public.get_game_leaderboard(
  p_game_id bigint,
  p_limit integer default 100,
  p_board text default 'badges'
)
returns table (
  player_rank bigint,
  profile_id uuid,
  username text,
  avatar_path text,
  badges_collected bigint,
  earned_experience bigint
)
language sql
stable
security invoker
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
    from public.game_badges
    join public.user_badges on user_badges.badge_id = game_badges.id
    where game_badges.game_id = p_game_id
      and p_game_id > 0
      and p_board in ('badges', 'experience')
    group by user_badges.user_id
  )
  select
    row_number() over (
      order by
        case when p_board = 'experience' then player_scores.earned_experience end desc,
        case when p_board = 'badges' then player_scores.badges_collected end desc,
        player_scores.badges_collected desc,
        player_scores.earned_experience desc,
        user_profiles.username asc
    )::bigint as player_rank,
    player_scores.user_id as profile_id,
    user_profiles.username,
    user_profiles.avatar_path,
    player_scores.badges_collected,
    player_scores.earned_experience
  from player_scores
  join public.user_profiles on user_profiles.id = player_scores.user_id
  order by player_rank
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.get_game_leaderboard(bigint, integer, text)
  from public;
grant execute on function public.get_game_leaderboard(bigint, integer, text)
  to anon, authenticated;

notify pgrst, 'reload schema';
