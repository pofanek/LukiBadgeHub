import { useState } from "react";
import EmailInput from "./EmailInput";
import PasswordInput from "./PasswordInput";
import Splitter from "./Splitter";
import RememberMe from "./RememberMe";
import SocialLogin from "./SocialLogin";
import NoAccount from "./NoAccount";
import LoginLink from "./LoginLink";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { Submit } from "../UI";
const LoginContent = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="bg-surface-overlay/40 mx-20 mt-15 mb-15 flex h-155 max-w-120 min-w-85 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 shadow-black outline-none">
        <h1 className="text-font-primary font-serif text-5xl">Login</h1>
        <SocialLogin icon={<FcGoogle size={24} />} label="Login with Google" />
        <SocialLogin
          icon={<FaDiscord size={24} />}
          label="Login with Discord"
        />
        <Splitter />
        <EmailInput value={login} id="name" setter={setLogin} />
        <div className="flex w-[80%] min-w-64 flex-col gap-3.5">
          <PasswordInput id="password" value={password} setter={setPassword} />
          <div className="flex justify-between">
            <RememberMe setter={setRemember} value={remember} />
            <LoginLink pathTo="/">Forgot password?</LoginLink>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-3.5">
          <Submit
            label="Login"
            className="w-[80%] min-w-64 font-sans text-xl"
          />
          <NoAccount />
        </div>
      </div>
    </main>
  );
};

export default LoginContent;
