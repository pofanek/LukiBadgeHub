import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export type SocialPlatform = "steam" | "youtube" | "instagram" | "bluesky";
export type SocialLink = { profile_id: string; platform: SocialPlatform; url: string };
const socialEvent = "luki-social-links-updated";

export function publishSocialLinks(profileId: string, links: SocialLink[]) {
  window.dispatchEvent(new CustomEvent<{ profileId: string; links: SocialLink[] }>(socialEvent, { detail: { profileId, links } }));
}

export function useSocialLinks(profileId?: string) {
  const [links, setLinks] = useState<SocialLink[]>([]);
  useEffect(() => {
    if (!profileId) return;
    let isCurrent = true;
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ profileId: string; links: SocialLink[] }>).detail;
      if (detail.profileId === profileId) setLinks(detail.links);
    };
    window.addEventListener(socialEvent, onUpdate);
    supabase.from("user_social_links").select("profile_id, platform, url").eq("profile_id", profileId).then(({ data }) => {
      if (isCurrent) setLinks(data || []);
    });
    return () => { isCurrent = false; window.removeEventListener(socialEvent, onUpdate); };
  }, [profileId]);
  return links;
}
