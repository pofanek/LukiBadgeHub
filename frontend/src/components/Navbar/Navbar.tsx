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
  const profilePath = user && profile ? `/profile/${encodeURIComponent(profile.username)}` : "/profile";

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
        <nav className="border-border bg-surface-overlay sticky top-0 z-40 h-16 border border-x-0 border-t-0 py-1 shadow-black">
          <div className="mx-auto grid h-full w-full max-w-6xl min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center px-2 sm:px-7 md:grid-cols-[minmax(12rem,1fr)_20rem_minmax(12rem,1fr)]">
            <div className="min-w-0">
              <Title value={searchbarOpen} />
            </div>
            <div className="hidden h-full items-center justify-center md:flex">
              <Searchbar className="flex w-full" inputClasses="w-full" />
            </div>
            <div className="flex h-full items-center justify-end gap-0 sm:gap-1">
              <div className="hidden min-[380px]:block md:hidden"><SearchbarButton value={searchbarOpen} setter={setSearchbarOpen} /></div>
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
                className="hidden md:block"
                pathTo="/games"
              />
              <NavbarButtonRightPanel
                label={"Rankings"}
                tabName="/rankings"
                activeTab={activeTab}
                className="hidden md:block"
                pathTo="/rankings"
              />
              <div className="relative">
                <Login
                  user={user}
                  profile={profile}
                  profileMenuOpen={profileMenuOpen}
                  setProfileMenu={setProfileMenu}
                  activeTab={activeTab}
                />
                <ProfileCard
                  user={user}
                  profile={profile}
                  profilePath={profilePath}
                  onLogout={handleLogout}
                  setProfileMenu={setProfileMenu}
                  profileMenuOpen={profileMenuOpen}
                  className={`${profileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
                />
              </div>
              <MenuButton value={menuOpen} setter={setMenuOpen} />
            </div>
            <SearchbarFixed value={searchbarOpen} setter={setSearchbarOpen} />
            <HamburgerMenu
              value={menuOpen}
              setter={setMenuOpen}
              isLoggedIn={Boolean(user)}
              profilePath={profilePath}
              onLogout={handleLogout}
            />
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
