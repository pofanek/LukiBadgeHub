create or replace function private.refresh_leaderboard_best_positions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rankings_started boolean;
begin
  select started_at is not null
  into rankings_started
  from public.leaderboard_rankings_settings
  where id = true
  for key share;

  if not coalesce(rankings_started, false) then
    return;
  end if;

  insert into public.leaderboard_best_positions (profile_id, best_rank, achieved_at)
  with scores as (
    select
      user_badges.user_id,
      coalesce(sum(
        case game_badges.difficulty
          when 'easy' then case game_badges.tier when 'low' then 5 when 'mid' then 7 else 10 end
          when 'medium' then case game_badges.tier when 'low' then 15 when 'mid' then 21 else 30 end
          when 'hard' then case game_badges.tier when 'low' then 60 when 'mid' then 84 else 120 end
          when 'extreme' then case game_badges.tier when 'low' then 600 when 'mid' then 840 else 1200 end
          when 'supreme' then case game_badges.tier when 'low' then 5000 when 'mid' then 7500 else 10000 end
          when 'inhuman' then case game_badges.tier when 'low' then 35000 when 'mid' then 50000 else 70000 end
        end
      ), 0)::bigint as score
    from public.user_badges
    join public.game_badges on game_badges.id = user_badges.badge_id
    group by user_badges.user_id
  ), ranked as (
    select
      user_id,
      rank() over (order by score desc)::bigint as best_rank
    from scores
    where score > 0
  )
  select user_id, best_rank, now()
  from ranked
  on conflict (profile_id) do update
  set best_rank = excluded.best_rank,
      achieved_at = excluded.achieved_at
  where excluded.best_rank < public.leaderboard_best_positions.best_rank;
end;
$$;

revoke all on function private.refresh_leaderboard_best_positions() from public, anon, authenticated;

create or replace function private.record_best_leaderboard_position()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_leaderboard_best_positions();

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.record_best_leaderboard_position() from public, anon, authenticated;

drop trigger if exists record_best_leaderboard_position on public.user_badges;
create trigger record_best_leaderboard_position
after insert or delete on public.user_badges
for each row execute function private.record_best_leaderboard_position();

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

  delete from public.leaderboard_best_positions;
  get diagnostics cleared_players = row_count;

  update public.leaderboard_rankings_settings
  set started_at = null
  where id = true;

  return next;
end;
$$;

revoke all on function public.reset_leaderboard_rankings() from public, anon, authenticated;
grant execute on function public.reset_leaderboard_rankings() to authenticated;

create or replace function public.start_leaderboard_rankings()
returns table (
  started_at timestamptz,
  seeded_players bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_started_at timestamptz;
begin
  if not (select private.is_leaderboard_owner()) then
    raise exception 'Only the leaderboard owner can start rankings.' using errcode = '42501';
  end if;

  select leaderboard_rankings_settings.started_at
  into existing_started_at
  from public.leaderboard_rankings_settings
  where leaderboard_rankings_settings.id = true
  for update;

  if existing_started_at is not null then
    return query select existing_started_at, 0::bigint;
    return;
  end if;

  insert into public.leaderboard_best_positions (profile_id, best_rank, achieved_at)
  with scores as (
    select
      user_badges.user_id,
      coalesce(sum(
        case game_badges.difficulty
          when 'easy' then case game_badges.tier when 'low' then 5 when 'mid' then 7 else 10 end
          when 'medium' then case game_badges.tier when 'low' then 15 when 'mid' then 21 else 30 end
          when 'hard' then case game_badges.tier when 'low' then 60 when 'mid' then 84 else 120 end
          when 'extreme' then case game_badges.tier when 'low' then 600 when 'mid' then 840 else 1200 end
          when 'supreme' then case game_badges.tier when 'low' then 5000 when 'mid' then 7500 else 10000 end
          when 'inhuman' then case game_badges.tier when 'low' then 35000 when 'mid' then 50000 else 70000 end
        end
      ), 0)::bigint as score
    from public.user_badges
    join public.game_badges on game_badges.id = user_badges.badge_id
    group by user_badges.user_id
  ), ranked as (
    select
      user_id,
      rank() over (order by score desc)::bigint as best_rank
    from scores
    where score > 0
  )
  select user_id, best_rank, now()
  from ranked;

  get diagnostics seeded_players = row_count;

  update public.leaderboard_rankings_settings
  set started_at = now()
  where id = true
  returning leaderboard_rankings_settings.started_at into started_at;

  return next;
end;
$$;

revoke all on function public.start_leaderboard_rankings() from public, anon, authenticated;
grant execute on function public.start_leaderboard_rankings() to authenticated;

notify pgrst, 'reload schema';
alter table public.leaderboard_rankings_settings
  add column if not exists owner_id uuid;

update public.leaderboard_rankings_settings
set owner_id = '3fd7d1a9-c1f2-4ba9-91d1-dd8f4154b8a3'
where id = true;

alter table public.leaderboard_rankings_settings
  alter column owner_id set not null;

create or replace function private.is_leaderboard_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) = '3fd7d1a9-c1f2-4ba9-91d1-dd8f4154b8a3'::uuid;
$$;

revoke all on function private.is_leaderboard_owner() from public, anon, authenticated;
grant execute on function private.is_leaderboard_owner() to authenticated;

drop policy if exists "Admins can read leaderboard ranking settings" on public.leaderboard_rankings_settings;
drop policy if exists "Leaderboard owner can read ranking settings" on public.leaderboard_rankings_settings;
create policy "Leaderboard owner can read ranking settings"
on public.leaderboard_rankings_settings for select
to authenticated
using ((select private.is_leaderboard_owner()));
