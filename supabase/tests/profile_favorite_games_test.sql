begin;

select plan(6);

insert into auth.users (id, email)
values
  ('77777777-7777-7777-7777-777777777777', 'favorite-game-owner@example.com'),
  ('88888888-8888-8888-8888-888888888888', 'favorite-game-visitor@example.com')
on conflict (id) do nothing;

insert into public.user_profiles (id, username, country_code)
values
  ('77777777-7777-7777-7777-777777777777', 'favorite-game-owner', 'unknown'),
  ('88888888-8888-8888-8888-888888888888', 'favorite-game-visitor', 'unknown')
on conflict (id) do nothing;

insert into public.games (name, description, is_published)
values
  ('Profile favorite games test game one', '', true),
  ('Profile favorite games test game two', '', true);

select is(
  to_regclass('public.profile_favorite_games')::text,
  'profile_favorite_games',
  'profile favorite games table exists'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-7777-7777-777777777777', true);
select lives_ok(
  $$insert into public.profile_favorite_games (profile_id, game_id) values ('77777777-7777-7777-7777-777777777777', (select id from public.games where name = 'Profile favorite games test game one'))$$,
  'owners can choose a favorite game'
);

set local role anon;
select results_eq(
  $$select game_id from public.profile_favorite_games where profile_id = '77777777-7777-7777-7777-777777777777'$$,
  array[(select id from public.games where name = 'Profile favorite games test game one')],
  'anonymous visitors can read a profile favorite game'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '88888888-8888-8888-8888-888888888888', true);
select results_eq(
  $$with updated as (update public.profile_favorite_games set game_id = (select id from public.games where name = 'Profile favorite games test game two') where profile_id = '77777777-7777-7777-7777-777777777777' returning game_id) select game_id from updated$$,
  array[]::bigint[],
  'visitors cannot change another profile favorite game'
);

select set_config('request.jwt.claim.sub', '77777777-7777-7777-7777-777777777777', true);
select lives_ok(
  $$update public.profile_favorite_games set game_id = (select id from public.games where name = 'Profile favorite games test game two') where profile_id = '77777777-7777-7777-7777-777777777777'$$,
  'owners can change their favorite game'
);
select lives_ok(
  $$delete from public.profile_favorite_games where profile_id = '77777777-7777-7777-7777-777777777777'$$,
  'owners can clear their favorite game'
);

select * from finish();
rollback;
