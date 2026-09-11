import * as Constants from "../../constants";
import { logo } from "../../assets";
import { NavbarImage } from "./";
import { Link } from "react-router-dom";
type TitleProps = {
  value?: boolean;
  longNavbar?: boolean;
  alwaysExpandText?: boolean;
};
const Title = ({
  value,
  longNavbar = true,
  alwaysExpandText = false,
}: TitleProps) => {
  return (
    <Link
      to="/"
      className={`flex h-full shrink-0 items-center duration-300 hover:scale-105 hover:cursor-pointer ${longNavbar ? "ml-2 w-42 gap-2 sm:ml-0 lg:w-auto lg:gap-4" : "w-67 justify-center gap-6"} `}
    >
      <NavbarImage
        className={`${value ? "shadow-none" : "shadow-black"}`}
        image={logo}
        alt={`${Constants.APP_SHORT_NAME} Logo`}
      />
      <p
        className={`text-font-primary font-serif text-3xl whitespace-nowrap ${
          alwaysExpandText
            ? "block"
            : longNavbar
              ? "hidden lg:block"
              : "hidden sm:block"
        }`}
      >
        {Constants.APP_NAME}
      </p>
      <p
        className={`text-font-primary font-serif text-4xl whitespace-nowrap ${
          alwaysExpandText ? "hidden" : "lg:hidden"
        }`}
      >
        {Constants.APP_SHORT_NAME}
      </p>
    </Link>
  );
};

export default Title;
