import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyEmail, resendVerification } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { toast } from "@/components/ui/sonner";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<string>("Verifying your email...");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) {
        setStatus("");
        setError("Missing verification token.");
        return;
      }
      try {
        const res: any = await verifyEmail(token);
        if (cancelled) return;
        if (res?.user) {
          login(res.user);
          setStatus("Email verified! Redirecting...");
          toast.success("Email verified");
          setTimeout(() => navigate("/"), 800);
        } else {
          setError(res?.message || "Verification failed.");
          toast.error(res?.message || "Verification failed.");
          setStatus("");
        }
      } catch (err) {
        if (!cancelled) {
          setError("Network error");
          toast.error("Network error");
          setStatus("");
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token, login, navigate]);

  const handleResend = async () => {
    setResendMessage(null);
    if (!email.trim()) {
      setResendMessage("Enter your email to resend verification.");
      toast.error("Enter your email to resend verification.");
      return;
    }
    const res: any = await resendVerification(email.trim());
    setResendMessage(res?.message || "If the email exists, a verification link was sent.");
    toast.success(res?.message || "Verification email sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>Finish setting up your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="button" variant="outline" className="w-full" onClick={handleResend}>
              Resend verification email
            </Button>
            {resendMessage && <p className="text-xs text-muted-foreground">{resendMessage}</p>}
          </div>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>
            Back to login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
