create or replace function private.notify_follow_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  follower_username text;
  is_mutual boolean;
begin
  select username
  into follower_username
  from public.user_profiles
  where id = new.follower_id;

  select exists (
    select 1
    from public.user_follows
    where follower_id = new.following_id
      and following_id = new.follower_id
  )
  into is_mutual;

  if is_mutual then
    if private.notification_enabled(new.following_id, 'new_mutual') then
      insert into public.notifications (user_id, type, title, body, action_path)
      values (
        new.following_id,
        'new_mutual',
        'New mutual',
        format('%s followed you back — you are now mutuals.', follower_username),
        format('/profile/%s', follower_username)
      );
    end if;
  elsif private.notification_enabled(new.following_id, 'new_follower') then
    insert into public.notifications (user_id, type, title, body, action_path)
    values (
      new.following_id,
      'new_follower',
      'New follower',
      format('%s started following you.', follower_username),
      format('/profile/%s', follower_username)
    );
  end if;

  return new;
end;
$$;

revoke all on function private.notify_follow_created()
  from public, anon, authenticated;
