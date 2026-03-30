import LoginLink from "./LoginLink";

const NoAccount = () => {
  return (
    <div className="flex w-[80%] items-center justify-center gap-3">
      <span className="text-font-secondary font-sans text-sm">
        Don't have an account?
        <LoginLink pathTo="/register"> Sign up</LoginLink>
      </span>
    </div>
  );
};

export default NoAccount;
