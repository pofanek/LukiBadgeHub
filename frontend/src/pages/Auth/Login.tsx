import { useState } from "react";
import {
  EmailInput,
  PasswordInput,
  Splitter,
  SocialLogin,
  NoAccount,
  LoginLink,
  FormFooter,
} from "./components";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { FocusContent, Submit } from "../../components/UI";
import { supabase } from "../../utils/supabase";
import { useNavigate } from "react-router-dom";
const Login = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: login,
      password: password,
    });
    if (error) {
      setError(error.message);
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setShowResend(true);
      }
      setLoading(false);
    } else {
      setLoading(false);
      navigate("/");
    }
  };
  const handleResendEmail = async () => {
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: login,
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      setError("Verification email sent! Check your inbox.");
      setShowResend(false);
    }
  };
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };
  return (
    <FocusContent>
      <form
        className="bg-surface-overlay/40 mx-20 mt-15 mb-15 flex h-145 max-w-110 min-w-85 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 shadow-black outline-none"
        onSubmit={handleLogin}
      >
        <h1 className="text-font-primary font-serif text-5xl">Log In</h1>
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
        <EmailInput value={login} id="name" setter={setLogin} />
        <FormFooter>
          <PasswordInput id="password" value={password} setter={setPassword} />
          <div className="flex w-[80%] justify-center">
            <LoginLink pathTo="/forgot-password">Forgot password?</LoginLink>
          </div>
        </FormFooter>
        <FormFooter>
          <Submit
            label={loading ? "Loading..." : "Login"}
            disabled={loading}
            className="w-[80%] min-w-64 font-sans text-xl"
          />
          <NoAccount login={true} />
        </FormFooter>
      </form>
      {showResend && (
        <button
          type="button"
          onClick={handleResendEmail}
          className="text-font-secondary hover:text-font-primary text-sm underline transition-colors"
        >
          Didn't get the email? Resend link
        </button>
      )}
      {error && (
        <p className="text-destructive font-sans text-lg">ERROR: {error}</p>
      )}
    </FocusContent>
  );
};

export default Login;
