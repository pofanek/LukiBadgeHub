import user from "../../assets/user.png";

const Login = () => {
    return (
        <div className="flex w-28 gap-4 items-center bg-primary-100 text-white p-3 font-sans rounded-4xl cursor-pointer hover:bg-secondary-300 duration-200 box-border">
            <p className="text-md font-sans whitespace-nowrap">Profile</p>
            <img src={user} alt="icon" className="rounded-4xl w-6 h-6 object-cover" />
        </div>
    );
};

export default Login;
