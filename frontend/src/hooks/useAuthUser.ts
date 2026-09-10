import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // getSession reads the persisted browser session immediately. Using getUser here
    // makes every remount wait for a network validation, which is especially visible
    // after the browser restores a backgrounded tab.
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return { user, isLoading };
}
