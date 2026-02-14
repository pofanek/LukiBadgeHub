import * as Constants from "../../constants";
import { logo } from "../../assets";
import { NavbarImage } from "./";
type TitleProps = {
  value: boolean;
};
const Title = ({ value }: TitleProps) => {
  return (
    <a
      href="#"
      className="ml-2 flex h-full w-42 items-center gap-2 duration-300 hover:scale-105 hover:cursor-pointer sm:w-67 md:gap-6"
    >
      <NavbarImage
        className={`${value ? "shadow-none" : "shadow-black"}`}
        image={logo}
        alt={`${Constants.APP_SHORT_NAME} Logo`}
      />
      <p className="text-font-primary hidden font-serif text-3xl whitespace-nowrap sm:block">
        {Constants.APP_NAME}
      </p>
      <p className="text-font-primary block font-serif text-4xl whitespace-nowrap sm:hidden">
        {Constants.APP_SHORT_NAME}
      </p>
    </a>
  );
};

export default Title;
