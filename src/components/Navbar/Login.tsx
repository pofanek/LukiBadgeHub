import { logo } from "../../assets";
import * as Constants from "../../constants";
import NavbarButtonRightPanel from "./NavbarButtonRightPanel";
import NavbarImage from "./NavbarImage";

type LoginProps = {
  IsLoggedIn: boolean; // loggedIn
  profileMenuOpen: boolean; // prof
  setProfileMenu: React.Dispatch<React.SetStateAction<boolean>>; // prof
  activeTab: "Home" | "Games" | "Leaderboards" | "Login";
};
const Login = ({
  IsLoggedIn,
  profileMenuOpen,
  setProfileMenu,
  activeTab,
}: LoginProps) => {
  return (
    <>
      {IsLoggedIn ? (
        <NavbarImage
          image={logo}
          alt="image"
          className="ml-1 hover:cursor-pointer active:cursor-pointer"
          onClick={() => {
            setProfileMenu(!profileMenuOpen);
          }}
        />
      ) : (
        <NavbarButtonRightPanel
          label={Constants.NAV_LABELS.LOGIN}
          tabName="Login"
          activeTab={activeTab}
        />
      )}
    </>
  );
};

export default Login;
