-- The legacy trigger inserts the same user_profiles row as
-- private.create_user_profile. Keeping both causes every Auth signup/OAuth
-- transaction to fail with a duplicate primary-key error.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Usernames were unique before Settings introduced its own Auth trigger. OAuth
-- provider metadata is not guaranteed to be unique, so derive a stable,
-- human-readable default with a short UUID suffix.
create or replace function private.create_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base_username text;
begin
  base_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'user_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'New member'
  );

  insert into public.user_profiles (id, username, country_code)
  values (
    new.id,
    left(base_username, 72) || '-' || left(new.id::text, 8),
    'unknown'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.create_user_profile() from public, anon, authenticated;

-- This table contains a short-lived server-side deletion challenge. It is
-- deliberately exposed only to service_role: authenticated users have no
-- grants or RLS policy and cannot create, inspect, or mark a challenge valid.
create table if not exists public.account_deletion_requests (
  user_id uuid primary key references auth.users (id) on delete cascade,
  password_verified_at timestamptz not null,
  email_verification_requested_at timestamptz not null,
  email_verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;

revoke all on table public.account_deletion_requests from anon, authenticated;
grant all on table public.account_deletion_requests to service_role;
