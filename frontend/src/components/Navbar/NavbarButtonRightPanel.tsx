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
  const formatPath = (path: string) =>
    "/" + path.slice(1, 2).toUpperCase() + path.slice(2);
  const isActive = activeTab === tabName || activeTab === formatPath(tabName);
  const isLogin = tabName === "Login" || tabName === "login";
  const loginStyles =
    "from-accent-cold to-accent-cold-dim bg-linear-to-r ml-2 text-font-primary hover:brightness-110";
  const activeStyles = "text-font-primary font-medium";
  const defaultStyles =
    "text-font-secondary hover:text-font-primary hover:bg-effect-glass";

  const styles = isLogin
    ? loginStyles
    : isActive
      ? activeStyles
      : defaultStyles;

  return (
    <Link to={pathTo}>
      <NavbarButton className={`${styles} ${className}`}>{label}</NavbarButton>
    </Link>
  );
};

export default NavbarButtonRightPanel;
