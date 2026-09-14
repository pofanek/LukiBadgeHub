import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { userchomik } from "../../../assets";
import {
  type FollowRelationship,
  useProfileFollows,
} from "../../../hooks/useProfileFollows";
import { supabase } from "../../../utils/supabase";
import { mediaUrl } from "../../../utils/media";

const categories = ["Mutuals", "Followers", "Following"] as const;
type Category = (typeof categories)[number];
type FollowProfile = { id: string; username: string; avatar_path: string | null };
type ListedPerson = { profile: FollowProfile; since: string };

function avatarUrl(path: string | null) {
  return mediaUrl(path) || userchomik;
}

function relationshipIds(profileId: string, relationships: FollowRelationship[], category: Category) {
  const following = relationships.filter(({ follower_id }) => follower_id === profileId);
  if (category === "Following") return following.map(({ following_id, created_at }) => ({ id: following_id, since: created_at }));
  const followers = new Set(relationships.filter(({ following_id }) => following_id === profileId).map(({ follower_id }) => follower_id));
  if (category === "Followers") return relationships.filter(({ following_id }) => following_id === profileId).map(({ follower_id, created_at }) => ({ id: follower_id, since: created_at }));
  return following.filter(({ following_id }) => followers.has(following_id)).map(({ following_id, created_at }) => ({ id: following_id, since: created_at }));
}

function categoryCount(
  profileId: string,
  relationships: FollowRelationship[],
  category: Category,
) {
  return relationshipIds(profileId, relationships, category).length;
}

function MutualsPanel({ profileId, viewerId }: { profileId: string; viewerId?: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const initialCategory =
    selectedCategory === "followers"
      ? "Followers"
      : selectedCategory === "following"
        ? "Following"
        : "Mutuals";
  const activeCategory = initialCategory;
  const { relationships, isLoading, refresh } = useProfileFollows(profileId, viewerId);
  const [profiles, setProfiles] = useState<FollowProfile[]>([]);
  const [viewerFollowingIds, setViewerFollowingIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const ids = useMemo(() => [...new Set(relationships.flatMap(({ follower_id, following_id }) => [follower_id, following_id]))].filter((id) => id !== profileId), [profileId, relationships]);

  const selectCategory = (category: Category) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "mutuals");
    next.set("category", category.toLowerCase());
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let isCurrent = true;
    if (!ids.length) {
      queueMicrotask(() => {
        if (!isCurrent) return;
        setProfiles([]);
        setViewerFollowingIds(new Set());
      });
      return () => { isCurrent = false; };
    }
    Promise.all([
      supabase.from("user_profiles").select("id, username, avatar_path").in("id", ids),
      viewerId ? supabase.from("user_follows").select("following_id").eq("follower_id", viewerId).in("following_id", ids) : Promise.resolve({ data: [], error: null }),
    ]).then(([{ data: profileData, error: profileError }, { data: followingData, error: followingError }]) => {
      if (!isCurrent) return;
      if (profileError || followingError) { setError("People could not be loaded."); return; }
      setProfiles((profileData || []) as FollowProfile[]);
      setViewerFollowingIds(new Set((followingData || []).map(({ following_id }) => following_id)));
    });
    return () => { isCurrent = false; };
  }, [ids, viewerId]);

  const people = useMemo<ListedPerson[]>(() => {
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
    return relationshipIds(profileId, relationships, activeCategory).flatMap(({ id, since }) => {
      const profile = profilesById.get(id);
      return profile ? [{ profile, since }] : [];
    });
  }, [activeCategory, profileId, profiles, relationships]);

  const toggleFollow = async (personId: string) => {
    if (!viewerId) {
      window.sessionStorage.setItem("luki-post-login-path", `${window.location.pathname}${window.location.search}`);
      navigate("/login");
      return;
    }
    setPendingId(personId);
    setError("");
    const isFollowing = viewerFollowingIds.has(personId);
    const { error: followError } = isFollowing
      ? await supabase.from("user_follows").delete().eq("follower_id", viewerId).eq("following_id", personId)
      : await supabase.from("user_follows").insert({ follower_id: viewerId, following_id: personId });
    setPendingId(null);
    if (followError) { setError("This profile could not be updated. Please try again."); return; }
    setViewerFollowingIds((current) => {
      const next = new Set(current);
      if (isFollowing) next.delete(personId); else next.add(personId);
      return next;
    });
    await refresh();
    window.dispatchEvent(new Event("luki-follows-updated"));
  };

  if (isLoading) return <p className="text-font-secondary py-12 text-center">Loading people...</p>;

  return <div className="mx-auto max-w-2xl">
    <div className="border-border mb-4 flex justify-center border-b">{categories.map((category) => <button key={category} type="button" onClick={() => selectCategory(category)} className={`relative px-4 py-3 text-sm ${activeCategory === category ? "text-font-primary" : "text-font-muted"}`}>{category} ({categoryCount(profileId, relationships, category)}){activeCategory === category && <span className="bg-accent-cold absolute right-3 bottom-0 left-3 h-0.5" />}</button>)}</div>
    {error && <p role="alert" className="text-destructive mb-4 text-sm">{error}</p>}
    <div className="border-border bg-surface/75 divide-border overflow-hidden rounded-xl border divide-y">
      {people.length ? people.map(({ profile, since }) => {
        const isOwnProfile = viewerId === profile.id;
        const isFollowing = viewerFollowingIds.has(profile.id);
        return <div key={profile.id} className="flex items-center gap-3 p-3 sm:p-4">
          <img src={avatarUrl(profile.avatar_path)} alt="" className="bg-surface-raised h-10 w-10 rounded-lg object-cover" />
          <div className="min-w-0 flex-1"><Link to={`/profile/${encodeURIComponent(profile.username)}`} className="text-font-primary hover:text-hover block truncate font-medium">{profile.username}</Link><p className="text-font-muted truncate text-xs">{activeCategory === "Followers" ? "Follows this player" : `${activeCategory} since ${new Date(since).toLocaleDateString()}`}</p></div>
          {!isOwnProfile && <button type="button" onClick={() => void toggleFollow(profile.id)} disabled={pendingId === profile.id} className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50">{pendingId === profile.id ? "Updating..." : isFollowing ? "Following" : "Follow"}</button>}
        </div>;
      }) : <p className="text-font-muted px-4 py-10 text-center text-sm">No {activeCategory.toLowerCase()} yet.</p>}
    </div>
  </div>;
}

export default MutualsPanel;
