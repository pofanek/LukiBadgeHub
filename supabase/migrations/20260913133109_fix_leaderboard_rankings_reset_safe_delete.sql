create or replace function public.reset_leaderboard_rankings()
returns table (
  cleared_players bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_leaderboard_owner()) then
    raise exception 'Only the leaderboard owner can reset rankings.' using errcode = '42501';
  end if;

  perform 1
  from public.leaderboard_rankings_settings
  where id = true
  for update;

  delete from public.leaderboard_best_positions
  where profile_id is not null;
  get diagnostics cleared_players = row_count;

  update public.leaderboard_rankings_settings
  set started_at = null
  where id = true;

  return next;
end;
$$;

revoke all on function public.reset_leaderboard_rankings() from public, anon, authenticated;
grant execute on function public.reset_leaderboard_rankings() to authenticated;

notify pgrst, 'reload schema';
