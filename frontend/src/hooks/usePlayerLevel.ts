import { useEffect, useMemo, useState } from "react";
import { getBadgeExperience } from "../constants";
import { useGames } from "./useGames";
import { getLevelProgress } from "../utils/leveling";
import { supabase } from "../utils/supabase";

type ClaimedBadges = {
  profileId?: string;
  badgeIds: number[];
  hasError: boolean;
};

export function usePlayerLevel(profileId: string) {
  const { games, isLoading: isGamesLoading, error: gamesError } = useGames();
  const [claimedBadges, setClaimedBadges] = useState<ClaimedBadges>({
    badgeIds: [],
    hasError: false,
  });

  useEffect(() => {
    let isCurrent = true;

    supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", profileId)
      .then(({ data, error }) => {
        if (!isCurrent) return;
        setClaimedBadges({
          profileId,
          badgeIds: (data || []).map((claim) => claim.badge_id),
          hasError: Boolean(error),
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [profileId]);

  const earnedExperience = useMemo(() => {
    if (claimedBadges.profileId !== profileId) return 0;

    const badgeIds = new Set(claimedBadges.badgeIds);
    return games.flatMap((game) => game.badges).reduce((total, badge) => {
      if (!badgeIds.has(badge.id)) return total;
      return total + getBadgeExperience(badge.difficulty, badge.tier);
    }, 0);
  }, [claimedBadges, games, profileId]);
  const levelProgress = getLevelProgress(earnedExperience);

  return {
    earnedExperience,
    ...levelProgress,
    isLoading: isGamesLoading || claimedBadges.profileId !== profileId,
    hasError:
      Boolean(gamesError) ||
      (claimedBadges.profileId === profileId && claimedBadges.hasError),
  };
}
