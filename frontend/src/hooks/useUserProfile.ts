import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export type UserProfile = {
  id: string;
  username: string;
  bio: string | null;
  country_code: string;
  avatar_path: string | null;
  banner_path: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

type ProfileRow = Omit<UserProfile, "avatar_url" | "banner_url">;
export type ProfileChanges = Pick<UserProfile, "username" | "bio" | "country_code" | "avatar_path" | "banner_path">;
const profileEvent = "luki-profile-updated";

function mediaUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return supabase.storage.from("profile-media").getPublicUrl(path).data.publicUrl;
}

function hydrateProfile(profile: ProfileRow): UserProfile {
  return { ...profile, avatar_url: mediaUrl(profile.avatar_path), banner_url: mediaUrl(profile.banner_path) };
}

export function publishUserProfile(profile: UserProfile) {
  window.dispatchEvent(new CustomEvent<UserProfile>(profileEvent, { detail: profile }));
}

export async function saveUserProfile(userId: string, changes: Partial<ProfileChanges>) {
  const { data, error } = await supabase
    .from("user_profiles")
    .update(changes)
    .eq("id", userId)
    .select("id, username, bio, country_code, avatar_path, banner_path")
    .single();
  if (error) throw error;
  const profile = hydrateProfile(data);
  publishUserProfile(profile);
  return profile;
}

export function useUserProfile(userId?: string) {
  const [result, setResult] = useState<{ userId?: string; profile: UserProfile | null }>({ profile: null });

  useEffect(() => {
    let isCurrent = true;
    if (!userId) return () => { isCurrent = false; };

    const onProfileUpdate = (event: Event) => {
      const profile = (event as CustomEvent<UserProfile>).detail;
      if (profile.id === userId) setResult({ userId, profile });
    };
    window.addEventListener(profileEvent, onProfileUpdate);
    supabase.from("user_profiles").select("id, username, bio, country_code, avatar_path, banner_path").eq("id", userId).maybeSingle().then(({ data, error }) => {
      if (isCurrent) setResult({ userId, profile: error || !data ? null : hydrateProfile(data) });
    });

    return () => {
      isCurrent = false;
      window.removeEventListener(profileEvent, onProfileUpdate);
    };
  }, [userId]);

  return { profile: result.userId === userId ? result.profile : null, isLoading: Boolean(userId) && result.userId !== userId };
}
