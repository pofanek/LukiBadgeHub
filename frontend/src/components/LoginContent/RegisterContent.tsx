import { useState } from "react";
import {
  EmailInput,
  PasswordInput,
  Splitter,
  SocialLogin,
  FormFooter,
  NoAccount,
  Card,
} from ".";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { FocusContent, Submit } from "../UI";

const RegisterContent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <FocusContent>
      <Card>
        <h1 className="text-font-primary font-serif text-5xl">Register</h1>
        <SocialLogin
          icon={<FcGoogle size={24} />}
          label="Continue with Google"
        />
        <SocialLogin
          icon={<FaDiscord size={24} />}
          label="Continue with Discord"
        />
        <Splitter />
        <EmailInput value={email} id="email" setter={setEmail} />
        <PasswordInput id="password" value={password} setter={setPassword} />
        <FormFooter>
          <Submit
            label="Register"
            className="w-[80%] min-w-64 font-sans text-xl"
          />
          <NoAccount login={false} />
        </FormFooter>
      </Card>
    </FocusContent>
  );
};

export default RegisterContent;
