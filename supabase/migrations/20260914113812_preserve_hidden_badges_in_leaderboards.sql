-- Leaderboard calculations need every awarded badge, including special badges
-- that are intentionally hidden by the direct game_badges RLS policy.
alter function public.get_leaderboard(text, text, integer, integer)
  security definer
  set search_path = '';

alter function public.get_leaderboard_position(text, text, uuid)
  security definer
  set search_path = '';

alter function public.get_leaderboard_with_country(text, text, integer, integer)
  security definer
  set search_path = '';

revoke all on function public.get_leaderboard(text, text, integer, integer) from public;
revoke all on function public.get_leaderboard_position(text, text, uuid) from public;
revoke all on function public.get_leaderboard_with_country(text, text, integer, integer) from public;

grant execute on function public.get_leaderboard(text, text, integer, integer) to anon, authenticated;
grant execute on function public.get_leaderboard_position(text, text, uuid) to anon, authenticated;
grant execute on function public.get_leaderboard_with_country(text, text, integer, integer) to anon, authenticated;
