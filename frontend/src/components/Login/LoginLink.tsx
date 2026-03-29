import { Link } from "react-router-dom";

type LoginLinkProps = {
  children: string;
  className?: string;
  pathTo: string;
};

const LoginLink = ({ children, className = "", pathTo }: LoginLinkProps) => {
  return (
    <Link
      to={pathTo}
      className={`${className} hover:text-hover active:text-hover from-link-primary to-link-secondary bg-linear-to-r bg-clip-text text-end font-sans text-transparent transition-colors duration-200 hover:cursor-pointer active:cursor-pointer`}
    >
      {children}
    </Link>
  );
};

export default LoginLink;
