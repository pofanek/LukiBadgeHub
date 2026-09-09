import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export type UserProfile = {
  id: string;
  username: string;
  bio: string | null;
  country: string | null;
  avatar_path: string | null;
};

export function useUserProfile(userId?: string) {
  const [result, setResult] = useState<{
    userId?: string;
    profile: UserProfile | null;
  }>({ profile: null });

  useEffect(() => {
    let isCurrent = true;

    if (!userId) {
      return () => {
        isCurrent = false;
      };
    }

    supabase
      .from("user_profiles")
      .select("id, username, bio, country, avatar_path")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isCurrent) return;
        setResult({ userId, profile: error ? null : data });
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  return {
    profile: result.userId === userId ? result.profile : null,
    isLoading: Boolean(userId) && result.userId !== userId,
  };
}
