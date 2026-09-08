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
      <section className="w-full self-stretch py-6 sm:py-8 lg:py-10">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-7">
          <ProfileHeader />
          <div className="border-border bg-surface-overlay/55 mt-5 overflow-hidden rounded-2xl border shadow-black sm:mt-7">
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
