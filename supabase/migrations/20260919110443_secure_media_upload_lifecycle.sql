create schema if not exists private;

create table public.media_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  target text not null check (target in (
    'profile-avatar',
    'profile-banner',
    'game-cover',
    'game-banner',
    'badge-icon'
  )),
  object_path text not null unique check (object_path <> ''),
  staging_object_path text unique check (staging_object_path <> ''),
  declared_content_type text not null check (declared_content_type in (
    'image/jpeg',
    'image/png',
    'image/webp'
  )),
  declared_bytes integer not null check (declared_bytes > 0),
  max_bytes integer not null check (max_bytes > 0),
  game_id bigint references public.games (id) on delete cascade,
  badge_id bigint references public.game_badges (id) on delete cascade,
  badge_difficulty text,
  badge_tier text,
  status text not null default 'pending' check (status in (
    'pending',
    'verified',
    'activated',
    'invalid',
    'expired'
  )),
  previous_object_path text,
  expected_previous_object_path text,
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint media_uploads_target_resource_check check (
    (target in ('profile-avatar', 'profile-banner') and game_id is null and badge_id is null)
    or (target in ('game-cover', 'game-banner') and game_id is not null and badge_id is null)
    or (target = 'badge-icon' and game_id is not null and badge_id is not null)
  ),
  constraint media_uploads_expiry_check check (expires_at > created_at),
  constraint media_uploads_declared_size_check check (declared_bytes <= max_bytes),
  constraint media_uploads_target_limit_check check (
    (target in ('profile-avatar', 'profile-banner') and max_bytes = 5242880)
    or (target in ('game-cover', 'game-banner', 'badge-icon') and max_bytes = 10485760)
  ),
  constraint media_uploads_badge_metadata_check check (
    (target = 'badge-icon' and badge_difficulty = 'inhuman' and badge_tier in ('low', 'mid', 'high'))
    or (target <> 'badge-icon' and badge_difficulty is null and badge_tier is null)
  ),
  constraint media_uploads_target_path_check check (
    (target = 'profile-avatar' and object_path like owner_id::text || '/avatar/%' and object_path ~ '^[0-9a-f-]{36}/avatar/[0-9a-f-]{36}\.(jpg|png|webp)$')
    or (target = 'profile-banner' and object_path like owner_id::text || '/banner/%' and object_path ~ '^[0-9a-f-]{36}/banner/[0-9a-f-]{36}\.(jpg|png|webp)$')
    or (target = 'game-cover' and object_path like 'games/' || game_id::text || '/cover/%' and object_path ~ '^games/[0-9]+/cover/[0-9a-f-]{36}\.(jpg|png|webp)$')
    or (target = 'game-banner' and object_path like 'games/' || game_id::text || '/banner/%' and object_path ~ '^games/[0-9]+/banner/[0-9a-f-]{36}\.(jpg|png|webp)$')
    or (target = 'badge-icon' and object_path like 'games/' || game_id::text || '/badges/' || badge_id::text || '/%' and object_path ~ '^games/[0-9]+/badges/[0-9]+/[0-9a-f-]{36}\.(jpg|png|webp)$')
  ),
  constraint media_uploads_staging_path_check check (
    staging_object_path is null
    or staging_object_path ~ '^pending/[0-9a-f-]{36}\.(jpg|png|webp)$'
  )
);

create index media_uploads_expiry_cleanup_idx
  on public.media_uploads (expires_at)
  where status in ('pending', 'verified', 'invalid');

create index media_uploads_previous_object_cleanup_idx
  on public.media_uploads (activated_at)
  where previous_object_path is not null;

create index media_uploads_owner_id_idx on public.media_uploads (owner_id);
create index media_uploads_game_id_idx on public.media_uploads (game_id) where game_id is not null;
create index media_uploads_badge_id_idx on public.media_uploads (badge_id) where badge_id is not null;

create table public.media_cleanup_queue (
  object_path text primary key check (object_path <> ''),
  created_at timestamptz not null default now(),
  attempts smallint not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz
);

create index media_cleanup_queue_created_at_idx on public.media_cleanup_queue (created_at);

alter table public.media_uploads enable row level security;
alter table public.media_cleanup_queue enable row level security;

revoke all on table public.media_uploads, public.media_cleanup_queue
  from public, anon, authenticated;
grant all on table public.media_uploads, public.media_cleanup_queue to service_role;

