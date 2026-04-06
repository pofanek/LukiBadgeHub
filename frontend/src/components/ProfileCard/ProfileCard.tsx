import { ProfileItem } from "./";
import { ProfileUserInfo } from "./";
import { Divider } from "../UI";
type ProfileCardProps = {
  className?: string;
  profileMenuOpen: boolean;
  setProfileMenu: React.Dispatch<React.SetStateAction<boolean>>;
};
import { FiUser } from "react-icons/fi";
import { FiSettings } from "react-icons/fi";
import { FiCreditCard } from "react-icons/fi";
import { FiBell } from "react-icons/fi";
import { FiUsers } from "react-icons/fi";
import { FiLogOut } from "react-icons/fi";

const ProfileCard = ({
  className = "",
  setProfileMenu,
  profileMenuOpen,
}: ProfileCardProps) => {
  return (
    <>
      <ul
        className={`${className} bg-surface-raised border-border fixed top-25 right-3.5 z-9 flex max-h-[calc(100vh-100px)] w-45 flex-col overflow-y-auto rounded-2xl border p-2 shadow-black transition-opacity duration-200 ease-in-out sm:right-7 sm:w-52`}
      >
        {/* User info header */}
        <ProfileUserInfo />
        {/* Divider */}
        <Divider />

        <ProfileItem pathTo={`/Profile`} Icon={FiUser}>
          Profile
        </ProfileItem>
        <ProfileItem pathTo={`/billing`} Icon={FiCreditCard}>
          Billing
        </ProfileItem>
        <ProfileItem pathTo={`/friends`} Icon={FiUsers}>
          Friends
        </ProfileItem>
        <ProfileItem pathTo={`/notifications`} Icon={FiBell}>
          Notifications
        </ProfileItem>

        <ProfileItem pathTo={`/settings`} Icon={FiSettings}>
          Settings
        </ProfileItem>
        <ProfileItem pathTo={`/logout`} logoutItem={true} Icon={FiLogOut}>
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
