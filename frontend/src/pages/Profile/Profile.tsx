import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { FocusContent, LoadingIndicator } from "../../components";
import { useAuthUser } from "../../hooks/useAuthUser";
import {
  useUserProfile,
  useUserProfileByUsername,
} from "../../hooks/useUserProfile";
import {
  GamesPanel,
  MutualsPanel,
  ProfileHeader,
  ProfileTabs,
  RecentsPanel,
  StatsPanel,
} from "./components";

export type ProfileTab = "games" | "mutuals" | "stats" | "recents";

function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("games");
  const { username } = useParams();
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const { profile: ownProfile, isLoading: isOwnProfileLoading } =
    useUserProfile(user?.id);
  const { profile: usernameProfile, isLoading: isUsernameProfileLoading } =
    useUserProfileByUsername(username);
  const profile = username ? usernameProfile : ownProfile;
  const isProfileLoading = username
    ? isUsernameProfileLoading
    : isOwnProfileLoading;

  if (!username && !isAuthLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthLoading || isProfileLoading) {
    return (
      <FocusContent>
        <LoadingIndicator label="Loading profile..." />
      </FocusContent>
    );
  }

  if (!profile) {
    return (
      <FocusContent>
        <p className="text-font-secondary">This profile could not be found.</p>
      </FocusContent>
    );
  }

  if (!username) {
    return (
      <Navigate
        to={`/profile/${encodeURIComponent(profile.username)}`}
        replace
      />
    );
  }

  if (profile.username !== username) {
    return (
      <Navigate
        to={`/profile/${encodeURIComponent(profile.username)}`}
        replace
      />
    );
  }

  return (
    <FocusContent>
      <section className="bg-primary w-full self-stretch pb-6 sm:pb-8 lg:pb-10">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-7">
          <ProfileHeader
            profile={profile}
            isOwnProfile={user?.id === profile.id}
          />
          <div>
            <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
            <div className="min-h-110 p-3 sm:p-5 lg:p-7">
              {activeTab === "games" && (
                <GamesPanel
                  profileId={profile.id}
                  isOwnProfile={user?.id === profile.id}
                />
              )}
              {activeTab === "mutuals" && <MutualsPanel />}
              {activeTab === "stats" && <StatsPanel profileId={profile.id} />}
              {activeTab === "recents" && <RecentsPanel profileId={profile.id} />}
            </div>
          </div>
        </div>
      </section>
    </FocusContent>
  );
}

export default Profile;
