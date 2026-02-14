import { NavbarButton } from "./";
import { searchIcon } from "../../assets";

type SearchbarButtonProps = {
  value: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
};

const SearchbarButton = ({ value, setter }: SearchbarButtonProps) => {
  return (
    <NavbarButton
      onClick={() => setter(!value)}
      className="from-brand-primary to-brand-secondary w-16 cursor-pointer bg-linear-to-r p-0 md:hidden"
    >
      <img
        className="m-auto h-6.5 w-6.5 min-w-5 object-cover"
        src={searchIcon}
        alt="Search"
      />
    </NavbarButton>
  );
};

export default SearchbarButton;
