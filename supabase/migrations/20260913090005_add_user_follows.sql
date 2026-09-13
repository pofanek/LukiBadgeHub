create table public.user_follows (
  follower_id uuid not null references public.user_profiles (id) on delete cascade,
  following_id uuid not null references public.user_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint user_follows_no_self_follow check (follower_id <> following_id)
);

create index user_follows_following_id_created_at_idx
  on public.user_follows (following_id, created_at desc);

create index user_follows_follower_id_created_at_idx
  on public.user_follows (follower_id, created_at desc);

alter table public.user_follows enable row level security;

grant select on public.user_follows to anon, authenticated;
grant insert, delete on public.user_follows to authenticated;

create policy "Follow relationships are visible"
on public.user_follows for select
to anon, authenticated
using (true);

create policy "Users can follow from their own profile"
on public.user_follows for insert
to authenticated
with check ((select auth.uid()) = follower_id);

create policy "Users can unfollow from their own profile"
on public.user_follows for delete
to authenticated
using ((select auth.uid()) = follower_id);
