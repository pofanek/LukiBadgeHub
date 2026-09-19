-- Older deployments reference user_profiles without a delete action, which
-- blocks Auth from deleting the account. Ownership rows must follow their Auth
-- user so all related profile data is removed in one transaction.
do $$
declare
  legacy_constraint record;
begin
  for legacy_constraint in
    select distinct constraint_row.conname
    from pg_constraint constraint_row
    join pg_attribute attribute_row
      on attribute_row.attrelid = constraint_row.conrelid
      and attribute_row.attnum = any (constraint_row.conkey)
    where constraint_row.conrelid = 'public.user_badges'::regclass
      and constraint_row.contype = 'f'
      and attribute_row.attname = 'user_id'
  loop
    execute format(
      'alter table public.user_badges drop constraint %I',
      legacy_constraint.conname
    );
  end loop;
end;
$$;

alter table public.user_badges
  add constraint user_badges_user_id_fkey
  foreign key (user_id)
  references auth.users (id)
  on delete cascade;
