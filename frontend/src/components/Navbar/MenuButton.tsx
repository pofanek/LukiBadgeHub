import { IoIosMenu } from "react-icons/io";
import { GoPlus } from "react-icons/go";
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
      {value ? (
        <div className="relative z-100 rotate-45">
          <GoPlus
            size={50}
            className="text-font-primary hover:cursor-pointer"
          />
        </div>
      ) : (
        <IoIosMenu
          size={50}
          className="text-font-primary hover:cursor-pointer"
        />
      )}
    </button>
  );
};

export default MenuButton;
