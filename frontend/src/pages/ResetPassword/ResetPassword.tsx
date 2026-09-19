import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { PasswordRequirements } from "../../components/UI";
import { passwordIsValid } from "../../utils/password";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const recoveryExchangeRef = useRef<Promise<boolean> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const recoveryLink =
      url.searchParams.get("type") === "recovery" ||
      hashParams.get("type") === "recovery";
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    const establishRecoverySession = async () => {
      if (code) {
        recoveryExchangeRef.current ??= supabase.auth
          .exchangeCodeForSession(code)
          .then(({ error: exchangeError }) => !exchangeError);
        const recoverySessionEstablished = await recoveryExchangeRef.current;
        if (!active) return;

        if (!recoverySessionEstablished) {
          setError("This password recovery link is invalid or has expired. Request a new one.");
          return;
        }

        window.history.replaceState({}, document.title, url.pathname);
        setReady(true);
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (recoveryLink && accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!active) return;

        if (setSessionError) {
          setError("This password recovery link is invalid or has expired. Request a new one.");
          return;
        }

        window.history.replaceState({}, document.title, url.pathname);
        setReady(true);
        return;
      }

      if (!recoveryLink) {
        setError("This password recovery link is invalid or has expired. Request a new one.");
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError || !data.session) {
        setError("This password recovery link is invalid or has expired. Request a new one.");
        return;
      }

      setReady(true);
    };

    void establishRecoverySession();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleReset = async () => {
    setError("");
    if (!ready) {
      setError("This password recovery link is invalid or has expired. Request a new one.");
      return;
    }
    if (!passwordIsValid(newPassword)) {
      setError("Choose a password that meets every requirement below.");
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
      setIsSaving(false);
      return;
    }

    const { data: hasPassword, error: verificationError } = await supabase.rpc(
      "current_user_has_password",
    );
    setIsSaving(false);
    if (verificationError || !hasPassword) {
      setError("The password could not be verified. Request a new recovery link and try again.");
      return;
    }

    setNewPassword("");
    setIsSaved(true);
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="bg-surface-overlay/40 mx-20 flex w-full max-w-120 min-w-85 flex-col items-center justify-center gap-6 rounded-xl px-5 py-10 shadow-black">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-font-primary font-serif text-3xl">
            New password
          </h2>
          <p className="text-font-muted mt-2 text-center font-sans text-sm">
            {isSaved
              ? "Your password has been saved."
              : ready
              ? "Enter your new password below."
              : "Waiting for password recovery link..."}
          </p>
        </div>

        <div className="border-surface-soft w-[80%] border-t" />

        <div className="flex w-[80%] min-w-64 flex-col gap-5">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            disabled={!ready || isSaved || isSaving}
            className="bg-surface text-font-primary border-surface-soft focus:border-accent-cold w-full rounded-xl border-2 p-2 font-sans text-lg transition-all duration-200 outline-none disabled:opacity-40"
          />
          <PasswordRequirements password={newPassword} />

          {error && (
            <p className="text-center font-sans text-sm text-red-400">
              {error}
            </p>
          )}

          {isSaved ? (
            <button
              onClick={() => navigate("/settings", { replace: true })}
              className="bg-surface text-font-primary from-accent-cold to-accent-cold-dim w-full cursor-pointer rounded-xl bg-linear-to-r p-2 font-sans text-lg transition-transform duration-300 hover:scale-[103%]"
            >
              Continue to settings
            </button>
          ) : (
            <button
              onClick={handleReset}
              disabled={!ready || isSaving}
              className={`bg-surface text-font-primary from-accent-cold to-accent-cold-dim w-full ${ready && !isSaving ? "cursor-pointer" : "cursor-not-allowed"} rounded-xl bg-linear-to-r p-2 font-sans text-lg transition-transform duration-300 hover:scale-[103%] disabled:opacity-40 disabled:hover:scale-100`}
            >
              {isSaving ? "Saving..." : "Save password"}
            </button>
          )}
          <button
            onClick={() => navigate("/login")}
            className="border-surface-soft hover:ring-surface-raised text-font-secondary w-full cursor-pointer rounded-xl border-2 p-2 font-sans text-lg transition-all duration-200 hover:ring-2"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
