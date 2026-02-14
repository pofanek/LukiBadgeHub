import NavbarButton from "./NavbarButton";
type NavbarButtonItemProps = {
  label: string;
  activeTab: string;
  className?: string;
  tabName: string;
};
const NavbarButtonRightPanel = ({
  activeTab,
  className = "",
  tabName,
  label,
}: NavbarButtonItemProps) => {
  return (
    <NavbarButton
      className={`${activeTab === tabName ? "from-brand-primary to-brand-secondary hover:text-font-primary active:text-font-primary bg-linear-to-r" : ""} ${className}`}
    >
      {label}
    </NavbarButton>
  );
};

export default NavbarButtonRightPanel;
