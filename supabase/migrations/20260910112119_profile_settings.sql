create schema if not exists private;

create table if not exists public.country_options (
  code text primary key,
  name text not null unique,
  flag text not null,
  constraint country_options_code_check check (code = 'unknown' or code ~ '^[A-Z]{2}$')
);

insert into public.country_options (code, name, flag)
select
  code,
  case when code = 'unknown' then 'Unknown' else code end,
  case
    when code = 'unknown' then ''
    else chr(127397 + ascii(left(code, 1))) || chr(127397 + ascii(right(code, 1)))
  end
from unnest(array[
  'unknown', 'AF', 'AL', 'DZ', 'AD', 'AO', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BT', 'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CD', 'CR', 'CI', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FJ', 'FI', 'FR', 'GA', 'GM', 'GE', 'DE', 'GH', 'GR', 'GD', 'GT', 'GN', 'GW', 'GY', 'HT', 'HN', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MR', 'MU', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'MK', 'NO', 'OM', 'PK', 'PW', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT', 'QA', 'RO', 'RU', 'RW', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO', 'ZA', 'SS', 'ES', 'LK', 'SD', 'SR', 'SE', 'CH', 'SY', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TO', 'TT', 'TN', 'TR', 'TM', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VU', 'VE', 'VN', 'YE', 'ZM', 'ZW', 'PS', 'VA', 'TW', 'RS'
]) as country_codes(code)
on conflict (code) do update
set flag = excluded.flag;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null default 'New member',
  bio text,
  country_code text not null default 'unknown' references public.country_options (code),
  avatar_path text,
  banner_path text,
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists bio text,
  add column if not exists country_code text,
  add column if not exists banner_path text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_profiles' and column_name = 'country'
  ) then
    update public.user_profiles profile
    set country_code = coalesce(country.code, 'unknown')
    from public.country_options country
    where profile.country_code is null
      and lower(country.name) = lower(coalesce(profile.country, 'Unknown'));
  end if;
end;
$$;

update public.user_profiles
set country_code = 'unknown'
where country_code is null;

alter table public.user_profiles
  alter column country_code set default 'unknown',
  alter column country_code set not null;

do $$
declare
  existing_user_fk text;
begin
  select conname into existing_user_fk
  from pg_constraint
  where conrelid = 'public.user_profiles'::regclass
    and contype = 'f'
    and confrelid = 'auth.users'::regclass
    and (select attnum from pg_attribute where attrelid = 'public.user_profiles'::regclass and attname = 'id') = any(conkey);

  if existing_user_fk is not null then
    execute format('alter table public.user_profiles drop constraint %I', existing_user_fk);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_profiles_id_fkey' and conrelid = 'public.user_profiles'::regclass) then
    alter table public.user_profiles add constraint user_profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_profiles_country_code_fkey' and conrelid = 'public.user_profiles'::regclass) then
    alter table public.user_profiles add constraint user_profiles_country_code_fkey foreign key (country_code) references public.country_options (code);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_bio_length_check' and conrelid = 'public.user_profiles'::regclass) then
    alter table public.user_profiles add constraint user_profiles_bio_length_check check (bio is null or char_length(bio) <= 500);
  end if;
end;
$$;

create table if not exists public.user_social_links (
  profile_id uuid not null references public.user_profiles (id) on delete cascade,
  platform text not null,
  url text not null,
  updated_at timestamptz not null default now(),
  primary key (profile_id, platform),
  constraint user_social_links_platform_check check (platform in ('steam', 'youtube', 'instagram', 'bluesky')),
  constraint user_social_links_url_check check (url ~* '^https?://[^[:space:]]+$')
);

create index if not exists user_social_links_profile_id_idx on public.user_social_links (profile_id);

alter table public.country_options enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_social_links enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'country_options' and policyname = 'Country options are readable') then
    create policy "Country options are readable" on public.country_options for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Profiles are readable') then
    create policy "Profiles are readable" on public.user_profiles for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Owners update their profile') then
    create policy "Owners update their profile" on public.user_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_social_links' and policyname = 'Social links are readable') then
    create policy "Social links are readable" on public.user_social_links for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_social_links' and policyname = 'Owners manage their social links') then
    create policy "Owners manage their social links" on public.user_social_links for all to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
  end if;
end;
$$;

grant select on public.country_options, public.user_profiles, public.user_social_links to anon, authenticated;
grant update on public.user_profiles to authenticated;
grant insert, update, delete on public.user_social_links to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users upload their profile media') then
    create policy "Users upload their profile media" on storage.objects for insert to authenticated
      with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users delete their profile media') then
    create policy "Users delete their profile media" on storage.objects for delete to authenticated
      using (bucket_id = 'profile-media' and owner_id = (select auth.uid()::text));
  end if;
end;
$$;

create or replace function private.set_user_profile_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.create_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_profiles (id, username, country_code)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), nullif(split_part(new.email, '@', 1), ''), 'New member'), 'unknown')
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.set_user_profile_updated_at() from public, anon, authenticated;
revoke all on function private.create_user_profile() from public, anon, authenticated;

drop trigger if exists set_user_profile_updated_at on public.user_profiles;
create trigger set_user_profile_updated_at before update on public.user_profiles for each row execute function private.set_user_profile_updated_at();

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'create_luki_user_profile') then
    create trigger create_luki_user_profile after insert on auth.users for each row execute function private.create_user_profile();
  end if;
end;
$$;
