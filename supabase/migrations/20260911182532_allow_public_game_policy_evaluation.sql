-- The public read policy calls private.is_admin() to include an Admin's drafts.
-- Anonymous calls return false because auth.uid() is null, but must be allowed
-- to evaluate the helper rather than failing before the policy can run.
grant execute on function private.is_admin() to anon;
