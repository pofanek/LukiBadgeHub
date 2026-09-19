begin;

select plan(2);

insert into auth.users (id, email)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'account-delete-cascade@example.com');

insert into public.games (name, description, is_published)
values ('Account deletion cascade test game', '', true);

insert into public.game_badges (game_id, name, description, difficulty, tier)
select id, 'Account deletion cascade test badge', '', 'easy', 'low'
from public.games
where name = 'Account deletion cascade test game';

insert into public.user_badges (user_id, badge_id)
select 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', id
from public.game_badges
where name = 'Account deletion cascade test badge';

delete from auth.users
where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

select is(
  (select count(*) from public.user_badges where user_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  0::bigint,
  'deleting an Auth user cascades to badge ownership rows'
);

select is(
  (select count(*) from auth.users where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  0::bigint,
  'the Auth user can be deleted after earning badges'
);

select * from finish();

rollback;
