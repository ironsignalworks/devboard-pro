import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@devboard.local");
  const [password, setPassword] = useState("password123");
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Login failed");
        return;
      }

      const data = await res.json();
      if (data?.token) {
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        alert("Login failed: no token returned");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Code2 className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your DevBoard account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              <Button variant="link" className="px-0 text-sm" type="button">
                Forgot password?
              </Button>
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button 
              variant="link" 
              className="px-1 text-primary" 
              onClick={() => navigate("/register")}
            >
              Sign up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
