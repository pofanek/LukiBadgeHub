alter table public.user_profiles
  drop constraint if exists user_profiles_bio_length_check;

alter table public.user_profiles
  add constraint user_profiles_bio_length_check
  check (bio is null or char_length(bio) <= 300);

-- OAuth identities do not reliably expose the presence of a password through
-- user.identities. Return only the current user's boolean status; the hash is
-- never exposed to the browser.
create or replace function public.current_user_has_password()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and coalesce(encrypted_password, '') <> ''
  );
$$;

revoke all on function public.current_user_has_password() from public, anon;
grant execute on function public.current_user_has_password() to authenticated;
