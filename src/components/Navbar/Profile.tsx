import user from "../../assets/user.png";
const Profile = () => {
  return (
    <button className="bg-primary-100 hover:bg-secondary-300 active:bg-secondary-300 flex min-w-28 cursor-pointer items-center gap-4 rounded-4xl p-3 font-sans text-white duration-200">
      <p className="text-md font-sans whitespace-nowrap">Log in</p>
      <img src={user} alt="icon" className="h-6 w-6 rounded-4xl object-cover" />
    </button>
  );
};

export default Profile;
