import { useState } from "react";
import {
  EmailInput,
  PasswordInput,
  Splitter,
  SocialLogin,
  FormFooter,
  NoAccount,
} from "./components";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { FocusContent, Submit } from "../../components/UI";
import { supabase } from "../../utils/supabase";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: "http://localhost:5173/auth/callback",
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
    console.log(data);
  };

  return (
    <FocusContent>
      <form
        className="bg-surface-overlay/40 mx-20 mt-15 mb-15 flex h-145 max-w-110 min-w-85 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 shadow-black outline-none"
        onSubmit={handleLogin}
      >
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
            disabled={loading}
            label={loading ? "Loading..." : "Register"}
            className="w-[80%] min-w-64 font-sans text-xl"
          />
          <NoAccount login={false} />
        </FormFooter>
      </form>
      {success && (
        <p className="text-font-secondary font-sans text-lg">
          check your mail.
        </p>
      )}
      {error && (
        <p className="text-destructive font-sans text-lg">ERROR: {error}</p>
      )}
    </FocusContent>
  );
};

export default Register;
