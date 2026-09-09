import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { FocusContent } from "../../components";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useUserProfile } from "../../hooks/useUserProfile";
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
  const { id } = useParams();
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const profileId = id || user?.id;
  const { profile, isLoading: isProfileLoading } = useUserProfile(profileId);

  if (!id && !isAuthLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthLoading || isProfileLoading) {
    return (
      <FocusContent>
        <p className="text-font-secondary">Loading profile...</p>
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

  return (
    <FocusContent>
      <section className="bg-primary w-full self-stretch pb-6 sm:pb-8 lg:pb-10">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-7">
          <ProfileHeader profile={profile} isOwnProfile={user?.id === profile.id} />
          <div>
            <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
            <div className="min-h-110 p-3 sm:p-5 lg:p-7">
              {activeTab === "games" && <GamesPanel />}
              {activeTab === "mutuals" && <MutualsPanel />}
              {activeTab === "stats" && <StatsPanel />}
              {activeTab === "recents" && <RecentsPanel />}
            </div>
          </div>
        </div>
      </section>
    </FocusContent>
  );
}

export default Profile;
