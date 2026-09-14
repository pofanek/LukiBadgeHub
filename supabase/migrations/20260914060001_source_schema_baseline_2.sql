SET local check_function_bodies = off;

CREATE TYPE "public"."tier" AS ENUM ('Low', 'Mid', 'High');
ALTER TABLE "public"."badges" ADD COLUMN "tier" public.tier NOT NULL;

CREATE OR REPLACE FUNCTION public.get_game_leaderboard(p_game_id bigint, p_limit integer DEFAULT 100)
RETURNS TABLE (player_rank bigint, profile_id uuid, username text, avatar_path text, country_code text, badges_collected bigint, earned_experience bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
  with player_scores as (
    select user_badges.user_id, count(*)::bigint as badges_collected,
      coalesce(sum(case game_badges.difficulty
        when 'easy' then case game_badges.tier when 'low' then 5 when 'mid' then 7 else 10 end
        when 'medium' then case game_badges.tier when 'low' then 15 when 'mid' then 21 else 30 end
        when 'hard' then case game_badges.tier when 'low' then 60 when 'mid' then 84 else 120 end
        when 'extreme' then case game_badges.tier when 'low' then 600 when 'mid' then 840 else 1200 end
        when 'supreme' then case game_badges.tier when 'low' then 5000 when 'mid' then 7500 else 10000 end
        when 'inhuman' then case game_badges.tier when 'low' then 35000 when 'mid' then 50000 else 70000 end
      end), 0)::bigint as earned_experience
    from public.user_badges join public.game_badges on game_badges.id = user_badges.badge_id
    where game_badges.game_id = p_game_id group by user_badges.user_id
  ), ranked as (
    select rank() over (order by player_scores.badges_collected desc, player_scores.earned_experience desc, user_profiles.username asc)::bigint as player_rank,
      player_scores.user_id as profile_id, user_profiles.username, user_profiles.avatar_path, user_profiles.country_code,
      player_scores.badges_collected, player_scores.earned_experience
    from player_scores join public.user_profiles on user_profiles.id = player_scores.user_id
  ) select * from ranked order by player_rank, username limit least(greatest(p_limit, 1), 100);
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable() RETURNS event_trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog' AS $function$
DECLARE cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO') AND object_type IN ('table','partitioned table')
  LOOP
    IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity); RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION WHEN OTHERS THEN RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity; END;
    ELSE RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
    END IF;
  END LOOP;
END;
$function$;

ALTER TABLE "public"."badges" ADD CONSTRAINT "badges_game_id_fkey" FOREIGN KEY (game_id) REFERENCES public.games(id);
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);
ALTER TABLE "public"."user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);
ALTER TABLE "public"."user_badges" ADD CONSTRAINT "users_badges_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."user_favorited_games" ADD CONSTRAINT "user_favorited_games_game_id_fkey" FOREIGN KEY (game_id) REFERENCES public.games(id);
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_username_key" UNIQUE (username);
CREATE POLICY "Enable read access for all users" ON "public"."badges" FOR SELECT TO PUBLIC USING (true);
