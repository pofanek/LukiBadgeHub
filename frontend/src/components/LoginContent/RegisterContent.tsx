import { useState } from "react";
import { EmailInput, PasswordInput, Splitter, SocialLogin, LoginLink } from ".";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { Submit } from "../UI";

const RegisterContent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="bg-surface-overlay/40 mx-20 mt-15 mb-15 flex h-155 max-w-120 min-w-85 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 shadow-black outline-none">
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
        <div className="flex w-[80%] min-w-64 flex-col gap-3.5">
          <PasswordInput id="password" value={password} setter={setPassword} />
        </div>
        <div className="flex w-full flex-col items-center gap-3.5">
          <Submit
            label="Register"
            className="w-[80%] min-w-64 font-sans text-xl"
          />
          <div className="flex items-center gap-2">
            <span className="text-font-secondary font-sans text-sm">
              Already have an account?
            </span>
            <LoginLink pathTo="/login">Log in</LoginLink>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegisterContent;
