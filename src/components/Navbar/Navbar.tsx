import Login from "./Login";
import NavbarButton from "./NavbarButton";
import Searchbar from "./Searchbar";
import logo from "../../assets/logo.png";
const Navbar = () => {
    return (
        // basis-0 grow sprawia ze są równe odstępy pomiędzy elementami z różnymi width.
        <nav className="fixed bg-primary-600 w-full h-[10%] gray-1 flex items-center p-4 justify-between">
            <div className=" h-[180%] box-border basis-0 grow">
                <a
                    href="#"
                    className="flex gap-6 items-center h-full w-68 box-border hover:scale-105 hover:cursor-pointer duration-300"
                >
                    <img src={logo} alt="icon" className="rounded-4xl w-12.5 h-12.5" />
                    <p className="text-white text-3xl font-serif whitespace-nowrap">Luki Badge Hub</p>
                </a>
            </div>
            <div className="flex h-full gap-6 items-center border-box">
                <Searchbar />
            </div>
            <div className="flex gap-6 items-center h-full box-border justify-end basis-0 grow">
                <NavbarButton>Games</NavbarButton>
                <NavbarButton>Leaderboards</NavbarButton>
                <Login />
            </div>
        </nav>
    );
};

export default Navbar;
