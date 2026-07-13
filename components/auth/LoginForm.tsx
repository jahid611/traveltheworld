"use client";

import { useEffect, useState, type FormEvent } from "react";
import { signIn } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

/**
 * Controlled email + password form. On success we hard-navigate to "/" so
 * the middleware sees the freshly-set session cookies on the next request.
 */
export default function LoginForm() {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Surface the failure flag set by app/auth/callback/route.ts.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "confirmation_failed") {
      setError("Email confirmation failed — request a new link or log in.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || loading) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      // Hard navigation (not router.push) so middleware runs with the new session.
      window.location.assign("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "LOGIN FAILED");
      setLoading(false);
    }
  }

  const disabled = !configured || loading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!configured && (
        <p className="notice-block">
          Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart. Login is
          disabled.
        </p>
      )}

      {error && <p className="error-block" role="alert">{error}</p>}

      <Field label="Email" htmlFor="login-email">
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={disabled}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Password" htmlFor="login-password">
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          disabled={disabled}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <Button
        type="submit"
        variant="invert"
        className="w-full"
        disabled={disabled}
      >
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
