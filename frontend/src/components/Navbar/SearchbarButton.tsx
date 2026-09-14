import { FiSearch } from "react-icons/fi";
import { NavbarButton } from "./";

type SearchbarButtonProps = {
  value: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
};

const SearchbarButton = ({ value, setter }: SearchbarButtonProps) => {
  return (
    <NavbarButton
      onClick={() => setter(!value)}
      ariaLabel={value ? "Close search" : "Open search"}
      className="border-border bg-surface-soft text-font-secondary hover:bg-brand-tertiary hover:text-font-primary h-10 w-10 border p-0 lg:hidden"
    >
      <FiSearch className="m-auto h-5 w-5" />
    </NavbarButton>
  );
};

export default SearchbarButton;
