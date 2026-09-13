import { useCallback, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export type FollowCounts = {
  followers: number;
  following: number;
  mutuals: number;
};

export type FollowRelationship = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

const emptyCounts: FollowCounts = { followers: 0, following: 0, mutuals: 0 };
const followsUpdatedEvent = "luki-follows-updated";

function countFollows(
  profileId: string,
  relationships: FollowRelationship[],
): FollowCounts {
  const followerIds = new Set(
    relationships
      .filter((relationship) => relationship.following_id === profileId)
      .map((relationship) => relationship.follower_id),
  );
  const followingIds = new Set(
    relationships
      .filter((relationship) => relationship.follower_id === profileId)
      .map((relationship) => relationship.following_id),
  );

  return {
    followers: followerIds.size,
    following: followingIds.size,
    mutuals: [...followingIds].filter((id) => followerIds.has(id)).length,
  };
}

export function useProfileFollows(profileId?: string, viewerId?: string) {
  const [relationships, setRelationships] = useState<FollowRelationship[]>([]);
  const [counts, setCounts] = useState<FollowCounts>(emptyCounts);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(profileId));
  const [isSaving, setIsSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!profileId) {
      setRelationships([]);
      setCounts(emptyCounts);
      setIsFollowing(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_follows")
      .select("follower_id, following_id, created_at")
      .or(`follower_id.eq.${profileId},following_id.eq.${profileId}`)
      .order("created_at", { ascending: false });
    if (error) {
      setRelationships([]);
      setCounts(emptyCounts);
      setIsFollowing(false);
      setIsLoading(false);
      throw error;
    }

    const nextRelationships = (data || []) as FollowRelationship[];
    setRelationships(nextRelationships);
    setCounts(countFollows(profileId, nextRelationships));
    setIsFollowing(
      Boolean(
        viewerId &&
          nextRelationships.some(
            (relationship) =>
              relationship.follower_id === viewerId &&
              relationship.following_id === profileId,
          ),
      ),
    );
    setIsLoading(false);
  }, [profileId, viewerId]);

  useEffect(() => {
    let isCurrent = true;
    queueMicrotask(() => {
      refresh().catch(() => {
        if (isCurrent) setIsLoading(false);
      });
    });
    const refreshOnFollowUpdate = () => {
      refresh().catch(() => {
        if (isCurrent) setIsLoading(false);
      });
    };
    window.addEventListener(followsUpdatedEvent, refreshOnFollowUpdate);
    return () => {
      isCurrent = false;
      window.removeEventListener(followsUpdatedEvent, refreshOnFollowUpdate);
    };
  }, [refresh]);

  const toggleFollow = useCallback(async () => {
    if (!profileId || !viewerId || profileId === viewerId) {
      throw new Error("Sign in to follow this profile.");
    }

    setIsSaving(true);
    const { error } = isFollowing
      ? await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", viewerId)
          .eq("following_id", profileId)
      : await supabase
          .from("user_follows")
          .insert({ follower_id: viewerId, following_id: profileId });
    setIsSaving(false);
    if (error) throw error;
    await refresh();
    window.dispatchEvent(new Event(followsUpdatedEvent));
  }, [isFollowing, profileId, refresh, viewerId]);

  return {
    relationships,
    counts,
    isFollowing,
    isLoading,
    isSaving,
    refresh,
    toggleFollow,
  };
}
