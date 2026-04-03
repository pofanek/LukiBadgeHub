import { Link } from "react-router-dom";
import type { IconType } from "react-icons";
import { TOTAL_ITEMS } from "./menuSections";

type CardItemProps = {
  children: string;
  className?: string;
  pathTo: string;
  isLink?: boolean;
  index?: number;
  open?: boolean;
  icon?: IconType;
};

const CardItem = ({
  className = "",
  pathTo,
  isLink = false,
  index = 0,
  open = true,
  icon: Icon,
  children,
}: CardItemProps) => {
  const delayMs = open ? 80 + index * 40 : (TOTAL_ITEMS - index) * 20;

  const baseClass = `${className} flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg
    text-2xl text-font-primary transition-all duration-200
    hover:text-hover hover:bg-effect-glass active:text-hover active:bg-effect-glass
    ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`;

  const props = {
    className: baseClass,
    style: { transitionDelay: `${delayMs}ms` },
  };

  return isLink ? (
    <a href={pathTo} {...props}>
      {Icon && <Icon size={22} />}
      {children}
    </a>
  ) : (
    <Link to={pathTo} {...props}>
      {Icon && <Icon size={22} />}
      {children}
    </Link>
  );
};

export default CardItem;
