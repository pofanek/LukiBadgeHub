import type { IconType } from "react-icons";
import { Link } from "react-router-dom";

type CardItemProps = {
  children: string;
  pathTo: string;
  className?: string;
  isLink?: boolean;
  logoutItem?: boolean;
  Icon: IconType;
};

const ProfileItem = ({
  children,
  className = "",
  pathTo,
  logoutItem = false,
  Icon,
}: CardItemProps) => {
  return (
    <>
      {logoutItem ? (
        <>
          <div className={`bg-border m-2 h-0.5 w-full`}></div>
          <Link
            to={pathTo}
            className={`${className} text-destructive hover:bg-destructive-background active:bg-destructive-background active:text-destructive-hover flex h-1/3 w-full cursor-pointer items-center justify-start gap-2 rounded-lg pl-2 transition-all duration-200`}
          >
            <Icon size={18} />
            {children}
          </Link>
        </>
      ) : (
        <>
          <Link
            to={pathTo}
            className={`${className} text-font-primary hover:text-hover active:text-hover hover:bg-brand-secondary active:bg-brand-secondary flex h-1/3 w-full cursor-pointer items-center justify-start gap-2 rounded-lg pl-2 transition-all duration-200`}
          >
            <Icon size={18} />
            {children}
          </Link>
        </>
      )}
    </>
  );
};

export default ProfileItem;
