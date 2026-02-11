import { NavbarButton, Searchbar, NavbarImage } from "./";
import { logo, menu, searchIcon, arrow } from "../../assets";
import { APP_NAME, APP_SHORT_NAME, NAV_LABELS } from "../../constants";
import { useState } from "react";
//! 735px Games znika    845px Leaderboards znika
const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchbarOpen, setSearchbarOpen] = useState(false);
  return (
    // basis-0 grow sprawia ze są równe odstępy pomiędzy elementami z różnymi width.
    <nav className="bg-primary-600 gray-1 fixed flex h-16 w-full items-center justify-between p-1 md:p-4">
      <div className="grow-0 basis-0 pr-0 md:grow md:pr-2">
        <a
          href="#"
          className="flex h-full w-42 items-center gap-2 duration-300 hover:scale-105 hover:cursor-pointer sm:w-67 md:gap-6"
        >
          <NavbarImage image={logo} alter={`${APP_SHORT_NAME} Logo`} />
          <p className="hidden font-serif text-3xl whitespace-nowrap text-white sm:block">
            {APP_NAME}
          </p>
          <p className="block font-serif text-4xl whitespace-nowrap text-white sm:hidden">
            {APP_SHORT_NAME}
          </p>
        </a>
      </div>
      <div className="flex h-full items-center pr-0 md:pr-4">
        <Searchbar className="hidden" />
      </div>
      <div className="flex h-full grow basis-0 items-center justify-end gap-3 md:gap-4">
        <NavbarButton
          onClick={() => setSearchbarOpen(!searchbarOpen)}
          className="bg-primary-200 flex h-12 min-w-18 items-center justify-center md:hidden"
        >
          <img className="h-8 w-8" src={searchIcon} alt="Search" />
        </NavbarButton>
        <NavbarButton className="hidden sm:block">
          {NAV_LABELS.GAMES}
        </NavbarButton>
        <NavbarButton className="hidden sm:block">
          {NAV_LABELS.LEADERBOARDS}
        </NavbarButton>
        <NavbarButton>{NAV_LABELS.LOGIN}</NavbarButton>
        <button
          className="block h-12.5 w-12.5 sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <NavbarImage image={menu} alter="Menu" className="z-2" />
        </button>
      </div>
      <ul
        className={`bg-primary-700 fixed top-0 right-0 z-1 flex h-full w-54 transform flex-col items-center gap-6 pt-20 transition-transform duration-200 ease-in-out ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <NavbarButton className="w-40">Games</NavbarButton>
        <NavbarButton className="w-40">Leaderboards</NavbarButton>
        <NavbarButton className="w-40">Settings</NavbarButton>
        <NavbarButton className="w-40">Discord</NavbarButton>
        <NavbarButton className="w-40">Support Us!</NavbarButton>
        <NavbarButton className="w-40">Log out</NavbarButton>
      </ul>
      <div
        className={`bg-primary-500 top-0 left-0 z-3 flex h-16 w-full items-center justify-start pr-4 pl-4 ${searchbarOpen ? "fixed" : "hidden"}`}
      >
        <button
          onClick={() => setSearchbarOpen(false)}
          className="mr-4 flex h-10 w-10 items-center justify-center object-cover"
        >
          <img
            src={arrow}
            alt="arrow"
            className="box-border h-8 w-8 object-cover"
          />
        </button>
        <Searchbar
          className="z-4 flex"
          inputClasses="w-[calc(100vw-150px)] sm:w-[calc(100vw-200px)]"
        />
      </div>
      {menuOpen && (
        <div
          className="fixed inset-0 z-0 bg-black/20"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
