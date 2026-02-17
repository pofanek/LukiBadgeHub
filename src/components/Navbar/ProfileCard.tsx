import ProfileItem from "./ProfileItem";
import * as Constants from "../../constants";
type ProfileCardProps = {
  className?: string;
};
import { FiUser } from "react-icons/fi";
import { FiSettings } from "react-icons/fi";
import { FiCreditCard } from "react-icons/fi";
import { FiLogOut } from "react-icons/fi";
const ProfileCard = ({ className = "" }: ProfileCardProps) => {
  return (
    <ul
      className={`${className} bg-surface-raised border-border fixed top-26 right-3.5 z-9 flex h-48 w-38 flex-col items-center justify-center rounded-xl p-2 shadow-black transition-opacity duration-200 ease-in-out sm:right-7`}
    >
      <ProfileItem pathTo={`/${Constants.USER_RELATED.PROFILE}`} Icon={FiUser}>
        {Constants.USER_RELATED.PROFILE}
      </ProfileItem>
      <ProfileItem
        pathTo={`/${Constants.NAV_LABELS.BILLING}`}
        Icon={FiCreditCard}
      >
        {Constants.NAV_LABELS.BILLING}
      </ProfileItem>
      <ProfileItem
        pathTo={`/${Constants.NAV_LABELS.SETTINGS}`}
        Icon={FiSettings}
      >
        {Constants.NAV_LABELS.SETTINGS}
      </ProfileItem>
      <ProfileItem
        pathTo={`/${Constants.USER_RELATED.LOGOUT}`}
        logoutItem={true}
        Icon={FiLogOut}
      >
        {Constants.USER_RELATED.LOGOUT}
      </ProfileItem>
    </ul>
  );
};

export default ProfileCard;
