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
      setError("PASSWORD MUST BE AT LEAST 8 CHARACTERS");
      return;
    }
    // Explicit state check on top of the checkbox 'required' attribute.
    if (!cguAccepted) {
      setError("YOU MUST ACCEPT THE TERMS OF SERVICE (CGU)");
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
          CHECK YOUR INBOX — CONFIRM YOUR EMAIL TO ACTIVATE THE ACCOUNT
        </p>
        <Link href="/login" className="label hover:text-fg">
          {"-> BACK TO LOG IN"}
        </Link>
      </div>
    );
  }

  const disabled = !configured || loading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!configured && (
        <p className="notice-block">
          SUPABASE NOT CONFIGURED — SET NEXT_PUBLIC_SUPABASE_URL AND
          NEXT_PUBLIC_SUPABASE_ANON_KEY IN .ENV.LOCAL, THEN RESTART. SIGN UP IS
          DISABLED.
        </p>
      )}

      {error && <p className="error-block" role="alert">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="FIRST NAME" htmlFor="signup-first-name">
          <Input
            id="signup-first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="ADA"
            required
            disabled={disabled}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </Field>
        <Field label="LAST NAME" htmlFor="signup-last-name">
          <Input
            id="signup-last-name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="LOVELACE"
            required
            disabled={disabled}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Field>
      </div>

      <Field label="EMAIL" htmlFor="signup-email">
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="YOU@EXAMPLE.COM"
          required
          disabled={disabled}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="PASSWORD (MIN 8 CHARACTERS)" htmlFor="signup-password">
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="********"
          required
          minLength={8}
          disabled={disabled}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <details className="border border-line bg-ink p-3">
        <summary className="label cursor-pointer select-none">
          TERMS OF SERVICE (CGU/CGD) — SUMMARY
        </summary>
        <ul className="mt-3 flex flex-col gap-2 text-xs leading-relaxed text-mute">
          <li>
            01 // DATA OWNERSHIP — YOUR PINS AND MEDIA BELONG TO YOU. THEY ARE
            PRIVATE, OWNER-ONLY, AND NEVER SHARED OR SOLD.
          </li>
          <li>
            02 // MEDIA LIMITS — MAX 15 FILES PER LOCATION. IMAGES: MAX 2 MB
            (WEBP). VIDEOS: MAX 15 SECONDS.
          </li>
          <li>
            03 // DELETION RIGHTS — DELETE ANY PIN, ANY FILE, OR YOUR ENTIRE
            ACCOUNT AT ANY TIME. DELETION IS PERMANENT.
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
        I ACCEPT THE TERMS OF SERVICE (CGU/CGD) SUMMARIZED ABOVE. REQUIRED TO
        CREATE AN ACCOUNT.
      </Checkbox>

      <Button
        type="submit"
        variant="invert"
        className="w-full"
        disabled={disabled || !cguAccepted}
      >
        {loading ? "WORKING…" : "CREATE ACCOUNT ->"}
      </Button>
    </form>
  );
}
