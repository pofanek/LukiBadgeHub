alter table public.user_social_links
  drop constraint user_social_links_platform_check;

alter table public.user_social_links
  add constraint user_social_links_platform_check
  check (platform in ('steam', 'youtube', 'instagram', 'bluesky', 'backloggd', 'speedrun'));
