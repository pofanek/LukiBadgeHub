import { useCallback, useEffect, useMemo, useState } from "react";
import { type BadgeRow, type CatalogueGame } from "../constants";
import { useGames } from "./useGames";
import { supabase } from "../utils/supabase";

type PinnedBadge = {
  badge: BadgeRow;
  game: CatalogueGame;
};

const pinnedBadgeChangeEvent = "pinned-badge-change";

export function usePinnedBadge(profileId?: string) {
  const { games, isLoading: isGamesLoading } = useGames();
  const [pinnedBadgeId, setPinnedBadgeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const handlePinnedBadgeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ profileId: string; badgeId: number | null }>)
        .detail;
      if (detail?.profileId === profileId) setPinnedBadgeId(detail.badgeId);
    };

    window.addEventListener(pinnedBadgeChangeEvent, handlePinnedBadgeChange);
    if (!profileId) {
      setPinnedBadgeId(null);
      setIsLoading(false);
      return () => {
        isCurrent = false;
        window.removeEventListener(pinnedBadgeChangeEvent, handlePinnedBadgeChange);
      };
    }
    setIsLoading(true);

    supabase
      .from("user_profiles")
      .select("pinned_badge_id")
      .eq("id", profileId)
      .maybeSingle()
      .then(({ data }) => {
        if (!isCurrent) return;
        setPinnedBadgeId(data?.pinned_badge_id || null);
        setIsLoading(false);
      });

    return () => {
      isCurrent = false;
      window.removeEventListener(pinnedBadgeChangeEvent, handlePinnedBadgeChange);
    };
  }, [profileId]);

  const pinnedBadge = useMemo<PinnedBadge | null>(() => {
    if (!pinnedBadgeId) return null;
    const game = games.find((item) =>
      item.badges.some((badge) => badge.id === pinnedBadgeId),
    );
    const badge = game?.badges.find((item) => item.id === pinnedBadgeId);
    return game && badge ? { game, badge } : null;
  }, [games, pinnedBadgeId]);

  const setPinnedBadge = useCallback(
    async (badgeId: number | null) => {
      if (!profileId) throw new Error("Sign in to pin a badge.");
      setIsSaving(true);
      const { error } = await supabase
        .from("user_profiles")
        .update({ pinned_badge_id: badgeId })
        .eq("id", profileId);
      setIsSaving(false);
      if (error) throw error;
      setPinnedBadgeId(badgeId);
      window.dispatchEvent(
        new CustomEvent(pinnedBadgeChangeEvent, {
          detail: { profileId, badgeId },
        }),
      );
    },
    [profileId],
  );

  return {
    pinnedBadge,
    pinnedBadgeId,
    setPinnedBadge,
    isLoading: isLoading || isGamesLoading,
    isSaving,
  };
}
