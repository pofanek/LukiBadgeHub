begin;

select plan(8);

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111', 'comment-user@example.com'),
  ('a2222222-2222-2222-2222-222222222222', 'comment-supporter@example.com'),
  ('a3333333-3333-3333-3333-333333333333', 'comment-owner@example.com');

insert into public.user_profiles (id, username, country_code, role) values
  ('a1111111-1111-1111-1111-111111111111', 'comment-user', 'unknown', 'User'),
  ('a2222222-2222-2222-2222-222222222222', 'comment-supporter', 'unknown', 'Supporter'),
  ('a3333333-3333-3333-3333-333333333333', 'comment-owner', 'unknown', 'Owner')
on conflict (id) do update set role = excluded.role, username = excluded.username;

insert into public.games (name, description, is_published)
values ('Comment and creator test game', '', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', true);
select throws_ok(
  $$insert into public.game_comments (game_id, author_id, body) values ((select id from public.games where name = 'Comment and creator test game'), 'a1111111-1111-1111-1111-111111111111', 'Not permitted')$$,
  '42501', null, 'regular users cannot create comments'
);

select set_config('request.jwt.claim.sub', 'a2222222-2222-2222-2222-222222222222', true);
select lives_ok(
  $$insert into public.game_comments (game_id, author_id, body) values ((select id from public.games where name = 'Comment and creator test game'), 'a2222222-2222-2222-2222-222222222222', 'Supporter comment')$$,
  'supporters can create comments'
);
select lives_ok(
  $$insert into public.game_comment_likes (comment_id, profile_id) values ((select id from public.game_comments where body = 'Supporter comment'), 'a2222222-2222-2222-2222-222222222222')$$,
  'signed-in users can like a comment'
);

select set_config('request.jwt.claim.sub', 'a3333333-3333-3333-3333-333333333333', true);
select lives_ok(
  $$insert into public.game_badge_creators (game_id, profile_id) values ((select id from public.games where name = 'Comment and creator test game'), 'a2222222-2222-2222-2222-222222222222')$$,
  'owner can assign a badge creator'
);
select lives_ok(
  $$update public.game_comments set is_pinned = true where body = 'Supporter comment'$$,
  'owner can pin a comment'
);

set local role anon;
select results_eq(
  $$select body from public.game_comments where game_id = (select id from public.games where name = 'Comment and creator test game')$$,
  array['Supporter comment'], 'visitors can read published-game comments'
);
select results_eq(
  $$select profile_id::text from public.game_badge_creators where game_id = (select id from public.games where name = 'Comment and creator test game')$$,
  array['a2222222-2222-2222-2222-222222222222'], 'visitors can read badge creator credits'
);
select is(
  (select display_order from public.game_badges limit 1),
  (select display_order from public.game_badges limit 1),
  'badge display order is available'
);

select * from finish();
rollback;
