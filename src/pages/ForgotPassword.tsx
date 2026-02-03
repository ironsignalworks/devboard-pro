import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { requestPasswordReset } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res: any = await requestPasswordReset(email);
      if (res?.resetUrl) {
        setMessage(`Reset link (dev): ${res.resetUrl}`);
        toast.success("Reset link generated");
      } else {
        setMessage(res?.message || "If the email exists, a reset link has been sent.");
        toast.success("Reset link sent");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>We'll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-muted-foreground break-all">{message}</p>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>
              Back to login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
