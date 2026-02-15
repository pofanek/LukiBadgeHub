import { Link } from "react-router-dom";

type CardItemProps = {
  children: string;
  lastItem?: boolean;
  className?: string;
  profileMenuOpen?: boolean;
  pathTo: string;
  isLink?: boolean;
};

const CardItem = ({
  children,
  lastItem = false,
  className = "",
  profileMenuOpen,
  pathTo,
  isLink = false,
}: CardItemProps) => {
  return (
    <>
      {isLink ? (
        <>
          <a
            href={pathTo}
            className={`${className} text-font-primary hover:text-hover active:text-hover hover:bg-effect-glass active:bg-effect-glass flex w-full cursor-pointer items-center justify-center rounded-lg transition-all duration-200`}
          >
            {children}
          </a>
          <div
            className={`bg-border m-2 h-0.5 w-full ${lastItem ? "hidden" : "block"}`}
          ></div>
        </>
      ) : (
        <>
          <Link
            to={pathTo}
            className={`${className} text-font-primary hover:text-hover active:text-hover hover:bg-effect-glass active:bg-effect-glass flex w-full cursor-pointer items-center justify-center rounded-lg transition-all duration-200`}
          >
            {children}
          </Link>
          <div
            className={`bg-border m-2 h-0.5 w-full ${lastItem ? "hidden" : "block"}`}
          ></div>
        </>
      )}
    </>
  );
};

export default CardItem;
