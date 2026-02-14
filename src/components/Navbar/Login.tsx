import { logo } from "../../assets";
import * as Constants from "../../constants";
import NavbarButtonRightPanel from "./NavbarButtonRightPanel";
import NavbarImage from "./NavbarImage";

type MenuButtonProps = {
  value: boolean; // loggedIn
  value2: boolean; // prof
  setter2: React.Dispatch<React.SetStateAction<boolean>>; // prof
  activeTab: "Home" | "Games" | "Leaderboards" | "Login";
};
const Login = ({ value, value2, setter2, activeTab }: MenuButtonProps) => {
  return (
    <>
      {value ? (
        <NavbarImage
          image={logo}
          alter="image"
          className="hover:cursor-pointer active:cursor-pointer"
          onClick={() => {
            setter2(!value2);
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
