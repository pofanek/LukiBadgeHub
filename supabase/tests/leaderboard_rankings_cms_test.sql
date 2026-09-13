begin;

select plan(6);

insert into auth.users (id, email)
values
  ('3fd7d1a9-c1f2-4ba9-91d1-dd8f4154b8a3', 'rankings-owner@example.com'),
  ('88888888-8888-8888-8888-888888888888', 'rankings-player-one@example.com'),
  ('99999999-9999-9999-9999-999999999999', 'rankings-player-two@example.com')
on conflict (id) do nothing;

insert into public.user_profiles (id, username, country_code, role)
values
  ('3fd7d1a9-c1f2-4ba9-91d1-dd8f4154b8a3', 'rankings-owner', 'unknown', 'Admin'),
  ('88888888-8888-8888-8888-888888888888', 'rankings-player-one', 'unknown', 'User'),
  ('99999999-9999-9999-9999-999999999999', 'rankings-player-two', 'unknown', 'User')
on conflict (id) do update
set role = excluded.role;

update public.leaderboard_rankings_settings
set started_at = null
where id = true;

delete from public.leaderboard_best_positions
where profile_id in (
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999'
);

insert into public.games (name, description, is_published)
values ('Leaderboard rankings CMS test game', '', true);

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Leaderboard rankings CMS easy badge', '', 'easy', 'low'
from public.games
where name = 'Leaderboard rankings CMS test game';

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Leaderboard rankings CMS medium badge', '', 'medium', 'high'
from public.games
where name = 'Leaderboard rankings CMS test game';

set local role authenticated;
select set_config('request.jwt.claim.sub', '88888888-8888-8888-8888-888888888888', true);
insert into public.user_badges (user_id, badge_id)
select '88888888-8888-8888-8888-888888888888', id
from public.game_badges
where name = 'Leaderboard rankings CMS easy badge';

select set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', true);
insert into public.user_badges (user_id, badge_id)
select '99999999-9999-9999-9999-999999999999', id
from public.game_badges
where name = 'Leaderboard rankings CMS medium badge';

select is_empty(
  $$select profile_id from public.leaderboard_best_positions where profile_id in ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999')$$,
  'badge claims do not record best ranks before activation'
);

select set_config('request.jwt.claim.sub', '3fd7d1a9-c1f2-4ba9-91d1-dd8f4154b8a3', true);
select results_eq(
  $$select seeded_players from public.start_leaderboard_rankings()$$,
  array[2::bigint],
  'starting rankings snapshots every player with EXP'
);
select results_eq(
  $$select best_rank from public.leaderboard_best_positions where profile_id in ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999') order by profile_id$$,
  array[2::bigint, 1::bigint],
  'the snapshot stores each player''s current rank'
);

select set_config('request.jwt.claim.sub', '88888888-8888-8888-8888-888888888888', true);
insert into public.user_badges (user_id, badge_id)
select '88888888-8888-8888-8888-888888888888', id
from public.game_badges
where name = 'Leaderboard rankings CMS medium badge';

select results_eq(
  $$select best_rank from public.leaderboard_best_positions where profile_id = '88888888-8888-8888-8888-888888888888'$$,
  array[1::bigint],
  'future badge claims preserve only an improved highest position'
);

select set_config('request.jwt.claim.sub', '3fd7d1a9-c1f2-4ba9-91d1-dd8f4154b8a3', true);
select results_eq(
  $$select cleared_players from public.reset_leaderboard_rankings()$$,
  array[2::bigint],
  'the leaderboard owner can revert the snapshot'
);
select is_empty(
  $$select profile_id from public.leaderboard_best_positions where profile_id in ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999')$$,
  'reverting clears saved leaderboard positions'
);

select * from finish();
rollback;
