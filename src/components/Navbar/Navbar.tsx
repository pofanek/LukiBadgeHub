import { Profile, NavbarButton, Searchbar, NavbarImage } from "./";
import { logo, menu, searchIcon } from "../../assets";
import { APP_NAME, APP_SHORT_NAME, NAV_LABELS } from "../../constants";
//! 735px Games znika    845px Leaderboards znika
const Navbar = () => {
  return (
    // basis-0 grow sprawia ze są równe odstępy pomiędzy elementami z różnymi width.
    <nav className="bg-primary-600 gray-1 fixed flex h-16 w-full items-center justify-between p-4">
      <div className="grow-0 basis-0 pr-0 sm:pr-6 md:grow">
        <a
          href="#"
          className="flex h-full w-12.5 items-center gap-2 duration-300 hover:scale-105 hover:cursor-pointer sm:w-68 sm:gap-6"
        >
          <NavbarImage image={logo} alter={`${APP_SHORT_NAME} Logo`} />
          <p className="hidden font-serif text-3xl whitespace-nowrap text-white sm:block">
            {APP_NAME}
          </p>
          <p className="title-visible:block hidden font-serif text-4xl whitespace-nowrap text-white sm:hidden">
            {APP_SHORT_NAME}
          </p>
        </a>
      </div>
      <div className="flex h-full items-center gap-6">
        <Searchbar />
      </div>
      <div className="flex h-full grow basis-0 items-center justify-end gap-2 pl-2 sm:gap-6 sm:pl-6">
        <NavbarButton className="bg-primary-200 flex h-12 min-w-18 items-center justify-center md:hidden">
          <img className="h-8 w-8" src={searchIcon} alt="Search" />
        </NavbarButton>
        <NavbarButton className="games-visible:block hidden">
          {NAV_LABELS.GAMES}
        </NavbarButton>
        <NavbarButton className="leaderboards-visible:block hidden">
          {NAV_LABELS.LEADERBOARDS}
        </NavbarButton>
        <Profile />
        <button className="leaderboards-visible:hidden block h-12.5 w-12.5">
          <NavbarImage image={menu} alter="Menu" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
