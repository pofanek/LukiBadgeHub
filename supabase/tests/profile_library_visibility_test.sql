begin;

select plan(5);

insert into auth.users (id, email)
values
  ('33333333-3333-3333-3333-333333333333', 'library-owner@example.com'),
  ('44444444-4444-4444-4444-444444444444', 'library-visitor@example.com')
on conflict (id) do nothing;

insert into public.user_profiles (id, username, country_code)
values
  ('33333333-3333-3333-3333-333333333333', 'library-owner', 'unknown'),
  ('44444444-4444-4444-4444-444444444444', 'library-visitor', 'unknown')
on conflict (id) do nothing;

insert into public.games (name, description, is_published)
values ('Profile library visibility test game', '', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select lives_ok(
  $$insert into public.user_game_library (user_id, game_id) values ('33333333-3333-3333-3333-333333333333', (select id from public.games where name = 'Profile library visibility test game'))$$,
  'owners can add a game to their library'
);

set local role anon;
select results_eq(
  $$select game_id from public.user_game_library where user_id = '33333333-3333-3333-3333-333333333333'$$,
  array[(select id from public.games where name = 'Profile library visibility test game')],
  'anonymous visitors can read games in another profile library'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select results_eq(
  $$select game_id from public.user_game_library where user_id = '33333333-3333-3333-3333-333333333333'$$,
  array[(select id from public.games where name = 'Profile library visibility test game')],
  'signed-in visitors can read games in another profile library'
);
select throws_ok(
  $$insert into public.user_game_library (user_id, game_id) values ('33333333-3333-3333-3333-333333333333', (select id from public.games where name = 'Profile library visibility test game'))$$,
  '42501',
  null,
  'visitors cannot add games to another profile library'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select lives_ok(
  $$delete from public.user_game_library where user_id = '33333333-3333-3333-3333-333333333333' and game_id = (select id from public.games where name = 'Profile library visibility test game')$$,
  'owners can remove games from their library'
);

select * from finish();
rollback;
