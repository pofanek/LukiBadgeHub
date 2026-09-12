import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export type UserProfile = {
  id: string;
  username: string;
  bio: string | null;
  country_code: string;
  avatar_path: string | null;
  banner_path: string | null;
  pinned_badge_id: number | null;
  username_changed_at: string | null;
  role: "User" | "Moderator" | "Admin";
  avatar_url: string | null;
  banner_url: string | null;
};

type ProfileRow = Omit<UserProfile, "avatar_url" | "banner_url">;
export type ProfileChanges = Pick<UserProfile, "username" | "bio" | "country_code" | "avatar_path" | "banner_path" | "pinned_badge_id">;
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
    .select("id, username, bio, country_code, avatar_path, banner_path, pinned_badge_id, username_changed_at, role")
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
    supabase.from("user_profiles").select("id, username, bio, country_code, avatar_path, banner_path, pinned_badge_id, username_changed_at, role").eq("id", userId).maybeSingle().then(({ data, error }) => {
      if (isCurrent) setResult({ userId, profile: error || !data ? null : hydrateProfile(data) });
    });

    return () => {
      isCurrent = false;
      window.removeEventListener(profileEvent, onProfileUpdate);
    };
  }, [userId]);

  return { profile: result.userId === userId ? result.profile : null, isLoading: Boolean(userId) && result.userId !== userId };
}

export function useUserProfileByUsername(username?: string) {
  const [result, setResult] = useState<{ username?: string; profile: UserProfile | null }>({ profile: null });

  useEffect(() => {
    let isCurrent = true;
    if (!username) return () => { isCurrent = false; };

    const loadProfile = async () => {
      const profileQuery = "id, username, bio, country_code, avatar_path, banner_path, pinned_badge_id, username_changed_at, role";
      const { data: currentProfile, error: currentError } = await supabase
        .from("user_profiles")
        .select(profileQuery)
        .eq("username", username)
        .maybeSingle();

      if (currentError) return null;
      if (currentProfile) return hydrateProfile(currentProfile);

      const { data: history, error: historyError } = await supabase
        .from("user_profile_username_history")
        .select("profile_id")
        .eq("username", username)
        .maybeSingle();

      if (historyError || !history) return null;

      const { data: historicalProfile, error: historicalError } = await supabase
        .from("user_profiles")
        .select(profileQuery)
        .eq("id", history.profile_id)
        .maybeSingle();

      return historicalError || !historicalProfile ? null : hydrateProfile(historicalProfile);
    };

    loadProfile().then((profile) => {
      if (isCurrent) setResult({ username, profile });
    });

    return () => { isCurrent = false; };
  }, [username]);

  return { profile: result.username === username ? result.profile : null, isLoading: Boolean(username) && result.username !== username };
}
