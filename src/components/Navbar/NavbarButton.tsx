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
      className={`hover:bg-effect-glass active:bg-effect-glass hover:text-hover active:text-hover text-font-primary hover: transform cursor-pointer rounded-xl p-1.5 pr-3 pl-3 font-sans transition-all duration-200 ease-out hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </button>
  );
};

export default NavbarButton;
