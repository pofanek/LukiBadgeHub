-- A previous username remains reserved so shared links keep resolving after a
-- profile owner changes it.
alter table public.user_profiles
  add column if not exists username_changed_at timestamptz;

create table if not exists public.user_profile_username_history (
  username text primary key,
  profile_id uuid not null references public.user_profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists user_profile_username_history_profile_id_idx
  on public.user_profile_username_history (profile_id);

alter table public.user_profile_username_history enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profile_username_history'
      and policyname = 'Username history is readable'
  ) then
    create policy "Username history is readable"
      on public.user_profile_username_history
      for select to anon, authenticated
      using (true);
  end if;
end;
$$;

grant select on public.user_profile_username_history to anon, authenticated;

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

  if old.username_changed_at > now() - interval '1 month' then
    raise exception 'Username can only be changed once per month.';
  end if;

  if exists (
    select 1
    from public.user_profile_username_history
    where username = new.username
      and profile_id <> old.id
  ) then
    raise exception 'This username is reserved by another profile.';
  end if;

  insert into public.user_profile_username_history (username, profile_id)
  values (old.username, old.id)
  on conflict (username) do nothing;

  new.username_changed_at := now();
  return new;
end;
$$;

revoke all on function private.track_username_change() from public, anon, authenticated;

drop trigger if exists track_user_profile_username_change on public.user_profiles;
create trigger track_user_profile_username_change
before update of username, username_changed_at on public.user_profiles
for each row execute function private.track_username_change();
