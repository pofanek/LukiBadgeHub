import { createContext, createElement, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase";

type AuthState = { user: User | null; isLoading: boolean };

const AuthUserContext = createContext<AuthState | null>(null);

// Authentication is application state. Keeping this subscription at the root
// prevents every page, the navbar, and notification UI from competing for the
// same Supabase auth lock when a backgrounded tab resumes.
let initialSessionPromise: Promise<void> | null = null;
let authState: AuthState = { user: null, isLoading: true };
const subscribers = new Set<(state: AuthState) => void>();

function publishAuthState(next: AuthState) {
  authState = next;
  subscribers.forEach((subscriber) => subscriber(next));
}

function initializeAuth() {
  if (initialSessionPromise) return initialSessionPromise;

  initialSessionPromise = supabase.auth.getSession().then(({ data }) => {
    publishAuthState({ user: data.session?.user ?? null, isLoading: false });
  }).catch(() => {
    publishAuthState({ user: null, isLoading: false });
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    publishAuthState({ user: session?.user ?? null, isLoading: false });
  });

  return initialSessionPromise;
}

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(authState);

  useEffect(() => {
    subscribers.add(setState);
    void initializeAuth();
    return () => { subscribers.delete(setState); };
  }, []);

  return createElement(AuthUserContext.Provider, { value: state }, children);
}

export function useAuthUser() {
  const state = useContext(AuthUserContext);
  if (!state) throw new Error("useAuthUser must be used within AuthUserProvider.");

  return state;
}
