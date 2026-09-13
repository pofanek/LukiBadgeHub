alter table public.user_profiles
  add column if not exists hide_pinned_badge_edit boolean not null default false;
