create or replace function private.refresh_leaderboard_ranks_after_badge_balance_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.difficulty is not distinct from old.difficulty
    and new.tier is not distinct from old.tier then
    return new;
  end if;

  perform private.refresh_leaderboard_best_positions();
  return new;
end;
$$;

revoke all on function private.refresh_leaderboard_ranks_after_badge_balance_change()
  from public, anon, authenticated;

drop trigger if exists refresh_leaderboard_ranks_after_badge_balance_change on public.game_badges;
create trigger refresh_leaderboard_ranks_after_badge_balance_change
after update of difficulty, tier on public.game_badges
for each row execute function private.refresh_leaderboard_ranks_after_badge_balance_change();
