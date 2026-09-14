SET local check_function_bodies = off;

-- The source project contained permissive legacy policies and an event trigger
-- that bypassed the repository's newer CMS/RLS rules. The recovered tables and
-- types are retained, while current tracked policies remain authoritative.
COMMENT ON COLUMN "public"."badges"."game_id" IS 'pointer, na gre o konkretnym id';
REVOKE ALL ON FUNCTION "public"."get_game_leaderboard"(bigint, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."get_game_leaderboard"(bigint, integer) TO "anon", "authenticated", "postgres", "service_role";
GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."badges" TO "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "anon", "authenticated", "postgres", "service_role";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_favorited_games" TO "anon", "authenticated", "postgres", "service_role";
GRANT USAGE ON TYPE "public"."difficulty" TO "postgres";
GRANT USAGE ON TYPE "public"."tier" TO "postgres";
ALTER TABLE "public"."user_favorited_games" ADD CONSTRAINT "user_favorited_games_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);
CREATE POLICY "Users can delete their own favorited games to database" ON "public"."user_favorited_games" FOR DELETE TO "authenticated" USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own favorited games to database" ON "public"."user_favorited_games" FOR INSERT TO "authenticated" WITH CHECK ((auth.uid() = user_id));
ALTER TABLE "public"."user_badges" ALTER COLUMN "user_id" SET DEFAULT auth.uid();
