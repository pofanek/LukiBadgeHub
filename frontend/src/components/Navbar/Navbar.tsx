import {
  Searchbar,
  ProfileCard,
  Title,
  SearchbarButton,
  HamburgerMenu,
  SearchbarFixed,
  MenuButton,
  Login,
  NavbarButtonRightPanel,
} from "./";
import { useState } from "react";
import { supabase } from "../../utils/supabase";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useUserProfile } from "../../hooks/useUserProfile";
type NavbarProps = {
  activeTab?: "Home" | "Games" | "Rankings" | "Login" | string;
  titleOnly?: boolean;
};
const Navbar = ({ activeTab = "", titleOnly = false }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchbarOpen, setSearchbarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenu] = useState(false);
  const { user } = useAuthUser();
  const { profile } = useUserProfile(user?.id);
  const profilePath = user ? `/profile/${user.id}` : "/login";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileMenu(false);
    setMenuOpen(false);
  };
  return (
    <>
      {titleOnly ? (
        <nav className="border-border bg-surface-overlay sticky top-0 z-10 flex h-16 max-h-16 flex-1 flex-row items-center justify-center border border-x-0 border-t-0 p-1 shadow-black">
          <Title longNavbar={false} />
        </nav>
      ) : (
        <nav className="border-border bg-surface-overlay sticky top-0 z-40 flex h-16 min-w-0 items-center justify-between border border-x-0 border-t-0 px-3 py-1 sm:px-7 shadow-black">
          <div className="flex-1 pr-0 md:grow md:pr-2">
            <Title value={searchbarOpen} />
          </div>
          <div className="flex h-full items-center pr-0 md:pr-4">
            <Searchbar className="hidden" />
          </div>
          <div className="flex h-full flex-1 items-center justify-end gap-0 sm:gap-1">
            <SearchbarButton value={searchbarOpen} setter={setSearchbarOpen} />
            <NavbarButtonRightPanel
              label={"Home"}
              tabName="/"
              activeTab={activeTab}
              className="hidden lg:block"
              pathTo="/"
            />
            <NavbarButtonRightPanel
              label={"Games"}
              tabName="/games"
              activeTab={activeTab}
              className="hidden sm:block"
              pathTo="/games"
            />
            <NavbarButtonRightPanel
              label={"Rankings"}
              tabName="/rankings"
              activeTab={activeTab}
              className="hidden sm:block"
              pathTo="/rankings"
            />
            <Login
              user={user}
              profile={profile}
              profileMenuOpen={profileMenuOpen}
              setProfileMenu={setProfileMenu}
              activeTab={activeTab}
            />
            <MenuButton value={menuOpen} setter={setMenuOpen} />
          </div>
          {/* all fixed pos */}
          <SearchbarFixed value={searchbarOpen} setter={setSearchbarOpen} />
          <ProfileCard
            user={user}
            profile={profile}
            profilePath={profilePath}
            onLogout={handleLogout}
            setProfileMenu={setProfileMenu}
            profileMenuOpen={profileMenuOpen}
            className={`${profileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          />
          <HamburgerMenu
            value={menuOpen}
            setter={setMenuOpen}
            isLoggedIn={Boolean(user)}
            profilePath={profilePath}
            onLogout={handleLogout}
          />
        </nav>
      )}
    </>
  );
};

export default Navbar;
