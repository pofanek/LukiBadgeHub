import type { IconType } from "react-icons";
import { Link } from "react-router-dom";
import { Divider } from "../UI";

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
          <Divider />
          <Link
            to={pathTo}
            className={`${className} text-destructive hover:bg-destructive-background active:bg-destructive-background flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200`}
          >
            <Icon size={16} />
            {children}
          </Link>
        </>
      ) : (
        <Link
          to={pathTo}
          className={`${className} text-font-secondary hover:text-font-primary hover:bg-brand-secondary flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200`}
        >
          <Icon size={16} />
          {children}
        </Link>
      )}
    </>
  );
};

export default ProfileItem;
