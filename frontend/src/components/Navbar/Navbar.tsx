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
import { FiSettings } from "react-icons/fi";
import { Link } from "react-router-dom";
import NotificationsMenu from "./NotificationsMenu";
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
  const profilePath =
    user && profile
      ? `/profile/${encodeURIComponent(profile.username)}`
      : "/profile";

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
                  tabName="/leaderboard"
                  activeTab={activeTab}
                  pathTo="/leaderboard"
                />
              </div>
            </div>
            <div className="mx-3 hidden max-w-80 min-w-0 flex-1 min-[1350px]:absolute min-[1350px]:left-1/2 min-[1350px]:mx-0 min-[1350px]:w-80 min-[1350px]:max-w-none min-[1350px]:flex-none min-[1350px]:-translate-x-1/2 lg:flex">
              <Searchbar className="w-full" inputClasses="w-full" />
            </div>
            <div className="ml-auto flex h-full items-center justify-end gap-0 sm:gap-1">
              <div className="block lg:hidden">
                <SearchbarButton
                  value={searchbarOpen}
                  setter={setSearchbarOpen}
                />
              </div>
              <NotificationsMenu />
              {user && (
                <Link
                  to="/settings"
                  aria-label="Settings"
                  title="Settings"
                  className="text-font-secondary hover:text-font-primary hover:bg-effect-glass ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-cold"
                >
                  <FiSettings className="h-5 w-5" aria-hidden="true" />
                </Link>
              )}
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
