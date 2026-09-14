import { FiArrowLeft } from "react-icons/fi";
import Searchbar from "./Searchbar";
type SearchbarFixedProps = {
  value: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
};

const SearchbarFixed = ({ value, setter }: SearchbarFixedProps) => {
  return (
    <div
      className={`bg-primary top-0 left-0 z-30 flex h-full w-full items-center justify-center rounded-xl lg:hidden ${value ? "absolute" : "hidden"}`}
    >
      <button
        type="button"
        onClick={() => setter(false)}
        className="text-font-secondary hover:text-font-primary absolute left-4 grid h-10 w-10 place-items-center rounded-lg transition-colors"
        aria-label="Close search"
      >
        <FiArrowLeft className="h-5 w-5" />
      </button>
      <Searchbar
        className="z-40 w-[calc(100%-7rem)] max-w-xl"
        inputClasses="w-full"
        onSearch={() => setter(false)}
      />
    </div>
  );
};

export default SearchbarFixed;
