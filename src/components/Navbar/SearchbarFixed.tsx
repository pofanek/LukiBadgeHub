import { FaArrowLeft } from "react-icons/fa";
import Searchbar from "./Searchbar";
type SearchbarFixedProps = {
  value: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
};

const SearchbarFixed = ({ value, setter }: SearchbarFixedProps) => {
  return (
    <div
      className={`bg-primary top-0 left-0 z-30 flex h-full w-full items-center justify-center rounded-xl p-1 pr-4 pl-4 md:hidden ${value ? "absolute" : "hidden"}`}
    >
      <button
        onClick={() => setter(false)}
        className="mr-4 flex h-10 w-10 items-center justify-center object-cover"
      >
        <FaArrowLeft size={32} color="#FFFFFF" />
      </button>
      <Searchbar className="z-40 flex" inputClasses="w-[calc(100vw-250px)]" />
    </div>
  );
};

export default SearchbarFixed;
