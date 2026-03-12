import React, { createContext, useState, useContext, useEffect } from "react";
import call, { isApiError } from "../api/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  isGuest?: boolean;
  guestExpiresAt?: string | Date;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  authError: string | null;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [loading, setLoading] = useState<boolean>(() => !localStorage.getItem("user"));
  const [authError, setAuthError] = useState<string | null>(null);

  const login = (u: AuthUser) => {
    setUser(u);
    setLoading(false);
    setAuthError(null);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const logout = async () => {
    try {
      await call("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // non-fatal
      console.error("[auth] logout error", err);
    }
    setUser(null);
    localStorage.removeItem("user");
  };

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    let cancelled = false;
    const hasLocalUser = !!localStorage.getItem("user");

    const validate = async () => {
      try {
        if (!hasLocalUser) setLoading(true);
        const res = await call<{ user?: AuthUser }>("/api/auth/me");

        console.log("[auth] /me response", res);

        if (cancelled) return;

        if (isApiError(res)) {
          // Unauthenticated on initial load is expected; route guard will redirect to /login.
          if (res.status === 401) {
            if (!hasLocalUser) {
              await logout();
              setAuthError(null);
            }
            return;
          }
          if (!hasLocalUser) {
            await logout();
            setAuthError(res.message || "Auth validation failed");
          }
          return;
        }

        if (res.user) {
          setUser(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        } else {
          await logout();
        }
      } catch (err) {
        const e = err as { message?: string };
        console.error("[auth] /me error", e?.message || err);
        if (!cancelled && !hasLocalUser) {
          await logout();
          setAuthError(e?.message || "Auth validation failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void validate();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
