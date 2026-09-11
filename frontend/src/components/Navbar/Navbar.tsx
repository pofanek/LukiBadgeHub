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
import { FiBell } from "react-icons/fi";
import { Link } from "react-router-dom";
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
          <div className="relative flex h-full w-full min-w-0 items-center px-2 sm:px-7">
            <div className="flex h-full min-w-0 items-center">
              <Title value={searchbarOpen} />
              <div className="hidden h-full items-center sm:flex">
                <NavbarButtonRightPanel
                  label="Games"
                  tabName="/games"
                  activeTab={activeTab}
                  className="ml-2"
                  pathTo="/games"
                />
                <NavbarButtonRightPanel
                  label="Leaderboards"
                  tabName="/rankings"
                  activeTab={activeTab}
                  pathTo="/rankings"
                />
              </div>
            </div>
            <div className="mx-3 hidden min-w-0 max-w-80 flex-1 min-[764px]:flex min-[1350px]:hidden">
              <Searchbar className="flex w-full" inputClasses="w-full" />
            </div>
            <div className="absolute left-1/2 hidden h-full w-80 -translate-x-1/2 items-center justify-center min-[1350px]:flex">
              <Searchbar className="flex w-full" inputClasses="w-full" />
            </div>
            <div className="ml-auto flex h-full items-center justify-end gap-0 sm:gap-1">
              <div className="hidden min-[380px]:block min-[764px]:hidden">
                <SearchbarButton
                  value={searchbarOpen}
                  setter={setSearchbarOpen}
                />
              </div>
              <Link
                to="/notifications"
                aria-label="Notifications"
                className="text-font-secondary hover:bg-effect-glass hover:text-font-primary focus-visible:ring-accent-cold hidden h-10 w-10 items-center justify-center rounded-xl transition-colors focus-visible:ring-2 sm:flex"
              >
                <FiBell className="h-5 w-5" />
              </Link>
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
