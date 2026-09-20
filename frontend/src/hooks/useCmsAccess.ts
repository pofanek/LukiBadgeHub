import { useEffect, useMemo, useState } from "react";
import type { UserRole } from "./useUserProfile";
import { supabase } from "../utils/supabase";

export function useCmsAccess(userId?: string, role?: UserRole) {
  const [result, setResult] = useState<{
    userId?: string;
    creatorGameIds: number[];
  }>({ creatorGameIds: [] });

  useEffect(() => {
    let isCurrent = true;
    if (!userId) {
      return () => {
        isCurrent = false;
      };
    }

    supabase
      .from("game_badge_creators")
      .select("game_id")
      .eq("profile_id", userId)
      .then(({ data }) => {
        if (!isCurrent) return;
        setResult({
          userId,
          creatorGameIds: (data || []).map((creator) => creator.game_id),
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  return useMemo(() => {
    const creatorGameIds = result.userId === userId ? result.creatorGameIds : [];
    const isAdmin = role === "Admin" || role === "Owner";
    const isModerator = role === "Moderator";
    const canEditAssignedGames = creatorGameIds.length > 0;

    return {
      creatorGameIds,
      isLoading: Boolean(userId) && result.userId !== userId,
      isAdmin,
      canEditAssignedGames,
      canAccessCms: isAdmin || isModerator || canEditAssignedGames,
    };
  }, [result, role, userId]);
}
