import { CiSearch } from "react-icons/ci";
type SearchbarProps = {
  className?: string;
  inputClasses?: string;
};
const Searchbar = ({ className = "", inputClasses }: SearchbarProps) => {
  return (
    <form
      className={`from-brand-primary to-brand-secondary focus-within:ring-hover/70 hover:ring-hover/70 rounded-2xl bg-linear-to-r duration-200 focus-within:ring-2 hover:ring-2 md:flex ${className}`}
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
        <CiSearch className="m-auto" size={32} color="#e6f1ff" />
      </button>
    </form>
  );
};

export default Searchbar;
