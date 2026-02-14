type FooterLinkProps = {
  children: string;
  className?: string;
  pathTo: string;
};

const FooterLink = ({ children, className = "", pathTo }: FooterLinkProps) => {
  return (
    <a
      href={pathTo}
      className={`${className} hover:text-hover active:text-hover from-link-primary to-link-secondary bg-linear-to-r bg-clip-text font-sans text-transparent transition-colors duration-200 hover:cursor-pointer active:cursor-pointer`}
    >
      {children}
    </a>
  );
};

export default FooterLink;
