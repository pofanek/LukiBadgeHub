import { useState } from "react";
import {
  EmailInput,
  PasswordInput,
  Splitter,
  RememberMe,
  SocialLogin,
  NoAccount,
  LoginLink,
  FormFooter,
} from "./components";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { FocusContent, Submit } from "../../components/UI";
const Login = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  return (
    <FocusContent>
      <form className="bg-surface-overlay/40 mx-20 mt-15 mb-15 flex h-145 max-w-110 min-w-85 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 shadow-black outline-none">
        <h1 className="text-font-primary font-serif text-5xl">Login</h1>
        <SocialLogin icon={<FcGoogle size={24} />} label="Login with Google" />
        <SocialLogin
          icon={<FaDiscord size={24} />}
          label="Login with Discord"
        />
        <Splitter />
        <EmailInput value={login} id="name" setter={setLogin} />
        <FormFooter>
          <PasswordInput id="password" value={password} setter={setPassword} />
          <div className="flex w-[80%] justify-between">
            <RememberMe setter={setRemember} value={remember} />
            <LoginLink pathTo="/">Forgot password?</LoginLink>
          </div>
        </FormFooter>
        <FormFooter>
          <Submit
            label="Login"
            className="w-[80%] min-w-64 font-sans text-xl"
          />
          <NoAccount login={true} />
        </FormFooter>
      </form>
    </FocusContent>
  );
};

export default Login;
