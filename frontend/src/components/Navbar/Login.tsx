import { userchomik } from "../../assets";
import NavbarButtonRightPanel from "./NavbarButtonRightPanel";
import NavbarImage from "./NavbarImage";

type LoginProps = {
  IsLoggedIn: boolean;
  profileMenuOpen: boolean;
  setProfileMenu: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: "Home" | "Games" | "Rankings" | "Login" | "None";
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
          image={userchomik}
          alt="image"
          className="ml-2 hover:cursor-pointer active:cursor-pointer"
          onClick={() => {
            setProfileMenu(!profileMenuOpen);
          }}
        />
      ) : (
        <NavbarButtonRightPanel
          label={"Login"}
          tabName="Login"
          activeTab={activeTab}
          pathTo="/Login"
        />
      )}
    </>
  );
};

export default Login;
