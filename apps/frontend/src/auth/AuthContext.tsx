import React, { createContext, useContext, useMemo, useState } from "react";
import type { AuthUser } from "../api/auth";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
};

type AuthContextValue = AuthState & {
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken"),
  );

  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(() => {
    return {
      accessToken,
      user,
      setAuth: (token: string, u: AuthUser) => {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(u));
        setAccessToken(token);
        setUser(u);
      },
      clearAuth: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setAccessToken(null);
        setUser(null);
      },
    };
  }, [accessToken, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
