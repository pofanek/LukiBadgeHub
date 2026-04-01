import { useState } from "react";
import {
  EmailInput,
  PasswordInput,
  Splitter,
  RememberMe,
  SocialLogin,
  NoAccount,
  LoginLink,
  Card,
  FormFooter,
} from ".";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { FocusContent, Submit } from "../UI";
const LoginContent = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  return (
    <FocusContent>
      <Card>
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
      </Card>
    </FocusContent>
  );
};

export default LoginContent;
