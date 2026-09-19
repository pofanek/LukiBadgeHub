begin;

select plan(7);

select is(
  to_regclass('public.feedback_rate_limits')::text,
  'feedback_rate_limits',
  'feedback rate-limit state exists'
);

set local role service_role;
select results_eq(
  $$select public.consume_feedback_rate_limit(repeat('a', 64))$$,
  array[true],
  'the first feedback request is allowed'
);
select results_eq(
  $$select public.consume_feedback_rate_limit(repeat('a', 64))$$,
  array[true],
  'the second feedback request is allowed'
);
select results_eq(
  $$select public.consume_feedback_rate_limit(repeat('a', 64))$$,
  array[true],
  'the third feedback request is allowed'
);
select results_eq(
  $$select public.consume_feedback_rate_limit(repeat('a', 64))$$,
  array[false],
  'the fourth request in a window is rejected atomically'
);
select throws_ok(
  $$select public.consume_feedback_rate_limit('not-a-hash')$$,
  '22023',
  'Invalid feedback rate-limit key.',
  'invalid rate-limit keys are rejected'
);

set local role anon;
select throws_ok(
  $$select public.consume_feedback_rate_limit(repeat('b', 64))$$,
  '42501',
  null,
  'anonymous callers cannot consume feedback rate-limit capacity directly'
);

select * from finish();
rollback;
