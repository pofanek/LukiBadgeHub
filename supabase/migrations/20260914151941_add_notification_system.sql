-- Notifications are created by trusted database triggers only. Clients can
-- read, update the read state, and delete their own inbox rows.
alter table public.notifications
  add column if not exists type text not null default 'legacy',
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists action_path text,
  add column if not exists read_at timestamptz;

update public.notifications
set
  title = coalesce(title, message),
  body = coalesce(body, ''),
  read_at = coalesce(read_at, case when readed then created_at end);

alter table public.notifications
  alter column title set not null,
  alter column body set not null,
  drop column if exists message,
  drop column if exists readed;

alter table public.notifications
  drop constraint if exists notifications_user_id_fkey;

alter table public.notifications
  add constraint notifications_user_id_fkey
  foreign key (user_id)
  references public.user_profiles (id)
  on delete cascade;

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create table public.user_notification_preferences (
  user_id uuid primary key references public.user_profiles (id) on delete cascade,
  role_granted_enabled boolean not null default true,
  special_badge_awarded_enabled boolean not null default true,
  new_follower_enabled boolean not null default true,
  new_mutual_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_notification_preferences enable row level security;

insert into public.user_notification_preferences (user_id)
select id
from public.user_profiles
on conflict (user_id) do nothing;

create or replace function private.create_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.create_notification_preferences()
  from public, anon, authenticated;

drop trigger if exists create_notification_preferences on public.user_profiles;
create trigger create_notification_preferences
after insert on public.user_profiles
for each row execute function private.create_notification_preferences();

create or replace function private.notification_enabled(
  p_user_id uuid,
  p_type text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select case p_type
        when 'role_granted' then preferences.role_granted_enabled
        when 'special_badge_awarded' then preferences.special_badge_awarded_enabled
        when 'new_follower' then preferences.new_follower_enabled
        when 'new_mutual' then preferences.new_mutual_enabled
        else true
      end
      from public.user_notification_preferences as preferences
      where preferences.user_id = p_user_id
    ),
    true
  );
$$;

revoke all on function private.notification_enabled(uuid, text)
  from public, anon, authenticated;

create or replace function private.notify_role_granted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role is not distinct from new.role
    or new.role not in ('Admin'::public.role, 'Moderator'::public.role, 'Supporter'::public.role)
    or not private.notification_enabled(new.id, 'role_granted') then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, action_path)
  values (
    new.id,
    'role_granted',
    'New role granted',
    format('You are now a %s.', new.role),
    format('/profile/%s', new.username)
  );

  return new;
end;
$$;

revoke all on function private.notify_role_granted()
  from public, anon, authenticated;

drop trigger if exists notify_role_granted on public.user_profiles;
create trigger notify_role_granted
after update of role on public.user_profiles
for each row execute function private.notify_role_granted();

create or replace function private.notify_special_badge_awarded()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  badge_name text;
  game_name text;
  game_id bigint;
begin
  select badges.name, games.name, games.id
  into badge_name, game_name, game_id
  from public.game_badges as badges
  join public.games on games.id = badges.game_id
  where badges.id = new.badge_id
    and badges.difficulty in ('extreme', 'supreme', 'inhuman');

  if not found
    or not private.notification_enabled(new.user_id, 'special_badge_awarded') then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, action_path)
  values (
    new.user_id,
    'special_badge_awarded',
    'Special badge awarded',
    format('You received %s for %s.', badge_name, game_name),
    format('/games/%s', game_id)
  );

  return new;
end;
$$;

revoke all on function private.notify_special_badge_awarded()
  from public, anon, authenticated;

drop trigger if exists notify_special_badge_awarded on public.user_badges;
create trigger notify_special_badge_awarded
after insert on public.user_badges
for each row execute function private.notify_special_badge_awarded();

create or replace function private.notify_follow_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  follower_username text;
  is_mutual boolean;
begin
  select username
  into follower_username
  from public.user_profiles
  where id = new.follower_id;

  select exists (
    select 1
    from public.user_follows
    where follower_id = new.following_id
      and following_id = new.follower_id
  )
  into is_mutual;

  if is_mutual then
    if private.notification_enabled(new.follower_id, 'new_mutual') then
      insert into public.notifications (user_id, type, title, body, action_path)
      values (
        new.follower_id,
        'new_mutual',
        'New mutual',
        format('%s followed you back — you are now mutuals.', follower_username),
        format('/profile/%s', follower_username)
      );
    end if;
  elsif private.notification_enabled(new.following_id, 'new_follower') then
    insert into public.notifications (user_id, type, title, body, action_path)
    values (
      new.following_id,
      'new_follower',
      'New follower',
      format('%s started following you.', follower_username),
      format('/profile/%s', follower_username)
    );
  end if;

  return new;
end;
$$;

revoke all on function private.notify_follow_created()
  from public, anon, authenticated;

drop trigger if exists notify_follow_created on public.user_follows;
create trigger notify_follow_created
after insert on public.user_follows
for each row execute function private.notify_follow_created();

drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Users can delete their own notifications" on public.notifications;

create policy "Users can view their own notifications"
on public.notifications for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their own notifications"
on public.notifications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notifications"
on public.notifications for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their notification preferences"
on public.user_notification_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their notification preferences"
on public.user_notification_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on table public.notifications from anon, authenticated;
grant select, delete on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

revoke all on table public.user_notification_preferences from anon, authenticated;
grant select on table public.user_notification_preferences to authenticated;
grant update (
  role_granted_enabled,
  special_badge_awarded_enabled,
  new_follower_enabled,
  new_mutual_enabled
) on table public.user_notification_preferences to authenticated;

alter publication supabase_realtime add table public.notifications;

notify pgrst, 'reload schema';
