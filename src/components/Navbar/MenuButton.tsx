import { menu, cross } from "../../assets";
import NavbarImage from "./NavbarImage";
type MenuButtonProps = {
  value: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
};
const MenuButton = ({ value, setter }: MenuButtonProps) => {
  return (
    <button
      className="ml-1 block h-12.5 w-12.5 sm:hidden"
      onClick={() => setter(!value)}
    >
      <NavbarImage
        image={menu}
        alt=""
        className={`${value ? "hidden" : "block"}`}
      />
      <NavbarImage
        image={cross}
        alt=""
        className={`z-20 ${value ? "block" : "hidden"}`}
      />
    </button>
  );
};

export default MenuButton;
