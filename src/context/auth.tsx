import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@/types";

/**
 * Mock auth context — session persisted to localStorage.
 * Swap the bodies of signIn / signUp / signOut for Supabase Auth later;
 * the surface stays identical.
 */
interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  startDemo: () => Promise<void>;
}

const KEY = "crudeai.session";
const AuthContext = createContext<AuthState | null>(null);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeUser(name: string, email: string): User {
  return {
    id: `usr_${Math.random().toString(36).slice(2, 10)}`,
    name,
    email,
    createdAt: Date.now(),
    emailVerified: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const persist = useCallback((u: User | null) => {
    setUser(u);
    if (typeof window === "undefined") return;
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async signIn(email) {
        await wait(650);
        const name = email.split("@")[0] ?? "trader";
        persist(makeUser(name.charAt(0).toUpperCase() + name.slice(1), email));
      },
      async signUp(name, email) {
        await wait(750);
        persist(makeUser(name, email));
      },
      signOut() {
        persist(null);
      },
      async requestPasswordReset() {
        await wait(600);
      },
      async resetPassword() {
        await wait(600);
      },
      async verifyEmail() {
        await wait(600);
        if (user) persist({ ...user, emailVerified: true });
      },
      async startDemo() {
        await wait(400);
        persist(makeUser("Demo Trader", "demo@crudeai.tech"));
      },
    }),
    [user, loading, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
