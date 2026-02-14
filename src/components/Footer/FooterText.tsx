import type React from "react";
import { Link } from "react-router-dom";

type FooterTextProps = {
  children: string | React.ReactNode;
  className?: string;
  isLink?: boolean;
  pathTo?: string;
};

const FooterText = ({
  children,
  className = "",
  isLink = false,
  pathTo = "",
}: FooterTextProps) => {
  return (
    <Link
      to={pathTo}
      className={`${className} hover:text-hover active:text-hover font-sans transition-colors duration-200 hover:cursor-pointer active:cursor-pointer ${isLink ? "from-link-primary to-link-secondary bg-linear-to-r bg-clip-text text-transparent" : "text-font-primary"}`}
    >
      {children}
    </Link>
  );
};

export default FooterText;
