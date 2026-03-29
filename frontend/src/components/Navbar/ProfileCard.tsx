import ProfileItem from "./ProfileItem";
type ProfileCardProps = {
  className?: string;
  profileMenuOpen: boolean;
  setProfileMenu: React.Dispatch<React.SetStateAction<boolean>>;
};
import { FiUser } from "react-icons/fi";
import { FiSettings } from "react-icons/fi";
import { FiCreditCard } from "react-icons/fi";
import { FiLogOut } from "react-icons/fi";
const ProfileCard = ({
  className = "",
  setProfileMenu,
  profileMenuOpen,
}: ProfileCardProps) => {
  return (
    <>
      <ul
        className={`${className} bg-surface-raised border-border fixed top-26 right-3.5 z-9 flex h-48 w-38 flex-col items-center justify-center rounded-xl p-2 shadow-black transition-opacity duration-200 ease-in-out sm:right-7`}
      >
        <ProfileItem pathTo={`/Profile`} Icon={FiUser}>
          Profile
        </ProfileItem>
        <ProfileItem pathTo={`/Billing`} Icon={FiCreditCard}>
          Billing
        </ProfileItem>
        <ProfileItem pathTo={`/Settings`} Icon={FiSettings}>
          Settings
        </ProfileItem>
        <ProfileItem pathTo={`/Logout`} logoutItem={true} Icon={FiLogOut}>
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
