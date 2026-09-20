alter table public.user_social_links
  add constraint user_social_links_service_url_check
  check (
    platform in ('instagram', 'bluesky')
    or (platform = 'steam' and url ~* '^https?://([a-z0-9-]+\.)*steamcommunity\.com([/:?#]|$)')
    or (platform = 'youtube' and url ~* '^https?://([a-z0-9-]+\.)*youtube\.com([/:?#]|$)')
    or (platform = 'backloggd' and url ~* '^https?://([a-z0-9-]+\.)*backloggd\.com([/:?#]|$)')
    or (platform = 'speedrun' and url ~* '^https?://([a-z0-9-]+\.)*speedrun\.com([/:?#]|$)')
  ) not valid;
