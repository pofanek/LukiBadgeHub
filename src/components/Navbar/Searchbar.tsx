import { searchIcon } from "../../assets";
type SearchbarProps = {
  className?: string;
  inputClasses?: string;
};
const Searchbar = ({ className = "", inputClasses }: SearchbarProps) => {
  return (
    <form
      className={`focus-within:ring-secondary-200 hover:ring-secondary-200 rounded-4xl duration-200 focus-within:ring-2 hover:ring-2 md:flex ${className}`}
    >
      <input
        className={`bg-primary-100 min-w-20 cursor-text rounded-4xl rounded-r-none p-3 font-sans text-white transition-all duration-200 outline-none md:w-[calc(100vw-768px)] lg:w-64 ${inputClasses}`}
        placeholder="Search"
      />
      <button
        type="submit"
        className="bg-primary-200 w-16 cursor-pointer rounded-4xl rounded-l-none duration-200"
        aria-label="Search"
      >
        <img className="m-auto h-8 w-8" src={searchIcon} />
      </button>
    </form>
  );
};

export default Searchbar;
