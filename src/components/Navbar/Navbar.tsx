import { NavbarButton, Searchbar, NavbarImage } from "./";
import { logo, menu, searchIcon, arrow, cross } from "../../assets";
import * as Constants from "../../constants";
import { useState } from "react";
//! 735px Games znika    845px Leaderboards znika
type NavbarProps = {
  activeTab: "Home" | "Games" | "Leaderboards" | "Login";
};
const Navbar = ({ activeTab }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchbarOpen, setSearchbarOpen] = useState(false);
  return (
    // basis-0 grow sprawia ze są równe odstępy pomiędzy elementami z różnymi width.
    <nav className="sticky flex h-16 w-full items-center justify-between p-1 md:p-4">
      <div className="grow-0 basis-0 pr-0 md:grow md:pr-2">
        <a
          href="#"
          className="flex h-full w-42 items-center gap-2 duration-300 hover:scale-105 hover:cursor-pointer sm:w-67 md:gap-6"
        >
          <NavbarImage
            className={`${searchbarOpen ? "shadow-none" : "shadow-black"}`}
            image={logo}
            alter={`${Constants.APP_SHORT_NAME} Logo`}
          />
          <p className="text-text-primary hidden font-serif text-3xl whitespace-nowrap sm:block">
            {Constants.APP_NAME}
          </p>
          <p className="text-text-primary block font-serif text-4xl whitespace-nowrap sm:hidden">
            {Constants.APP_SHORT_NAME}
          </p>
        </a>
      </div>
      <div className="flex h-full items-center pr-0 md:pr-4">
        <Searchbar className="hidden" />
      </div>
      <div className="under380px:gap-3 flex h-full grow basis-0 items-center justify-end gap-1 md:gap-4">
        <NavbarButton
          onClick={() => setSearchbarOpen(!searchbarOpen)}
          className="from-brand-primary to-brand-secondary w-16 cursor-pointer bg-linear-to-r p-0 md:hidden"
        >
          <img className="m-auto h-6.5 w-6.5" src={searchIcon} alt="Search" />
        </NavbarButton>
        <NavbarButton
          className={`${activeTab === "Home" ? "from-brand-primary to-brand-secondary hover:text-text-primary active:text-text-primary bg-linear-to-r" : ""} hidden lg:block`}
        >
          {Constants.NAV_LABELS.HOME}
        </NavbarButton>
        <NavbarButton
          className={`${activeTab === "Games" ? "from-brand-primary to-brand-secondary hover:text-text-primary active:text-text-primary bg-linear-to-r" : ""} hidden sm:block`}
        >
          {Constants.NAV_LABELS.GAMES}
        </NavbarButton>
        <NavbarButton
          className={`${activeTab === "Leaderboards" ? "from-brand-primary to-brand-secondary hover:text-text-primary active:text-text-primary bg-linear-to-r" : ""} hidden sm:block`}
        >
          {Constants.NAV_LABELS.LEADERBOARDS}
        </NavbarButton>
        <NavbarButton
          className={`${activeTab === "Login" ? "from-brand-primary to-brand-secondary hover:text-text-primary active:text-text-primary bg-linear-to-r" : ""} `}
        >
          {Constants.NAV_LABELS.LOGIN}
        </NavbarButton>
        <button
          className="block h-12.5 w-12.5 sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <NavbarImage
            image={menu}
            alter=""
            className={`${menuOpen ? "hidden" : "block"}`}
          />
          <NavbarImage
            image={cross}
            alter=""
            className={`z-2 ${menuOpen ? "block" : "hidden"}`}
          />
        </button>
      </div>
      <ul
        className={`bg-primary fixed top-0 right-0 z-1 flex h-full w-54 transform flex-col items-center pt-20 transition-transform duration-200 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <li className="w-1/1.5 mb-3 flex justify-center border-b border-white pb-3">
          <NavbarButton className="w-40">
            {Constants.NAV_LABELS.GAMES}
          </NavbarButton>
        </li>
        <li className="w-1/1.5 mb-3 flex justify-center border-b border-white pb-3">
          <NavbarButton className="w-40">
            {Constants.NAV_LABELS.LEADERBOARDS}
          </NavbarButton>
        </li>
        <li className="w-1/1.5 mb-3 flex justify-center border-b border-white pb-3">
          <NavbarButton className="w-40">
            {Constants.NAV_LABELS.SETTINGS}
          </NavbarButton>
        </li>
        <li className="w-1/1.5 mb-3 flex justify-center border-b border-white pb-3">
          <NavbarButton className="w-40">
            {Constants.NAV_LABELS.DISCORD}
          </NavbarButton>
        </li>
        <li className="w-1/1.5 mb-3 flex justify-center border-b border-white pb-3">
          <NavbarButton className="w-40">
            {Constants.NAV_LABELS.SUPPORTME}
          </NavbarButton>
        </li>
        <li className="w-1/1.5 flex justify-center">
          <NavbarButton className="w-40">
            {Constants.NAV_LABELS.LOGOUT}
          </NavbarButton>
        </li>
      </ul>

      <div
        className={`bg-primary top-0 left-0 z-3 flex h-16 w-full items-center justify-center pr-4 pl-4 ${searchbarOpen ? "fixed" : "hidden"}`}
      >
        <button
          onClick={() => setSearchbarOpen(false)}
          className="mr-4 flex h-10 w-10 items-center justify-center object-cover"
        >
          <img src={arrow} alt="arrow" className="h-8 w-8 object-cover" />
        </button>
        <Searchbar className="z-4 flex" inputClasses="w-[calc(100vw-250px)]" />
      </div>
      {menuOpen && (
        <div
          className="fixed inset-0 z-0 bg-black/15"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
