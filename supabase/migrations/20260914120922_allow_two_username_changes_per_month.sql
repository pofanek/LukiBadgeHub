create table if not exists private.user_profile_username_change_log (
  profile_id uuid not null references public.user_profiles (id) on delete cascade,
  changed_at timestamptz not null default now(),
  primary key (profile_id, changed_at)
);

create index if not exists user_profile_username_change_log_profile_id_changed_at_idx
  on private.user_profile_username_change_log (profile_id, changed_at desc);

insert into private.user_profile_username_change_log (profile_id, changed_at)
select id, username_changed_at
from public.user_profiles
where username_changed_at is not null
on conflict do nothing;

create or replace function private.track_username_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.username is not distinct from old.username then
    if new.username_changed_at is distinct from old.username_changed_at then
      raise exception 'The username change date is managed automatically.';
    end if;
    return new;
  end if;

  new.username := btrim(new.username);
  if new.username = '' then
    raise exception 'Username cannot be empty.';
  end if;

  if (
    select count(*)
    from private.user_profile_username_change_log
    where profile_id = old.id
      and changed_at > now() - interval '1 month'
  ) >= 2 then
    raise exception 'Username can only be changed twice per month.';
  end if;

  if exists (
    select 1 from public.user_profile_username_history
    where username = new.username and profile_id <> old.id
  ) then
    raise exception 'This username is reserved by another profile.';
  end if;

  insert into public.user_profile_username_history (username, profile_id)
  values (old.username, old.id)
  on conflict (username) do nothing;

  insert into private.user_profile_username_change_log (profile_id)
  values (old.id);

  new.username_changed_at := now();
  return new;
end;
$$;

revoke all on function private.track_username_change() from public, anon, authenticated;
