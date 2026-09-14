begin;

select plan(16);

insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'notification-recipient@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'notification-follower@example.com');

update public.user_profiles
set username = 'notification-recipient'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

update public.user_profiles
set username = 'notification-follower'
where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select ok(
  (select role_granted_enabled and special_badge_awarded_enabled and new_follower_enabled and new_mutual_enabled
   from public.user_notification_preferences
   where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'new profiles receive enabled notification preferences'
);

update public.user_profiles
set role = 'Supporter'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select results_eq(
  $$select type from public.notifications where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' order by id$$,
  array['role_granted'],
  'a manually granted supported role creates a notification'
);

update public.user_notification_preferences
set role_granted_enabled = false
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

update public.user_profiles
set role = 'Admin'
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select count(*) from public.notifications where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and type = 'role_granted'),
  1::bigint,
  'disabled role preferences suppress later role notifications'
);

insert into public.games (name, description, is_published)
values ('Notification trigger game', '', true);

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Notification extreme badge', '', 'extreme', 'low'
from public.games
where name = 'Notification trigger game';

insert into public.user_badges (user_id, badge_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', id
from public.game_badges
where name = 'Notification extreme badge';

select results_eq(
  $$select type from public.notifications where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' order by id$$,
  array['role_granted', 'special_badge_awarded'],
  'awarding an Extreme badge creates a special badge notification'
);

update public.user_notification_preferences
set special_badge_awarded_enabled = false
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Notification inhuman badge', '', 'inhuman', 'low'
from public.games
where name = 'Notification trigger game';

insert into public.user_badges (user_id, badge_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', id
from public.game_badges
where name = 'Notification inhuman badge';

select is(
  (select count(*) from public.notifications where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and type = 'special_badge_awarded'),
  1::bigint,
  'disabled special badge preferences suppress later badge notifications'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);

select lives_ok(
  $$insert into public.user_follows (follower_id, following_id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$,
  'a user can follow another profile'
);

set local role postgres;

select results_eq(
  $$select type from public.notifications where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' order by id$$,
  array['role_granted', 'special_badge_awarded', 'new_follower'],
  'a normal follow creates a follower notification'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);

select lives_ok(
  $$insert into public.user_follows (follower_id, following_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$,
  'a user can follow back'
);

set local role postgres;

select results_eq(
  $$select user_id::text || '|' || body from public.notifications where type = 'new_mutual'$$,
  array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb|notification-recipient followed you back — you are now mutuals.'],
  'following back notifies the original follower and names the person who followed back'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);

select is_empty(
  $$select id from public.notifications where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$,
  'a user cannot read another user''s notifications'
);

select lives_ok(
  $$update public.notifications set read_at = now() where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and type = 'new_follower'$$,
  'a user can mark their own notifications as read'
);

select ok(
  (select read_at is not null from public.notifications where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and type = 'new_follower'),
  'the notification read timestamp is saved'
);

select throws_ok(
  $$insert into public.notifications (user_id, type, title, body) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'new_follower', 'Forged', 'Forged')$$,
  '42501',
  null,
  'clients cannot forge notifications'
);

select is_empty(
  $$update public.user_notification_preferences set new_follower_enabled = false where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' returning user_id$$,
  'a user cannot change another user''s preferences'
);

select lives_ok(
  $$delete from public.notifications where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and type = 'new_follower'$$,
  'a user can delete their own notification'
);

select is_empty(
  $$select id from public.notifications where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and type = 'new_follower'$$,
  'deleted notifications leave the inbox'
);

select * from finish();
rollback;
