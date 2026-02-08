import user from "../../assets/magnifying-glass.png";

const Searchbar = () => {
    return (
        <form className="flex focus-within:ring-2 focus-within:ring-secondary-200 hover:ring-2 hover:ring-secondary-200 rounded-4xl duration-200">
            <input
                className="bg-primary-100 w-64 text-white p-3 font-sans rounded-4xl cursor-text duration-200 outline-none rounded-r-none box-border"
                placeholder="Search"
            />
            <button
                type="submit"
                className="w-16 rounded-l-none bg-primary-200 rounded-4xl cursor-pointer duration-200 box-border"
            >
                <img className="w-8 h-8 m-auto" src={user} alt="Search" />
            </button>
        </form>
    );
};

export default Searchbar;
