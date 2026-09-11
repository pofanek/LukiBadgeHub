begin;

select plan(9);

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

select * from finish();
rollback;
