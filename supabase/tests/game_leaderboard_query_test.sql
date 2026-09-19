begin;

select plan(5);

insert into auth.users (id, email)
values
  ('77777777-7777-7777-7777-777777777777', 'game-leader-one@example.com'),
  ('88888888-8888-8888-8888-888888888888', 'game-leader-two@example.com');

insert into public.user_profiles (id, username, country_code)
values
  ('77777777-7777-7777-7777-777777777777', 'game-leader-one', 'unknown'),
  ('88888888-8888-8888-8888-888888888888', 'game-leader-two', 'unknown')
on conflict (id) do update
set username = excluded.username, country_code = excluded.country_code;

insert into public.games (name, description, is_published)
values ('Game leaderboard RPC test', '', true);

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Game leaderboard RPC easy', '', 'easy', 'low'
from public.games where name = 'Game leaderboard RPC test';
insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Game leaderboard RPC inhuman', '', 'inhuman', 'high'
from public.games where name = 'Game leaderboard RPC test';

insert into public.user_badges (user_id, badge_id)
select '77777777-7777-7777-7777-777777777777', id
from public.game_badges where name in ('Game leaderboard RPC easy', 'Game leaderboard RPC inhuman');
insert into public.user_badges (user_id, badge_id)
select '88888888-8888-8888-8888-888888888888', id
from public.game_badges where name = 'Game leaderboard RPC easy';

set local role anon;
select results_eq(
  $$select username from public.get_game_leaderboard((select id from public.games where name = 'Game leaderboard RPC test'), 100, 'badges')$$,
  array['game-leader-one', 'game-leader-two'],
  'anonymous users can read the game badge leaderboard'
);
select results_eq(
  $$select earned_experience from public.get_game_leaderboard((select id from public.games where name = 'Game leaderboard RPC test'), 100, 'experience') limit 1$$,
  array[70005::bigint],
  'the game EXP leaderboard calculates badge experience in PostgreSQL'
);
select results_eq(
  $$select player_rank from public.get_game_leaderboard((select id from public.games where name = 'Game leaderboard RPC test'), 100, 'badges')$$,
  array[1::bigint, 2::bigint],
  'the game leaderboard returns deterministic sequential ranks'
);
select is_empty(
  $$select * from public.get_game_leaderboard((select id from public.games where name = 'Game leaderboard RPC test'), 100, 'invalid')$$,
  'an invalid board returns no leaderboard rows'
);
select results_eq(
  $$select count(*)::integer from public.get_game_leaderboard((select id from public.games where name = 'Game leaderboard RPC test'), 999, 'badges')$$,
  array[2],
  'the function accepts a bounded page size'
);

select * from finish();
rollback;
