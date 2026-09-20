begin;

select plan(3);

insert into auth.users (id, email)
values ('99999999-9999-9999-9999-999999999999', 'social-platforms@example.com')
on conflict (id) do nothing;

insert into public.user_profiles (id, username, country_code)
values ('99999999-9999-9999-9999-999999999999', 'social-platforms', 'unknown')
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', true);

select lives_ok(
  $$insert into public.user_social_links (profile_id, platform, url) values ('99999999-9999-9999-9999-999999999999', 'backloggd', 'https://backloggd.com/u/test')$$,
  'users can save a Backloggd link'
);

select lives_ok(
  $$insert into public.user_social_links (profile_id, platform, url) values ('99999999-9999-9999-9999-999999999999', 'speedrun', 'https://www.speedrun.com/users/test')$$,
  'users can save a Speedrun.com link'
);

select throws_ok(
  $$insert into public.user_social_links (profile_id, platform, url) values ('99999999-9999-9999-9999-999999999999', 'speedrun', 'https://example.com/users/test')$$,
  '23514',
  null,
  'users cannot save a Speedrun.com link from another domain'
);

select * from finish();
rollback;
