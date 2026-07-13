"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signUpWithProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

/**
 * Sign-up form: first/last name, email, password (min 8) and a REQUIRED CGU
 * checkbox. The CGU flag is validated here (checkbox + explicit state check)
 * AND server-side by the handle_new_user trigger — the client is never trusted.
 */
export default function SignUpForm() {
  const configured = isSupabaseConfigured();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cguAccepted, setCguAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || loading) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    // Explicit state check on top of the checkbox 'required' attribute.
    if (!cguAccepted) {
      setError("You must accept the Terms of Service (CGU).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { needsEmailConfirmation } = await signUpWithProfile({
        email,
        password,
        firstName,
        lastName,
        cguAccepted: true,
      });
      if (needsEmailConfirmation) {
        setNeedsConfirmation(true);
        setLoading(false);
      } else {
        // Hard navigation so middleware sees the fresh session cookies.
        window.location.assign("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "SIGN UP FAILED");
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="flex flex-col gap-4">
        <p className="notice-block" role="status">
          Check your inbox — confirm your email to activate the account.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-sun hover:underline"
        >
          {"← Back to sign in"}
        </Link>
      </div>
    );
  }

  const disabled = !configured || loading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!configured && (
        <p className="notice-block">
          Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart. Sign up is
          disabled.
        </p>
      )}

      {error && <p className="error-block" role="alert">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="signup-first-name">
          <Input
            id="signup-first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Ada"
            required
            disabled={disabled}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </Field>
        <Field label="Last name" htmlFor="signup-last-name">
          <Input
            id="signup-last-name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Lovelace"
            required
            disabled={disabled}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="signup-email">
        <Input
          id="signup-email"
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

      <Field label="Password (min 8 characters)" htmlFor="signup-password">
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          minLength={8}
          disabled={disabled}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <details className="rounded-lg border border-line bg-raise p-3">
        <summary className="cursor-pointer text-sm font-medium text-fg select-none">
          Terms of Service (CGU/CGD) — summary
        </summary>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-[13px] leading-relaxed text-mute">
          <li>
            Data ownership — your pins and media belong to you. They are private,
            owner-only, and never shared or sold.
          </li>
          <li>
            Media limits — up to 15 files per location. Images: max 2 MB (WebP).
            Videos: max 15 seconds.
          </li>
          <li>
            Deletion rights — delete any pin, any file, or your entire account at
            any time. Deletion is permanent.
          </li>
        </ul>
      </details>

      <Checkbox
        name="cgu"
        required
        disabled={disabled}
        checked={cguAccepted}
        onChange={(e) => setCguAccepted(e.target.checked)}
      >
        I accept the Terms of Service (CGU/CGD) summarized above. Required to
        create an account.
      </Checkbox>

      <Button
        type="submit"
        variant="invert"
        className="w-full"
        disabled={disabled || !cguAccepted}
      >
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
