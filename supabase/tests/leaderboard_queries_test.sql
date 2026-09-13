begin;

select plan(5);

insert into auth.users (id, email)
values
  ('55555555-5555-5555-5555-555555555555', 'leader-one@example.com'),
  ('66666666-6666-6666-6666-666666666666', 'leader-two@example.com')
on conflict (id) do nothing;

insert into public.user_profiles (id, username, country_code)
values
  ('55555555-5555-5555-5555-555555555555', 'leader-one', 'unknown'),
  ('66666666-6666-6666-6666-666666666666', 'leader-two', 'unknown')
on conflict (id) do nothing;

insert into public.games (name, description, is_published)
values ('Leaderboard query test game', '', true);

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Leaderboard easy', '', 'easy', 'low'
from public.games where name = 'Leaderboard query test game';
insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Leaderboard inhuman', '', 'inhuman', 'high'
from public.games where name = 'Leaderboard query test game';
insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Leaderboard hard', '', 'hard', 'high'
from public.games where name = 'Leaderboard query test game';

insert into public.user_badges (user_id, badge_id)
select '55555555-5555-5555-5555-555555555555', id
from public.game_badges where name in ('Leaderboard easy', 'Leaderboard inhuman');
insert into public.user_badges (user_id, badge_id)
select '66666666-6666-6666-6666-666666666666', id
from public.game_badges where name = 'Leaderboard hard';

set local role anon;
select results_eq(
  $$select profile_id::text from public.get_leaderboard('experience', null, 1, 100) limit 1$$,
  array['55555555-5555-5555-5555-555555555555'],
  'anonymous users can read the EXP leaderboard'
);
select results_eq(
  $$select score from public.get_leaderboard('experience', null, 1, 100) limit 1$$,
  array[70005::bigint],
  'EXP leaderboard uses the badge difficulty and tier experience values'
);
select results_eq(
  $$select profile_id::text from public.get_leaderboard('badges', null, 1, 100) limit 1$$,
  array['55555555-5555-5555-5555-555555555555'],
  'badge leaderboard ranks total claimed badges'
);
select results_eq(
  $$select profile_id::text from public.get_leaderboard('difficulty', 'easy', 1, 100) limit 1$$,
  array['55555555-5555-5555-5555-555555555555'],
  'difficulty leaderboard filters claimed badges by difficulty'
);
select results_eq(
  $$select score from public.get_leaderboard_position('experience', null, '55555555-5555-5555-5555-555555555555')$$,
  array[70005::bigint],
  'player position returns the player score'
);

select * from finish();
rollback;
