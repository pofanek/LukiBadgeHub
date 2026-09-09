import { useState } from "react";
import { FocusContent } from "../../components";
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

  return (
    <FocusContent>
      <section className="bg-primary w-full self-stretch pb-6 sm:pb-8 lg:pb-10">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-7">
          <ProfileHeader />
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
