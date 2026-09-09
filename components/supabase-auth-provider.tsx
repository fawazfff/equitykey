"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithWallet: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseBrowserClient();
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signInWithWallet = useCallback(async () => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      setAuthError("The EquityKey database is not connected yet.");
      return false;
    }
    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await client.auth.signInWithWeb3({
        chain: "ethereum",
        statement: "Sign in to create and unlock EquityKey benefits.",
      });
      if (error) throw error;
      setSession(data.session);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet sign-in could not be completed.";
      setAuthError(message.includes("provider") ? "Wallet sign-in is not enabled in Supabase yet." : message);
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    await getSupabaseBrowserClient().auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, user: session?.user ?? null, loading, authError, signInWithWallet, signOut }), [session, loading, authError, signInWithWallet, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider");
  return value;
}

