type FooterTextProps = {
  children: string;
  className?: string;
  isLink?: boolean;
};

const FooterText = ({
  children,
  className = "",
  isLink = false,
}: FooterTextProps) => {
  return (
    <a
      className={`${className} hover:text-hover active:text-hover font-sans transition-colors duration-200 hover:cursor-pointer active:cursor-pointer ${isLink ? "from-link-primary to-link-secondary bg-linear-to-r bg-clip-text text-transparent" : "text-font-primary"}`}
    >
      {children}
    </a>
  );
};

export default FooterText;
