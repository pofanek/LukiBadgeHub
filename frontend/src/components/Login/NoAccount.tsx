import LoginLink from "./LoginLink";

const NoAccount = () => {
  return (
    <div className="flex w-[80%] items-center gap-3">
      <span className="text-font-secondary text-md font-sans">
        Don't have an account?
        <LoginLink pathTo="/register"> Sign up</LoginLink>
      </span>
    </div>
  );
};

export default NoAccount;
