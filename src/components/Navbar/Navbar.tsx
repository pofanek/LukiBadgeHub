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
import * as Constants from "../../constants";
import { useState } from "react";
type NavbarProps = {
  activeTab: "Home" | "Games" | "Leaderboards" | "Login";
};
const Navbar = ({ activeTab }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchbarOpen, setSearchbarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenu] = useState(false);
  const [IsLoggedIn] = useState(true);
  return (
    <>
      <nav className="bg-primary border-border sticky mt-7 mr-2 ml-2 flex h-16 items-center justify-between rounded-xl border p-1 shadow-black sm:mr-7 sm:ml-7">
        <div className="flex-1 pr-0 md:grow md:pr-2">
          <Title value={searchbarOpen} />
        </div>
        <div className="flex h-full items-center pr-0 md:pr-4">
          <Searchbar className="hidden" />
        </div>
        <div className="flex h-full flex-1 items-center justify-end gap-2">
          <SearchbarButton value={searchbarOpen} setter={setSearchbarOpen} />
          <NavbarButtonRightPanel
            label={Constants.NAV_LABELS.HOME}
            tabName="Home"
            activeTab={activeTab}
            className="hidden lg:block"
          />
          <NavbarButtonRightPanel
            label={Constants.NAV_LABELS.GAMES}
            tabName="Games"
            activeTab={activeTab}
            className="hidden sm:block"
          />
          <NavbarButtonRightPanel
            label={Constants.NAV_LABELS.LEADERBOARDS}
            tabName="Leaderboards"
            activeTab={activeTab}
            className="hidden sm:block"
          />
          <Login
            IsLoggedIn={IsLoggedIn}
            profileMenuOpen={profileMenuOpen}
            setProfileMenu={setProfileMenu}
            activeTab={activeTab}
          />
          <MenuButton value={menuOpen} setter={setMenuOpen} />
        </div>
        {/* all fixed pos */}
        <SearchbarFixed value={searchbarOpen} setter={setSearchbarOpen} />
        <HamburgerMenu value={menuOpen} setter={setMenuOpen} />
        <ProfileCard
          className={`${profileMenuOpen ? "opacity-100" : "opacity-0"}`}
          profileMenuOpen={profileMenuOpen}
        />
      </nav>
    </>
  );
};

export default Navbar;
