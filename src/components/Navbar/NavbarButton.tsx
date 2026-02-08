type navbarButtonProps = {
    children: string;
};

const NavbarButton = (props: navbarButtonProps) => {
    return (
        <button className="bg-primary-100 text-white p-3 font-sans rounded-4xl cursor-pointer hover:bg-secondary-300 duration-200 box-border">
            {props.children}
        </button>
    );
};

export default NavbarButton;
