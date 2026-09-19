begin;

select plan(18);

insert into auth.users (id, email)
values
  ('90000000-0000-0000-0000-000000000001', 'media-owner@example.com'),
  ('90000000-0000-0000-0000-000000000002', 'media-other@example.com'),
  ('90000000-0000-0000-0000-000000000003', 'media-admin@example.com')
on conflict (id) do nothing;

insert into public.user_profiles (id, username, country_code, role)
values
  ('90000000-0000-0000-0000-000000000001', 'media-owner', 'unknown', 'User'),
  ('90000000-0000-0000-0000-000000000002', 'media-other', 'unknown', 'User'),
  ('90000000-0000-0000-0000-000000000003', 'media-admin', 'unknown', 'Admin')
on conflict (id) do update set role = excluded.role;

insert into public.games (name, description, is_published)
values ('Media lifecycle test game', '', false)
on conflict (lower(name)) do nothing;

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Media lifecycle Inhuman badge', '', 'inhuman', 'high'
from public.games
where name = 'Media lifecycle test game'
on conflict (game_id, lower(name)) do nothing;

select is(
  to_regclass('public.media_uploads')::text,
  'media_uploads',
  'pending uploads are tracked privately'
);
select is(
  to_regclass('public.media_cleanup_queue')::text,
  'media_cleanup_queue',
  'orphan cleanup work is tracked privately'
);
select ok(
  to_regprocedure('private.invoke_media_cleanup()') is not null,
  'the scheduled cleanup invocation is available to Supabase Cron'
);

set local role anon;
select throws_ok(
  $$select public.activate_media_upload('90000000-0000-0000-0000-000000000010')$$,
  '42501',
  null,
  'anonymous callers cannot activate media'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$update public.user_profiles set avatar_path = '90000000-0000-0000-0000-000000000001/avatar/unverified.png' where id = '90000000-0000-0000-0000-000000000001'$$,
  '42501',
  'Media paths are managed by confirmed uploads.',
  'a user cannot make an unverified upload active'
);
select throws_ok(
  $$select * from public.media_uploads$$,
  '42501',
  null,
  'pending upload state is not readable by a browser role'
);
select throws_ok(
  $$insert into public.media_uploads (owner_id, target, object_path, declared_content_type, declared_bytes, max_bytes) values ('90000000-0000-0000-0000-000000000002', 'profile-avatar', 'other/avatar/file.png', 'image/png', 1, 5242880)$$,
  '42501',
  null,
  'a user cannot create an upload for another resource owner'
);

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
update public.user_profiles
set avatar_path = '90000000-0000-0000-0000-000000000001/avatar/old.png'
where id = '90000000-0000-0000-0000-000000000001';

insert into public.media_uploads (
  id, owner_id, target, object_path, staging_object_path, expected_previous_object_path, declared_content_type, declared_bytes, max_bytes, status
)
values (
  '90000000-0000-0000-0000-000000000011',
  '90000000-0000-0000-0000-000000000001',
  'profile-avatar',
  '90000000-0000-0000-0000-000000000001/avatar/90000000-0000-0000-0000-000000000011.png',
  'pending/90000000-0000-0000-0000-000000000011.png',
  '90000000-0000-0000-0000-000000000001/avatar/old.png',
  'image/png', 64, 5242880, 'verified'
);
select results_eq(
  $$select object_path from public.activate_media_upload('90000000-0000-0000-0000-000000000011')$$,
  array['90000000-0000-0000-0000-000000000001/avatar/90000000-0000-0000-0000-000000000011.png'],
  'a verified replacement becomes active'
);
select results_eq(
  $$select avatar_path from public.user_profiles where id = '90000000-0000-0000-0000-000000000001'$$,
  array['90000000-0000-0000-0000-000000000001/avatar/90000000-0000-0000-0000-000000000011.png'],
  'activation switches the database reference before cleanup'
);
select results_eq(
  $$select previous_object_path from public.media_uploads where id = '90000000-0000-0000-0000-000000000011'$$,
  array['90000000-0000-0000-0000-000000000001/avatar/old.png'],
  'the old object remains queued until it is safely deleted'
);

