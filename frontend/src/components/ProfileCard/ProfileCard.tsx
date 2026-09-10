import { ProfileItem } from "./";
import { ProfileUserInfo } from "./";
import { Divider } from "../UI";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "../../hooks/useUserProfile";
type ProfileCardProps = {
  className?: string;
  profileMenuOpen: boolean;
  setProfileMenu: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
  profile: UserProfile | null;
  profilePath: string;
  onLogout: () => Promise<void>;
};
import { FiUser } from "react-icons/fi";
import { FiSettings } from "react-icons/fi";
import { FiBell } from "react-icons/fi";
import { FiLogOut } from "react-icons/fi";

const ProfileCard = ({
  className = "",
  setProfileMenu,
  profileMenuOpen,
  user,
  profile,
  profilePath,
  onLogout,
}: ProfileCardProps) => {
  if (!user) return null;

  const closeMenu = () => setProfileMenu(false);

  return (
    <>
      <ul
        className={`${className} bg-surface-raised border-border fixed top-20 right-3.5 z-9 flex max-h-[calc(100vh-100px)] w-45 flex-col overflow-y-auto rounded-2xl border p-2 shadow-black transition-opacity duration-200 ease-in-out sm:right-7 sm:w-52`}
      >
        {/* User info header */}
        <ProfileUserInfo user={user} profile={profile} />
        {/* Divider */}
        <Divider />

        <ProfileItem pathTo={profilePath} onClick={closeMenu} Icon={FiUser}>
          Profile
        </ProfileItem>
        <ProfileItem pathTo="/notifications" onClick={closeMenu} Icon={FiBell}>
          Notifications
        </ProfileItem>

        <ProfileItem pathTo="/settings" onClick={closeMenu} Icon={FiSettings}>
          Settings
        </ProfileItem>
        <ProfileItem logoutItem={true} onClick={onLogout} Icon={FiLogOut}>
          Logout
        </ProfileItem>
      </ul>
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-8"
          onClick={() => setProfileMenu(false)}
        ></div>
      )}
    </>
  );
};
export default ProfileCard;