create or replace function private.is_managed_media_path(path text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select path ~ '^[0-9a-f-]{36}/(avatar|banner)/[0-9a-f-]{36}\.(jpg|png|webp)$'
    or path ~ '^games/[0-9]+/(cover|banner)/[0-9a-f-]{36}\.(jpg|png|webp)$'
    or path ~ '^games/[0-9]+/badges/[0-9]+/[0-9a-f-]{36}\.(jpg|png|webp)$'
    or path ~ '^pending/[0-9a-f-]{36}\.(jpg|png|webp)$';
$$;

revoke all on function private.is_managed_media_path(text)
  from public, anon, authenticated;
grant execute on function private.is_managed_media_path(text)
  to service_role;

alter table public.media_cleanup_queue
  add constraint media_cleanup_queue_managed_path_check
  check (private.is_managed_media_path(object_path));

create or replace function private.reject_unverified_media_references()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_path text;
  new_path text;
begin
  if tg_table_name = 'user_profiles' and tg_op = 'INSERT' then
    return new;
  end if;

  if tg_table_name = 'user_profiles' then
    old_path := case when tg_op = 'INSERT' then null else old.avatar_path end;
    new_path := new.avatar_path;
    if old_path is distinct from new_path then
      if (select auth.role()) is distinct from 'service_role' and new_path is not null then
        raise exception 'Media paths are managed by confirmed uploads.' using errcode = '42501';
      end if;
      if (select auth.role()) is distinct from 'service_role'
        and old_path is not null
        and private.is_managed_media_path(old_path) then
        insert into public.media_cleanup_queue (object_path)
        values (old_path)
        on conflict (object_path) do nothing;
      end if;
    end if;

    old_path := case when tg_op = 'INSERT' then null else old.banner_path end;
    new_path := new.banner_path;
    if old_path is distinct from new_path then
      if (select auth.role()) is distinct from 'service_role' and new_path is not null then
        raise exception 'Media paths are managed by confirmed uploads.' using errcode = '42501';
      end if;
      if (select auth.role()) is distinct from 'service_role'
        and old_path is not null
        and private.is_managed_media_path(old_path) then
        insert into public.media_cleanup_queue (object_path)
        values (old_path)
        on conflict (object_path) do nothing;
      end if;
    end if;
  elsif tg_table_name = 'games' then
    old_path := case when tg_op = 'INSERT' then null else old.cover_path end;
    new_path := new.cover_path;
    if old_path is distinct from new_path then
      if (select auth.role()) is distinct from 'service_role' and new_path is not null then
        raise exception 'Media paths are managed by confirmed uploads.' using errcode = '42501';
      end if;
      if (select auth.role()) is distinct from 'service_role'
        and old_path is not null
        and private.is_managed_media_path(old_path) then
        insert into public.media_cleanup_queue (object_path)
        values (old_path)
        on conflict (object_path) do nothing;
      end if;
    end if;

    old_path := case when tg_op = 'INSERT' then null else old.banner_path end;
    new_path := new.banner_path;
    if old_path is distinct from new_path then
      if (select auth.role()) is distinct from 'service_role' and new_path is not null then
        raise exception 'Media paths are managed by confirmed uploads.' using errcode = '42501';
      end if;
      if (select auth.role()) is distinct from 'service_role'
        and old_path is not null
        and private.is_managed_media_path(old_path) then
        insert into public.media_cleanup_queue (object_path)
        values (old_path)
        on conflict (object_path) do nothing;
      end if;
    end if;
  elsif tg_table_name = 'game_badges' then
    old_path := case when tg_op = 'INSERT' then null else old.icon_path end;
    new_path := new.icon_path;
    if old_path is distinct from new_path then
      if (select auth.role()) is distinct from 'service_role' and new_path is not null then
        raise exception 'Media paths are managed by confirmed uploads.' using errcode = '42501';
      end if;
      if (select auth.role()) is distinct from 'service_role'
        and old_path is not null
        and private.is_managed_media_path(old_path) then
        insert into public.media_cleanup_queue (object_path)
        values (old_path)
        on conflict (object_path) do nothing;
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.reject_unverified_media_references()
  from public, anon, authenticated;

create or replace function private.queue_deleted_media_upload()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_managed_media_path(old.object_path) then
    insert into public.media_cleanup_queue (object_path)
    values (old.object_path)
    on conflict (object_path) do nothing;
  end if;
  if private.is_managed_media_path(old.staging_object_path) then
    insert into public.media_cleanup_queue (object_path)
    values (old.staging_object_path)
    on conflict (object_path) do nothing;
  end if;
  if old.previous_object_path is not null and private.is_managed_media_path(old.previous_object_path) then
    insert into public.media_cleanup_queue (object_path)
    values (old.previous_object_path)
    on conflict (object_path) do nothing;
  end if;
  return old;
end;
$$;

revoke all on function private.queue_deleted_media_upload()
  from public, anon, authenticated;

create trigger queue_deleted_media_upload
before delete on public.media_uploads
for each row execute function private.queue_deleted_media_upload();

drop trigger if exists reject_unverified_profile_media_references on public.user_profiles;
create trigger reject_unverified_profile_media_references
before insert or update of avatar_path, banner_path on public.user_profiles
for each row execute function private.reject_unverified_media_references();

drop trigger if exists reject_unverified_game_media_references on public.games;
create trigger reject_unverified_game_media_references
before insert or update of cover_path, banner_path on public.games
for each row execute function private.reject_unverified_media_references();

drop trigger if exists reject_unverified_badge_media_references on public.game_badges;
create trigger reject_unverified_badge_media_references
before insert or update of icon_path on public.game_badges
for each row execute function private.reject_unverified_media_references();

create or replace function public.activate_media_upload(
  p_upload_id uuid,
  p_badge_difficulty text default null,
  p_badge_tier text default null
)
returns table (object_path text, previous_object_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  upload public.media_uploads%rowtype;
  previous_path text;
begin
  select * into upload
  from public.media_uploads
  where id = p_upload_id
  for update;

  if not found or upload.status <> 'verified' or upload.expires_at <= now() then
    raise exception 'The media upload cannot be activated.' using errcode = 'P0001';
  end if;

  if upload.target = 'badge-icon'
    and (p_badge_difficulty <> 'inhuman' or p_badge_tier not in ('low', 'mid', 'high')) then
    raise exception 'The media upload cannot be activated.' using errcode = 'P0001';
  end if;

  case upload.target
    when 'profile-avatar' then
      select avatar_path into previous_path
      from public.user_profiles
      where id = upload.owner_id
      for update;
      if not found then
        raise exception 'The media upload owner no longer exists.' using errcode = 'P0001';
      end if;
      if previous_path is distinct from upload.expected_previous_object_path then
        raise exception 'The media target changed. Upload it again.' using errcode = 'P0001';
      end if;
      update public.user_profiles
      set avatar_path = upload.object_path
      where id = upload.owner_id;

    when 'profile-banner' then
      select banner_path into previous_path
      from public.user_profiles
      where id = upload.owner_id
      for update;
      if not found then
        raise exception 'The media upload owner no longer exists.' using errcode = 'P0001';
      end if;
      if previous_path is distinct from upload.expected_previous_object_path then
        raise exception 'The media target changed. Upload it again.' using errcode = 'P0001';
      end if;
      update public.user_profiles
      set banner_path = upload.object_path
      where id = upload.owner_id;

    when 'game-cover' then
      select cover_path into previous_path
      from public.games
      where id = upload.game_id
      for update;
      if not found then
        raise exception 'The game no longer exists.' using errcode = 'P0001';
      end if;
      if previous_path is distinct from upload.expected_previous_object_path then
        raise exception 'The media target changed. Upload it again.' using errcode = 'P0001';
      end if;
      update public.games
      set cover_path = upload.object_path, cover_position = 'center'
      where id = upload.game_id;

    when 'game-banner' then
      select banner_path into previous_path
      from public.games
      where id = upload.game_id
      for update;
      if not found then
        raise exception 'The game no longer exists.' using errcode = 'P0001';
      end if;
      if previous_path is distinct from upload.expected_previous_object_path then
        raise exception 'The media target changed. Upload it again.' using errcode = 'P0001';
      end if;
      update public.games
      set banner_path = upload.object_path
      where id = upload.game_id;

    when 'badge-icon' then
      select icon_path into previous_path
      from public.game_badges
      where id = upload.badge_id
        and game_id = upload.game_id
      for update;
      if not found then
        raise exception 'The badge no longer accepts a custom icon.' using errcode = 'P0001';
      end if;
      if previous_path is distinct from upload.expected_previous_object_path then
        raise exception 'The media target changed. Upload it again.' using errcode = 'P0001';
      end if;
      update public.game_badges
      set
        icon_path = upload.object_path,
        difficulty = coalesce(p_badge_difficulty, difficulty),
        tier = coalesce(p_badge_tier, tier)
      where id = upload.badge_id
        and game_id = upload.game_id;
  end case;

  update public.media_uploads
  set
    status = 'activated',
    activated_at = now(),
    previous_object_path = previous_path
  where id = upload.id;

  return query select upload.object_path, previous_path;
end;
$$;

revoke all on function public.activate_media_upload(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.activate_media_upload(uuid, text, text)
  to service_role;

create or replace function private.invoke_media_cleanup()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  service_role_key text;
begin
  select decrypted_secret into project_url
  from vault.decrypted_secrets
  where name = 'media_cleanup_project_url';

  select decrypted_secret into service_role_key
  from vault.decrypted_secrets
  where name = 'media_cleanup_service_role_key';

  if project_url is null or service_role_key is null then
    raise exception 'Media cleanup scheduler secrets are not configured.' using errcode = 'P0001';
  end if;

  perform net.http_post(
    url := project_url || '/functions/v1/media',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'apikey', service_role_key,
      'Content-Type', 'application/json'
    ),
    body := '{"action":"cleanup-stale"}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$;

revoke all on function private.invoke_media_cleanup()
  from public, anon, authenticated;

notify pgrst, 'reload schema';
