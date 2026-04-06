import LoginLink from "./LoginLink";
type props = {
  login: boolean;
};
const NoAccount = ({ login }: props) => {
  return login ? (
    <div className="flex w-[80%] items-center justify-center gap-3">
      <span className="text-font-secondary font-sans text-sm">
        Don't have an account?
        <LoginLink pathTo="/register"> Sign up</LoginLink>
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span className="text-font-secondary font-sans text-sm">
        Already have an account?
      </span>
      <LoginLink pathTo="/login">Log in</LoginLink>
    </div>
  );
};

export default NoAccount;
