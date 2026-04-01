type NavbarButtonProps = {
  children: string | React.ReactNode;
  className?: string;
  onClick?: () => void;
};

const NavbarButton = ({
  children,
  className = "",
  onClick,
}: NavbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-xl px-3 py-1.5 font-sans transition-all duration-200 ease-out hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </button>
  );
};

export default NavbarButton;
