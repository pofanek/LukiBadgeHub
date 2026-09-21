create or replace function private.restrict_game_visibility_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_published is distinct from old.is_published
    and not (select private.is_admin()) then
    raise exception 'Only admins can change game visibility.' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.restrict_game_visibility_changes() from public, anon, authenticated;

drop trigger if exists restrict_game_visibility_changes on public.games;
create trigger restrict_game_visibility_changes
before update of is_published on public.games
for each row
execute function private.restrict_game_visibility_changes();
