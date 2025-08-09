"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrainCircuit } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("dev@example.com");
  const [name, setName] = useState("Developer");

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push("/");
      }
    });
  }, [router]);

  const handleDevSignIn = async () => {
    setLoading(true);
    try {
      const result = await signIn("dev", { 
        email, 
        name,
        callbackUrl: "/" 
      });
      if (result?.error) {
        console.error("Sign in error:", result.error);
      }
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BrainCircuit className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to FocusFlow</CardTitle>
          <CardDescription>
            Sign in to start tracking your focus sessions and productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Development Login */}
          {process.env.NODE_ENV === "development" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <Button
                onClick={handleDevSignIn}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Signing in..." : "Continue (Development)"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Google OAuth (only if configured) */}
          {process.env.GOOGLE_CLIENT_ID && (
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continue with Google
            </Button>
          )}

          {!process.env.GOOGLE_CLIENT_ID && process.env.NODE_ENV !== "development" && (
            <p className="text-sm text-center text-muted-foreground">
              Google OAuth not configured. Please set up Google OAuth credentials.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
