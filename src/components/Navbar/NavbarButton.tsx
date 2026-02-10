type NavbarButtonProps = {
  children: string | React.ReactNode;
  className?: string;
};

const NavbarButton = ({ children, className = "" }: NavbarButtonProps) => {
  return (
    <button
      className={`bg-primary-100 hover:bg-secondary-300 active:bg-secondary-300 cursor-pointer rounded-4xl p-3 font-sans text-white duration-200 ${className}`}
    >
      {children}
    </button>
  );
};

export default NavbarButton;
