begin;

select plan(5);

insert into auth.users (id, email)
values
  ('55555555-5555-5555-5555-555555555555', 'pinned-games-owner@example.com'),
  ('66666666-6666-6666-6666-666666666666', 'pinned-games-visitor@example.com')
on conflict (id) do nothing;

insert into public.user_profiles (id, username, country_code)
values
  ('55555555-5555-5555-5555-555555555555', 'pinned-games-owner', 'unknown'),
  ('66666666-6666-6666-6666-666666666666', 'pinned-games-visitor', 'unknown')
on conflict (id) do nothing;

insert into public.games (name, description, is_published)
values ('Profile pinned games test game', '', true);

select is(
  to_regclass('public.profile_pinned_games')::text,
  'profile_pinned_games',
  'profile pinned games table exists'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
select lives_ok(
  $$insert into public.profile_pinned_games (profile_id, game_id) values ('55555555-5555-5555-5555-555555555555', (select id from public.games where name = 'Profile pinned games test game'))$$,
  'owners can pin a game on their profile'
);

set local role anon;
select results_eq(
  $$select game_id from public.profile_pinned_games where profile_id = '55555555-5555-5555-5555-555555555555'$$,
  array[(select id from public.games where name = 'Profile pinned games test game')],
  'anonymous visitors can read pinned profile games'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
select throws_ok(
  $$insert into public.profile_pinned_games (profile_id, game_id) values ('55555555-5555-5555-5555-555555555555', (select id from public.games where name = 'Profile pinned games test game'))$$,
  '42501',
  null,
  'visitors cannot pin games on another profile'
);

select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
select lives_ok(
  $$delete from public.profile_pinned_games where profile_id = '55555555-5555-5555-5555-555555555555' and game_id = (select id from public.games where name = 'Profile pinned games test game')$$,
  'owners can unpin their games'
);

select * from finish();
rollback;
