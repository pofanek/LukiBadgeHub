import { searchIcon } from "../../assets";
type SearchbarProps = {
  className?: string;
  inputClasses?: string;
};
const Searchbar = ({ className = "", inputClasses }: SearchbarProps) => {
  return (
    <form
      className={`from-brand-primary to-brand-secondary focus-within:ring-accent-main/70 hover:ring-accent-main/70 rounded-2xl bg-linear-to-r duration-200 focus-within:ring-2 hover:ring-2 md:flex ${className}`}
    >
      <input
        className={`min-w-20 cursor-text rounded-4xl rounded-r-none p-1.5 pr-3 pl-3 font-sans text-white transition-all duration-200 outline-none md:w-[calc(100vw-768px)] lg:w-64 ${inputClasses}`}
        placeholder="Search"
      />
      <button
        type="submit"
        className="w-16 cursor-pointer rounded-l-none"
        aria-label="Search"
      >
        <img className="m-auto h-8 w-8" src={searchIcon} />
      </button>
    </form>
  );
};

export default Searchbar;
