import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import call, { isApiError } from "@/api/client";
import { useAuth, type AuthUser } from "@/context/AuthContext";

type LoginResponse = {
  user?: AuthUser;
  message?: string;
  requiresVerification?: boolean;
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setSubmitting(true);
    try {
      const res = await call<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (isApiError(res)) {
        toast.error(res.message || "Login failed");
        return;
      }

      if (res.requiresVerification) {
        toast.message("Check your email", {
          description: "Please verify your email before logging in.",
        });
        return;
      }

      if (!res.user) {
        toast.error("Login failed");
        return;
      }

      login(res.user);
      navigate("/");
    } catch (err) {
      const e = err as { message?: string };
      console.error("Login error", e?.message || err);
      toast.error(e?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setSubmitting(true);
    try {
      const res = await call<{ user?: AuthUser; message?: string }>("/api/auth/guest", {
        method: "POST",
      });

      if (isApiError(res)) {
        toast.error(res.message || "Guest login failed");
        return;
      }

      if (!res.user) {
        toast.error("Guest login failed");
        return;
      }

      login(res.user);
      navigate("/");
    } catch (err) {
      const e = err as { message?: string };
      console.error("Guest login error", e?.message || err);
      toast.error(e?.message || "Guest login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="outline" className="w-full" disabled={submitting} onClick={handleGuestLogin}>
            Continue as guest
          </Button>
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot your password?
          </button>
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}