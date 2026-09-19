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
import { FocusContent, Submit, Turnstile } from "../../components/UI";
import { supabase } from "../../utils/supabase";
import { PasswordRequirements } from "../../components/UI";
import { passwordIsValid } from "../../utils/password";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!captchaToken) {
      setError("Complete the security check to continue.");
      return;
    }
    if (!passwordIsValid(password)) {
      setError("Choose a password that meets every requirement below.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        captchaToken,
      },
    });
    setCaptchaToken(null); setCaptchaReset((value) => value + 1);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setError(error.message);
  };

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };
  return (
    <FocusContent>
      <form
        className="bg-surface-overlay/40 mx-20 mt-15 mb-15 flex h-145 max-w-110 min-w-85 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 shadow-black outline-none"
        onSubmit={handleRegister}
      >
        <h1 className="text-font-primary font-serif text-5xl">Sign Up</h1>
        <SocialLogin
          icon={<FcGoogle size={24} />}
          label="Continue with Google"
          onClick={handleGoogleLogin}
        />
        <SocialLogin
          icon={<FaDiscord size={24} />}
          label="Continue with Discord"
          onClick={handleDiscordLogin}
        />
        <Splitter />
        <Turnstile key={captchaReset} onTokenChange={setCaptchaToken} />
        <EmailInput value={email} id="email" setter={setEmail} />
        <PasswordInput
          id="password"
          value={password}
          setter={setPassword}
          autoComplete="new-password"
        />
        <div className="w-[80%] min-w-64"><PasswordRequirements password={password} /></div>
        <FormFooter>
          <Submit
            disabled={loading || !captchaToken}
            label={loading ? "Loading..." : "Register"}
            className="w-[80%] min-w-64 font-sans text-xl"
          />
          <NoAccount login={false} />
        </FormFooter>
      </form>
      {success && (
        <p className="text-font-secondary hover:text-font-primary cursor-pointer text-sm underline transition-colors">
          check your e-mail address.
        </p>
      )}
      {error && (
        <p className="text-destructive font-sans text-lg">ERROR: {error}</p>
      )}
    </FocusContent>
  );
};

export default Register;
