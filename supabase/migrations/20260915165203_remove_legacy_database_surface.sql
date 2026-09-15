-- These objects were imported by the source-schema baseline but have no
-- application call sites. They are empty and broaden the public Data API
-- surface, so remove them instead of maintaining policies and indexes for a
-- retired feature.
drop event trigger if exists rls_auto_enable;
drop function if exists public.rls_auto_enable();
drop table if exists public.user_favorited_games;
drop table if exists public.badges;
