create or replace function public.get_leaderboard(
  p_board text default 'experience',
  p_difficulty text default null,
  p_page integer default 1,
  p_page_size integer default 100
)
returns table (
  player_rank bigint,
  profile_id uuid,
  username text,
  avatar_path text,
  score bigint,
  earned_badges bigint,
  earned_experience bigint,
  total_players bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with badge_scores as (
    select
      user_badges.user_id,
      count(*)::bigint as all_badges,
      coalesce(sum(
        case game_badges.difficulty
          when 'easy' then case game_badges.tier when 'low' then 5 when 'mid' then 7 else 10 end
          when 'medium' then case game_badges.tier when 'low' then 15 when 'mid' then 21 else 30 end
          when 'hard' then case game_badges.tier when 'low' then 60 when 'mid' then 84 else 120 end
          when 'extreme' then case game_badges.tier when 'low' then 600 when 'mid' then 840 else 1200 end
          when 'supreme' then case game_badges.tier when 'low' then 5000 when 'mid' then 7500 else 10000 end
          when 'inhuman' then case game_badges.tier when 'low' then 35000 when 'mid' then 50000 else 70000 end
        end
      ), 0)::bigint as all_experience,
      count(*) filter (where game_badges.difficulty = p_difficulty)::bigint as difficulty_badges,
      coalesce(sum(
        case when game_badges.difficulty = p_difficulty then
          case game_badges.difficulty
            when 'easy' then case game_badges.tier when 'low' then 5 when 'mid' then 7 else 10 end
            when 'medium' then case game_badges.tier when 'low' then 15 when 'mid' then 21 else 30 end
            when 'hard' then case game_badges.tier when 'low' then 60 when 'mid' then 84 else 120 end
            when 'extreme' then case game_badges.tier when 'low' then 600 when 'mid' then 840 else 1200 end
            when 'supreme' then case game_badges.tier when 'low' then 5000 when 'mid' then 7500 else 10000 end
            when 'inhuman' then case game_badges.tier when 'low' then 35000 when 'mid' then 50000 else 70000 end
          end
        else 0 end
      ), 0)::bigint as difficulty_experience
    from public.user_badges
    join public.game_badges on game_badges.id = user_badges.badge_id
    group by user_badges.user_id
  ), ranked as (
    select
      user_profiles.id as profile_id,
      user_profiles.username,
      user_profiles.avatar_path,
      case p_board
        when 'experience' then badge_scores.all_experience
        when 'badges' then badge_scores.all_badges
        when 'difficulty' then badge_scores.difficulty_badges
        else 0
      end as score,
      case when p_board = 'difficulty' then badge_scores.difficulty_badges else badge_scores.all_badges end as earned_badges,
      case when p_board = 'difficulty' then badge_scores.difficulty_experience else badge_scores.all_experience end as earned_experience
    from badge_scores
    join public.user_profiles on user_profiles.id = badge_scores.user_id
    where p_board in ('experience', 'badges', 'difficulty')
      and (p_board <> 'difficulty' or p_difficulty in ('easy', 'medium', 'hard', 'extreme', 'supreme', 'inhuman'))
  ), numbered as (
    select
      dense_rank() over (order by score desc)::bigint as player_rank,
      count(*) over ()::bigint as total_players,
      ranked.*
    from ranked
    where score > 0
  )
  select player_rank, profile_id, username, avatar_path, score, earned_badges, earned_experience, total_players
  from numbered
  order by score desc, username asc
  limit least(greatest(p_page_size, 1), 100)
  offset (greatest(p_page, 1) - 1) * least(greatest(p_page_size, 1), 100);
$$;

create or replace function public.get_leaderboard_position(
  p_board text,
  p_difficulty text,
  p_profile_id uuid
)
returns table (
  player_rank bigint,
  score bigint,
  earned_badges bigint,
  earned_experience bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with scores as (
    select
      user_badges.user_id,
      count(*)::bigint as all_badges,
      count(*) filter (where game_badges.difficulty = p_difficulty)::bigint as difficulty_badges,
      coalesce(sum(case game_badges.difficulty
        when 'easy' then case game_badges.tier when 'low' then 5 when 'mid' then 7 else 10 end
        when 'medium' then case game_badges.tier when 'low' then 15 when 'mid' then 21 else 30 end
        when 'hard' then case game_badges.tier when 'low' then 60 when 'mid' then 84 else 120 end
        when 'extreme' then case game_badges.tier when 'low' then 600 when 'mid' then 840 else 1200 end
        when 'supreme' then case game_badges.tier when 'low' then 5000 when 'mid' then 7500 else 10000 end
        when 'inhuman' then case game_badges.tier when 'low' then 35000 when 'mid' then 50000 else 70000 end
      end), 0)::bigint as all_experience,
      coalesce(sum(case when game_badges.difficulty = p_difficulty then case game_badges.difficulty
        when 'easy' then case game_badges.tier when 'low' then 5 when 'mid' then 7 else 10 end
        when 'medium' then case game_badges.tier when 'low' then 15 when 'mid' then 21 else 30 end
        when 'hard' then case game_badges.tier when 'low' then 60 when 'mid' then 84 else 120 end
        when 'extreme' then case game_badges.tier when 'low' then 600 when 'mid' then 840 else 1200 end
        when 'supreme' then case game_badges.tier when 'low' then 5000 when 'mid' then 7500 else 10000 end
        when 'inhuman' then case game_badges.tier when 'low' then 35000 when 'mid' then 50000 else 70000 end
      end else 0 end), 0)::bigint as difficulty_experience
    from public.user_badges
    join public.game_badges on game_badges.id = user_badges.badge_id
    group by user_badges.user_id
  ), ranked as (
    select
      user_id,
      case p_board when 'experience' then all_experience when 'badges' then all_badges when 'difficulty' then difficulty_badges else 0 end as score,
      case when p_board = 'difficulty' then difficulty_badges else all_badges end as earned_badges,
      case when p_board = 'difficulty' then difficulty_experience else all_experience end as earned_experience
    from scores
    where p_board in ('experience', 'badges', 'difficulty')
      and (p_board <> 'difficulty' or p_difficulty in ('easy', 'medium', 'hard', 'extreme', 'supreme', 'inhuman'))
  )
  select player_rank, score, earned_badges, earned_experience
  from (
    select
      user_id,
      dense_rank() over (order by score desc)::bigint as player_rank,
      score,
      earned_badges,
      earned_experience
    from ranked
    where score > 0
  ) positions
  where user_id = p_profile_id;
$$;

revoke all on function public.get_leaderboard(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.get_leaderboard_position(text, text, uuid) from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, text, integer, integer) to anon, authenticated;
grant execute on function public.get_leaderboard_position(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
