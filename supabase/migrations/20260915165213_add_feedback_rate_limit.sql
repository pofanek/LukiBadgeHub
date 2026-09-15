create table public.feedback_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count smallint not null default 1 check (request_count > 0)
);

alter table public.feedback_rate_limits enable row level security;
revoke all on table public.feedback_rate_limits from public, anon, authenticated;
grant all on table public.feedback_rate_limits to service_role;

-- The Edge Function is the only caller. This single UPSERT is atomic, so
-- concurrent requests cannot each pass the same rate-limit window.
create or replace function public.consume_feedback_rate_limit(p_key_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean := false;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid feedback rate-limit key.' using errcode = '22023';
  end if;

  insert into public.feedback_rate_limits as limits (
    key_hash,
    window_started_at,
    request_count
  )
  values (p_key_hash, now(), 1)
  on conflict (key_hash) do update
  set
    window_started_at = case
      when limits.window_started_at <= now() - interval '10 minutes' then now()
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= now() - interval '10 minutes' then 1
      else limits.request_count + 1
    end
  where limits.window_started_at <= now() - interval '10 minutes'
    or limits.request_count < 3
  returning true into allowed;

  return coalesce(allowed, false);
end;
$$;

revoke all on function public.consume_feedback_rate_limit(text)
  from public, anon, authenticated;
grant execute on function public.consume_feedback_rate_limit(text) to service_role;
