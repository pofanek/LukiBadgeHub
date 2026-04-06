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
        <nav className="border-border bg-surface-overlay/40 sticky z-10 mx-20 mt-7 flex h-16 max-h-16 flex-1 flex-row items-center justify-center rounded-xl border p-1 shadow-black sm:mx-20 lg:w-215 lg:self-center">
          <Title longNavbar={false} />
        </nav>
      ) : (
        <nav className="border-border bg-surface-overlay/40 sticky z-40 mx-2 mt-7 flex h-16 min-w-94 items-center justify-between rounded-xl border p-1 pr-3 shadow-black sm:mr-7 sm:ml-7">
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
