import { NavbarButton } from "./";
import { CiSearch } from "react-icons/ci";

type SearchbarButtonProps = {
  value: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
};

const SearchbarButton = ({ value, setter }: SearchbarButtonProps) => {
  return (
    <NavbarButton
      onClick={() => setter(!value)}
      className="from-brand-primary to-brand-secondary w-16 cursor-pointer bg-linear-to-r md:hidden"
      style={{ padding: "2px" }}
    >
      <CiSearch className="m-auto" size={32} color="#e6f1ff" />
    </NavbarButton>
  );
};

export default SearchbarButton;
