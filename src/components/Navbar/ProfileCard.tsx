import CardItem from "./CardItem";

type ProfileCardProps = {
  className?: string;
  profileMenuOpen: boolean;
};

const ProfileCard = ({ className = "", profileMenuOpen }: ProfileCardProps) => {
  return (
    <ul
      className={`${className} bg-surface-raised border-border fixed top-26 right-3.5 z-9 flex h-54 w-46 flex-col items-center justify-center rounded-xl p-2 shadow-black transition-opacity duration-300 ease-in-out sm:right-2 sm:w-52`}
    >
      <CardItem profileMenuOpen={profileMenuOpen} className="h-1/3">
        Profile
      </CardItem>
      <CardItem profileMenuOpen={profileMenuOpen} className="h-1/3">
        Settings
      </CardItem>
      <CardItem
        profileMenuOpen={profileMenuOpen}
        className="h-1/3"
        lastItem={true}
      >
        Logout
      </CardItem>
    </ul>
  );
};

export default ProfileCard;
