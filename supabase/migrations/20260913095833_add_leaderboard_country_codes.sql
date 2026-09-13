create or replace function public.get_leaderboard_with_country(
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
  country_code text,
  score bigint,
  earned_badges bigint,
  earned_experience bigint,
  total_players bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    leaderboard.player_rank,
    leaderboard.profile_id,
    leaderboard.username,
    leaderboard.avatar_path,
    user_profiles.country_code,
    leaderboard.score,
    leaderboard.earned_badges,
    leaderboard.earned_experience,
    leaderboard.total_players
  from public.get_leaderboard(p_board, p_difficulty, p_page, p_page_size) as leaderboard
  join public.user_profiles on user_profiles.id = leaderboard.profile_id;
$$;

revoke all on function public.get_leaderboard_with_country(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.get_leaderboard_with_country(text, text, integer, integer) to anon, authenticated;

notify pgrst, 'reload schema';
