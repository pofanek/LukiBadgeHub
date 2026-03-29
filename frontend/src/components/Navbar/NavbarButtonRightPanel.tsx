import { Link } from "react-router-dom";
import NavbarButton from "./NavbarButton";
type NavbarButtonItemProps = {
  label: string;
  activeTab: string;
  className?: string;
  tabName: string;
  pathTo: string;
};
const NavbarButtonRightPanel = ({
  activeTab,
  className = "",
  tabName,
  label,
  pathTo,
}: NavbarButtonItemProps) => {
  return (
    <Link to={pathTo}>
      <NavbarButton
        className={`${activeTab === tabName ? "from-brand-primary to-brand-secondary hover:text-font-primary active:text-font-primary bg-linear-to-r" : ""} ${className}`}
      >
        {label}
      </NavbarButton>
    </Link>
  );
};

export default NavbarButtonRightPanel;