insert into public.media_uploads (
  id, owner_id, target, object_path, staging_object_path, declared_content_type, declared_bytes, max_bytes, status
)
values (
  '90000000-0000-0000-0000-000000000012',
  '90000000-0000-0000-0000-000000000001',
  'profile-avatar',
  '90000000-0000-0000-0000-000000000001/avatar/90000000-0000-0000-0000-000000000012.png',
  'pending/90000000-0000-0000-0000-000000000012.png',
  'image/png', 64, 5242880, 'pending'
);
select throws_ok(
  $$select public.activate_media_upload('90000000-0000-0000-0000-000000000012')$$,
  'P0001',
  'The media upload cannot be activated.',
  'an unverified replacement cannot activate'
);
select results_eq(
  $$select avatar_path from public.user_profiles where id = '90000000-0000-0000-0000-000000000001'$$,
  array['90000000-0000-0000-0000-000000000001/avatar/90000000-0000-0000-0000-000000000011.png'],
  'a failed replacement preserves the active object reference'
);

update public.user_profiles
set banner_path = '90000000-0000-0000-0000-000000000001/banner/90000000-0000-0000-0000-000000000011.png'
where id = '90000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select lives_ok(
  $$update public.user_profiles set banner_path = null where id = '90000000-0000-0000-0000-000000000001'$$,
  'an authenticated user can clear active media without direct queue privileges'
);
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select results_eq(
  $$select object_path from public.media_cleanup_queue where object_path = '90000000-0000-0000-0000-000000000001/banner/90000000-0000-0000-0000-000000000011.png'$$,
  array['90000000-0000-0000-0000-000000000001/banner/90000000-0000-0000-0000-000000000011.png'],
  'cleared active media is placed in the private cleanup inventory'
);

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
insert into public.media_uploads (
  id, owner_id, target, object_path, staging_object_path, declared_content_type, declared_bytes, max_bytes, status
)
values (
  '90000000-0000-0000-0000-000000000014',
  '90000000-0000-0000-0000-000000000001',
  'profile-avatar',
  '90000000-0000-0000-0000-000000000001/avatar/90000000-0000-0000-0000-000000000014.png',
  'pending/90000000-0000-0000-0000-000000000014.png',
  'image/png', 64, 5242880, 'pending'
);
delete from public.media_uploads where id = '90000000-0000-0000-0000-000000000014';
select results_eq(
  $$select object_path from public.media_cleanup_queue where object_path in ('90000000-0000-0000-0000-000000000001/avatar/90000000-0000-0000-0000-000000000014.png', 'pending/90000000-0000-0000-0000-000000000014.png') order by object_path$$,
  array['90000000-0000-0000-0000-000000000001/avatar/90000000-0000-0000-0000-000000000014.png', 'pending/90000000-0000-0000-0000-000000000014.png'],
  'deleting upload inventory rows preserves every R2 key for cleanup'
);

insert into public.media_uploads (
  id, owner_id, target, object_path, staging_object_path, declared_content_type, declared_bytes, max_bytes,
  status, created_at, expires_at
)
values (
  '90000000-0000-0000-0000-000000000013',
  '90000000-0000-0000-0000-000000000001',
  'profile-avatar',
  '90000000-0000-0000-0000-000000000001/avatar/90000000-0000-0000-0000-000000000013.png',
  'pending/90000000-0000-0000-0000-000000000013.png',
  'image/png', 64, 5242880, 'verified', now() - interval '2 days', now() - interval '1 day'
);
select throws_ok(
  $$select public.activate_media_upload('90000000-0000-0000-0000-000000000013')$$,
  'P0001',
  'The media upload cannot be activated.',
  'expired uploads cannot replace active media'
);
select lives_ok(
  $$insert into public.media_cleanup_queue (object_path) values ('pending/90000000-0000-0000-0000-000000000015.png')$$,
  'orphaned paths can be queued for scheduled cleanup'
);
select results_eq(
  $$select object_path from public.media_cleanup_queue where object_path = 'pending/90000000-0000-0000-0000-000000000015.png'$$,
  array['pending/90000000-0000-0000-0000-000000000015.png'],
  'the cleanup worker has an orphan inventory item to process'
);

select * from finish();
rollback;
