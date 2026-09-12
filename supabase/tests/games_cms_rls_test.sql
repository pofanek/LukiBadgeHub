begin;

select plan(19);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'member@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'admin@example.com');

insert into public.user_profiles (id, username, country_code, role)
values
  ('11111111-1111-1111-1111-111111111111', 'member', 'unknown', 'User'),
  ('22222222-2222-2222-2222-222222222222', 'admin', 'unknown', 'Admin')
on conflict (id) do update set role = excluded.role;

insert into public.games (name, description, is_published)
values ('CMS test draft', '', false), ('CMS test published', '', true);

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'CMS test published badge', '', 'medium', 'mid'
from public.games
where name = 'CMS test published';

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'CMS test draft badge', '', 'inhuman', 'high'
from public.games
where name = 'CMS test draft';

set local role anon;
select results_eq(
  $$select name from public.games where name like 'CMS test %' order by name$$,
  array['CMS test published'],
  'anon reads published games but not drafts'
);
select throws_ok(
  $$insert into public.games (name, description) values ('anon game', '')$$,
  '42501',
  null,
  'anon cannot create games'
);
select results_eq(
  $$select name from public.game_badges where name like 'CMS test %' order by name$$,
  array['CMS test published badge'],
  'anon reads badges belonging to published games but not drafts'
);
select throws_ok(
  $$insert into public.user_badges (user_id, badge_id) select '11111111-1111-1111-1111-111111111111', id from public.game_badges where name = 'CMS test published badge'$$,
  '42501',
  null,
  'anon cannot claim a badge'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select results_eq(
  $$select name from public.games where name like 'CMS test %' order by name$$,
  array['CMS test published'],
  'members cannot read drafts'
);
select throws_ok(
  $$insert into public.games (name, description) values ('member game', '')$$,
  '42501',
  null,
  'members cannot create games'
);
select throws_ok(
  $$update public.user_profiles set role = 'Admin' where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'members cannot promote themselves'
);
select throws_ok(
  $$insert into public.game_badges (game_id, name, description, difficulty, tier) select id, 'member badge', '', 'easy', 'low' from public.games where name = 'CMS test published'$$,
  '42501',
  null,
  'members cannot create badge definitions'
);
select lives_ok(
  $$insert into public.user_badges (user_id, badge_id) select '11111111-1111-1111-1111-111111111111', id from public.game_badges where name = 'CMS test published badge'$$,
  'members can claim their own badge'
);
set local role anon;
select results_eq(
  $$select user_id::text from public.user_badges where badge_id = (select id from public.game_badges where name = 'CMS test published badge')$$,
  array['11111111-1111-1111-1111-111111111111'],
  'badge ownership is publicly readable for player rankings'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select results_eq(
  $$select game_id::text from public.user_game_library where user_id = '11111111-1111-1111-1111-111111111111'$$,
  array[(select id::text from public.games where name = 'CMS test published')],
  'claiming a badge automatically adds its game to the member library'
);
select throws_ok(
  $$insert into public.user_badges (user_id, badge_id) select '22222222-2222-2222-2222-222222222222', id from public.game_badges where name = 'CMS test published badge'$$,
  '42501',
  null,
  'members cannot claim a badge for another user'
);
select lives_ok(
  $$delete from public.user_badges where user_id = '11111111-1111-1111-1111-111111111111' and badge_id = (select id from public.game_badges where name = 'CMS test published badge')$$,
  'members can remove their own badge claim'
);

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select lives_ok(
  $$insert into public.games (name, description) values ('admin game', '')$$,
  'admins can create games'
);
select results_eq(
  $$select name from public.games where name like 'CMS test %' order by name$$,
  array['CMS test draft', 'CMS test published'],
  'admins can read drafts'
);
select lives_ok(
  $$update public.games set description = 'updated' where name = 'CMS test draft'$$,
  'admins can update games'
);
select throws_ok(
  $$delete from public.games where name = 'CMS test draft'$$,
  '42501',
  null,
  'admins cannot delete games through the client role'
);
select lives_ok(
  $$insert into public.game_badges (game_id, name, description, difficulty, tier) select id, 'admin badge', '', 'inhuman', 'high' from public.games where name = 'CMS test published'$$,
  'admins can create badge definitions'
);
select lives_ok(
  $$update public.game_badges set description = 'updated' where name = 'admin badge'$$,
  'admins can update badge definitions'
);

select * from finish();
rollback;
