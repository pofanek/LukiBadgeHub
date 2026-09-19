alter table public.user_profiles
  add column if not exists hide_homepage_username_edit boolean not null default false;

grant update (hide_homepage_username_edit) on public.user_profiles to authenticated;
