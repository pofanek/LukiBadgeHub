import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event: any) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleReset = async (e: any) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(error.message);
    else navigate("/login");
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="bg-surface-overlay/40 mx-20 flex w-full max-w-120 min-w-85 flex-col items-center justify-center gap-6 rounded-xl px-5 py-10 shadow-black">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-font-primary font-serif text-3xl">
            New password
          </h2>
          <p className="text-font-muted mt-2 text-center font-sans text-sm">
            {ready
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
            disabled={!ready}
            className="bg-surface text-font-primary border-surface-soft focus:border-accent-cold w-full rounded-xl border-2 p-2 font-sans text-lg transition-all duration-200 outline-none disabled:opacity-40"
          />

          {error && (
            <p className="text-center font-sans text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={handleReset}
            disabled={!ready}
            className={`bg-surface text-font-primary from-accent-cold to-accent-cold-dim w-full ${ready ? "cursor-pointer" : "cursor-not-allowed"} rounded-xl bg-linear-to-r p-2 font-sans text-lg transition-transform duration-300 hover:scale-[103%] disabled:opacity-40 disabled:hover:scale-100`}
          >
            Save password
          </button>
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
