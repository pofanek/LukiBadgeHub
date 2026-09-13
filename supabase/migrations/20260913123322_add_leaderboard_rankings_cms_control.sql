create table public.leaderboard_rankings_settings (
  id boolean primary key default true check (id),
  owner_id uuid not null default '3fd7d1a9-c1f2-4ba9-91d1-dd8f4154b8a3',
  started_at timestamptz
);

alter table public.leaderboard_rankings_settings enable row level security;

revoke all on table public.leaderboard_rankings_settings from anon, authenticated;
grant select on table public.leaderboard_rankings_settings to authenticated;

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

create policy "Leaderboard owner can read ranking settings"
on public.leaderboard_rankings_settings for select
to authenticated
using ((select private.is_leaderboard_owner()));

insert into public.leaderboard_rankings_settings (id)
values (true);

-- Best ranks from before the CMS-controlled snapshot are intentionally discarded.
delete from public.leaderboard_best_positions;

create or replace function private.record_best_leaderboard_position()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rankings_started_at timestamptz;
  current_rank bigint;
begin
  -- Coordinate with activation so a badge claim cannot be missed by the snapshot.
  select started_at
  into rankings_started_at
  from public.leaderboard_rankings_settings
  where id = true
  for key share;

  if rankings_started_at is null then
    return new;
  end if;

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

notify pgrst, 'reload schema';
