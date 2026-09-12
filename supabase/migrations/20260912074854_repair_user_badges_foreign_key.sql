-- A legacy foreign key on user_badges.badge_id references the previous badge
-- table. Remove every FK on that column before adding the current relationship.
do $$
declare
  legacy_constraint record;
begin
  for legacy_constraint in
    select distinct constraint_row.conname
    from pg_constraint constraint_row
    join pg_attribute attribute_row
      on attribute_row.attrelid = constraint_row.conrelid
      and attribute_row.attnum = any (constraint_row.conkey)
    where constraint_row.conrelid = 'public.user_badges'::regclass
      and constraint_row.contype = 'f'
      and attribute_row.attname = 'badge_id'
  loop
    execute format(
      'alter table public.user_badges drop constraint %I',
      legacy_constraint.conname
    );
  end loop;
end;
$$;

-- Preserve any ownership rows from the unresolvable legacy system instead of
-- discarding them. New game badges start with their own valid ownership rows.
create table if not exists private.legacy_user_badges (
  user_id uuid not null,
  badge_id bigint not null,
  earned_at timestamptz,
  archived_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

insert into private.legacy_user_badges (user_id, badge_id, earned_at)
select user_id, badge_id, earned_at
from public.user_badges
where not exists (
  select 1
  from public.game_badges
  where game_badges.id = user_badges.badge_id
)
on conflict (user_id, badge_id) do nothing;

delete from public.user_badges
where not exists (
  select 1
  from public.game_badges
  where game_badges.id = user_badges.badge_id
);

alter table public.user_badges
  add constraint user_badges_badge_id_fkey
  foreign key (badge_id)
  references public.game_badges (id)
  on delete cascade;
