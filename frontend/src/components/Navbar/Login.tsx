import { userchomik } from "../../assets";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "../../hooks/useUserProfile";
import NavbarButtonRightPanel from "./NavbarButtonRightPanel";
import NavbarImage from "./NavbarImage";

type LoginProps = {
  user: User | null;
  profile: UserProfile | null;
  profileMenuOpen: boolean;
  setProfileMenu: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: "Home" | "Games" | "Rankings" | "Login" | string;
};
const Login = ({
  user,
  profile,
  profileMenuOpen,
  setProfileMenu,
  activeTab,
}: LoginProps) => {
  return (
    <>
      {user ? (
        <button
          type="button"
          aria-label="Open profile menu"
          className={`ml-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-cold ${
            profileMenuOpen
              ? "ring-accent-cold ring-offset-primary rounded-full ring-2 ring-offset-1"
              : ""
          }`}
          onClick={() => {
            setProfileMenu(!profileMenuOpen);
          }}
        >
          <NavbarImage
            image={profile?.avatar_path || user.user_metadata.avatar_url || userchomik}
            alt={`${profile?.username || user.email || "User"}'s avatar`}
            className="hover:cursor-pointer active:cursor-pointer"
          />
        </button>
      ) : (
        <NavbarButtonRightPanel
          label={"Login"}
          tabName="login"
          activeTab={activeTab}
          pathTo="/login"
        />
      )}
    </>
  );
};

export default Login;
