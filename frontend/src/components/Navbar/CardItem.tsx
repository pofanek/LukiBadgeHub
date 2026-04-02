import { Link } from "react-router-dom";
import { Divider } from "../UI";
type CardItemProps = {
  children: string;
  lastItem?: boolean;
  className?: string;
  pathTo: string;
  isLink?: boolean;
};

const CardItem = ({
  children,
  lastItem = false,
  className = "",
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
          {lastItem ? <div></div> : <Divider />}
        </>
      ) : (
        <>
          <Link
            to={pathTo}
            className={`${className} text-font-primary hover:text-hover active:text-hover hover:bg-effect-glass active:bg-effect-glass flex w-full cursor-pointer items-center justify-center rounded-lg transition-all duration-200`}
          >
            {children}
          </Link>

          {lastItem ? <div></div> : <Divider />}
        </>
      )}
    </>
  );
};

export default CardItem;
