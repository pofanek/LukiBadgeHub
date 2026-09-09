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
type NavbarProps = {
  activeTab?: "Home" | "Games" | "Rankings" | "Login" | string;
  titleOnly?: boolean;
};
const Navbar = ({ activeTab = "", titleOnly = false }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchbarOpen, setSearchbarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenu] = useState(false);
  const [IsLoggedIn] = useState(false);
  return (
    <>
      {titleOnly ? (
        <nav className="border-border bg-surface-overlay/40 sticky top-0 z-10 flex h-16 max-h-16 flex-1 flex-row items-center justify-center border border-x-0 border-t-0 p-1 shadow-black">
          <Title longNavbar={false} />
        </nav>
      ) : (
        <nav className="border-border bg-surface-overlay/40 sticky top-0 z-40 flex h-16 min-w-0 items-center justify-between border border-x-0 border-t-0 p-1 pr-3 shadow-black">
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
              IsLoggedIn={IsLoggedIn}
              profileMenuOpen={profileMenuOpen}
              setProfileMenu={setProfileMenu}
              activeTab={activeTab}
            />
            <MenuButton value={menuOpen} setter={setMenuOpen} />
          </div>
          {/* all fixed pos */}
          <SearchbarFixed value={searchbarOpen} setter={setSearchbarOpen} />
          <ProfileCard
            setProfileMenu={setProfileMenu}
            profileMenuOpen={profileMenuOpen}
            className={`${profileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          />
          <HamburgerMenu
            value={menuOpen}
            setter={setMenuOpen}
            isLoggedIn={IsLoggedIn}
          />
        </nav>
      )}
    </>
  );
};

export default Navbar;
