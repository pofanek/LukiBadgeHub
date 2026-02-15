import CardItem from "./CardItem";
import * as Constants from "../../constants";
type ProfileCardProps = {
  className?: string;
};

const ProfileCard = ({ className = "" }: ProfileCardProps) => {
  return (
    <ul
      className={`${className} bg-surface-raised border-border fixed top-26 right-3.5 z-9 flex h-54 w-46 flex-col items-center justify-center rounded-xl p-2 shadow-black transition-opacity duration-300 ease-in-out sm:right-2 sm:w-52`}
    >
      <CardItem pathTo={`/${Constants.USER_RELATED.PROFILE}`} className="h-1/3">
        {Constants.USER_RELATED.PROFILE}
      </CardItem>
      <CardItem pathTo={`/${Constants.NAV_LABELS.SETTINGS}`} className="h-1/3">
        {Constants.NAV_LABELS.SETTINGS}
      </CardItem>
      <CardItem pathTo={`/${Constants.NAV_LABELS.BILLING}`} className="h-1/3">
        {Constants.NAV_LABELS.BILLING}
      </CardItem>
      <CardItem
        pathTo={`/${Constants.USER_RELATED.LOGOUT}`}
        className="h-1/3"
        lastItem={true}
      >
        {Constants.USER_RELATED.LOGOUT}
      </CardItem>
    </ul>
  );
};

export default ProfileCard;
